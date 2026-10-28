/**
 * SmartEducate Classroom Voice & Video Call Types
 * Supports 1:1 teacher ↔ student voice and video calling states,
 * WebRTC-ready session lifecycle, media controls, and permissions.
 */

import { MessageSenderRole } from './chat';

export type CallType = 'voice' | 'video';

export type CallStatus =
  | 'idle'
  | 'calling'           // Outgoing ringing alias
  | 'outgoing_ringing'  // Caller waiting for manual answer
  | 'incoming'          // Incoming ringing alias
  | 'incoming_ringing'  // Receiver ringing UI (awaiting manual answer)
  | 'accepting'         // Receiver clicked Answer, acquiring media
  | 'connecting'        // Exchanging SDP answer & ICE candidates
  | 'connected'         // WebRTC media actively connected
  | 'declined'          // Manually declined by recipient
  | 'rejected'          // Rejected alias
  | 'timed_out'         // No answer within timeout
  | 'ended'             // Terminated by either party
  | 'failed';           // Connection or media acquisition failed

export interface CallParticipant {
  id: string;
  name: string;
  role: MessageSenderRole;
  avatar?: string;
}

export interface CallSession {
  id: string;
  classroomId: string;
  type: CallType;
  status: CallStatus;
  caller: CallParticipant;
  receiver: CallParticipant;
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerMuted: boolean;
  errorMessage?: string;
  // Connection mode: genuine WebRTC peer connection across devices
  connectionMode: 'webrtc_peer' | 'local_loopback' | 'cross_tab_peer' | 'webrtc_ready';
}

export interface CallDiagnosticLog {
  id: string;
  timestamp: string;
  stage:
    | 'A_CLICKED'
    | 'B_ACQUIRE_START'
    | 'C_ACQUIRE_RESULT'
    | 'D_FIRESTORE_DOC_CREATED'
    | 'E_RECIPIENT_RECEIVED'
    | 'F_RECIPIENT_ACCEPTED'
    | 'G_SDP_EXCHANGE'
    | 'H_ICE_EXCHANGE'
    | 'I_PEER_CONNECTION_STATE'
    | 'J_REMOTE_TRACK_PLAYBACK'
    | 'ERROR';
  stageLabel: string;
  status: 'pending' | 'success' | 'failed' | 'info';
  details: string;
  data?: any;
}

export interface EnvironmentDiagnostics {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  inIframe: boolean;
  protocol: string;
  origin: string;
  userAgent: string;
  microphonePermission?: string;
  cameraPermission?: string;
}

export interface LiveCallMetrics {
  localAudioTracks: number;
  localVideoTracks: number;
  remoteAudioTracks: number;
  remoteVideoTracks: number;
  addTrackRan: boolean;
  offerApplied: boolean;
  answerApplied: boolean;
  iceCandidatesSent: number;
  iceCandidatesReceived: number;
  iceCandidatesApplied: number;
  peerConnectionState: RTCPeerConnectionState | 'idle' | 'closed';
  iceConnectionState: RTCIceConnectionState | 'idle' | 'closed';
  onTrackFired: boolean;
  remoteStreamAttached: boolean;
  audioPlaySucceeded: boolean;
  audioPlayBlocked: boolean;
}
