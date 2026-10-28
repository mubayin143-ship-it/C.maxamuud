/**
 * SmartEducate WebRTC & Environment Real-Time Call Diagnostics Panel
 * Records live stages A through J:
 * A: Call initiation clicked
 * B: Camera/mic request started
 * C: getUserMedia result / error
 * D: Firestore call doc created
 * E: Recipient listener received
 * F: Recipient accepted
 * G: SDP offer/answer exchanged
 * H: ICE candidates exchanged
 * I: RTCPeerConnection state
 * J: Remote media tracks playback
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Camera,
  ExternalLink,
  Radio,
  Check,
  X,
  Volume2,
} from 'lucide-react';
import { CallDiagnosticLog, EnvironmentDiagnostics, LiveCallMetrics } from '../../types/call';
import { classroomCallService } from '../../services/classroomCallService';

export const CallDiagnosticsPanel: React.FC = () => {
  const [logs, setLogs] = useState<CallDiagnosticLog[]>([]);
  const [env, setEnv] = useState<EnvironmentDiagnostics | null>(null);
  const [metrics, setMetrics] = useState<LiveCallMetrics>(classroomCallService.getLiveMetrics());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stages' | 'metrics' | 'env'>('stages');

  useEffect(() => {
    const unsubDiag = classroomCallService.subscribeDiagnostics((newLogs) => {
      setLogs(newLogs);
    });
    const unsubMetrics = classroomCallService.subscribeMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });
    classroomCallService.getEnvironmentDiagnostics().then(setEnv);
    return () => {
      unsubDiag();
      unsubMetrics();
    };
  }, []);

  const refreshEnv = async () => {
    const res = await classroomCallService.getEnvironmentDiagnostics();
    setEnv(res);
  };

  const hasErrors = logs.some((l) => l.status === 'failed');

  return (
    <div className="border-t border-slate-700/80 bg-slate-900/90 text-slate-200 text-xs rounded-xl overflow-hidden mt-3 shadow-lg">
      {/* Collapsible header */}
      <div
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${hasErrors ? 'text-rose-400' : 'text-purple-400'}`} />
          <span className="font-bold text-white tracking-wide text-xs">
            WebRTC Diagnostics Trace & Environment Inspect
          </span>
          {logs.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                hasErrors ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {logs.length} stages ({hasErrors ? 'failures noted' : 'live'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {metrics.peerConnectionState === 'connected' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected (PC: {metrics.peerConnectionState})
            </span>
          )}
          {env?.inIframe && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              Preview iFrame
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 border-t border-slate-800 space-y-3">
          {/* Subheader tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('stages')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'stages'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Lifecycle Stages (A-J)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Media & ICE Metrics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('env')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'env'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Runtime Environment
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshEnv}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                title="Refresh Environment Inspection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => classroomCallService.clearDiagnostics()}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TAB 1: Real-time Stages A through J */}
          {activeTab === 'stages' && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">
                  No call initiated yet. Click Voice Call or Video Call to capture diagnostic traces.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                  {logs.map((log) => {
                    const statusColor =
                      log.status === 'success'
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
                        : log.status === 'failed'
                        ? 'text-rose-400 border-rose-500/30 bg-rose-950/20'
                        : log.status === 'pending'
                        ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
                        : 'text-slate-300 border-slate-700/40 bg-slate-800/40';

                    return (
                      <div
                        key={log.id}
                        className={`p-2 rounded-lg border flex items-start justify-between gap-2 ${statusColor}`}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : log.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : log.status === 'pending' ? (
                            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                          ) : (
                            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold uppercase tracking-wider text-[10px] px-1 py-0.2 rounded bg-black/40">
                                {log.stage.replace('_', ' ')}
                              </span>
                              <span className="font-semibold text-slate-200">{log.stageLabel}</span>
                            </div>
                            <p className="text-slate-300 text-[10px] mt-0.5 break-all whitespace-pre-wrap">
                              {log.details}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                          {log.timestamp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live WebRTC & Media Metrics */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Local Tracks</span>
                <p className="font-bold text-white text-xs">
                  Audio: <span className="text-emerald-400">{metrics.localAudioTracks}</span> | Video: <span className="text-emerald-400">{metrics.localVideoTracks}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  addTrack(): {metrics.addTrackRan ? <span className="text-emerald-400 font-bold">Executed</span> : <span className="text-slate-500">Pending</span>}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Remote Tracks</span>
                <p className="font-bold text-white text-xs">
                  Audio: <span className="text-purple-400">{metrics.remoteAudioTracks}</span> | Video: <span className="text-purple-400">{metrics.remoteVideoTracks}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  ontrack: {metrics.onTrackFired ? <span className="text-emerald-400 font-bold">Fired</span> : <span className="text-slate-500">Waiting</span>}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">ICE Candidates</span>
                <p className="font-bold text-white text-xs">
                  Sent: <span className="text-indigo-400">{metrics.iceCandidatesSent}</span> | Recv: <span className="text-indigo-400">{metrics.iceCandidatesReceived}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Applied: <span className="text-emerald-400 font-bold">{metrics.iceCandidatesApplied}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">SDP & State</span>
                <p className="font-bold text-xs capitalize text-purple-300">
                  PC: {metrics.peerConnectionState}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  ICE: {metrics.iceConnectionState}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-4 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                <div className="flex items-center gap-3">
                  <span>SDP Offer: {metrics.offerApplied ? <span className="text-emerald-400 font-bold">✓ Applied</span> : <span className="text-slate-500">None</span>}</span>
                  <span>SDP Answer: {metrics.answerApplied ? <span className="text-emerald-400 font-bold">✓ Applied</span> : <span className="text-slate-500">None</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Audio Playback:</span>
                  {metrics.audioPlayBlocked ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-amber-400" /> Blocked (Tap unblock button)
                    </span>
                  ) : metrics.audioPlaySucceeded ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Playing
                    </span>
                  ) : (
                    <span className="text-slate-400">Idle / Initializing</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Execution Environment Diagnostics */}
          {activeTab === 'env' && env && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Secure Context (HTTPS):</span>
                  {env.isSecureContext ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Insecure (HTTP)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MediaDevices API:</span>
                  <span className={env.hasMediaDevices ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {env.hasMediaDevices ? 'Available' : 'Missing'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">getUserMedia Supported:</span>
                  <span className={env.hasGetUserMedia ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {env.hasGetUserMedia ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Embedded Frame (iFrame):</span>
                  <span className={env.inIframe ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {env.inIframe ? 'Inside iFrame (Permissions Policy applies)' : 'Top-level Window'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mic Permission:</span>
                  <span className="font-mono text-purple-300 font-bold capitalize">
                    {env.microphonePermission || 'prompt'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Camera Permission:</span>
                  <span className="font-mono text-purple-300 font-bold capitalize">
                    {env.cameraPermission || 'prompt'}
                  </span>
                </div>
              </div>

              {/* Direct Standalone Launch Helper */}
              {env.inIframe && (
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-400 shrink-0" />
                    <p className="text-[11px] text-purple-200">
                      Inside iframe preview: browsers restrict camera/microphone access without top-level permission delegation. For guaranteed cross-device WebRTC calling, open the standalone HTTPS URL in a new browser window.
                    </p>
                  </div>
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <span>Open Standalone</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
