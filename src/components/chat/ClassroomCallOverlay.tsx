/**
 * SmartEducate Classroom Voice & Video Call Overlay Component
 * Provides production UI for Outgoing Calling, Incoming Ringing, Connected Call with
 * live camera preview, real remote WebRTC stream playback, audio controls,
 * speaker toggle, and permission error handling.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  User,
  Shield,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { CallSession } from '../../types/call';
import { classroomCallService } from '../../services/classroomCallService';
import { useI18n } from '../../i18n/I18nContext';
import { CallDiagnosticsPanel } from './CallDiagnosticsPanel';

interface ClassroomCallOverlayProps {
  session: CallSession;
  onClose?: () => void;
  isTeacher: boolean;
}

export const ClassroomCallOverlay: React.FC<ClassroomCallOverlayProps> = ({
  session,
  isTeacher,
}) => {
  const { t } = useI18n();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Attach local and remote media streams to video/audio DOM elements with play() promise handling
  useEffect(() => {
    const attachStreams = () => {
      const localStream = classroomCallService.getLocalStream();
      const remoteStream = classroomCallService.getRemoteStream();

      // Local video stream preview
      if (localVideoRef.current && localStream) {
        if (localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        localVideoRef.current.play().catch((err) => {
          console.warn('Local video play warning:', err);
        });
      }

      // Check remote video tracks presence and active state
      if (remoteStream) {
        const vTracks = remoteStream.getVideoTracks();
        const liveVideo = vTracks.length > 0 && vTracks.some((t) => t.readyState === 'live');
        setHasRemoteVideo(liveVideo);

        // Remote video stream display (muted so browser never blocks autoplay)
        if (remoteVideoRef.current) {
          const currentSrc = remoteVideoRef.current.srcObject as MediaStream | null;
          const currentVCount = currentSrc?.getVideoTracks().length || 0;

          // Re-bind srcObject if stream instance changed or if previously had 0 video tracks and now has video!
          if (currentSrc !== remoteStream || (currentVCount === 0 && vTracks.length > 0)) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.load();
          }
          remoteVideoRef.current.play().catch((err) => {
            console.warn('Remote video play warning:', err);
          });
        }

        // Remote audio stream playback (handles remote voice in voice & video calls)
        if (remoteAudioRef.current) {
          if (remoteAudioRef.current.srcObject !== remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          remoteAudioRef.current.muted = !!session.isSpeakerMuted;
          remoteAudioRef.current
            .play()
            .then(() => {
              setIsAudioBlocked(false);
              classroomCallService.setPlaybackDiagnostic(true, false);
            })
            .catch((err) => {
              console.warn('Remote audio autoplay blocked by browser:', err);
              setIsAudioBlocked(true);
              classroomCallService.setPlaybackDiagnostic(false, true);
            });
        }
      } else {
        setHasRemoteVideo(false);
      }
    };

    attachStreams();

    // Listen for tracks added or unmuted on remoteStream
    const remoteStream = classroomCallService.getRemoteStream();
    if (remoteStream) {
      remoteStream.onaddtrack = () => attachStreams();
      remoteStream.onremovetrack = () => attachStreams();
      remoteStream.getVideoTracks().forEach((track) => {
        track.onunmute = () => attachStreams();
      });
    }

    // Subscribe to call service state changes for immediate updates
    const unsub = classroomCallService.subscribe(() => {
      attachStreams();
    });

    const interval = setInterval(attachStreams, 300);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [session.status, session.connectionMode, session.isCameraOff, session.isSpeakerMuted]);

  // User-gesture handler to unblock audio if restricted by browser autoplay policy
  const handleUnblockAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => {
          setIsAudioBlocked(false);
          classroomCallService.setPlaybackDiagnostic(true, false);
        })
        .catch((e) => {
          console.warn('User gesture audio unlock failed:', e);
        });
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Accurately determine the opposite party in any call state
  const isCaller = isTeacher
    ? session.caller.role === 'teacher'
    : session.caller.role === 'student';
  const otherParticipant = isCaller ? session.receiver : session.caller;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-in fade-in duration-200">
      {/* Hidden dedicated audio element to guarantee remote voice playback for both voice and video */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={session.isSpeakerMuted} />

      {/* TOP BAR: Header, Status, Duration & WebRTC Security Pill */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              {session.type === 'video' ? (
                <Video className="w-4 h-4" />
              ) : (
                <PhoneCall className="w-4 h-4" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {otherParticipant.name}
              </h4>
              <p className="text-[11px] text-purple-200/80 font-medium capitalize">
                {otherParticipant.role === 'teacher' ? 'Macallin (Instructor)' : 'Arday (Student)'} ·{' '}
                {session.type === 'video' ? 'Wicitaan Muuqaal (Video Call)' : 'Wicitaan Cod (Voice Call)'}
              </p>
            </div>
          </div>

          {/* Call Status / Timer */}
          <div>
            {session.status === 'connected' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Waa ku xiran yahay</span> · {formatDuration(session.durationSeconds)}
              </span>
            ) : session.status === 'calling' || session.status === 'outgoing_ringing' ? (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold animate-pulse">
                Wacayaa... (Calling)
              </span>
            ) : session.status === 'incoming' || session.status === 'incoming_ringing' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold animate-pulse">
                Wicitaan Soo Dhacaya (Incoming Call)
              </span>
            ) : session.status === 'accepting' ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold animate-pulse">
                Aqbalayaa... (Accepting...)
              </span>
            ) : session.status === 'connecting' ? (
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold animate-pulse">
                Isku xirayaa... (Connecting...)
              </span>
            ) : session.status === 'rejected' || session.status === 'declined' ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                Waa la diiday (Declined)
              </span>
            ) : session.status === 'timed_out' ? (
              <span className="px-3 py-1 rounded-full bg-slate-500/20 border border-slate-400/30 text-slate-300 text-xs font-bold">
                Wakhtigii wuu dhacay (Timed Out)
              </span>
            ) : session.status === 'failed' ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                Wicitaanka Ma Guulaysan (Failed)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                Wicitaanku wuu xirmay (Call Ended)
              </span>
            )}
          </div>
        </div>

        {/* WebRTC Peer Connection Mode */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Connection Mode:</span>
          </span>
          <span className="font-mono text-purple-300 text-[10px]">
            Direct WebRTC End-to-End Media (Encrypted Peer Connection)
          </span>
        </div>
      </div>

      {/* HARDWARE PERMISSION WARNING BANNER (If denied or unavailable) */}
      {session.errorMessage && (
        <div className="my-2 p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Ogeysiis Qalabka / Hardware Notice</p>
              <p className="text-[11px] text-amber-200/90 mt-0.5">{session.errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {typeof window !== 'undefined' && window.self !== window.top && (
              <a
                href={typeof window !== 'undefined' ? `${window.location.origin}/?openChat=true` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ku Fur Daaqad Cusub</span>
              </a>
            )}
            <button
              type="button"
              onClick={async () => {
                await classroomCallService.retryMedia();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              Isku-day Mar Kale (Retry)
            </button>
          </div>
        </div>
      )}

      {/* TAP TO ENABLE SOUND BANNER (If browser autoplay blocks remote audio) */}
      {isAudioBlocked && (
        <div className="my-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-between gap-3 text-amber-200 text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="font-bold text-amber-200">
              Biraawsarkaagu wuxuu hakiyay codka fog (Browser blocked remote audio autoplay).
            </p>
          </div>
          <button
            type="button"
            onClick={handleUnblockAudio}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Taabo si codku u shaqeeyo</span>
          </button>
        </div>
      )}

      {/* CENTER VIEW: Depends on Call Status & Type */}
      <div className="flex-1 my-3 flex items-center justify-center relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
        {(session.status === 'calling' || session.status === 'outgoing_ringing') && (
          /* OUTGOING CALLING VIEW */
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="relative">
              {/* Ripple circles */}
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-4 border-purple-400/30 flex items-center justify-center text-white shadow-xl relative z-10">
                <User className="w-12 h-12" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{otherParticipant.name}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Wacayaa... Sugaya in {otherParticipant.role === 'teacher' ? 'macallinku' : 'ardaygu'} ka jawaabo (Ringing... waiting for answer)
              </p>
            </div>
          </div>
        )}

        {(session.status === 'incoming' || session.status === 'incoming_ringing') && (
          /* INCOMING RINGING VIEW - Manual Answer Only, NEVER Auto-Answer */
          <div className="flex flex-col items-center gap-5 text-center p-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 border-4 border-emerald-400/40 flex items-center justify-center text-white shadow-xl relative z-10">
                <PhoneIncoming className="w-12 h-12" />
              </div>
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide">
                {session.type === 'video' ? 'Wicitaan Muuqaal (Video Call)' : 'Wicitaan Cod (Voice Call)'}
              </span>
              <h3 className="text-xl font-bold text-white mt-1.5">{session.caller.name}</h3>
              <p className="text-xs text-slate-400 capitalize mt-0.5">
                {session.caller.role === 'teacher' ? 'Macallinka Fasalka (Classroom Instructor)' : 'Ardayga Fasalka (Student)'}
              </p>
              <p className="text-[11px] text-emerald-300/80 mt-2 font-medium">
                Guji "Ka jawaab" si aad ugu biirto wicitaanka.
              </p>
            </div>

            {/* Explicit Manual Answer / Decline actions with Somali labels */}
            <div className="flex items-center gap-5 mt-2">
              <button
                type="button"
                onClick={() => classroomCallService.declineCall()}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer font-bold text-xs"
                title="Diid Wicitaanka (Decline Call)"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Diid (Decline)</span>
              </button>

              <button
                type="button"
                onClick={() => classroomCallService.answerCall()}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer animate-pulse font-bold text-xs"
                title="Ka jawaab Wicitaanka (Answer Call)"
              >
                {session.type === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Ka jawaab (Answer)</span>
              </button>
            </div>
          </div>
        )}

        {(session.status === 'accepting' || session.status === 'connecting') && (
          /* CONNECTING TRANSITION VIEW */
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-purple-600/30 border-2 border-purple-400/50 flex items-center justify-center text-purple-300">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{otherParticipant.name}</h3>
              <p className="text-xs text-purple-300 mt-1">
                {session.status === 'accepting'
                  ? 'Aqbalayaa wicitaanka... (Acquiring microphone/camera...)'
                  : 'Isku xirayaa WebRTC... (Connecting media stream...)'}
              </p>
            </div>
          </div>
        )}

        {session.status === 'connected' && (
          /* CONNECTED ACTIVE CALL VIEW */
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
            {session.type === 'video' ? (
              /* VIDEO CALL CANVAS */
              <>
                {/* Main Remote View (Muted so browser autoplay policy never freezes video) */}
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-slate-900 rounded-xl">
                  {/* Fallback placeholder while remote camera feeds connect or if camera off */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-2 shadow-inner">
                      <User className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">{otherParticipant.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Muuqaalka fog (Remote video stream)</p>
                  </div>

                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el) {
                        const remote = classroomCallService.getRemoteStream();
                        if (remote) {
                          if (el.srcObject !== remote) {
                            el.srcObject = remote;
                            el.play().catch(() => {});
                          }
                          if (remote.getVideoTracks().length > 0) {
                            setHasRemoteVideo(true);
                          }
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={true}
                    onLoadedMetadata={() => setHasRemoteVideo(true)}
                    onPlaying={() => setHasRemoteVideo(true)}
                    className={`w-full h-full object-cover rounded-xl relative z-10 transition-opacity duration-300 ${
                      hasRemoteVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {/* Remote Participant Tag */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-xs font-bold text-white flex items-center gap-1.5 border border-white/10 z-20">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>{otherParticipant.name}</span>
                  </div>
                </div>

                {/* Local Camera Picture-in-Picture (PIP) Window */}
                <div className="absolute bottom-3 right-3 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/50 bg-slate-900 z-20">
                  {session.isCameraOff ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-[10px]">
                      <VideoOff className="w-4 h-4 text-slate-500 mb-1" />
                      <span>Camera Off</span>
                    </div>
                  ) : (
                    <video
                      ref={(el) => {
                        localVideoRef.current = el;
                        if (el) {
                          const local = classroomCallService.getLocalStream();
                          if (local && el.srcObject !== local) {
                            el.srcObject = local;
                            el.play().catch(() => {});
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                    Adiga (You)
                  </span>
                </div>
              </>
            ) : (
              /* VOICE CALL CANVAS */
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <div className="relative">
                  {/* Speaking pulse wave */}
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border-4 border-purple-400/40 flex items-center justify-center text-white shadow-2xl relative z-10">
                    <User className="w-12 h-12" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{otherParticipant.name}</h3>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">
                    Wicitaan Cod ah · {formatDuration(session.durationSeconds)}
                  </p>
                </div>

                {/* Audio visualizer bar graph */}
                <div className="flex items-center gap-1 h-8 mt-1">
                  {[40, 70, 95, 60, 30, 85, 100, 75, 45, 90, 65, 35].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${session.isMuted ? 15 : h}%` }}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        session.isMuted ? 'bg-slate-700' : 'bg-purple-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(session.status === 'declined' || session.status === 'rejected') && (
          /* CALL DECLINED VIEW */
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-amber-600/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
              <PhoneOff className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Waa la diiday (Call Declined)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Qofka kale wuu diiday wicitaanka (Call declined by recipient)
              </p>
            </div>
          </div>
        )}

        {session.status === 'timed_out' && (
          /* CALL TIMED OUT VIEW */
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center text-slate-400">
              <Clock className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Wakhtigii wuu dhacay (Timed Out)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Lama helin jawaab 45 ilbiriqsi gudahood (No answer within 45s)
              </p>
            </div>
          </div>
        )}

        {session.status === 'failed' && (
          /* CALL FAILED VIEW */
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Wicitaanka Ma Guulaysan (Call Failed)</h3>
              <p className="text-xs text-slate-400 mt-1">
                {session.errorMessage || 'Xiriirka WebRTC lama xaqiijin karo'}
              </p>
            </div>
          </div>
        )}

        {session.status === 'ended' && (
          /* CALL ENDED VIEW */
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400">
              <PhoneOff className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Wicitaanku wuu xirmay (Call Ended)</h3>
              <p className="text-xs text-slate-400 mt-1">
                {session.durationSeconds > 0
                  ? `Wadarta wakhtiga: ${formatDuration(session.durationSeconds)}`
                  : 'Xiriirku wuu go\'ay'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS TOOLBAR */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 py-2">
        {session.status === 'connected' ? (
          <>
            {/* Mute / Unmute Mic */}
            <button
              type="button"
              onClick={() => classroomCallService.toggleMute()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                session.isMuted
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={session.isMuted ? 'Fur Codka (Unmute Mic)' : 'Xir Codka (Mute Mic)'}
            >
              {session.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera On / Off (For Video Calls) */}
            {session.type === 'video' && (
              <button
                type="button"
                onClick={() => classroomCallService.toggleCamera()}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  session.isCameraOff
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title={session.isCameraOff ? 'Fur Kaamirada (Turn Camera On)' : 'Xir Kaamirada (Turn Camera Off)'}
              >
                {session.isCameraOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Speaker / Output Toggle */}
            <button
              type="button"
              onClick={() => classroomCallService.toggleSpeaker()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                session.isSpeakerMuted
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={session.isSpeakerMuted ? 'Fur Sameecada (Unmute Speaker)' : 'Xir Sameecada (Mute Speaker)'}
            >
              {session.isSpeakerMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={() => classroomCallService.endCall()}
              className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Xir Wicitaanka (End Call)"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </>
        ) : session.status === 'calling' ||
          session.status === 'outgoing_ringing' ||
          session.status === 'connecting' ||
          session.status === 'accepting' ? (
          <button
            type="button"
            onClick={() => classroomCallService.endCall()}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Kanoolee (Cancel Call)</span>
          </button>
        ) : null}
      </div>

      {/* Real-time WebRTC Diagnostics Trace Panel (A-J stages, Live Metrics & Environment) */}
      <CallDiagnosticsPanel />
    </div>
  );
};
