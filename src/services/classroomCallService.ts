/**
 * SmartEducate Classroom Voice & Video Call Service
 * Real-time 1:1 Teacher ↔ Student WebRTC voice and video calling.
 * Includes STUN & TURN network traversal, Firestore-backed cloud signaling,
 * SDP offer/answer negotiation, bidirectional ICE candidate streaming,
 * media permission controls, and app-level incoming call notification.
 */

import {
  CallType,
  CallStatus,
  CallParticipant,
  CallSession,
  CallDiagnosticLog,
  EnvironmentDiagnostics,
  LiveCallMetrics,
} from '../types/call';
import { db, auth } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { classroomChatService } from './classroomChatService';

// Public STUN servers and openrelay TURN fallback for restrictive NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Web Audio sound generator for ringtone, connected chime, and hangup chime
class CallAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private ringTimer: any = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public startRingtone(): void {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    let isRinging = true;
    const playTone = () => {
      if (!isRinging || !this.audioCtx) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime); // 440 Hz
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.2);
      } catch (e) {
        // Ignore audio playback context restriction
      }
    };

    playTone();
    this.ringTimer = setInterval(playTone, 2500);
  }

  public stopRingtone(): void {
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
  }

  public playConnectChime(): void {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }

  public playEndChime(): void {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15); // E4
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }
}

class ClassroomCallService {
  private currentSession: CallSession | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private listeners: Set<(session: CallSession | null) => void> = new Set();
  private durationTimer: any = null;
  private callTimeoutTimer: any = null;
  private soundPlayer = new CallAudioSynthesizer();

  // Diagnostics trace collection
  private diagnosticLogs: CallDiagnosticLog[] = [];
  private diagnosticListeners: Set<(logs: CallDiagnosticLog[]) => void> = new Set();

  // Active call document listeners & cleanup
  private activeCallDocUnsub: Unsubscribe | null = null;
  private remoteCandidatesUnsub: Unsubscribe | null = null;

  // Background incoming-call listeners for the logged-in user
  private incomingListeners: Map<string, Unsubscribe> = new Map();
  private currentListeningUid: string | null = null;

