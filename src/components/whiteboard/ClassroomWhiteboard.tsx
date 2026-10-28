/**
 * SmartEducate Classroom Whiteboard Component
 * Full-featured interactive whiteboard for Live Class sessions.
 * Features:
 * - Three Display Modes:
 *   1. Mode 1: Original Handwriting (raw pen strokes preserved 100%)
 *   2. Mode 2: Beautiful Handwriting (calligraphy & natural educational script) — Default Preferred
 *   3. Mode 3: Textbook Print (clean academic educational typesetting)
 * - Automatic Real-Time Handwriting Recognition (multilingual English, Somali, Arabic RTL, Math)
 * - Teacher Font & Presentation Controls (Font family, size, color)
 * - Real-Time Teacher/Student Synchronization (BroadcastChannel & Firestore live sync)
 * - Multi-page management, Undo/Redo, Eraser, Shapes, Study Material saving & sharing.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pen,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  Plus,
  Edit2,
  Download,
  Share2,
  BookOpen,
  Maximize2,
  Minimize2,
  Check,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Settings,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  WhiteboardTool,
  WhiteboardStrokeWidth,
  WhiteboardElement,
  WhiteboardSession,
  WhiteboardDisplayMode,
  RecognizedStrokeBlock,
  WhiteboardPresentationSettings,
} from '../../types/whiteboard';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import {
  whiteboardSyncService,
  DEFAULT_PRESENTATION_SETTINGS,
} from '../../services/whiteboardSyncService';
import {
  studyMaterialService,
  StudyMaterialDownloadPermission,
} from '../../services/studyMaterialService';
import { useI18n } from '../../i18n/I18nContext';

interface ClassroomWhiteboardProps {
  classroomId: string;
  classroomTitle: string;
  teacherName: string;
  isTeacher: boolean;
  onClose?: () => void;
  onSavedToStudyMaterial?: (title: string) => void;
  className?: string;
}

const PALETTE_COLORS = [
  { name: 'Charcoal', hex: '#1E1B4B' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Rose', hex: '#DC2626' },
];

const STROKE_WIDTHS: Array<{ label: string; width: WhiteboardStrokeWidth }> = [
  { label: 'Fine', width: 2 },
  { label: 'Medium', width: 4 },
  { label: 'Bold', width: 8 },
];

const BEAUTIFIED_FONTS = [
  { label: 'Caveat (Natural Calligraphy)', value: 'Caveat' },
  { label: 'Kalam (Clear Ink Pen)', value: 'Kalam' },
  { label: 'Patrick Hand (Classroom Marker)', value: 'Patrick Hand' },
  { label: 'Amiri (Arabic Calligraphy)', value: 'Amiri' },
  { label: 'Aref Ruqaa (Arabic Ruq\'ah)', value: 'Aref Ruqaa' },
];

const TEXTBOOK_FONTS = [
  { label: 'Plus Jakarta Sans (Academic Sans)', value: 'Plus Jakarta Sans' },
  { label: 'Merriweather (University Serif)', value: 'Merriweather' },
  { label: 'Lora (Editorial Book)', value: 'Lora' },
  { label: 'Noto Naskh Arabic (Textbook Arabic)', value: 'Noto Naskh Arabic' },
];

const FONT_SIZES = [
  { label: '20px (Compact)', value: 20 },
  { label: '26px (Standard)', value: 26 },
  { label: '32px (Large)', value: 32 },
  { label: '40px (Heading)', value: 40 },
];

export const ClassroomWhiteboard: React.FC<ClassroomWhiteboardProps> = ({
  classroomId,
  classroomTitle,
  teacherName,
  isTeacher,
  onClose,
  onSavedToStudyMaterial,
  className = '',
}) => {
  const { t } = useI18n();

  // Whiteboard Session state synced across tabs & Firestore
  const [session, setSession] = useState<WhiteboardSession>(() =>
    whiteboardSyncService.getSession(classroomId, classroomTitle, teacherName)
  );

  const [studentViewingPageId, setStudentViewingPageId] = useState<string | null>(null);
  const [followTeacher, setFollowTeacher] = useState(true);

  // Active page: students follow teacher unless they have chosen to view another page
  const activePage =
    !isTeacher && !followTeacher && studentViewingPageId
      ? session.pages.find((p) => p.id === studentViewingPageId) || session.pages[0]
      : session.pages.find((p) => p.id === session.activePageId) || session.pages[0];

  // Presentation settings (synced to all students)
  const presentationSettings: WhiteboardPresentationSettings =
    session.presentationSettings || DEFAULT_PRESENTATION_SETTINGS;

  // Tool state
  const [currentTool, setCurrentTool] = useState<WhiteboardTool>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1E1B4B');
  const [strokeWidth, setStrokeWidth] = useState<WhiteboardStrokeWidth>(4);

  // Undo / Redo history stacks per page
  const [undoStack, setUndoStack] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);

  // Page rename state
  const [isRenamingPage, setIsRenamingPage] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFontSettingsOpen, setIsFontSettingsOpen] = useState(false);
  const [isRecognizingLocal, setIsRecognizingLocal] = useState(false);

  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionDebounceTimerRef = useRef<any>(null);
  const recognitionCooldownUntilRef = useRef<number>(0);

  // Subscribe to real-time session synchronization
  useEffect(() => {
    const unsubscribe = whiteboardSyncService.subscribe(classroomId, (newSession) => {
      setSession(newSession);
    });
    return () => unsubscribe();
  }, [classroomId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recognitionDebounceTimerRef.current) {
        clearTimeout(recognitionDebounceTimerRef.current);
      }
    };
  }, []);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  /**
   * Automatic Handwriting Recognition Workflow:
   * Takes un-recognized pen strokes, generates an ink bounding crop,
   * calls server-side AI handwriting recognition, and converts to a RecognizedStrokeBlock.
   */
  const triggerAutoRecognition = useCallback(async () => {
    if (!isTeacher || !activePage) return;

    // Check rate-limit cooldown
    if (Date.now() < recognitionCooldownUntilRef.current) {
      return;
    }

    // Find all pen strokes on the active page
    const penElements = activePage.elements.filter(
      (el) => el.tool === 'pen' && el.points && el.points.length > 2
    );
    if (penElements.length === 0) {
      showToast('Marka hore sabuuradda qoraal ku qor (Draw or write ink strokes on the board first)');
      return;
    }

    // Determine which pen elements have not yet been recognized
    const alreadyRecognizedIds = new Set<string>();
    (activePage.recognizedBlocks || []).forEach((b) => {
      if (b && Array.isArray(b.elementIds)) {
        b.elementIds.forEach((id) => alreadyRecognizedIds.add(id));
      }
    });

    const unRecognizedStrokes = penElements.filter((el) => !alreadyRecognizedIds.has(el.id));
    if (unRecognizedStrokes.length === 0) {
      showToast('Dhammaan farta waa la aqoonsaday (All handwriting strokes are already recognized)');
      return;
    }

    // Spatial stroke clustering helper: groups strokes that belong to the same line or passage
    const strokeBounds = unRecognizedStrokes
      .map((el) => {
        let sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
        (el.points || []).forEach((pt) => {
          if (typeof pt.x === 'number' && typeof pt.y === 'number' && isFinite(pt.x) && isFinite(pt.y)) {
            if (pt.x < sMinX) sMinX = pt.x;
            if (pt.y < sMinY) sMinY = pt.y;
            if (pt.x > sMaxX) sMaxX = pt.x;
            if (pt.y > sMaxY) sMaxY = pt.y;
          }
        });
        if (!isFinite(sMinX) || !isFinite(sMinY)) return null;
        return { el, minX: sMinX, minY: sMinY, maxX: sMaxX, maxY: sMaxY };
      })
      .filter(Boolean) as Array<{
        el: WhiteboardElement;
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
      }>;

    if (strokeBounds.length === 0) return;

    // Cluster strokes based on vertical and horizontal spatial proximity to capture coherent lines and paragraphs
    const clusters: Array<{
      elements: WhiteboardElement[];
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    }> = [];

    strokeBounds.forEach((sb) => {
      let matchedCluster: (typeof clusters)[0] | null = null;
      for (const c of clusters) {
        const vertGap = Math.max(0, Math.max(sb.minY - c.maxY, c.minY - sb.maxY));
        const horizGap = Math.max(0, Math.max(sb.minX - c.maxX, c.minX - sb.maxX));
        // Belong to same text line or formula if vertically aligned (<45px) and reasonably adjacent (<150px)
        const isSameLine = vertGap <= 45 && horizGap <= 150;
        // Or if consecutive line in a handwritten paragraph with horizontal overlap
        const horizOverlap = Math.min(sb.maxX, c.maxX) - Math.max(sb.minX, c.minX);
        const isMultiLineParagraph = vertGap <= 60 && horizOverlap > -40;

        if (isSameLine || isMultiLineParagraph) {
          matchedCluster = c;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.elements.push(sb.el);
        matchedCluster.minX = Math.min(matchedCluster.minX, sb.minX);
        matchedCluster.minY = Math.min(matchedCluster.minY, sb.minY);
        matchedCluster.maxX = Math.max(matchedCluster.maxX, sb.maxX);
        matchedCluster.maxY = Math.max(matchedCluster.maxY, sb.maxY);
      } else {
        clusters.push({
          elements: [sb.el],
          minX: sb.minX,
          minY: sb.minY,
          maxX: sb.maxX,
          maxY: sb.maxY,
        });
      }
    });

    try {
      setIsRecognizingLocal(true);
      whiteboardSyncService.setRecognizingStatus(classroomId, true);

      let currentBlocks = [...(activePage.recognizedBlocks || [])];

      for (const cluster of clusters.slice(0, 2)) {
        const { minX, minY, maxX, maxY, elements: clusterStrokes } = cluster;
        // Ignore single tiny accidental taps/dots
        if (maxX - minX < 14 && maxY - minY < 14) continue;

        const pad = 16;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.max(40, maxX - minX + pad * 2);
        const cropH = Math.max(30, maxY - minY + pad * 2);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.min(1200, Math.floor(cropW * 2));
        offCanvas.height = Math.min(800, Math.floor(cropH * 2));
        const ctx = offCanvas.getContext('2d');
        if (!ctx) continue;

        ctx.scale(2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cropW, cropH);
        ctx.translate(-cropX, -cropY);

        clusterStrokes.forEach((el) => {
          if (!el.points || el.points.length === 0) return;
          ctx.strokeStyle = el.color || '#1E1B4B';
          ctx.lineWidth = Math.max(2, el.strokeWidth || 4);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        });

        const cropDataUrl = offCanvas.toDataURL('image/jpeg', 0.92);

        const res = await whiteboardSyncService.recognizeHandwriting(
          cropDataUrl,
          classroomTitle
        );

        if ((res as any).rateLimited || (res as any).busy) {
          recognitionCooldownUntilRef.current = Date.now() + 20000;
          showToast('Farta asalka ah ayaa la haynayaa (AI model cooling down, original strokes preserved)');
          break;
        }

        if (res.success && res.recognizedText && (res.confidence || 0) >= 0.45) {
          const newBlock: RecognizedStrokeBlock = {
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            elementIds: clusterStrokes.map((s) => s.id),
            originalText: res.recognizedText,
            renderedText: res.recognizedText,
            language: res.language || 'en',
            isRTL: Boolean(res.isRTL),
            isMath: Boolean(res.isMath),
            boundingBox: { minX, minY, maxX, maxY },
            confidence: res.confidence || 0.9,
            status: 'recognized',
            createdAt: new Date().toISOString(),
          };

          currentBlocks = [...currentBlocks, newBlock];
          const updated = whiteboardSyncService.updateRecognizedBlocks(
            classroomId,
            activePage.id,
            currentBlocks
          );
          setSession(updated);

          showToast(
            `✨ Farta Qurxoon: "${res.recognizedText.slice(0, 24)}${
              res.recognizedText.length > 24 ? '...' : ''
            }"`
          );
        } else if (res.fallback) {
          showToast('Farta asalka ah ayaa la haynayaa (Original handwriting preserved)');
        }
      }
    } catch (err) {
      console.warn('Auto handwriting recognition error:', err);
    } finally {
      setIsRecognizingLocal(false);
      whiteboardSyncService.setRecognizingStatus(classroomId, false);
    }
  }, [isTeacher, activePage, classroomId, classroomTitle]);

  // Handle elements change by teacher & schedule automatic recognition debounce
  const handleElementsChange = (newElements: WhiteboardElement[]) => {
    if (!isTeacher || !activePage) return;

    // Push current state to undo stack
    setUndoStack((prev) => [...prev, activePage.elements]);
    setRedoStack([]);

    // Update synchronized service
    const updated = whiteboardSyncService.updatePageElements(
      classroomId,
      activePage.id,
      newElements
    );
    setSession(updated);

    // Schedule automatic handwriting recognition ONLY when in Beautified or Textbook mode
    if (currentTool === 'pen' && presentationSettings.displayMode !== 'original') {
      if (recognitionDebounceTimerRef.current) {
        clearTimeout(recognitionDebounceTimerRef.current);
      }
      recognitionDebounceTimerRef.current = setTimeout(() => {
        triggerAutoRecognition();
      }, 2500); // 2.5s natural handwriting pause debounce
    }
  };

  // Switch Whiteboard Display Mode (Mode 1, Mode 2, Mode 3)
  const handleSetDisplayMode = (mode: WhiteboardDisplayMode) => {
    if (!isTeacher) return;
    const updated = whiteboardSyncService.updatePresentationSettings(classroomId, {
      displayMode: mode,
    });
    setSession(updated);
    showToast(
      mode === 'beautified'
        ? 'Mode: Farta Qurxoon (Beautiful Handwriting) ✨'
        : mode === 'textbook'
        ? 'Mode: Daabacaadda Buugga (Textbook Print) 📖'
        : 'Mode: Farta Asalka ah (Original Handwriting)'
    );

    // If switching to beautified or textbook mode and active page has unrecognized pen strokes, trigger recognition
    if (mode !== 'original' && activePage) {
      const penElements = activePage.elements.filter(
        (el) => el.tool === 'pen' && el.points && el.points.length > 2
      );
      const recognizedIds = new Set<string>();
      (activePage.recognizedBlocks || []).forEach((b) => {
        if (b && Array.isArray(b.elementIds)) {
          b.elementIds.forEach((id) => recognizedIds.add(id));
        }
      });
      const unrec = penElements.filter((el) => !recognizedIds.has(el.id));
      if (unrec.length > 0) {
        triggerAutoRecognition();
      }
    }
  };

  // Update Font or presentation settings
  const handleUpdatePresentation = (settings: Partial<WhiteboardPresentationSettings>) => {
    if (!isTeacher) return;
    const updated = whiteboardSyncService.updatePresentationSettings(classroomId, settings);
    setSession(updated);
  };

  // Teacher manual correction on recognized block
  const handleCorrectBlock = (blockId: string, newText: string) => {
    if (!isTeacher || !activePage) return;
    const updated = whiteboardSyncService.correctRecognizedBlock(
      classroomId,
      activePage.id,
      blockId,
      newText
    );
    setSession(updated);
    showToast('Qoraalka waa la saxay (Text corrected)');
  };

  // Undo action
  const handleUndo = () => {
    if (!isTeacher || undoStack.length === 0 || !activePage) return;
    const previousElements = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, activePage.elements]);

    const updated = whiteboardSyncService.updatePageElements(
      classroomId,
      activePage.id,
      previousElements
    );
    setSession(updated);
  };

  // Redo action
  const handleRedo = () => {
    if (!isTeacher || redoStack.length === 0 || !activePage) return;
    const nextElements = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, activePage.elements]);

    const updated = whiteboardSyncService.updatePageElements(
      classroomId,
      activePage.id,
      nextElements
    );
    setSession(updated);
  };

  // Clear current page
  const handleClearPage = () => {
    if (!isTeacher || !activePage) return;
    if (activePage.elements.length === 0) return;

    setUndoStack((prev) => [...prev, activePage.elements]);
    setRedoStack([]);

    const updated = whiteboardSyncService.clearPage(classroomId, activePage.id);
    setSession(updated);
    showToast(t('whiteboard.toast.cleared') || 'Page cleared');
  };

  // Add a new page
  const handleAddPage = () => {
    if (!isTeacher) return;
    const updated = whiteboardSyncService.addPage(classroomId);
    setSession(updated);
    setUndoStack([]);
    setRedoStack([]);
    showToast(`Added ${updated.pages[updated.pages.length - 1].title}`);
  };

  // Switch to a page (teacher updates shared session, student updates local view)
  const handleSwitchPage = (pageId: string) => {
    if (isTeacher) {
      const updated = whiteboardSyncService.switchPage(classroomId, pageId);
      setSession(updated);
      setUndoStack([]);
      setRedoStack([]);
    } else {
      setFollowTeacher(false);
      setStudentViewingPageId(pageId);
    }
  };

  // Start renaming current page
  const handleStartRename = () => {
    if (!isTeacher || !activePage) return;
    setRenameInput(activePage.title);
    setIsRenamingPage(true);
  };

  // Commit page rename
  const handleCommitRename = () => {
    if (!isTeacher || !activePage || !renameInput.trim()) {
      setIsRenamingPage(false);
      return;
    }
    const updated = whiteboardSyncService.renamePage(classroomId, activePage.id, renameInput);
    setSession(updated);
    setIsRenamingPage(false);
    showToast(`Page renamed to "${renameInput.trim()}"`);
  };

  // Delete page
  const handleDeletePage = (pageId: string) => {
    if (!isTeacher) return;
    if (session.pages.length <= 1) {
      handleClearPage();
      return;
    }
    const target = session.pages.find((p) => p.id === pageId);
    const updated = whiteboardSyncService.deletePage(classroomId, pageId);
    setSession(updated);
    setUndoStack([]);
    setRedoStack([]);
    showToast(`Deleted ${target?.title || 'page'}`);
  };

  // State for saving whiteboard notes with download permission selection
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savePermission, setSavePermission] = useState<StudyMaterialDownloadPermission>('allow_download');
  const [isSharingImmediately, setIsSharingImmediately] = useState(false);

  const openSaveDialog = (shareImmediately: boolean = false) => {
    setIsSharingImmediately(shareImmediately);
    const dateFormatted = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setSaveTitle(`Live Class Whiteboard Notes — ${classroomTitle} (${dateFormatted})`);
    setSavePermission('allow_download');
    setIsSaveModalOpen(true);
  };

  // Save whiteboard snapshot and save to Study Material with chosen permission
  const executeSaveToStudyMaterial = () => {
    let snapshotUrl: string | undefined = undefined;
    if (canvasElementRef.current) {
      try {
        snapshotUrl = canvasElementRef.current.toDataURL('image/png');
      } catch (err) {
        console.warn('Canvas export error:', err);
      }
    }

    const material = studyMaterialService.saveWhiteboardAsMaterial(
      classroomId,
      session,
      snapshotUrl,
      saveTitle.trim() || undefined,
      savePermission
    );

    const msg = isSharingImmediately
      ? `Whiteboard saved and shared with classroom! (${session.pages.length} pages)`
      : `Saved to Study Material library (${session.pages.length} pages)`;

    showToast(msg);
    setIsSaveModalOpen(false);
    if (onSavedToStudyMaterial) {
      onSavedToStudyMaterial(material.title);
    }
  };

  // Download snapshot of current page
  const handleDownloadSnapshot = () => {
    if (!canvasElementRef.current) return;
    try {
      const dataUrl = canvasElementRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${classroomTitle.replace(/\s+/g, '_')}_Whiteboard_${activePage?.title.replace(/\s+/g, '_') || 'page'}.png`;
      a.click();
      showToast('Snapshot downloaded as PNG');
    } catch (e) {
      console.warn('Failed to download whiteboard snapshot:', e);
    }
  };

  const activePageIndex = session.pages.findIndex((p) => p.id === activePage?.id);
  const isRecognizing = session.isRecognizing || isRecognizingLocal;

  return (
    <div
      className={`flex flex-col bg-[#FDFCFE] rounded-3xl border border-[#EDE8F5] shadow-xs overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full h-full'
      } ${className}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#1E1B4B] text-white text-xs font-bold shadow-xl border border-purple-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR: Classroom Title, Pages Switcher, Action Buttons */}
      <div className="p-3 sm:p-4 bg-white border-b border-[#EDE8F5] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Classroom & Role Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1E1B4B] truncate">
                {classroomTitle}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
                AI Whiteboard
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
              <span>{teacherName}</span>
              <span>•</span>
              {isTeacher ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instructor Controls
                </span>
              ) : (
                <span className="text-purple-600 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Student View (Read Only)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions (Save Material, Share, Download, Fullscreen, Close) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {isTeacher ? (
            <>
              {/* Manual Recognize Now trigger */}
              <button
                type="button"
                onClick={triggerAutoRecognition}
                disabled={isRecognizing}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-purple-200 shadow-2xs disabled:opacity-50"
                title="Aqoonso farta hadda (Recognize handwriting now)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isRecognizing ? 'Aqoonsanayaa...' : 'Aqoonso (AI)'}
                </span>
              </button>

              {/* Save as Study Material */}
              <button
                type="button"
                onClick={() => openSaveDialog(false)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-100"
                title="Save this whiteboard to classroom Study Materials"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Material</span>
              </button>

              {/* Share with Classroom */}
              <button
                type="button"
                onClick={() => openSaveDialog(true)}
                className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Save and share notes directly with enrolled students"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share with Class</span>
              </button>
            </>
          ) : (
            /* Student: Download Notes Button */
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-purple-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Notes</span>
            </button>
          )}

          {/* Export PNG (Teacher Icon Shortcut) */}
          {isTeacher && (
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Download PNG snapshot"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Whiteboard'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Optional Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close Whiteboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* THREE DISPLAY MODES SWITCHER & FONT CONTROLS BAR (Step 01B & 01E) */}
      <div className="px-3 sm:px-4 py-2 bg-[#F6F4FB] border-b border-[#EDE8F5] flex flex-wrap items-center justify-between gap-2.5">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wide">
            Qaabka (Mode):
          </span>

          {/* Mode 1: Original Handwriting */}
          <button
            type="button"
            onClick={() => handleSetDisplayMode('original')}
            disabled={!isTeacher}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              presentationSettings.displayMode === 'original'
                ? 'bg-[#1E1B4B] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#1E1B4B] hover:bg-slate-50'
            }`}
            title="Mode 1: Farta Asalka ah (Original handwritten strokes)"
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Farta Asalka ah (Original)</span>
          </button>

          {/* Mode 2: Beautiful Handwriting (Preferred) */}
          <button
            type="button"
            onClick={() => handleSetDisplayMode('beautified')}
            disabled={!isTeacher}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              presentationSettings.displayMode === 'beautified'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50/50'
            }`}
            title="Mode 2: Farta Qurxoon (Beautiful natural handwriting & calligraphy)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Farta Qurxoon (Beautiful)</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-amber-400/30 text-[9px] uppercase font-extrabold text-amber-200">
              Default
            </span>
          </button>

          {/* Mode 3: Textbook Print */}
          <button
            type="button"
            onClick={() => handleSetDisplayMode('textbook')}
            disabled={!isTeacher}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              presentationSettings.displayMode === 'textbook'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/50'
            }`}
            title="Mode 3: Daabacaadda Buugga (Clean educational textbook typesetting)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Daabacaadda Buugga (Textbook)</span>
          </button>
        </div>

        {/* Font & Presentation Controls Toggle (Teacher only) */}
        {isTeacher ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFontSettingsOpen(!isFontSettingsOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isFontSettingsOpen
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-700 border-[#EDE8F5] hover:bg-purple-50'
              }`}
              title="Habee Nooca Farta & Xajmiga (Configure Fonts & Size)"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Habee Farta (Fonts & Style)</span>
            </button>
          </div>
        ) : (
          /* Student Synced Indicator */
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>
              Qaabka farta macallinka: <b className="capitalize">{presentationSettings.displayMode}</b>
            </span>
          </div>
        )}
      </div>

      {/* EXPANDABLE TEACHER FONT CONFIGURATION PANEL (Step 01E) */}
      {isTeacher && isFontSettingsOpen && (
        <div className="p-3 bg-white border-b border-[#EDE8F5] flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-150">
          {/* Font Family Selector based on active mode */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-[#1E1B4B]">
              {presentationSettings.displayMode === 'beautified'
                ? 'Nooca Farta Qurxoon (Handwriting Font):'
                : 'Nooca Farta Buugga (Textbook Font):'}
            </label>
            <select
              value={
                presentationSettings.displayMode === 'beautified'
                  ? presentationSettings.beautifiedFont
                  : presentationSettings.textbookFont
              }
              onChange={(e) => {
                if (presentationSettings.displayMode === 'beautified') {
                  handleUpdatePresentation({ beautifiedFont: e.target.value });
                } else {
                  handleUpdatePresentation({ textbookFont: e.target.value });
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#FAF8FE] border border-purple-200 text-xs font-bold text-[#1E1B4B] outline-none cursor-pointer focus:border-purple-500"
            >
              {(presentationSettings.displayMode === 'beautified'
                ? BEAUTIFIED_FONTS
                : TEXTBOOK_FONTS
              ).map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-[#1E1B4B]">Xajmiga Farta (Size):</label>
            <div className="flex items-center gap-1">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  type="button"
                  onClick={() => handleUpdatePresentation({ fontSize: fs.value })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presentationSettings.fontSize === fs.value
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-[#FAF8FE] text-slate-600 hover:bg-slate-100 border border-[#EDE8F5]'
                  }`}
                >
                  {fs.value}px
                </button>
              ))}
            </div>
          </div>

          {/* Text Color Selector */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-[#1E1B4B]">Midabka Qoraalka (Color):</label>
            <div className="flex items-center gap-1.5">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleUpdatePresentation({ textColor: c.hex })}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                    presentationSettings.textColor === c.hex
                      ? 'scale-120 ring-2 ring-purple-500 ring-offset-1'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {presentationSettings.textColor === c.hex && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-PAGE STRIP: Tabs to Add, Rename, Switch, and Delete Pages */}
      <div className="px-3 py-2 bg-[#FAF8FE] border-b border-[#EDE8F5] flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider ps-1">
            Bogagga (Pages):
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {session.pages.map((p, idx) => {
              const isActive = p.id === activePage?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all font-semibold shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#7C3AED] text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-700 hover:bg-purple-50/60 border border-[#EDE8F5]'
                  }`}
                  onClick={() => handleSwitchPage(p.id)}
                >
                  <span className="text-[11px]">
                    {idx + 1}. {p.title}
                  </span>

                  {/* Teacher: Delete Page (if not the sole page) */}
                  {isTeacher && session.pages.length > 1 && isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(p.id);
                      }}
                      className="p-0.5 rounded hover:bg-purple-800/80 text-white/80 hover:text-white ms-1"
                      title="Delete this page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Teacher: Add Page Button */}
          {isTeacher && (
            <button
              type="button"
              onClick={handleAddPage}
              className="px-2 py-1 rounded-xl bg-white hover:bg-purple-50 text-[#7C3AED] border border-purple-200 font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
              title="Add a new blank page to the whiteboard"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px]">Add Page</span>
            </button>
          )}

          {/* Student: Follow Teacher Live Page Button */}
          {!isTeacher && !followTeacher && (
            <button
              type="button"
              onClick={() => {
                setFollowTeacher(true);
                setStudentViewingPageId(null);
                showToast('Hadda waxaad la socotaa bogga macallinka (Following teacher live page)');
              }}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
              title="Snap back to teacher live page"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px]">Follow Teacher (Live)</span>
            </button>
          )}
        </div>

        {/* Current Page Navigation & Rename Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Previous / Next Page Controls */}
          <button
            type="button"
            disabled={activePageIndex <= 0}
            onClick={() => handleSwitchPage(session.pages[activePageIndex - 1].id)}
            className="p-1 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-slate-600 px-1">
            {activePageIndex + 1} / {session.pages.length}
          </span>
          <button
            type="button"
            disabled={activePageIndex >= session.pages.length - 1}
            onClick={() => handleSwitchPage(session.pages[activePageIndex + 1].id)}
            className="p-1 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Teacher: Rename Current Page Button */}
          {isTeacher && !isRenamingPage && (
            <button
              type="button"
              onClick={handleStartRename}
              className="p-1 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-white transition-colors cursor-pointer"
              title="Rename Current Page"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Inline Page Rename Input */}
          {isTeacher && isRenamingPage && (
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-purple-300">
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitRename();
                  if (e.key === 'Escape') setIsRenamingPage(false);
                }}
                className="px-1.5 py-0.5 text-xs text-[#1E1B4B] font-semibold outline-none w-24 sm:w-32"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCommitRename}
                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenamingPage(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TEACHER TOOLBAR (Drawing, Eraser, Text, Shapes, Palette, Undo, Redo, Clear) */}
      {isTeacher ? (
        <div className="p-2.5 sm:p-3 bg-white border-b border-[#EDE8F5] flex flex-wrap items-center justify-between gap-2.5">
          {/* Group 1: Tools (Pen, Eraser, Text, Shapes) */}
          <div className="flex items-center gap-1 bg-[#FAF8FE] p-1 rounded-2xl border border-[#EDE8F5]">
            {/* Pen Tool */}
            <button
              type="button"
              onClick={() => setCurrentTool('pen')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'pen'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Pen (Draw Freehand & Auto-Recognize)"
            >
              <Pen className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Eraser Tool */}
            <button
              type="button"
              onClick={() => setCurrentTool('eraser')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'eraser'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Eraser (Clean strokes)"
            >
              <Eraser className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Text Tool */}
            <button
              type="button"
              onClick={() => setCurrentTool('text')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'text'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Text (Click to place typed text or correct recognized words)"
            >
              <Type className="w-4 h-4 stroke-[2.2]" />
            </button>

            <div className="w-[1px] h-6 bg-slate-200 mx-0.5" />

            {/* Rectangle Shape */}
            <button
              type="button"
              onClick={() => setCurrentTool('rectangle')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'rectangle'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Circle Shape */}
            <button
              type="button"
              onClick={() => setCurrentTool('circle')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'circle'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Circle / Ellipse"
            >
              <Circle className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Straight Line */}
            <button
              type="button"
              onClick={() => setCurrentTool('line')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'line'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Straight Line"
            >
              <Minus className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Directional Arrow */}
            <button
              type="button"
              onClick={() => setCurrentTool('arrow')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentTool === 'arrow'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-purple-700'
              }`}
              title="Arrow"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Group 2: Color Palette */}
          <div className="flex items-center gap-1.5 bg-[#FAF8FE] p-1 rounded-2xl border border-[#EDE8F5]">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setCurrentColor(c.hex)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                  currentColor === c.hex ? 'scale-115 ring-2 ring-purple-500 ring-offset-1' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {currentColor === c.hex && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                )}
              </button>
            ))}
          </div>

          {/* Group 3: Stroke Width */}
          <div className="flex items-center gap-1 bg-[#FAF8FE] p-1 rounded-2xl border border-[#EDE8F5]">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.width}
                type="button"
                onClick={() => setStrokeWidth(sw.width)}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  strokeWidth === sw.width
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          {/* Group 4: Undo, Redo, Clear */}
          <div className="flex items-center gap-1 bg-[#FAF8FE] p-1 rounded-2xl border border-[#EDE8F5]">
            {/* Undo */}
            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              className="p-2 rounded-xl text-slate-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Undo last action"
            >
              <Undo2 className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Redo */}
            <button
              type="button"
              disabled={redoStack.length === 0}
              onClick={handleRedo}
              className="p-2 rounded-xl text-slate-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Redo action"
            >
              <Redo2 className="w-4 h-4 stroke-[2.2]" />
            </button>

            <div className="w-[1px] h-6 bg-slate-200 mx-0.5" />

            {/* Clear Board */}
            <button
              type="button"
              onClick={handleClearPage}
              className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              title="Clear all strokes on this page"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      ) : (
        /* STUDENT READ-ONLY HEADER BANNER */
        <div className="px-4 py-2 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#7C3AED] font-semibold">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              Live Whiteboard Stream — Updates are synchronized in real-time as the instructor teaches.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFollowTeacher(true);
                handleSwitchPage(session.activePageId);
              }}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Follow Teacher
            </button>
          </div>
        </div>
      )}

      {/* CANVAS SURFACE */}
      <div className="flex-1 p-2 sm:p-4 h-[58vh] min-h-[440px] max-h-[720px] flex flex-col">
        <WhiteboardCanvas
          elements={activePage?.elements || []}
          recognizedBlocks={activePage?.recognizedBlocks || []}
          presentationSettings={presentationSettings}
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={strokeWidth}
          isReadOnly={!isTeacher}
          onElementsChange={handleElementsChange}
          onCorrectBlock={handleCorrectBlock}
          onCanvasReady={(canvas) => {
            canvasElementRef.current = canvas;
          }}
          isRecognizing={isRecognizing}
          className="flex-1 shadow-sm"
        />
      </div>

      {/* FOOTER BAR: Page Summary, Mode Status, Recognition stats */}
      <div className="px-4 py-2.5 bg-white border-t border-[#EDE8F5] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1E1B4B]">
            {activePage?.title || 'Main Page'}
          </span>
          <span>•</span>
          <span>{activePage?.elements.length || 0} elements drawn</span>
          {(activePage?.recognizedBlocks?.length || 0) > 0 && (
            <>
              <span>•</span>
              <span className="text-[#7C3AED] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                {activePage?.recognizedBlocks?.length} block(s) recognized
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 font-medium">
          <span className="capitalize text-slate-600">
            Mode: <b>{presentationSettings.displayMode}</b>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-bold">Live Synchronized</span>
          </div>
        </div>
      </div>

      {/* SAVE WHITEBOARD AS STUDY MATERIAL MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1B4B]">
                    {isSharingImmediately ? 'Share Whiteboard with Class' : 'Save as Study Material'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Save {session.pages.length} canvas page(s) with student download permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-bold text-[#1E1B4B]">Material Title</label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#1E1B4B] outline-none focus:border-purple-500"
                placeholder="Enter title for whiteboard lecture notes"
              />
            </div>

            {/* Student Download Permissions Selection */}
            <div className="space-y-2 text-start">
              <label className="text-xs font-bold text-[#1E1B4B]">Student Download Permissions</label>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    savePermission === 'allow_download'
                      ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="permission"
                    value="allow_download"
                    checked={savePermission === 'allow_download'}
                    onChange={() => setSavePermission('allow_download')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1E1B4B]">Allow Download (Default)</p>
                    <p className="text-[11px] text-slate-500">
                      Enrolled students can review notes online and download high-resolution PNG snapshots.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    savePermission === 'view_only'
                      ? 'border-purple-400 bg-purple-50/40 text-purple-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="permission"
                    value="view_only"
                    checked={savePermission === 'view_only'}
                    onChange={() => setSavePermission('view_only')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1E1B4B]">View Only (No Download)</p>
                    <p className="text-[11px] text-slate-500">
                      Students can study and review the notes in the SmartEducate Viewer, but cannot download local files.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    savePermission === 'download_disabled'
                      ? 'border-amber-400 bg-amber-50/40 text-amber-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="permission"
                    value="download_disabled"
                    checked={savePermission === 'download_disabled'}
                    onChange={() => setSavePermission('download_disabled')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1E1B4B]">Download Disabled (Restricted)</p>
                    <p className="text-[11px] text-slate-500">
                      Material is restricted to proprietary in-app classroom viewing only.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSaveToStudyMaterial}
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
