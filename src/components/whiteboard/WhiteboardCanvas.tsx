/**
 * SmartEducate Whiteboard Canvas Component
 * High-performance HTML5 Canvas renderer with touch/pointer support,
 * smooth vectors, shapes, text, eraser, and read-only student rendering.
 * Supports:
 * - Mode 1: Original Handwriting (raw strokes preserved 100%)
 * - Mode 2: Beautiful Handwriting (calligraphy & natural educational script)
 * - Mode 3: Textbook Print (clean academic educational typesetting)
 * - Arabic RTL contextual alignment and mathematical notations.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  WhiteboardElement,
  WhiteboardTool,
  WhiteboardStrokeWidth,
  WhiteboardPoint,
  RecognizedStrokeBlock,
  WhiteboardPresentationSettings,
} from '../../types/whiteboard';
import { Sparkles, Edit3, Check, X, RefreshCw } from 'lucide-react';

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  recognizedBlocks?: RecognizedStrokeBlock[];
  presentationSettings?: WhiteboardPresentationSettings;
  currentTool: WhiteboardTool;
  currentColor: string;
  strokeWidth: WhiteboardStrokeWidth;
  isReadOnly?: boolean;
  onElementsChange?: (elements: WhiteboardElement[]) => void;
  onCorrectBlock?: (blockId: string, newText: string) => void;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  isRecognizing?: boolean;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  recognizedBlocks = [],
  presentationSettings,
  currentTool,
  currentColor,
  strokeWidth,
  isReadOnly = false,
  onElementsChange,
  onCorrectBlock,
  className = '',
  onCanvasReady,
  isRecognizing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<WhiteboardPoint | null>(null);
  const currentPointsRef = useRef<WhiteboardPoint[]>([]);
  const previewShapeRef = useRef<WhiteboardElement | null>(null);

  // Text insertion state
  const [textInputPos, setTextInputPos] = useState<WhiteboardPoint | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Correction popover for recognized blocks (Teacher only)
  const [editingBlock, setEditingBlock] = useState<RecognizedStrokeBlock | null>(null);
  const [editingBlockText, setEditingBlockText] = useState('');

  const displayMode = presentationSettings?.displayMode || 'beautified';

  // Helper to wrap text into multiple lines on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    // Check if text already has newline breaks
    const rawParagraphs = text.split('\n');
    const lines: string[] = [];

    rawParagraphs.forEach((para) => {
      const words = para.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        lines.push(currentLine);
      }
    });

    return lines.length > 0 ? lines : [text];
  };

  // Re-render canvas elements according to current displayMode
  const drawAll = useCallback(
    (preview?: WhiteboardElement | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Reset transform and clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Draw paper background with subtle educational dot grid
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Subtle dot grid
      ctx.fillStyle = '#E2E8F0';
      const gridSize = 32;
      for (let x = gridSize; x < rect.width; x += gridSize) {
        for (let y = gridSize; y < rect.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Collect element IDs that are part of a recognized block
      const recognizedElementIdSet = new Set<string>();
      if (displayMode !== 'original' && Array.isArray(recognizedBlocks) && recognizedBlocks.length > 0) {
        recognizedBlocks.forEach((block) => {
          if (block && block.status !== 'fallback' && Array.isArray(block.elementIds)) {
            block.elementIds.forEach((id) => recognizedElementIdSet.add(id));
          }
        });
      }

      // Render raw elements list (excluding recognized strokes in Mode 2 & 3)
      const itemsToRender = preview ? [...elements, preview] : elements;

      itemsToRender.forEach((el) => {
        // In Beautified or Textbook mode, skip strokes that have been converted to digital text
        if (
          displayMode !== 'original' &&
          el.tool === 'pen' &&
          recognizedElementIdSet.has(el.id)
        ) {
          return;
        }

        ctx.save();
        ctx.strokeStyle = el.color;
        ctx.fillStyle = el.color;
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.tool === 'pen' && el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        } else if (el.tool === 'eraser' && el.points && el.points.length > 0) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = el.strokeWidth * 3;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        } else if (
          el.tool === 'rectangle' &&
          el.x !== undefined &&
          el.y !== undefined &&
          el.width !== undefined &&
          el.height !== undefined
        ) {
          ctx.beginPath();
          ctx.rect(el.x, el.y, el.width, el.height);
          ctx.stroke();
        } else if (
          el.tool === 'circle' &&
          el.x !== undefined &&
          el.y !== undefined &&
          el.width !== undefined &&
          el.height !== undefined
        ) {
          ctx.beginPath();
          const centerX = el.x + el.width / 2;
          const centerY = el.y + el.height / 2;
          const radiusX = Math.abs(el.width / 2);
          const radiusY = Math.abs(el.height / 2);
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (
          el.tool === 'line' &&
          el.x !== undefined &&
          el.y !== undefined &&
          el.endX !== undefined &&
          el.endY !== undefined
        ) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.endX, el.endY);
          ctx.stroke();
        } else if (
          el.tool === 'arrow' &&
          el.x !== undefined &&
          el.y !== undefined &&
          el.endX !== undefined &&
          el.endY !== undefined
        ) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.endX, el.endY);
          ctx.stroke();

          const angle = Math.atan2(el.endY - el.y, el.endX - el.x);
          const headLength = Math.max(12, el.strokeWidth * 3.5);
          ctx.beginPath();
          ctx.moveTo(el.endX, el.endY);
          ctx.lineTo(
            el.endX - headLength * Math.cos(angle - Math.PI / 6),
            el.endY - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(el.endX, el.endY);
          ctx.lineTo(
            el.endX - headLength * Math.cos(angle + Math.PI / 6),
            el.endY - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        } else if (
          el.tool === 'text' &&
          el.x !== undefined &&
          el.y !== undefined &&
          el.text
        ) {
          ctx.font = `600 ${el.fontSize || 18}px system-ui, -apple-system, sans-serif`;
          ctx.fillText(el.text, el.x, el.y);
        }

        ctx.restore();
      });

      // Render recognized blocks when in Beautiful Handwriting (Mode 2) or Textbook Print (Mode 3)
      if (displayMode !== 'original' && Array.isArray(recognizedBlocks) && recognizedBlocks.length > 0) {
        recognizedBlocks.forEach((block) => {
          if (!block || block.status === 'fallback') return;

          const textToRender = block.renderedText || block.originalText;
          if (!textToRender) return;

          ctx.save();

          // 1. Determine font family & styling based on mode and language
          let fontFamily = 'Caveat, cursive';
          let fontWeight = '600';

          if (displayMode === 'beautified') {
            // Mode 2: Beautiful Handwriting
            if (block.isRTL || block.language === 'ar') {
              // Authentic Arabic calligraphy / Ruq'ah / Naskh script
              fontFamily = 'Amiri, "Aref Ruqaa", Cairo, serif';
              fontWeight = '700';
            } else {
              fontFamily = `"${presentationSettings?.beautifiedFont || 'Caveat'}", cursive, system-ui`;
              fontWeight = '600';
            }
          } else {
            // Mode 3: Textbook Print
            if (block.isRTL || block.language === 'ar') {
              fontFamily = '"Noto Naskh Arabic", Cairo, Amiri, sans-serif';
              fontWeight = '600';
            } else if (block.isMath) {
              fontFamily = '"Lora", "KaTeX_Main", "Cambria Math", serif';
              fontWeight = '600';
            } else {
              fontFamily = `"${presentationSettings?.textbookFont || 'Plus Jakarta Sans'}", -apple-system, sans-serif`;
              fontWeight = '600';
            }
          }

          // 2. Proportional font sizing matching natural stroke scale (clamped 16-36px)
          const bbox = block.boundingBox || { minX: 40, minY: 40, maxX: 200, maxY: 100 };
          const minX = typeof bbox.minX === 'number' && isFinite(bbox.minX) ? bbox.minX : 40;
          const minY = typeof bbox.minY === 'number' && isFinite(bbox.minY) ? bbox.minY : 40;
          const maxX = typeof bbox.maxX === 'number' && isFinite(bbox.maxX) ? bbox.maxX : minX + 160;
          const maxY = typeof bbox.maxY === 'number' && isFinite(bbox.maxY) ? bbox.maxY : minY + 50;

          const strokeH = Math.max(22, maxY - minY);
          const strokeW = Math.max(30, maxX - minX);

          // Calculate line count to scale font proportionally to single-line ink height
          const linesInText = Math.max(1, textToRender.split('\n').length);
          const singleLineStrokeH = strokeH / linesInText;
          const naturalFontSize = Math.max(16, Math.min(36, Math.round(singleLineStrokeH * 0.72)));
          const baseSize = presentationSettings?.fontSize
            ? Math.min(presentationSettings.fontSize, naturalFontSize + 4)
            : naturalFontSize;

          ctx.font = `${fontWeight} ${baseSize}px ${fontFamily}`;
          ctx.fillStyle = presentationSettings?.textColor || '#1E1B4B';

          // 3. Direction and alignment (authentic RTL for Arabic, LTR for English, Somali, Math)
          const isRTL = Boolean(block.isRTL || block.language === 'ar');
          ctx.direction = isRTL ? 'rtl' : 'ltr';
          ctx.textAlign = isRTL ? 'right' : 'left';
          ctx.textBaseline = 'top';

          // 4. Stable layout width and multi-line wrapping with generous bounding
          const layoutWidth = Math.max(strokeW * 1.25 + 40, 240);
          const lines = wrapText(ctx, textToRender, layoutWidth);
          const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width), 20);

          // For RTL (Arabic), anchor to the right edge (maxX) with safety margin against left clipping; for LTR anchor to minX
          const startX = isRTL ? Math.max(maxX, maxLineWidth + 24) : minX;
          const startY = Math.max(10, minY);
          // Arabic script requires 1.6x line-height to accommodate harakat diacritics and descenders cleanly
          const lineHeight = baseSize * (isRTL ? 1.6 : (presentationSettings?.lineHeight || 1.38));

          // Render clean typography
          lines.forEach((line, idx) => {
            ctx.fillText(line, startX, startY + idx * lineHeight);
          });

          // 5. Clean, subtle teacher indicator (NO noisy overlapping dashed rectangles)
          if (!isReadOnly) {
            ctx.save();
            ctx.fillStyle = '#8B5CF6'; // purple-500
            // Draw a subtle 3px anchor indicator at the anchor corner
            const indicatorX = isRTL ? startX : minX;
            ctx.beginPath();
            ctx.arc(indicatorX, startY - 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          ctx.restore();
        });
      }
    },
    [elements, recognizedBlocks, displayMode, presentationSettings, isReadOnly]
  );

  // Resize canvas when container dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number | null = null;

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height || 520));

      const targetCanvasWidth = width * dpr;
      const targetCanvasHeight = height * dpr;

      if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        drawAll(previewShapeRef.current);
        if (onCanvasReady) {
          onCanvasReady(canvas);
        }
      }
    };

    handleResize();
    const timer1 = setTimeout(handleResize, 50);
    const timer2 = setTimeout(handleResize, 250);

    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        handleResize();
      });
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
    };
  }, [drawAll, onCanvasReady]);

  // Redraw when elements, recognized blocks, or display settings change
  useEffect(() => {
    drawAll(previewShapeRef.current);
  }, [elements, recognizedBlocks, displayMode, presentationSettings, drawAll]);

  // Compute pointer coordinates relative to canvas
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Find if user clicked on a recognized block for manual correction
  const findClickedBlock = (pt: WhiteboardPoint): RecognizedStrokeBlock | null => {
    if (!Array.isArray(recognizedBlocks)) return null;
    for (const block of recognizedBlocks) {
      if (!block || block.status === 'fallback' || !block.boundingBox) continue;
      const b = block.boundingBox;
      const minX = typeof b.minX === 'number' && isFinite(b.minX) ? b.minX : 0;
      const minY = typeof b.minY === 'number' && isFinite(b.minY) ? b.minY : 0;
      const maxX = typeof b.maxX === 'number' && isFinite(b.maxX) ? b.maxX : minX + 120;
      const maxY = typeof b.maxY === 'number' && isFinite(b.maxY) ? b.maxY : minY + 50;
      if (
        pt.x >= minX - 10 &&
        pt.x <= maxX + 40 &&
        pt.y >= minY - 10 &&
        pt.y <= maxY + 40
      ) {
        return block;
      }
    }
    return null;
  };

  // Pointer Down (Mouse & Touch unified)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const point = getCanvasCoords(e);
    startPointRef.current = point;
    isDrawingRef.current = true;

    // Check if teacher clicked an existing recognized block to correct
    if (!isReadOnly && (currentTool === 'text' || e.altKey)) {
      const clicked = findClickedBlock(point);
      if (clicked) {
        setEditingBlock(clicked);
        setEditingBlockText(clicked.renderedText || clicked.originalText);
        isDrawingRef.current = false;
        return;
      }
    }

    if (currentTool === 'text') {
      setTextInputPos(point);
      setTextInputValue('');
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    if (currentTool === 'pen' || currentTool === 'eraser') {
      currentPointsRef.current = [point];
      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: currentTool,
        color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
        strokeWidth,
        points: [point],
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    }
  };

  // Pointer Move (Mouse & Touch unified)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !isDrawingRef.current || !startPointRef.current) return;
    const current = getCanvasCoords(e);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      currentPointsRef.current.push(current);
      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: currentTool,
        color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
        strokeWidth,
        points: [...currentPointsRef.current],
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    } else if (currentTool === 'rectangle') {
      const x = Math.min(startPointRef.current.x, current.x);
      const y = Math.min(startPointRef.current.y, current.y);
      const width = Math.abs(current.x - startPointRef.current.x);
      const height = Math.abs(current.y - startPointRef.current.y);

      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: 'rectangle',
        color: currentColor,
        strokeWidth,
        x,
        y,
        width,
        height,
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    } else if (currentTool === 'circle') {
      const x = Math.min(startPointRef.current.x, current.x);
      const y = Math.min(startPointRef.current.y, current.y);
      const width = Math.abs(current.x - startPointRef.current.x);
      const height = Math.abs(current.y - startPointRef.current.y);

      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: 'circle',
        color: currentColor,
        strokeWidth,
        x,
        y,
        width,
        height,
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    } else if (currentTool === 'line') {
      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: 'line',
        color: currentColor,
        strokeWidth,
        x: startPointRef.current.x,
        y: startPointRef.current.y,
        endX: current.x,
        endY: current.y,
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    } else if (currentTool === 'arrow') {
      const preview: WhiteboardElement = {
        id: `temp_${Date.now()}`,
        tool: 'arrow',
        color: currentColor,
        strokeWidth,
        x: startPointRef.current.x,
        y: startPointRef.current.y,
        endX: current.x,
        endY: current.y,
      };
      previewShapeRef.current = preview;
      drawAll(preview);
    }
  };

  // Pointer Up (Mouse & Touch unified)
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !isDrawingRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDrawingRef.current = false;
    const finalShape = previewShapeRef.current;
    previewShapeRef.current = null;
    startPointRef.current = null;
    currentPointsRef.current = [];

    if (finalShape && onElementsChange) {
      const newEl: WhiteboardElement = {
        ...finalShape,
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      onElementsChange([...elements, newEl]);
    } else {
      drawAll(null);
    }
  };

  // Commit text input from Floating Text tool
  const handleCommitText = () => {
    if (!textInputPos || !textInputValue.trim() || !onElementsChange) {
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }

    const newTextEl: WhiteboardElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tool: 'text',
      color: currentColor,
      strokeWidth,
      x: textInputPos.x,
      y: textInputPos.y + 16,
      text: textInputValue.trim(),
      fontSize: strokeWidth === 2 ? 18 : strokeWidth === 4 ? 24 : 32,
    };

    onElementsChange([...elements, newTextEl]);
    setTextInputPos(null);
    setTextInputValue('');
  };

  // Save teacher correction on a recognized block
  const handleSaveCorrection = () => {
    if (editingBlock && onCorrectBlock && editingBlockText.trim()) {
      onCorrectBlock(editingBlock.id, editingBlockText.trim());
    }
    setEditingBlock(null);
    setEditingBlockText('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[360px] sm:min-h-[480px] rounded-2xl overflow-hidden border border-[#EDE8F5] bg-white select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block ${
          isReadOnly
            ? 'cursor-default'
            : currentTool === 'text'
            ? 'cursor-text'
            : currentTool === 'eraser'
            ? 'cursor-crosshair'
            : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      />

      {/* Real-time Recognition Status Indicator */}
      <div className="absolute top-3 end-3 z-10 flex items-center gap-2 pointer-events-none">
        {isRecognizing ? (
          <div className="px-2.5 py-1 rounded-xl bg-purple-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Farta la aqoonsanayaa... (Recognizing)</span>
          </div>
        ) : displayMode === 'beautified' && recognizedBlocks.length > 0 ? (
          <div className="px-2.5 py-1 rounded-xl bg-white/90 border border-purple-200 text-[#7C3AED] text-[11px] font-bold flex items-center gap-1.5 shadow-xs backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Farta Qurxoon (Beautified) · {recognizedBlocks.length} Blocks</span>
          </div>
        ) : displayMode === 'textbook' && recognizedBlocks.length > 0 ? (
          <div className="px-2.5 py-1 rounded-xl bg-white/90 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 shadow-xs backdrop-blur-xs">
            <span>Daabacaadda Buugga (Textbook Print) · {recognizedBlocks.length} Blocks</span>
          </div>
        ) : null}
      </div>

      {/* Floating Text Input for Text Tool */}
      {textInputPos && !isReadOnly && (
        <div
          className="absolute z-20 flex items-center gap-1.5 p-1 rounded-xl bg-white shadow-xl border border-purple-200"
          style={{
            left: Math.min(textInputPos.x, (containerRef.current?.clientWidth || 300) - 220),
            top: Math.max(10, textInputPos.y - 20),
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitText();
              if (e.key === 'Escape') setTextInputPos(null);
            }}
            placeholder="Qor qoraal & taabo Enter..."
            className="px-2.5 py-1 text-sm font-semibold rounded-lg bg-[#F8F7FC] text-[#1E1B4B] outline-none border border-purple-300 w-48 sm:w-64"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCommitText}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#7C3AED] text-white hover:bg-purple-700 cursor-pointer"
          >
            Ku dar
          </button>
        </div>
      )}

      {/* Floating Correction Popover for Recognized Block (Teacher) */}
      {editingBlock && !isReadOnly && (
        <div
          className="absolute z-30 flex flex-col gap-2 p-3 rounded-2xl bg-white shadow-2xl border border-purple-300 w-72 sm:w-80"
          style={{
            left: Math.min(
              Math.max(10, typeof editingBlock.boundingBox?.minX === 'number' && isFinite(editingBlock.boundingBox.minX) ? editingBlock.boundingBox.minX : 40),
              (containerRef.current?.clientWidth || 300) - 300
            ),
            top: Math.max(10, (typeof editingBlock.boundingBox?.minY === 'number' && isFinite(editingBlock.boundingBox.minY) ? editingBlock.boundingBox.minY : 40) - 10),
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sax Qoraalka La Aqoonsaday (Edit Text)</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingBlock(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            value={editingBlockText}
            onChange={(e) => setEditingBlockText(e.target.value)}
            dir={editingBlock.isRTL ? 'rtl' : 'ltr'}
            rows={2}
            className="w-full p-2 text-sm font-medium rounded-xl border border-purple-200 bg-[#FAF8FE] text-[#1E1B4B] outline-none focus:border-purple-500"
            autoFocus
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Luqadda: <b className="capitalize">{editingBlock.language}</b>
              {editingBlock.isMath ? ' · Xisaab' : ''}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Kanoolee
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-3 py-1 rounded-lg bg-[#7C3AED] hover:bg-purple-700 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Keydi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Badge for Students */}
      {isReadOnly && (
        <div className="absolute top-3 start-3 z-10 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-purple-100 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-700 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Fasalka Tooska ah: Qoraalka Macallinka (Live Instructor Board)</span>
        </div>
      )}
    </div>
  );
};