  public logDiagnostic(
    stage: CallDiagnosticLog['stage'],
    stageLabel: string,
    status: CallDiagnosticLog['status'],
    details: string,
    data?: any
  ): void {
    const entry: CallDiagnosticLog = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().split('T')[1].replace('Z', ''),
      stage,
      stageLabel,
      status,
      details,
      data,
    };
    this.diagnosticLogs = [entry, ...this.diagnosticLogs].slice(0, 50);
    console.log(`[CALL_DIAGNOSTIC] [${stage}] [${status.toUpperCase()}]: ${details}`, data || '');
    this.diagnosticListeners.forEach((cb) => cb([...this.diagnosticLogs]));
  }

  public getDiagnosticLogs(): CallDiagnosticLog[] {
    return [...this.diagnosticLogs];
  }

  public clearDiagnostics(): void {
    this.diagnosticLogs = [];
    this.diagnosticListeners.forEach((cb) => cb([]));
  }

  public subscribeDiagnostics(callback: (logs: CallDiagnosticLog[]) => void): () => void {
    this.diagnosticListeners.add(callback);
    callback([...this.diagnosticLogs]);
    return () => {
      this.diagnosticListeners.delete(callback);
    };
  }

  // Real-time WebRTC lifecycle metrics
  private liveMetrics: LiveCallMetrics = {
    localAudioTracks: 0,
    localVideoTracks: 0,
    remoteAudioTracks: 0,
    remoteVideoTracks: 0,
    addTrackRan: false,
    offerApplied: false,
    answerApplied: false,
    iceCandidatesSent: 0,
    iceCandidatesReceived: 0,
    iceCandidatesApplied: 0,
    peerConnectionState: 'idle',
    iceConnectionState: 'idle',
    onTrackFired: false,
    remoteStreamAttached: false,
    audioPlaySucceeded: false,
    audioPlayBlocked: false,
  };
  private metricsListeners: Set<(metrics: LiveCallMetrics) => void> = new Set();
  private candidateQueue: RTCIceCandidateInit[] = [];

  public getLiveMetrics(): LiveCallMetrics {
    return { ...this.liveMetrics };
  }

  public subscribeMetrics(callback: (metrics: LiveCallMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    callback({ ...this.liveMetrics });
    return () => {
      this.metricsListeners.delete(callback);
    };
  }

  private notifyMetrics(): void {
    this.metricsListeners.forEach((cb) => cb({ ...this.liveMetrics }));
  }

  public setPlaybackDiagnostic(audioPlaySucceeded: boolean, audioPlayBlocked: boolean): void {
    this.liveMetrics.audioPlaySucceeded = audioPlaySucceeded;
    this.liveMetrics.audioPlayBlocked = audioPlayBlocked;
    this.notifyMetrics();
  }

  private async processRemoteCandidate(cand: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    this.liveMetrics.iceCandidatesReceived++;
    this.notifyMetrics();

    // Guard: Remote description must be set before adding candidates
    if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      this.candidateQueue.push(cand);
      this.logDiagnostic(
        'H_ICE_EXCHANGE',
        'Candidate Buffered',
        'info',
        'Remote SDP not ready yet, candidate stored in queue'
      );
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
      this.liveMetrics.iceCandidatesApplied++;
      this.notifyMetrics();
      this.logDiagnostic('H_ICE_EXCHANGE', 'Candidate Applied', 'info', 'Remote ICE candidate applied to RTCPeerConnection');
    } catch (iceErr: any) {
      console.warn('Error adding ICE candidate:', iceErr);
      this.logDiagnostic('H_ICE_EXCHANGE', 'Candidate Apply Error', 'failed', iceErr?.message || 'Error', iceErr);
    }
  }

  private async flushCandidateQueue(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    const queued = [...this.candidateQueue];
    this.candidateQueue = [];

    for (const cand of queued) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        this.liveMetrics.iceCandidatesApplied++;
        this.logDiagnostic('H_ICE_EXCHANGE', 'Buffered Candidate Applied', 'info', 'Buffered candidate successfully flushed');
      } catch (e: any) {
        console.warn('Error flushing buffered candidate:', e);
      }
    }
    this.notifyMetrics();
  }

  public async getEnvironmentDiagnostics(): Promise<EnvironmentDiagnostics> {
    const isBrowser = typeof window !== 'undefined';
    const isSecureContext = isBrowser ? window.isSecureContext === true : false;
    const hasMediaDevices = isBrowser && !!navigator.mediaDevices;
    const hasGetUserMedia = isBrowser && !!navigator.mediaDevices?.getUserMedia;
    const inIframe = isBrowser ? window.self !== window.top : false;
    const protocol = isBrowser ? window.location.protocol : '';
    const origin = isBrowser ? window.location.origin : '';
    const userAgent = isBrowser ? navigator.userAgent : '';

    let microphonePermission: string | undefined = undefined;
    let cameraPermission: string | undefined = undefined;

    if (isBrowser && navigator.permissions?.query) {
      try {
        const micQ = await navigator.permissions.query({ name: 'microphone' as any });
        microphonePermission = micQ.state;
      } catch (e) {}
      try {
        const camQ = await navigator.permissions.query({ name: 'camera' as any });
        cameraPermission = camQ.state;
      } catch (e) {}
    }

    return {
      isSecureContext,
      hasMediaDevices,
      hasGetUserMedia,
      inIframe,
      protocol,
      origin,
      userAgent,
      microphonePermission,
      cameraPermission,
    };
  }

  public getCurrentSession(): CallSession | null {
    return this.currentSession;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public subscribe(callback: (session: CallSession | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentSession);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.currentSession ? { ...this.currentSession } : null));
  }

  /**
   * Hardware permission & stream acquisition with progressive fallback
   * Handles high-definition constraints fallback, audio-only fallback, and iframe restrictions
   */
  public async acquireMedia(
    type: CallType
  ): Promise<{ stream: MediaStream | null; error?: string }> {
    this.logDiagnostic(
      'B_ACQUIRE_START',
      'Media Acquisition Started',
      'pending',
      `Requesting userMedia for type: ${type} (Audio: true, Video: ${type === 'video'})`
    );

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      const err =
        'Xiriirkaagu ma aha mid sugan (HTTPS). Biraawsarku wuxuu u baahan yahay xiriir sugan (HTTPS) si uu u ogolaado kaamirada iyo mikrofoonka. Fadlan isticmaal cinwaanka HTTPS. (Secure context HTTPS is required).';
      this.logDiagnostic('C_ACQUIRE_RESULT', 'Insecure Context', 'failed', err);
      return { stream: null, error: err };
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err =
        'Biraawsarkaagu ma taageero helitaanka qalabka WebRTC (navigator.mediaDevices.getUserMedia). Fadlan cusboonaysii biraawsarkaaga. (Media devices not supported).';
      this.logDiagnostic('C_ACQUIRE_RESULT', 'Media Devices Not Available', 'failed', err);
      return {
        stream: null,
        error: err,
      };
    }

    // Try primary constraint set first
    try {
      const constraints: MediaStreamConstraints =
        type === 'video'
          ? {
              audio: { echoCancellation: true, noiseSuppression: true },
              video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
            }
          : {
              audio: { echoCancellation: true, noiseSuppression: true },
              video: false,
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      const audioTracks = stream.getAudioTracks().length;
      const videoTracks = stream.getVideoTracks().length;

      this.logDiagnostic(
        'C_ACQUIRE_RESULT',
        'Media Stream Acquired Successfully',
        'success',
        `Acquired local MediaStream. Audio tracks: ${audioTracks}, Video tracks: ${videoTracks}`,
        { audioTracks, videoTracks, active: stream.active }
      );

      if (this.currentSession) {
        this.currentSession.errorMessage = undefined;
        this.notify();
      }
      return { stream };
    } catch (primaryErr: any) {
      console.warn('Primary media constraints failed, attempting fallback:', primaryErr);

      // If video call failed due to overconstrained or camera device issue, try basic video constraints
      if (type === 'video') {
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            audio: true,
            video: true,
          };
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          this.localStream = stream;
          const audioTracks = stream.getAudioTracks().length;
          const videoTracks = stream.getVideoTracks().length;

          this.logDiagnostic(
            'C_ACQUIRE_RESULT',
            'Media Stream Acquired via Fallback',
            'success',
            `Fallback constraints succeeded. Audio tracks: ${audioTracks}, Video tracks: ${videoTracks}`,
            { audioTracks, videoTracks }
          );

          if (this.currentSession) {
            this.currentSession.errorMessage = undefined;
            this.notify();
          }
          return { stream };
        } catch (fallbackErr: any) {
          console.warn('Fallback video constraints also failed:', fallbackErr);
        }
      }

      // Analyze specific error with clear bilingual (English & Somali) explanation
      let errorMsg = `getUserMedia failed: ${primaryErr.name || 'Error'} - ${primaryErr.message || 'Access rejected'}`;
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (primaryErr.name === 'NotAllowedError' || primaryErr.name === 'PermissionDeniedError') {
        if (inIframe) {
          errorMsg =
            type === 'video'
              ? 'Kaamirada iyo mikrofoonka waxaa xannibay shaashadda daawashada (iframe) ee AI Studio sababtoo ah siyaasadda amniga biraawsarka. Si aad u wacdo, fadlan guji "Ku Fur Daaqad Cusub (Open in Standalone Tab)" si toos ah oo sugan. (Camera/mic blocked inside embedded iframe preview).'
              : 'Mikrofoonka waxaa xannibay shaashadda daawashada (iframe) ee AI Studio sababtoo ah siyaasadda amniga biraawsarka. Si aad u wacdo, fadlan guji "Ku Fur Daaqad Cusub (Open in Standalone Tab)" si toos ah oo sugan. (Microphone blocked inside embedded iframe preview).';
        } else {
          errorMsg =
            type === 'video'
              ? 'Ogolaanshaha Kaamirada iyo Mikrofoonka waa la diiday. Fadlan guji calaamadda qufulka ee biraawsarkaaga (URL bar) si aad u ogolaato, ka dibna guji Isku-day mar kale. (Camera & microphone access was denied by browser).'
              : 'Ogolaanshaha Mikrofoonka waa la diiday. Fadlan biraawsarkaaga ka ogolow mikrofoonka, ka dibna guji Isku-day mar kale. (Microphone access was denied by browser).';
        }
      } else if (primaryErr.name === 'NotFoundError' || primaryErr.name === 'DevicesNotFoundError') {
        errorMsg =
          type === 'video'
            ? 'Lama helin Kaamero ama Mikrofoon ku xiran aaladdaada. Fadlan ku xir qalabkaaga oo dib u tijaabi. (No camera or microphone found on your device).'
            : 'Lama helin Mikrofoon ku xiran aaladdaada. Fadlan ku xir mikrofoon oo dib u tijaabi. (No microphone found on your device).';
      } else if (primaryErr.name === 'NotReadableError' || primaryErr.name === 'TrackStartError') {
        errorMsg =
          'Kaamirada ama Mikrofoonka waxaa hadda isticmaalaya barnaamij kale (sida Zoom, Teams ama tab kale). Fadlan xir barnaamijkaas oo ku celi. (Hardware is currently busy in another app/tab).';
      } else if (primaryErr.name === 'OverconstrainedError') {
        errorMsg =
          'Tayada kaamirada aaladdaada ma taageerto qaabka la codsaday. (Camera format constraints not supported by your hardware).';
      } else if (primaryErr.name === 'SecurityError') {
        errorMsg =
          'Amniga biraawsarka ayaa diiday helitaanka qalabka. Waxaa loo baahan yahay xiriir sugan (HTTPS). (Security policy disallowed media access).';
      }

      this.logDiagnostic(
        'C_ACQUIRE_RESULT',
        `getUserMedia Rejected: ${primaryErr.name || 'Error'}`,
        'failed',
        errorMsg,
        { errorName: primaryErr.name, errorMessage: primaryErr.message, inIframe }
      );

      return { stream: null, error: errorMsg };
    }
  }

  /**
   * Retry acquiring media during an active call session
   */
  public async retryMedia(): Promise<boolean> {
    if (!this.currentSession) return false;
    const { stream, error } = await this.acquireMedia(this.currentSession.type);
    if (stream) {
      if (this.peerConnection) {
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        // Replace track on existing transceivers so renegotiation is not required
        this.peerConnection.getTransceivers().forEach((transceiver) => {
          if (transceiver.receiver.track.kind === 'audio' && audioTrack) {
            transceiver.direction = 'sendrecv';
            transceiver.sender.replaceTrack(audioTrack);
          } else if (transceiver.receiver.track.kind === 'video' && videoTrack) {
            transceiver.direction = 'sendrecv';
            transceiver.sender.replaceTrack(videoTrack);
          }
        });

        // Add any missing tracks to peer connection
        stream.getTracks().forEach((track) => {
          const hasSender = this.peerConnection?.getSenders().some((s) => s.track === track);
          if (!hasSender) {
            try {
              this.peerConnection?.addTrack(track, stream!);
            } catch (e) {
              console.warn('addTrack fallback in retryMedia:', e);
            }
          }
        });
      }
      if (this.currentSession) {
        this.currentSession.errorMessage = undefined;
        this.notify();
      }
      return true;
    } else {
      if (this.currentSession) {
        this.currentSession.errorMessage = error;
        this.notify();
      }
      return false;
    }
  }

  /**
   * Initiates an outgoing WebRTC call from caller to receiver via Firestore signaling
   */
  public async startCall(
    classroomId: string,
    type: CallType,
    caller: CallParticipant,
    receiver: CallParticipant
  ): Promise<{ success: boolean; error?: string }> {
    this.cleanupPeerConnection();

    this.logDiagnostic(
      'A_CLICKED',
      'Call Initiation Triggered',
      'pending',
      `Caller (${caller.name} [${caller.role}]) -> Receiver (${receiver.name} [${receiver.role}]) [${type.toUpperCase()}] in classroom: ${classroomId}`,
      { caller, receiver, classroomId }
    );

    // 1. Verify caller authentication
    if (!auth.currentUser) {
      const authErr =
        'Fadlan marka hore gal akoonkaaga (Sign In) si aad u sameyso wicitaanka tooska ah. (User must be authenticated to start a call).';
      this.logDiagnostic('A_CLICKED', 'Unauthenticated Caller', 'failed', authErr);
      return { success: false, error: authErr };
    }

    // 2. Verify recipient identity (must not be mock demo IDs)
    if (!receiver.id || receiver.id === 'st-1' || receiver.id === 'teacher_1') {
      const recErr =
        receiver.role === 'student'
          ? 'Aqoonsiga ardayga la wacayo ma aha mid dhab ah. Fadlan xulo arday dhab ah oo fasalka iska diiwaangeliyay. (Invalid student recipient UID).'
          : 'Aqoonsiga macallinka fasalkan weli lama diiwaangelin Firestore dhexdiisa. Fadlan hubi in macallinku ku jiro fasalka. (Invalid teacher recipient UID).';
      this.logDiagnostic('A_CLICKED', 'Invalid Recipient ID', 'failed', recErr, { receiver });
      return { success: false, error: recErr };
    }

    const canonicalId = await classroomChatService.resolveCanonicalClassroomId(classroomId);
    if (!canonicalId) {
      const err = 'Could not resolve canonical classroom ID';
      this.logDiagnostic('A_CLICKED', 'Canonical Classroom ID Not Found', 'failed', err, { classroomId });
      return { success: false, error: err };
    }

    // 3. Pre-validate classroom membership from Firestore
    try {
      const cDoc = await getDoc(doc(db, 'classrooms', canonicalId));
      if (!cDoc.exists()) {
        const clsErr = 'Fasalkan lagama helin xogta Firestore (Classroom document does not exist in Firestore).';
        this.logDiagnostic('A_CLICKED', 'Classroom Not Found', 'failed', clsErr, { canonicalId });
        return { success: false, error: clsErr };
      }

      // If receiver is student, check enrollment
      if (receiver.role === 'student') {
        const enrollDoc = await getDoc(doc(db, 'classrooms', canonicalId, 'enrollments', receiver.id));
        if (!enrollDoc.exists()) {
          const enrollQ = query(
            collection(db, 'classrooms', canonicalId, 'enrollments'),
            where('studentId', '==', receiver.id)
          );
          const enrollSnap = await getDocs(enrollQ);
          if (enrollSnap.empty) {
            const enrollErr =
              'Ardayga la wacayo kuma jiro diiwaanka fasalkan (Recipient is not enrolled in this classroom).';
            this.logDiagnostic('A_CLICKED', 'Recipient Not Enrolled', 'failed', enrollErr, { receiverId: receiver.id });
            return { success: false, error: enrollErr };
          }
        }
      }
    } catch (membershipErr: any) {
      console.warn('Membership pre-check warning:', membershipErr);
    }

    // 4. Acquire local hardware stream
    const { stream, error } = await this.acquireMedia(type);
    if (!stream) {
      this.logDiagnostic('A_CLICKED', 'Aborted - Media Acquisition Failed', 'failed', error || 'Failed to acquire media stream');
      return { success: false, error: error || 'Failed to acquire media stream' };
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveCallerId = auth.currentUser?.uid || caller.id;

    // 2. Initialize RTCPeerConnection
    this.logDiagnostic(
      'I_PEER_CONNECTION_STATE',
      'Initializing RTCPeerConnection',
      'pending',
      'Configuring RTCPeerConnection with STUN and TURN fallback iceServers',
      { callId, iceServersCount: ICE_SERVERS.iceServers?.length }
    );

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;
    this.remoteStream = new MediaStream();

    // Attach local media tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
    // Ensure all transceivers are configured to sendrecv for full bi-directional audio/video
    pc.getTransceivers().forEach((t) => {
      t.direction = 'sendrecv';
    });
    this.liveMetrics.addTrackRan = true;
    this.liveMetrics.localAudioTracks = stream.getAudioTracks().length;
    this.liveMetrics.localVideoTracks = stream.getVideoTracks().length;
    this.notifyMetrics();

    // Handle remote tracks arrival
    pc.ontrack = (event) => {
      this.liveMetrics.onTrackFired = true;
      this.logDiagnostic(
        'J_REMOTE_TRACK_PLAYBACK',
        'Remote Media Track Received',
        'success',
        `Received remote track: kind=${event.track.kind}, enabled=${event.track.enabled}, readyState=${event.track.readyState}`,
        { kind: event.track.kind, id: event.track.id }
      );

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream?.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream?.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream?.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream?.addTrack(event.track);
        }
      }

      // Re-instantiate MediaStream reference so React state and video DOM srcObject update immediately
      this.remoteStream = new MediaStream(this.remoteStream.getTracks());
      event.track.onunmute = () => {
        if (this.remoteStream) {
          this.remoteStream = new MediaStream(this.remoteStream.getTracks());
          this.notify();
        }
      };

      this.liveMetrics.remoteAudioTracks = this.remoteStream.getAudioTracks().length;
      this.liveMetrics.remoteVideoTracks = this.remoteStream.getVideoTracks().length;
      this.liveMetrics.remoteStreamAttached = true;
      this.notifyMetrics();

      if (this.currentSession && this.currentSession.status !== 'connected') {
        this.currentSession = {
          ...this.currentSession,
          status: 'connected',
          connectedAt: this.currentSession.connectedAt || Date.now(),
        };
        this.startDurationTimer();
      }
      this.notify();
    };

    // Buffer and stream local ICE candidates to Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate && auth.currentUser) {
        try {
          const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const candRef = doc(db, 'classrooms', canonicalId, 'calls', callId, 'callerCandidates', candId);
          await setDoc(candRef, {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            senderId: auth.currentUser.uid,
            createdAt: Date.now(),
          });
          this.liveMetrics.iceCandidatesSent++;
          this.notifyMetrics();
          this.logDiagnostic('H_ICE_EXCHANGE', 'Caller Candidate Streamed', 'info', `Sent caller candidate ${event.candidate.type || ''}`);
        } catch (e: any) {
          console.warn('Error writing caller ICE candidate:', e);
          this.logDiagnostic('H_ICE_EXCHANGE', 'Candidate Write Error', 'failed', e?.message || 'Error writing candidate', e);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.liveMetrics.iceConnectionState = pc.iceConnectionState;
      this.notifyMetrics();
      this.logDiagnostic(
        'I_PEER_CONNECTION_STATE',
        `ICE Connection State: ${pc.iceConnectionState}`,
        pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed' ? 'success' : pc.iceConnectionState === 'failed' ? 'failed' : 'info',
        `iceConnectionState changed to ${pc.iceConnectionState}. ConnectionState: ${pc.connectionState}`
      );
      if (
        (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') &&
        this.currentSession &&
        this.currentSession.status !== 'connected'
      ) {
        this.currentSession = {
          ...this.currentSession,
          status: 'connected',
          connectedAt: this.currentSession.connectedAt || Date.now(),
        };
        this.startDurationTimer();
        this.notify();
      }
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      this.liveMetrics.peerConnectionState = pc.connectionState;
      this.notifyMetrics();
      this.logDiagnostic(
        'I_PEER_CONNECTION_STATE',
        `PeerConnection State: ${pc.connectionState}`,
        pc.connectionState === 'connected' ? 'success' : pc.connectionState === 'failed' ? 'failed' : 'info',
        `connectionState changed to: ${pc.connectionState}`
      );
      if (pc.connectionState === 'connected') {
        this.soundPlayer.playConnectChime();
        if (this.currentSession && this.currentSession.status !== 'connected') {
          this.currentSession = {
            ...this.currentSession,
            status: 'connected',
            connectedAt: this.currentSession.connectedAt || Date.now(),
          };
          this.startDurationTimer();
          this.notify();
        }
      } else if (pc.connectionState === 'failed') {
        this.logDiagnostic('I_PEER_CONNECTION_STATE', 'Connection Failed', 'failed', 'WebRTC peer connection failed');
        if (this.currentSession && this.currentSession.status !== 'ended') {
          this.currentSession = {
            ...this.currentSession,
            status: 'failed',
            errorMessage: 'Xiriirka WebRTC ma suurtagelin (Peer connection failed).',
          };
          this.notify();
        }
      }
    };

    // 3. Create and set SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.liveMetrics.offerApplied = true;
    this.notifyMetrics();
    this.logDiagnostic('G_SDP_EXCHANGE', 'Local SDP Offer Created', 'success', `Created & set local SDP offer type: ${offer.type}`);

    // 4. Save call offer document to Firestore
    const callDocRef = doc(db, 'classrooms', canonicalId, 'calls', callId);
    try {
      await setDoc(callDocRef, {
        id: callId,
        classroomId: canonicalId,
        callType: type,
        status: 'ringing',
        callerId: effectiveCallerId,
        callerName: caller.name,
        callerRole: caller.role,
        receiverId: receiver.id,
        receiverName: receiver.name,
        receiverRole: receiver.role,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.logDiagnostic(
        'D_FIRESTORE_DOC_CREATED',
        'Firestore Call Document Written',
        'success',
        `Saved call signaling document at classrooms/${canonicalId}/calls/${callId}`,
        { callerId: effectiveCallerId, receiverId: receiver.id }
      );
    } catch (docErr: any) {
      console.error('Failed to create call signaling doc in Firestore:', docErr);
      this.logDiagnostic(
        'D_FIRESTORE_DOC_CREATED',
        'Firestore Call Document Failed',
        'failed',
        `Failed to create document: ${docErr?.message || 'Permission denied or Firestore error'}`,
        docErr
      );
      this.cleanupPeerConnection();
      return { success: false, error: docErr?.message || 'Failed to start call' };
    }

    // 5. Update session state to outgoing_ringing
    const session: CallSession = {
      id: callId,
      classroomId: canonicalId,
      type,
      status: 'outgoing_ringing',
      caller: { ...caller, id: effectiveCallerId },
      receiver,
      startedAt: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerMuted: false,
      errorMessage: error,
      connectionMode: 'webrtc_peer',
    };

    this.currentSession = session;
    this.notify();
    this.soundPlayer.startRingtone();

    // 45s outgoing call timeout
    if (this.callTimeoutTimer) clearTimeout(this.callTimeoutTimer);
    this.callTimeoutTimer = setTimeout(async () => {
      if (
        this.currentSession &&
        (this.currentSession.status === 'outgoing_ringing' || this.currentSession.status === 'calling')
      ) {
        this.logDiagnostic('A_CLICKED', 'Call Timeout', 'info', 'No answer after 45 seconds');
        try {
          await updateDoc(callDocRef, {
            status: 'timed_out',
            endedAt: Date.now(),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {}
        this.endCallInternal('No answer (Timed out)');
      }
    }, 45000);

    // 6. Listen for recipient's answer, rejection, or end in Firestore
    this.activeCallDocUnsub = onSnapshot(
      callDocRef,
      async (snap) => {
        if (!snap.exists()) {
          this.logDiagnostic('A_CLICKED', 'Call Doc Removed', 'info', 'Signaling document was deleted');
          this.endCallInternal('Call ended');
          return;
        }

        const data = snap.data();
        if (
          data.status === 'accepted' &&
          data.answer &&
          (this.currentSession?.status === 'outgoing_ringing' || this.currentSession?.status === 'calling')
        ) {
          this.logDiagnostic(
            'F_RECIPIENT_ACCEPTED',
            'Recipient Accepted Call',
            'success',
            `Recipient accepted with answer SDP (${data.answer.type})`
          );
          if (this.callTimeoutTimer) clearTimeout(this.callTimeoutTimer);
          this.soundPlayer.stopRingtone();

          // Transition caller to connecting state
          this.currentSession = {
            ...this.currentSession,
            status: 'connecting',
          };
          this.notify();

          try {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              this.liveMetrics.answerApplied = true;
              this.notifyMetrics();
              this.logDiagnostic('G_SDP_EXCHANGE', 'Remote SDP Answer Applied', 'success', 'Remote description set to accepted answer');
              await this.flushCandidateQueue();
            }
          } catch (sdpErr: any) {
            console.warn('Error applying remote SDP answer:', sdpErr);
            this.logDiagnostic('G_SDP_EXCHANGE', 'Remote SDP Answer Error', 'failed', sdpErr?.message || 'SDP error', sdpErr);
          }

          // Listen for receiver's ICE candidates
          const receiverCandsRef = collection(db, 'classrooms', canonicalId, 'calls', callId, 'receiverCandidates');
          this.remoteCandidatesUnsub = onSnapshot(
            receiverCandsRef,
            (candsSnap) => {
              candsSnap.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                  const cData = change.doc.data();
                  await this.processRemoteCandidate({
                    candidate: cData.candidate,
                    sdpMid: cData.sdpMid,
                    sdpMLineIndex: cData.sdpMLineIndex,
                  });
                }
              });
            },
            (err) => {
              console.warn('remoteCandidatesUnsub onSnapshot notice:', err);
            }
          );
        } else if (data.status === 'rejected' || data.status === 'declined') {
          this.logDiagnostic('F_RECIPIENT_ACCEPTED', 'Recipient Rejected Call', 'info', 'Call was declined by receiver');
          if (this.callTimeoutTimer) clearTimeout(this.callTimeoutTimer);
          this.soundPlayer.stopRingtone();
          this.soundPlayer.playEndChime();
          this.endCallInternal('Call declined');
        } else if (data.status === 'timed_out') {
          this.logDiagnostic('A_CLICKED', 'Call Timed Out', 'info', 'Call timed out');
          if (this.callTimeoutTimer) clearTimeout(this.callTimeoutTimer);
          this.soundPlayer.stopRingtone();
          this.soundPlayer.playEndChime();
          this.endCallInternal('Wakhtigii wuu dhacay (Call timed out)');
        } else if (data.status === 'ended') {
          this.logDiagnostic('A_CLICKED', 'Call Ended Remotely', 'info', 'Call was terminated by remote party');
          if (this.callTimeoutTimer) clearTimeout(this.callTimeoutTimer);
          this.soundPlayer.stopRingtone();
          this.soundPlayer.playEndChime();
          this.endCallInternal('Call ended');
        }
      },
      (err) => {
        console.warn('activeCallDocUnsub onSnapshot notice:', err);
      }
    );

    return { success: true };
  }

  /**
   * Recipient answers the incoming WebRTC call (Manual Answer Only)
   */
  public async answerCall(): Promise<void> {
    if (!this.currentSession) return;
    const session = this.currentSession;
    const callId = session.id;
    const canonicalId = session.classroomId;

    this.logDiagnostic(
      'F_RECIPIENT_ACCEPTED',
      'Receiver Manually Answered Call',
      'pending',
      `Receiver accepted incoming call ID: ${callId}. Starting media acquisition and WebRTC answer.`
    );

    this.soundPlayer.stopRingtone();

    // 1. Transition state to accepting
    this.currentSession = {
      ...session,
      status: 'accepting',
    };
    this.notify();

    // 2. Acquire local media (only after explicit Answer click) with graceful receive-only fallback
    const hasLiveAudio = this.localStream && this.localStream.getAudioTracks().some((t) => t.readyState === 'live');
    const hasLiveVideo = this.localStream && this.localStream.getVideoTracks().some((t) => t.readyState === 'live');
    const isStreamValid = session.type === 'video' ? (hasLiveAudio && hasLiveVideo) : hasLiveAudio;

    let stream = isStreamValid ? this.localStream : null;
    let hardwareWarning: string | undefined = undefined;

    if (!stream) {
      const res = await this.acquireMedia(session.type);
      if (res.stream) {
        stream = res.stream;
        this.localStream = stream;
      } else {
        // Fallback to audio-only if camera was unavailable or denied
        if (session.type === 'video') {
          const audioRes = await this.acquireMedia('voice');
          if (audioRes.stream) {
            stream = audioRes.stream;
            this.localStream = stream;
            hardwareWarning = 'Kaamiradu ma furmin, codka oo kaliya ayaa shaqeynaya (Camera unavailable, audio-only connected).';
          }
        }
        if (!stream) {
          // If neither camera nor mic is accessible, do not fail! Connect in receive-only mode so recipient can still see and hear the caller.
          hardwareWarning = res.error || 'Qalabka codka/kaamirada lama heli karo. Waxaad ku xiran tahay daawasho kaliya (Connected in receive-only mode).';
        }
      }
    }

    // QA/Simulation Call handler: connect cleanly without crashing on missing Firestore doc
    if (callId.endsWith('_sim')) {
      if (stream) {
        this.remoteStream = new MediaStream(stream.getTracks());
      }
      this.currentSession = {
        ...session,
        status: 'connected',
        connectedAt: Date.now(),
        errorMessage: hardwareWarning,
      };
      this.startDurationTimer();
      this.notify();
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;
    this.remoteStream = new MediaStream();

    // Handle remote tracks arrival
    pc.ontrack = (event) => {
      this.liveMetrics.onTrackFired = true;
      this.logDiagnostic(
        'J_REMOTE_TRACK_PLAYBACK',
        'Receiver Track Received',
        'success',
        `Receiver received remote track: kind=${event.track.kind}, enabled=${event.track.enabled}, readyState=${event.track.readyState}`
      );
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream?.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream?.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream?.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream?.addTrack(event.track);
        }
      }

      // Re-instantiate MediaStream reference so React state and video DOM srcObject update immediately
      this.remoteStream = new MediaStream(this.remoteStream.getTracks());
      event.track.onunmute = () => {
        if (this.remoteStream) {
          this.remoteStream = new MediaStream(this.remoteStream.getTracks());
          this.notify();
        }
      };

      this.liveMetrics.remoteAudioTracks = this.remoteStream.getAudioTracks().length;
      this.liveMetrics.remoteVideoTracks = this.remoteStream.getVideoTracks().length;
      this.liveMetrics.remoteStreamAttached = true;
      this.notifyMetrics();

      if (this.currentSession && this.currentSession.status !== 'connected') {
        this.soundPlayer.playConnectChime();
        this.currentSession = {
          ...this.currentSession,
          status: 'connected',
          connectedAt: this.currentSession.connectedAt || Date.now(),
        };
        this.startDurationTimer();
      }
      this.notify();
    };

    // Buffer and stream receiver ICE candidates to Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate && auth.currentUser) {
        try {
          const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const candRef = doc(db, 'classrooms', canonicalId, 'calls', callId, 'receiverCandidates', candId);
          await setDoc(candRef, {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            senderId: auth.currentUser.uid,
            createdAt: Date.now(),
          });
          this.liveMetrics.iceCandidatesSent++;
          this.notifyMetrics();
          this.logDiagnostic('H_ICE_EXCHANGE', 'Receiver Candidate Streamed', 'info', `Sent receiver candidate`);
        } catch (e: any) {
          console.warn('Error writing receiver ICE candidate:', e);
          this.logDiagnostic('H_ICE_EXCHANGE', 'Candidate Write Error', 'failed', e?.message || 'Error', e);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.liveMetrics.iceConnectionState = pc.iceConnectionState;
      this.notifyMetrics();
      this.logDiagnostic(
        'I_PEER_CONNECTION_STATE',
        `Receiver ICE State: ${pc.iceConnectionState}`,
        pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed' ? 'success' : pc.iceConnectionState === 'failed' ? 'failed' : 'info',
        `Receiver iceConnectionState changed to: ${pc.iceConnectionState}`
      );
      if (
        (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') &&
        this.currentSession &&
        this.currentSession.status !== 'connected'
      ) {
        this.soundPlayer.playConnectChime();
        this.currentSession = {
          ...this.currentSession,
          status: 'connected',
          connectedAt: this.currentSession.connectedAt || Date.now(),
        };
        this.startDurationTimer();
        this.notify();
      }
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      this.liveMetrics.peerConnectionState = pc.connectionState;
      this.notifyMetrics();
      if (pc.connectionState === 'connected') {
        this.soundPlayer.playConnectChime();
        if (this.currentSession && this.currentSession.status !== 'connected') {
          this.currentSession = {
            ...this.currentSession,
            status: 'connected',
            connectedAt: this.currentSession.connectedAt || Date.now(),
          };
          this.startDurationTimer();
          this.notify();
        }
      } else if (pc.connectionState === 'failed') {
        this.logDiagnostic('I_PEER_CONNECTION_STATE', 'Receiver Connection Failed', 'failed', 'WebRTC peer connection failed');
        if (this.currentSession && this.currentSession.status !== 'ended') {
          this.currentSession = {
            ...this.currentSession,
            status: 'failed',
            errorMessage: 'Xiriirka WebRTC ma suurtagelin (Peer connection failed).',
          };
          this.notify();
        }
      }
    };

    // 3. Fetch call doc & set remote SDP offer FIRST (Required by WebRTC JSEP standard for answerers)
    const callDocRef = doc(db, 'classrooms', canonicalId, 'calls', callId);
    const callSnap = await getDoc(callDocRef);
    if (!callSnap.exists()) {
      this.logDiagnostic('F_RECIPIENT_ACCEPTED', 'Call Doc Missing', 'failed', 'Call document no longer exists in Firestore');
      this.endCallInternal('Call no longer exists');
      return;
    }

    const callData = callSnap.data();
    if (!callData.offer) {
      this.logDiagnostic('G_SDP_EXCHANGE', 'Missing Remote Offer', 'failed', 'Call document missing offer payload');
      this.endCallInternal('Missing call offer');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      this.liveMetrics.offerApplied = true;
      this.notifyMetrics();
      this.logDiagnostic('G_SDP_EXCHANGE', 'Remote Offer Applied', 'success', 'Receiver successfully applied caller SDP offer');
      await this.flushCandidateQueue();
    } catch (offerErr: any) {
      this.logDiagnostic('G_SDP_EXCHANGE', 'Remote Offer Failed', 'failed', offerErr?.message || 'Error applying offer', offerErr);
    }

    // 4. Attach local media tracks to matching transceivers negotiated from caller's SDP offer
    if (stream) {
      const transceivers = pc.getTransceivers();
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      transceivers.forEach((transceiver) => {
        if (transceiver.receiver.track.kind === 'audio' && audioTrack) {
          transceiver.direction = 'sendrecv';
          transceiver.sender.replaceTrack(audioTrack);
        } else if (transceiver.receiver.track.kind === 'video' && videoTrack) {
          transceiver.direction = 'sendrecv';
          transceiver.sender.replaceTrack(videoTrack);
        }
      });

      // Ensure all local tracks are added to peer connection with streams attached
      stream.getTracks().forEach((track) => {
        const hasSender = pc.getSenders().some((s) => s.track === track);
        if (!hasSender) {
          try {
            pc.addTrack(track, stream!);
          } catch (e) {
            console.warn('addTrack fallback warning in answerCall:', e);
          }
        }
      });

      // Ensure all transceivers with sender tracks send and receive
      pc.getTransceivers().forEach((t) => {
        if (t.sender.track) {
          t.direction = 'sendrecv';
        }
      });
      this.liveMetrics.localAudioTracks = stream.getAudioTracks().length;
      this.liveMetrics.localVideoTracks = stream.getVideoTracks().length;
    } else {
      pc.getTransceivers().forEach((t) => {
        t.direction = 'recvonly';
      });
    }
    this.liveMetrics.addTrackRan = true;
    this.notifyMetrics();

    // Listen for caller's ICE candidates
    const callerCandsRef = collection(db, 'classrooms', canonicalId, 'calls', callId, 'callerCandidates');
    this.remoteCandidatesUnsub = onSnapshot(
      callerCandsRef,
      (candsSnap) => {
        candsSnap.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const cData = change.doc.data();
            await this.processRemoteCandidate({
              candidate: cData.candidate,
              sdpMid: cData.sdpMid,
              sdpMLineIndex: cData.sdpMLineIndex,
            });
          }
        });
      },
      (err) => {
        console.warn('callerCandidatesUnsub onSnapshot notice:', err);
      }
    );

    // 5. Create and set SDP Answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.liveMetrics.answerApplied = true;
    this.notifyMetrics();
    this.logDiagnostic('G_SDP_EXCHANGE', 'Created Local Answer', 'success', `Created & set receiver SDP answer (${answer.type})`);

    // 5. Update call doc in Firestore to accepted with answer
    try {
      await updateDoc(callDocRef, {
        status: 'accepted',
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
        connectedAt: Date.now(),
        updatedAt: new Date().toISOString(),
      });
      this.logDiagnostic('F_RECIPIENT_ACCEPTED', 'Answer Doc Saved', 'success', 'Updated Firestore call document with SDP answer');
    } catch (updErr: any) {
      this.logDiagnostic('F_RECIPIENT_ACCEPTED', 'Answer Doc Update Failed', 'failed', updErr?.message || 'Firestore update failed', updErr);
    }

    // 6. Transition state to connecting (awaiting media completion)
    this.currentSession = {
      ...this.currentSession,
      status: 'connecting',
    };
    this.notify();

    // 7. Listen for caller termination
    this.activeCallDocUnsub = onSnapshot(
      callDocRef,
      (snap) => {
        if (!snap.exists() || snap.data()?.status === 'ended') {
          this.logDiagnostic('A_CLICKED', 'Call Ended by Caller', 'info', 'Caller ended the session');
          this.endCallInternal('Call ended');
        }
      },
      (err) => {
        console.warn('activeCallDocUnsub onSnapshot notice:', err);
      }
    );
  }

  /**
   * Decline incoming call
   */
  public async declineCall(): Promise<void> {
    if (!this.currentSession) return;
    const session = this.currentSession;
    this.soundPlayer.stopRingtone();
    this.soundPlayer.playEndChime();

    try {
      const callDocRef = doc(db, 'classrooms', session.classroomId, 'calls', session.id);
      await updateDoc(callDocRef, {
        status: 'declined',
        endedAt: Date.now(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to update call status to declined:', e);
    }

    this.endCallInternal('Call declined');
  }

  /**
   * Hang up and end active or outgoing call
   */
  public async endCall(reason?: string): Promise<void> {
    if (!this.currentSession) return;
    const session = this.currentSession;
    this.soundPlayer.stopRingtone();
    this.soundPlayer.playEndChime();

    try {
      const callDocRef = doc(db, 'classrooms', session.classroomId, 'calls', session.id);
      await updateDoc(callDocRef, {
        status: 'ended',
        endedAt: Date.now(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to update call status to ended:', e);
    }

    this.endCallInternal(reason);
  }

  private endCallInternal(errorMessage?: string): void {
    if (this.callTimeoutTimer) {
      clearTimeout(this.callTimeoutTimer);
      this.callTimeoutTimer = null;
    }
    this.stopDurationTimer();
    this.cleanupPeerConnection();

    if (this.currentSession) {
      const isDeclined = errorMessage?.includes('decline');
      const isTimeout = errorMessage?.includes('Timed out') || errorMessage?.includes('dhacay');
      this.currentSession = {
        ...this.currentSession,
        status: isDeclined ? 'declined' : isTimeout ? 'timed_out' : 'ended',
        endedAt: Date.now(),
        errorMessage: errorMessage || this.currentSession.errorMessage,
      };
      this.notify();

      setTimeout(() => {
        if (
          this.currentSession?.status === 'ended' ||
          this.currentSession?.status === 'declined' ||
          this.currentSession?.status === 'rejected' ||
          this.currentSession?.status === 'timed_out' ||
          this.currentSession?.status === 'failed'
        ) {
          this.currentSession = null;
          this.notify();
        }
      }, 2500);
    }
  }

  private cleanupPeerConnection(): void {
    if (this.activeCallDocUnsub) {
      this.activeCallDocUnsub();
      this.activeCallDocUnsub = null;
    }
    if (this.remoteCandidatesUnsub) {
      this.remoteCandidatesUnsub();
      this.remoteCandidatesUnsub = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.remoteStream = null;
    }

    this.candidateQueue = [];
    this.liveMetrics = {
      localAudioTracks: 0,
      localVideoTracks: 0,
      remoteAudioTracks: 0,
      remoteVideoTracks: 0,
      addTrackRan: false,
      offerApplied: false,
      answerApplied: false,
      iceCandidatesSent: 0,
      iceCandidatesReceived: 0,
      iceCandidatesApplied: 0,
      peerConnectionState: 'idle',
      iceConnectionState: 'idle',
      onTrackFired: false,
      remoteStreamAttached: false,
      audioPlaySucceeded: false,
      audioPlayBlocked: false,
    };
    this.notifyMetrics();
  }

  /**
   * Cleans up all active incoming-call listeners and resets listening state
   */
  public clearIncomingListeners(): void {
    this.incomingListeners.forEach((unsub) => unsub());
    this.incomingListeners.clear();
    this.currentListeningUid = null;
  }

  /**
   * App-level incoming call listener for the authenticated user.
   * Listens across all enrolled or owned classrooms so incoming calls alert anywhere.
   */
  public async listenForIncomingCalls(userUid: string, classroomIds: string[]): Promise<void> {
    if (!userUid || !auth.currentUser || classroomIds.length === 0) {
      this.clearIncomingListeners();
      return;
    }

    // Clean up previous listeners if user changed
    if (this.currentListeningUid !== userUid) {
      this.incomingListeners.forEach((unsub) => unsub());
      this.incomingListeners.clear();
      this.currentListeningUid = userUid;
    }

    const resolvedCanonicalIds: string[] = [];
    for (const rawId of classroomIds) {
      if (!rawId) continue;
      const canonicalId = await classroomChatService.resolveCanonicalClassroomId(rawId);
      if (canonicalId && !resolvedCanonicalIds.includes(canonicalId)) {
        resolvedCanonicalIds.push(canonicalId);
      }
    }

    // Clean up any listeners for classrooms no longer in the list
    const activeSet = new Set(resolvedCanonicalIds);
    for (const [existingId, unsub] of this.incomingListeners.entries()) {
      if (!activeSet.has(existingId)) {
        unsub();
        this.incomingListeners.delete(existingId);
      }
    }

    for (const canonicalId of resolvedCanonicalIds) {
      if (this.incomingListeners.has(canonicalId)) continue;

      try {
        const callsCol = collection(db, 'classrooms', canonicalId, 'calls');
        const q = query(
          callsCol,
          where('receiverId', '==', userUid),
          where('status', '==', 'ringing')
        );

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                const callId = change.doc.id;

                // Don't alert if already in an active or calling call
                if (
                  this.currentSession &&
                  this.currentSession.status !== 'idle' &&
                  this.currentSession.status !== 'ended' &&
                  this.currentSession.status !== 'declined' &&
                  this.currentSession.status !== 'rejected' &&
                  this.currentSession.status !== 'timed_out' &&
                  this.currentSession.status !== 'failed'
                ) {
                  return;
                }

                // Set active incoming call session (Manual answer required - no media acquisition here)
                this.logDiagnostic(
                  'E_RECIPIENT_RECEIVED',
                  'Incoming Call Alert Received',
                  'success',
                  `Recipient received incoming call from ${data.callerName} (${data.callerRole}). Call ID: ${callId}`,
                  { callId, callerId: data.callerId, receiverId: userUid, callType: data.callType }
                );

                this.currentSession = {
                  id: callId,
                  classroomId: canonicalId,
                  type: (data.callType as CallType) || 'video',
                  status: 'incoming_ringing',
                  caller: {
                    id: data.callerId,
                    name: data.callerName || 'Participant',
                    role: data.callerRole || 'teacher',
                  },
                  receiver: {
                    id: userUid,
                    name: data.receiverName || 'Student',
                    role: data.receiverRole || 'student',
                  },
                  startedAt: Date.now(),
                  durationSeconds: 0,
                  isMuted: false,
                  isCameraOff: false,
                  isSpeakerMuted: false,
                  connectionMode: 'webrtc_peer',
                };

                this.notify();
                this.soundPlayer.startRingtone();

                // Watch this specific call document: if caller cancels, dismiss incoming prompt
                const specificDocRef = doc(db, 'classrooms', canonicalId, 'calls', callId);
                const cancelWatcher = onSnapshot(
                  specificDocRef,
                  (docSnap) => {
                    if (
                      !docSnap.exists() ||
                      docSnap.data()?.status === 'ended' ||
                      docSnap.data()?.status === 'rejected' ||
                      docSnap.data()?.status === 'declined' ||
                      docSnap.data()?.status === 'timed_out'
                    ) {
                      cancelWatcher();
                      if (
                        this.currentSession?.id === callId &&
                        (this.currentSession?.status === 'incoming' || this.currentSession?.status === 'incoming_ringing')
                      ) {
                        this.soundPlayer.stopRingtone();
                        this.currentSession = null;
                        this.notify();
                      }
                    }
                  },
                  (err) => {
                    console.warn('cancelWatcher onSnapshot notice:', err);
                  }
                );
              }
            });
          },
          (err) => {
            console.warn(`Incoming calls onSnapshot notice for ${canonicalId}:`, err);
          }
        );

        this.incomingListeners.set(canonicalId, unsub);
      } catch (err) {
        console.warn(`Could not attach incoming call listener for classroom ${canonicalId}:`, err);
      }
    }
  }

  /**
   * Toggles microphone mute
   */
  public toggleMute(): boolean {
    if (!this.currentSession) return false;
    const nextMuted = !this.currentSession.isMuted;

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    this.currentSession = {
      ...this.currentSession,
      isMuted: nextMuted,
    };
    this.notify();
    return nextMuted;
  }

  /**
   * Toggles camera on/off during a video call
   */
  public toggleCamera(): boolean {
    if (!this.currentSession) return false;
    const nextCameraOff = !this.currentSession.isCameraOff;

    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextCameraOff;
      });
    }

    this.currentSession = {
      ...this.currentSession,
      isCameraOff: nextCameraOff,
    };
    this.notify();
    return nextCameraOff;
  }

  /**
   * Toggles speaker output audio
   */
  public toggleSpeaker(): boolean {
    if (!this.currentSession) return false;
    const nextSpeakerMuted = !this.currentSession.isSpeakerMuted;

    this.currentSession = {
      ...this.currentSession,
      isSpeakerMuted: nextSpeakerMuted,
    };
    this.notify();
    return nextSpeakerMuted;
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.durationTimer = setInterval(() => {
      if (this.currentSession && this.currentSession.status === 'connected') {
        const connectedAt = this.currentSession.connectedAt || this.currentSession.startedAt;
        const durationSeconds = Math.floor((Date.now() - connectedAt) / 1000);
        this.currentSession = {
          ...this.currentSession,
          durationSeconds,
        };
        this.notify();
      }
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  /**
   * Helper to simulate incoming call for QA and demonstration
   */
  public simulateIncomingCall(
    classroomId: string,
    type: CallType,
    caller: CallParticipant,
    receiver: CallParticipant
  ): void {
    this.cleanupPeerConnection();
    const session: CallSession = {
      id: `call_${Date.now()}_sim`,
      classroomId,
      type,
      status: 'incoming',
      caller,
      receiver,
      startedAt: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerMuted: false,
      connectionMode: 'webrtc_peer',
    };

    this.currentSession = session;
    this.notify();
    this.soundPlayer.startRingtone();
  }
}

export const classroomCallService = new ClassroomCallService();
