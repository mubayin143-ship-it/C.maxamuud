/**
 * SmartEducate Classroom Lecture Recording Modal
 * Supports real microphone recording, verified browser MIME types,
 * clean track disposal, preview playback, and saving to Study Material
 * with instructor download permissions (Allow Download, View Only, Download Disabled).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Radio,
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Sparkles,
  Volume2,
  Trash2,
  CheckCircle2,
  FileAudio,
} from 'lucide-react';
import { GlobalClassroom } from '../../types/education';
import {
  studyMaterialService,
  ClassroomLectureRecording,
  StudyMaterialDownloadPermission,
} from '../../services/studyMaterialService';
import { useI18n } from '../../i18n/I18nContext';

interface ClassroomRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  isTeacher: boolean;
}

export const ClassroomRecordingModal: React.FC<ClassroomRecordingModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  isTeacher,
}) => {
  const { t } = useI18n();

  // Recordings list from studyMaterialService
  const [recordings, setRecordings] = useState<ClassroomLectureRecording[]>([]);

  // Recording lifecycle state
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Completed recording audio result (real human voice)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [recordedDurationSeconds, setRecordedDurationSeconds] = useState(0);

  // Save form fields
  const [saveTitle, setSaveTitle] = useState('');
  const [savePermission, setSavePermission] = useState<StudyMaterialDownloadPermission>('allow_download');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Playback state
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  // Audio & Hardware refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const listAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load recordings on open
  useEffect(() => {
    if (isOpen && activeClassroom?.id) {
      const recs = studyMaterialService.getRecordings(
        activeClassroom.id,
        activeClassroom.instructorName
      );
      setRecordings(recs);
    }
  }, [isOpen, activeClassroom?.id]);

  // Clean up audio & hardware on unmount or close
  useEffect(() => {
    return () => {
      stopHardwareTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (listAudioRef.current) {
        listAudioRef.current.pause();
        listAudioRef.current = null;
      }
    };
  }, []);

  const stopHardwareTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
  };

  const getSupportedMimeType = (): string => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return '';
    }
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const formatSeconds = (total: number) => {
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. START RECORDING (Uses real browser MediaRecorder)
  const handleStartRecording = async () => {
    setRecordingError(null);
    setRecordedAudioUrl(null);
    setIsPlayingPreview(false);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Microphone recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Emit data in 250ms chunks to ensure audio data is continuously captured
      recorder.start(250);

      setRecorderState('recording');
      setRecordingSeconds(0);

      const defaultTitle = `Lecture: ${activeClassroom?.title || 'Classroom'} (${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })})`;
      setSaveTitle(defaultTitle);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      let msg = 'Microphone access was denied. Please allow microphone permission in your browser address bar.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device was detected on your computer.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Microphone is already in use by another application.';
      }
      setRecordingError(msg);
      setRecorderState('idle');
    }
  };

  // 2. STOP RECORDING (Captures real audio Blob and stops tracks cleanly)
  const handleStopRecording = () => {
    if (recorderState !== 'recording') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const capturedDuration = Math.max(1, recordingSeconds);
    setRecordedDurationSeconds(capturedDuration);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        // Cleanly stop all microphone hardware tracks
        recorder.stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });

        const effectiveMime = recorder.mimeType || 'audio/webm';
        setRecordedMimeType(effectiveMime);

        const blob = new Blob(audioChunksRef.current, { type: effectiveMime });

        if (blob.size === 0) {
          setRecordingError('No audio data was captured. Please speak directly into your microphone.');
          setRecorderState('idle');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (dataUrl) {
            setRecordedAudioUrl(dataUrl);
            setRecorderState('stopped');
          }
        };
        reader.onerror = () => {
          const objUrl = URL.createObjectURL(blob);
          setRecordedAudioUrl(objUrl);
          setRecorderState('stopped');
        };
        reader.readAsDataURL(blob);
      };

      recorder.stop();
    } else {
      setRecorderState('idle');
    }
  };

  // 3. PREVIEW PLAYBACK (Plays real human voice)
  const togglePreviewPlayback = () => {
    if (!recordedAudioUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudioUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        setPreviewCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewCurrentTime(0);
      };

      audio.onerror = (e) => {
        console.error('Audio preview playback error:', e);
        setIsPlayingPreview(false);
      };
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      // Pause any list audio playing
      if (listAudioRef.current) {
        listAudioRef.current.pause();
        setActivePlayingId(null);
      }

      previewAudioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlayingPreview(false);
        });
    }
  };

  // 4. SAVE RECORDING (Saves to studyMaterialService & resets)
  const handleSaveRecording = () => {
    if (!recordedAudioUrl || !activeClassroom?.id) return;

    const newRec = studyMaterialService.addRecording(activeClassroom.id, {
      title: saveTitle.trim() || `Lecture Recording (${formatSeconds(recordedDurationSeconds)})`,
      durationSeconds: recordedDurationSeconds,
      instructor: activeClassroom?.instructorName || 'Instructor',
      audioUrl: recordedAudioUrl,
      mimeType: recordedMimeType,
      downloadPermission: savePermission,
    });

    setRecordings((prev) => [newRec, ...prev]);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);

    // Reset recorder state
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setRecorderState('idle');
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
  };

  // 5. PLAY ARCHIVED RECORDING (Plays real human voice from list)
  const handlePlayArchivedRecording = (rec: ClassroomLectureRecording) => {
    if (activePlayingId === rec.id) {
      if (listAudioRef.current) {
        listAudioRef.current.pause();
      }
      setActivePlayingId(null);
      return;
    }

    // Stop preview if running
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    if (listAudioRef.current) {
      listAudioRef.current.pause();
      listAudioRef.current = null;
    }

    if (!rec.audioUrl) {
      alert('This archived lecture has no audio attached.');
      return;
    }

    const audio = new Audio(rec.audioUrl);
    listAudioRef.current = audio;
    setActivePlayingId(rec.id);

    audio.onended = () => {
      setActivePlayingId(null);
      listAudioRef.current = null;
    };

    audio.onerror = (e) => {
      console.error('List audio playback error:', e);
      setActivePlayingId(null);
      listAudioRef.current = null;
    };

    audio
      .play()
      .then(() => setActivePlayingId(rec.id))
      .catch((err) => {
        console.warn('Audio play rejected:', err);
        setActivePlayingId(null);
      });
  };

  // 6. DOWNLOAD RECORDING FILE (With browser file save)
  const handleDownloadRecording = (rec: ClassroomLectureRecording) => {
    if (!rec.audioUrl) return;
    const a = document.createElement('a');
    a.href = rec.audioUrl;
    a.download = `${rec.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 7. PERMISSION CHANGE (For teacher)
  const handleUpdatePermission = (
    recId: string,
    permission: StudyMaterialDownloadPermission
  ) => {
    if (!activeClassroom?.id) return;
    const updated = studyMaterialService.updateRecordingPermission(
      activeClassroom.id,
      recId,
      permission
    );
    setRecordings(updated);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('student.action.recording') || 'Classroom Recordings'}
      description={`${activeClassroom?.title || 'Classroom'} · Live Microphone Lecture Audio`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-medium">
            SmartEducate Real Audio Engine · Live Microphone Capture
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-start">
        {/* SUCCESS TOAST BANNER */}
        {saveSuccessToast && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              Recording saved successfully and added to Study Material library!
            </span>
          </div>
        )}

        {/* ERROR STATE BANNER */}
        {recordingError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Microphone Audio Notice</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{recordingError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRecordingError(null)}
              className="text-xs font-bold text-rose-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TEACHER RECORDER PANEL (Only shown for instructor) */}
        {isTeacher && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#FAF8FE] to-[#F3EEFC] border-2 border-[#EDE8F5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1E1B4B]">
                    Live Classroom Audio Recorder
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Captures genuine human voice via microphone with zero synthetic tones
                  </p>
                </div>
              </div>

              {recorderState === 'recording' && (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>RECORDING</span>
                </span>
              )}
            </div>

            {/* RECORDER STATE 1: IDLE */}
            {recorderState === 'idle' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-600">
                  Ready to record. Tap below and speak into your microphone for 5–10 seconds.
                </p>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              </div>
            )}

            {/* RECORDER STATE 2: RECORDING */}
            {recorderState === 'recording' && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-purple-200">
                  {/* Digital Clock */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-base font-mono font-extrabold text-[#1E1B4B]">
                      {formatSeconds(recordingSeconds)}
                    </span>
                    <span className="text-xs text-slate-400">
                      (Speak naturally into your mic)
                    </span>
                  </div>

                  {/* Audio visualizer wave */}
                  <div className="flex items-center gap-1 h-6">
                    {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35].map((val, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${val}%` }}
                        className="w-1 rounded-full bg-[#7C3AED] animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              </div>
            )}

            {/* RECORDER STATE 3: STOPPED -> PREVIEW & SAVE */}
            {recorderState === 'stopped' && (
              <div className="space-y-3 pt-1">
                {/* Immediate Audio Preview Player */}
                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={togglePreviewPlayback}
                      className="w-10 h-10 rounded-full bg-[#7C3AED] hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95"
                      title={isPlayingPreview ? 'Pause' : 'Play recorded voice'}
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ms-0.5" />
                      )}
                    </button>
                    <div>
                      <h5 className="text-xs font-bold text-[#1E1B4B]">
                        {isPlayingPreview ? 'Playing Your Voice...' : 'Preview Recorded Voice'}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatSeconds(Math.floor(previewCurrentTime))} /{' '}
                        {formatSeconds(recordedDurationSeconds)} · Real Microphone Capture
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real Voice Captured</span>
                  </div>
                </div>

                {/* Title & Permission Selector */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Recording Title
                    </label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="e.g. Lecture 09: Vector Calculus"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-[#1E1B4B] focus:border-[#7C3AED] outline-none"
                    />
                  </div>

                  {/* Student Download Permissions */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Student Download Access
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSavePermission('allow_download')}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          savePermission === 'allow_download'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Allow Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSavePermission('view_only')}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          savePermission === 'view_only'
                            ? 'bg-purple-50 border-purple-300 text-purple-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>View Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSavePermission('download_disabled')}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          savePermission === 'download_disabled'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Download Disabled</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save & Discard Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (previewAudioRef.current) previewAudioRef.current.pause();
                      setRecorderState('idle');
                      setRecordedAudioUrl(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                  >
                    Discard & Re-record
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecording}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Recording</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARCHIVED RECORDINGS LIST */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            Archived Course Recordings ({recordings.length})
          </h4>

          {recordings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-200">
              No lecture recordings yet. Tap "Start Recording" to create your first lecture.
            </div>
          ) : (
            recordings.map((rec) => {
              const isPlaying = activePlayingId === rec.id;
              const canStudentDownload = rec.downloadPermission === 'allow_download';

              return (
                <div
                  key={rec.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={() => handlePlayArchivedRecording(rec)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
                        isPlaying
                          ? 'bg-rose-600 text-white'
                          : 'bg-[#7C3AED] text-white hover:bg-purple-700'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play lecture audio'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ms-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] truncate">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>{rec.instructor}</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-purple-700">
                          {rec.duration}
                        </span>
                        <span>·</span>
                        <span>{rec.date}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Download Permission Pill */}
                    {rec.downloadPermission === 'allow_download' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Allow Download</span>
                      </span>
                    ) : rec.downloadPermission === 'view_only' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-purple-600" />
                        <span>View Only</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Downloads Disabled</span>
                      </span>
                    )}

                    {/* Download Button (If Allowed or Teacher) */}
                    {(isTeacher || canStudentDownload) && rec.audioUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownloadRecording(rec)}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Download audio recording"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {/* Teacher Permission Quick-Toggle */}
                    {isTeacher && (
                      <div className="flex items-center gap-1 ms-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePermission(
                              rec.id,
                              rec.downloadPermission === 'allow_download'
                                ? 'view_only'
                                : 'allow_download'
                            )
                          }
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Toggle student download access"
                        >
                          Change Access
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
