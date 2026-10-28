/**
 * SmartEducate Live Lecture Session Service
 * Provides real-time authoritative live lecture discovery, lifecycle coordination,
 * and synchronization between Teacher and enrolled Students.
 * Backed by Firestore cloud persistence (/classrooms/{classroomId}/liveSessions/{sessionId}),
 * BroadcastChannel for instant cross-tab discovery, and localStorage resilience.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { whiteboardSyncService } from './whiteboardSyncService';

// Public STUN servers and openrelay TURN fallback for restrictive NAT traversal
export const ICE_SERVERS: RTCConfiguration = {
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

export type LiveConnectionState =
  | 'IDLE'
  | 'SESSION_AVAILABLE'
  | 'JOINING'
  | 'CONNECTING_MEDIA'
  | 'CONNECTED'
  | 'CAMERA_OFF'
  | 'AUDIO_ONLY'
  | 'CONNECTION_FAILED'
  | 'SESSION_ENDED';

export interface LiveLectureSession {
  id: string;
  classroomId: string;
  title: string;
  subject?: string;
  teacherId: string;
  teacherName: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  activeTab?: 'video' | 'whiteboard';
}

const STORAGE_PREFIX = 'smarteducate_live_session_';
const CHANNEL_NAME = 'smarteducate_live_sessions_channel';

class LiveSessionService {
  private memoryCache: Map<string, LiveLectureSession> = new Map();
  private singleListeners: Map<string, Set<(session: LiveLectureSession | null) => void>> = new Map();
  private multiListeners: Set<(sessions: Map<string, LiveLectureSession>) => void> = new Set();
  private firestoreUnsubs: Map<string, Unsubscribe> = new Map();
  private channel: BroadcastChannel | null = null;
  private activeLocalStream: MediaStream | null = null;

  // Real-time WebRTC broadcast connections from teacher to enrolled students
  private teacherPeerConnections: Map<string, { pc: RTCPeerConnection; unsubs: Unsubscribe[] }> = new Map();
  private teacherBroadcastUnsub: Unsubscribe | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'LIVE_SESSION_UPDATE' && event.data.session) {
            this.handleRemoteSessionUpdate(event.data.session);
          } else if (event.data?.type === 'LIVE_SESSION_ENDED' && event.data.classroomId) {
            this.handleRemoteSessionEnded(event.data.classroomId);
          }
        };
      } catch (err) {
        console.warn('LiveSessionService BroadcastChannel warning:', err);
      }
    }
  }

  /**
   * Set or clear the active local media stream (from teacher camera/mic)
   */
  public setLocalStream(stream: MediaStream | null): void {
    this.activeLocalStream = stream;
  }

  /**
   * Get the active local media stream
   */
  public getLocalStream(): MediaStream | null {
    return this.activeLocalStream;
  }

  /**
   * Handles incoming session update from BroadcastChannel
   */
  private handleRemoteSessionUpdate(session: LiveLectureSession): void {
    this.memoryCache.set(session.classroomId, session);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${session.classroomId}`, JSON.stringify(session));
      } catch (e) {}
    }
    this.notifySingleListeners(session.classroomId, session);
    this.notifyMultiListeners();
  }

  /**
   * Handles incoming session ended notification from BroadcastChannel
   */
  private handleRemoteSessionEnded(classroomId: string): void {
    const existing = this.memoryCache.get(classroomId);
    if (existing) {
      const ended: LiveLectureSession = {
        ...existing,
        status: 'ended',
        endedAt: new Date().toISOString(),
      };
      this.memoryCache.set(classroomId, ended);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${classroomId}`, JSON.stringify(ended));
        } catch (e) {}
      }
      this.notifySingleListeners(classroomId, ended);
      this.notifyMultiListeners();
    }
  }

  /**
   * Notify single-classroom subscribers
   */
  private notifySingleListeners(classroomId: string, session: LiveLectureSession | null): void {
    const set = this.singleListeners.get(classroomId);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(session);
        } catch (e) {
          console.warn('Listener error in LiveSessionService:', e);
        }
      });
    }
  }

  /**
   * Notify multi-classroom subscribers (e.g., student dashboard)
   */
  private notifyMultiListeners(): void {
    const copy = new Map(this.memoryCache);
    this.multiListeners.forEach((cb) => {
      try {
        cb(copy);
      } catch (e) {
        console.warn('Multi-listener error in LiveSessionService:', e);
      }
    });
  }

  /**
   * Load session from memory or localStorage
   */
  public getSession(classroomId: string): LiveLectureSession | null {
    if (this.memoryCache.has(classroomId)) {
      return this.memoryCache.get(classroomId)!;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${classroomId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.classroomId === classroomId) {
            this.memoryCache.set(classroomId, parsed);
            return parsed;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  /**
   * Teacher starts an authoritative live lecture for a classroom
   */
  public async startLiveLecture(params: {
    classroomId: string;
    title: string;
    subject?: string;
    teacherId: string;
    teacherName: string;
    hasVideo?: boolean;
    hasAudio?: boolean;
    activeTab?: 'video' | 'whiteboard';
  }): Promise<LiveLectureSession> {
    const sessionId = `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session: LiveLectureSession = {
      id: sessionId,
      classroomId: params.classroomId,
      title: params.title,
      subject: params.subject,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      status: 'active',
      startedAt: new Date().toISOString(),
      hasVideo: params.hasVideo ?? true,
      hasAudio: params.hasAudio ?? true,
      activeTab: params.activeTab || 'video',
    };

    // 1. Update memory cache & localStorage
    this.memoryCache.set(params.classroomId, session);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${params.classroomId}`, JSON.stringify(session));
      } catch (e) {}
    }

    // 2. Broadcast immediately to other tabs/windows in the browser
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'LIVE_SESSION_UPDATE',
          session,
        });
      } catch (e) {}
    }

    // 3. Keep whiteboard sync in lockstep
    try {
      whiteboardSyncService.setLiveActive(params.classroomId, true, {
        classroomTitle: params.title,
        teacherName: params.teacherName,
      });
    } catch (e) {
      console.warn('whiteboardSyncService setLiveActive error:', e);
    }

    // 4. Persist to authoritative Firestore cloud document
    try {
      const docRef = doc(db, 'classrooms', params.classroomId, 'liveSessions', 'current');
      await setDoc(docRef, {
        id: session.id,
        classroomId: session.classroomId,
        title: session.title,
        teacherName: session.teacherName,
        teacherId: session.teacherId,
        status: 'active',
        startedAt: session.startedAt,
        hasVideo: session.hasVideo,
        hasAudio: session.hasAudio,
        activeTab: session.activeTab,
      });
    } catch (err) {
      console.warn('Firestore liveSessions persistence note:', err);
    }

    this.notifySingleListeners(params.classroomId, session);
    this.notifyMultiListeners();
    return session;
  }

  /**
   * Teacher ends the live lecture for a classroom
   */
  public async endLiveLecture(classroomId: string): Promise<void> {
    const existing = this.getSession(classroomId);
    const endedSession: LiveLectureSession = {
      id: existing?.id || `live_${Date.now()}`,
      classroomId,
      title: existing?.title || 'Live Session',
      subject: existing?.subject,
      teacherId: existing?.teacherId || '',
      teacherName: existing?.teacherName || 'Instructor',
      status: 'ended',
      startedAt: existing?.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      hasVideo: false,
      hasAudio: false,
    };

    // 1. Update memory & local storage
    this.memoryCache.set(classroomId, endedSession);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${classroomId}`, JSON.stringify(endedSession));
      } catch (e) {}
    }

    // 2. Broadcast via channel
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'LIVE_SESSION_ENDED',
          classroomId,
        });
      } catch (e) {}
    }

    // 3. Update whiteboard sync
    try {
      whiteboardSyncService.setLiveActive(classroomId, false);
    } catch (e) {}

    // 4. Update Firestore cloud document
    try {
      const docRef = doc(db, 'classrooms', classroomId, 'liveSessions', 'current');
      await setDoc(
        docRef,
        {
          status: 'ended',
          endedAt: endedSession.endedAt,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore liveSessions end note:', err);
    }

    this.notifySingleListeners(classroomId, endedSession);
    this.notifyMultiListeners();
  }

  /**
   * Subscribes to live lecture updates for a single classroom (cloud + channel + memory)
   */
  public subscribeClassroom(
    classroomId: string,
    callback: (session: LiveLectureSession | null) => void
  ): () => void {
    if (!classroomId) {
      callback(null);
      return () => {};
    }

    if (!this.singleListeners.has(classroomId)) {
      this.singleListeners.set(classroomId, new Set());
    }
    this.singleListeners.get(classroomId)!.add(callback);

    // Initial trigger from memory or localStorage
    const current = this.getSession(classroomId);
    callback(current);

    // Register Firestore onSnapshot listener if not already active
    if (!this.firestoreUnsubs.has(classroomId)) {
      try {
        const docRef = doc(db, 'classrooms', classroomId, 'liveSessions', 'current');
        const unsub = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as LiveLectureSession;
              if (data && data.status) {
                this.handleRemoteSessionUpdate(data);
              }
            } else {
              // If document does not exist yet, verify if whiteboard is active
              const wb = whiteboardSyncService.getSession(classroomId);
              if (wb && wb.isLiveActive) {
                const synthetic: LiveLectureSession = {
                  id: `syn_${classroomId}`,
                  classroomId,
                  title: wb.classroomTitle || 'Live Lecture',
                  teacherId: 'teacher',
                  teacherName: wb.teacherName || 'Instructor',
                  status: 'active',
                  startedAt: wb.lastUpdated,
                  hasVideo: true,
                  hasAudio: true,
                };
                this.handleRemoteSessionUpdate(synthetic);
              }
            }
          },
          (err) => {
            console.warn(`Firestore liveSessions listener notice for ${classroomId}:`, err);
          }
        );
        this.firestoreUnsubs.set(classroomId, unsub);
      } catch (err) {
        console.warn('Could not register Firestore liveSessions subscription:', err);
      }
    }

    return () => {
      const set = this.singleListeners.get(classroomId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.singleListeners.delete(classroomId);
          const unsub = this.firestoreUnsubs.get(classroomId);
          if (unsub) {
            unsub();
            this.firestoreUnsubs.delete(classroomId);
          }
        }
      }
    };
  }

  /**
   * Subscribes to live lecture updates across ALL enrolled classrooms for a student.
   * This guarantees immediate discovery whenever any of the student's teachers goes live.
   */
  public subscribeEnrolledClassrooms(
    classroomIds: string[],
    callback: (activeSessions: LiveLectureSession[]) => void
  ): () => void {
    if (!Array.isArray(classroomIds) || classroomIds.length === 0) {
      callback([]);
      return () => {};
    }

    const unsubs: Array<() => void> = [];
    const activeMap: Map<string, LiveLectureSession> = new Map();

    const emit = () => {
      const activeList = Array.from(activeMap.values()).filter((s) => s.status === 'active');
      callback(activeList);
    };

    classroomIds.forEach((id) => {
      const u = this.subscribeClassroom(id, (session) => {
        if (session && session.status === 'active') {
          activeMap.set(id, session);
        } else {
          activeMap.delete(id);
        }
        emit();
      });
      unsubs.push(u);
    });

    emit();

    return () => {
      unsubs.forEach((u) => u());
    };
  }

  /**
   * Updates dynamic hardware media state (e.g. teacher turning camera off or muting mic)
   */
  public async updateMediaState(
    classroomId: string,
    state: { hasVideo?: boolean; hasAudio?: boolean }
  ): Promise<void> {
    const existing = this.getSession(classroomId);
    if (existing) {
      const updated: LiveLectureSession = {
        ...existing,
        hasVideo: state.hasVideo ?? existing.hasVideo,
        hasAudio: state.hasAudio ?? existing.hasAudio,
      };
      this.handleRemoteSessionUpdate(updated);
    }
    try {
      const docRef = doc(db, 'classrooms', classroomId, 'liveSessions', 'current');
      await updateDoc(docRef, {
        ...(state.hasVideo !== undefined ? { hasVideo: state.hasVideo } : {}),
        ...(state.hasAudio !== undefined ? { hasAudio: state.hasAudio } : {}),
      });
    } catch (e) {
      console.warn('updateMediaState notice:', e);
    }
  }

  /**
   * Starts teacher-side WebRTC broadcast listener.
   * Listens for joining students in /classrooms/{classroomId}/calls and negotiates
   * individual RTCPeerConnection to stream the teacher's camera/mic to each student.
   */
  public startBroadcastMedia(
    classroomId: string,
    teacherUid: string,
    localStream: MediaStream
  ): () => void {
    this.stopBroadcastMedia();
    this.activeLocalStream = localStream;

    try {
      const callsCol = collection(db, 'classrooms', classroomId, 'calls');
      const q = query(
        callsCol,
        where('callType', '==', 'live_stream'),
        where('receiverId', '==', teacherUid),
        where('status', '==', 'live_join_requested')
      );

      this.teacherBroadcastUnsub = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const callId = change.doc.id;
              const studentUid = data.callerId;

              if (!data.offer || !studentUid) return;

              // If an existing connection exists for this student, tear it down cleanly first
              if (this.teacherPeerConnections.has(studentUid)) {
                const existing = this.teacherPeerConnections.get(studentUid)!;
                existing.unsubs.forEach((u) => u());
                try {
                  existing.pc.close();
                } catch (e) {}
                this.teacherPeerConnections.delete(studentUid);
              }

              console.log(`[LIVE_BROADCAST] Teacher negotiating live stream with student: ${studentUid}`);

              const pc = new RTCPeerConnection(ICE_SERVERS);
              const connectionUnsubs: Unsubscribe[] = [];

              // Attach teacher's local audio and video tracks
              localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
              });

              // Stream teacher ICE candidates to receiverCandidates
              pc.onicecandidate = async (event) => {
                if (event.candidate) {
                  try {
                    const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    const candRef = doc(
                      db,
                      'classrooms',
                      classroomId,
                      'calls',
                      callId,
                      'receiverCandidates',
                      candId
                    );
                    await setDoc(candRef, {
                      candidate: event.candidate.candidate,
                      sdpMid: event.candidate.sdpMid,
                      sdpMLineIndex: event.candidate.sdpMLineIndex,
                      senderId: teacherUid,
                      createdAt: Date.now(),
                    });
                  } catch (candErr) {
                    console.warn('Teacher live ICE candidate write error:', candErr);
                  }
                }
              };

              // Set remote student SDP offer
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

                // Listen for student's ICE candidates
                const callerCandsRef = collection(
                  db,
                  'classrooms',
                  classroomId,
                  'calls',
                  callId,
                  'callerCandidates'
                );
                const candsUnsub = onSnapshot(
                  callerCandsRef,
                  (candsSnap) => {
                    candsSnap.docChanges().forEach(async (candChange) => {
                      if (candChange.type === 'added') {
                        const cData = candChange.doc.data();
                        if (cData.candidate) {
                          try {
                            await pc.addIceCandidate(
                              new RTCIceCandidate({
                                candidate: cData.candidate,
                                sdpMid: cData.sdpMid,
                                sdpMLineIndex: cData.sdpMLineIndex,
                              })
                            );
                          } catch (e) {}
                        }
                      }
                    });
                  },
                  (err) => {
                    console.warn('callerCandidates onSnapshot notice:', err);
                  }
                );
                connectionUnsubs.push(candsUnsub);

                // Create and set local SDP answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Update Firestore call doc with accepted answer
                const callDocRef = doc(db, 'classrooms', classroomId, 'calls', callId);
                await updateDoc(callDocRef, {
                  status: 'live_connected',
                  answer: {
                    type: answer.type,
                    sdp: answer.sdp,
                  },
                  connectedAt: Date.now(),
                  updatedAt: new Date().toISOString(),
                });

                // Listen for student leaving/ending
                const docUnsub = onSnapshot(
                  callDocRef,
                  (snap) => {
                    if (!snap.exists() || snap.data()?.status === 'ended') {
                      this.cleanupStudentPeer(studentUid);
                    }
                  },
                  (err) => {
                    console.warn('live callDoc onSnapshot notice:', err);
                  }
                );
                connectionUnsubs.push(docUnsub);

                this.teacherPeerConnections.set(studentUid, {
                  pc,
                  unsubs: connectionUnsubs,
                });
              } catch (sdpErr) {
                console.warn('Teacher live SDP negotiation error:', sdpErr);
              }
            }
          });
        },
        (err) => {
          console.warn('teacherBroadcast onSnapshot notice:', err);
        }
      );
    } catch (err) {
      console.warn('startBroadcastMedia listener error:', err);
    }

    return () => this.stopBroadcastMedia();
  }

  private cleanupStudentPeer(studentUid: string): void {
    const item = this.teacherPeerConnections.get(studentUid);
    if (item) {
      item.unsubs.forEach((u) => u());
      try {
        item.pc.close();
      } catch (e) {}
      this.teacherPeerConnections.delete(studentUid);
      console.log(`[LIVE_BROADCAST] Cleaned up peer connection for student: ${studentUid}`);
    }
  }

  /**
   * Stops teacher broadcast and cleans up all active student peer connections
   */
  public stopBroadcastMedia(): void {
    if (this.teacherBroadcastUnsub) {
      this.teacherBroadcastUnsub();
      this.teacherBroadcastUnsub = null;
    }
    this.teacherPeerConnections.forEach((item) => {
      item.unsubs.forEach((u) => u());
      try {
        item.pc.close();
      } catch (e) {}
    });
    this.teacherPeerConnections.clear();
  }

  /**
   * Student joins an active live lecture and establishes WebRTC peer connection
   * with the broadcasting teacher to receive remote video and audio streams.
   */
  public joinLiveStream(params: {
    classroomId: string;
    studentUid: string;
    studentName: string;
    teacherUid: string;
    onRemoteStream: (stream: MediaStream) => void;
    onStateChange: (state: LiveConnectionState, details?: string) => void;
  }): () => void {
    const { classroomId, studentUid, studentName, teacherUid, onRemoteStream, onStateChange } = params;

    let isTerminated = false;
    let pc: RTCPeerConnection | null = null;
    const unsubs: Unsubscribe[] = [];
    const callDocId = `live_stream_${studentUid}`;
    const candidateQueue: RTCIceCandidateInit[] = [];

    onStateChange('JOINING');

    const cleanup = async () => {
      if (isTerminated) return;
      isTerminated = true;

      unsubs.forEach((u) => u());
      unsubs.length = 0;

      if (pc) {
        try {
          pc.close();
        } catch (e) {}
        pc = null;
      }

      // Mark the student call doc ended or delete it
      try {
        const callDocRef = doc(db, 'classrooms', classroomId, 'calls', callDocId);
        await updateDoc(callDocRef, {
          status: 'ended',
          endedAt: Date.now(),
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {}

      onStateChange('IDLE');
    };

    // Initialize WebRTC
    const initWebRTC = async () => {
      try {
        // 1. Verify session is still active
        const session = this.getSession(classroomId);
        if (session && session.status === 'ended') {
          onStateChange('SESSION_ENDED', 'The instructor has ended this live lecture.');
          return;
        }

        onStateChange('CONNECTING_MEDIA');

        pc = new RTCPeerConnection(ICE_SERVERS);
        const remoteStream = new MediaStream();

        // 2. Add receive-only transceivers for audio and video
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // 3. Handle incoming remote tracks
        pc.ontrack = (event) => {
          console.log(`[LIVE_STREAM] Student received remote track: ${event.track.kind}`);
          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach((track) => {
              if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
                remoteStream.addTrack(track);
              }
            });
          } else if (event.track) {
            if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
              remoteStream.addTrack(event.track);
            }
          }
          onRemoteStream(remoteStream);
          onStateChange('CONNECTED');
        };

        // 4. Handle ICE and connection states
        pc.onconnectionstatechange = () => {
          if (!pc || isTerminated) return;
          console.log(`[LIVE_STREAM] Student connectionState: ${pc.connectionState}`);
          if (pc.connectionState === 'connected') {
            onStateChange('CONNECTED');
          } else if (pc.connectionState === 'failed') {
            onStateChange('CONNECTION_FAILED', 'WebRTC media transport failed to establish.');
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (!pc || isTerminated) return;
          console.log(`[LIVE_STREAM] Student iceConnectionState: ${pc.iceConnectionState}`);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            onStateChange('CONNECTED');
          } else if (pc.iceConnectionState === 'failed') {
            pc.restartIce();
          }
        };

        // 5. Stream student ICE candidates to callerCandidates
        pc.onicecandidate = async (event) => {
          if (event.candidate && !isTerminated) {
            try {
              const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const candRef = doc(
                db,
                'classrooms',
                classroomId,
                'calls',
                callDocId,
                'callerCandidates',
                candId
              );
              await setDoc(candRef, {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                senderId: studentUid,
                createdAt: Date.now(),
              });
            } catch (e) {
              console.warn('Student ICE candidate write warning:', e);
            }
          }
        };

        // 6. Create SDP Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 7. Write call offer document to Firestore
        const callDocRef = doc(db, 'classrooms', classroomId, 'calls', callDocId);
        await setDoc(callDocRef, {
          id: callDocId,
          classroomId,
          callType: 'live_stream',
          status: 'live_join_requested',
          callerId: studentUid,
          callerName: studentName,
          callerRole: 'student',
          receiverId: teacherUid,
          receiverName: 'Instructor',
          receiverRole: 'teacher',
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 8. Listen for teacher's SDP answer
        const docUnsub = onSnapshot(
          callDocRef,
          async (snap) => {
            if (isTerminated || !pc) return;
            if (!snap.exists()) {
              onStateChange('SESSION_ENDED', 'Live stream session was ended.');
              cleanup();
              return;
            }

            const data = snap.data();
            if (data.status === 'live_connected' && data.answer) {
              try {
                if (pc.signalingState !== 'stable') {
                  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                  // Flush buffered candidates
                  for (const cand of candidateQueue) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch (e) {}
                  }
                  candidateQueue.length = 0;
                }
              } catch (sdpErr) {
                console.warn('Student error applying teacher SDP answer:', sdpErr);
              }

              // Listen for teacher's receiverCandidates
              const receiverCandsRef = collection(
                db,
                'classrooms',
                classroomId,
                'calls',
                callDocId,
                'receiverCandidates'
              );
              const candsUnsub = onSnapshot(
                receiverCandsRef,
                (candsSnap) => {
                  if (isTerminated || !pc) return;
                  candsSnap.docChanges().forEach(async (candChange) => {
                    if (candChange.type === 'added') {
                      const cData = candChange.doc.data();
                      if (cData.candidate) {
                        const candInit: RTCIceCandidateInit = {
                          candidate: cData.candidate,
                          sdpMid: cData.sdpMid,
                          sdpMLineIndex: cData.sdpMLineIndex,
                        };
                        const currentPc = pc;
                        if (currentPc && currentPc.remoteDescription) {
                          try {
                            await currentPc.addIceCandidate(new RTCIceCandidate(candInit));
                          } catch (e) {}
                        } else {
                          candidateQueue.push(candInit);
                        }
                      }
                    }
                  });
                },
                (err) => {
                  console.warn('receiverCandidates onSnapshot notice:', err);
                }
              );
              unsubs.push(candsUnsub);
            } else if (data.status === 'ended') {
              onStateChange('SESSION_ENDED', 'The instructor has ended the live stream.');
              cleanup();
            }
          },
          (err) => {
            console.warn('Student call doc onSnapshot notice:', err);
          }
        );
        unsubs.push(docUnsub);

        // 9. Also listen to classroom live session document for overall session end
        const sessionDocRef = doc(db, 'classrooms', classroomId, 'liveSessions', 'current');
        const sessionUnsub = onSnapshot(
          sessionDocRef,
          (snap) => {
            if (isTerminated) return;
            if (snap.exists() && snap.data()?.status === 'ended') {
              onStateChange('SESSION_ENDED', 'The instructor has ended the live lecture.');
              cleanup();
            }
          },
          (err) => {
            console.warn('Session doc onSnapshot notice:', err);
          }
        );
        unsubs.push(sessionUnsub);
      } catch (err: any) {
        console.warn('joinLiveStream initiation error:', err);
        onStateChange('CONNECTION_FAILED', err?.message || 'Could not connect to live stream.');
      }
    };

    initWebRTC();

    return () => {
      cleanup();
    };
  }
}

export const liveSessionService = new LiveSessionService();
