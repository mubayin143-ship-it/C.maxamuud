/**
 * SmartEducate Canonical Whiteboard Types
 * Defines data structures for the interactive classroom whiteboard,
 * multi-page drawings, shapes, synchronization, and study material export.
 */

export type WhiteboardTool =
  | 'pen'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow';

export type WhiteboardStrokeWidth = 2 | 4 | 8 | 14;

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  strokeWidth: number;
  // Freehand points for pen and eraser
  points?: WhiteboardPoint[];
  // Geometric shapes or text placement
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // End coordinates for lines and arrows
  endX?: number;
  endY?: number;
  // Text element specific
  text?: string;
  fontSize?: number;
}

export type WhiteboardDisplayMode = 'original' | 'beautified' | 'textbook';

export interface WhiteboardPresentationSettings {
  displayMode: WhiteboardDisplayMode;
  beautifiedFont: string;
  textbookFont: string;
  fontSize: number;
  textColor: string;
  lineHeight?: number;
}

export interface RecognizedStrokeBlock {
  id: string;
  elementIds: string[];
  originalText: string;
  renderedText: string;
  language: 'en' | 'so' | 'ar' | 'math' | 'mixed';
  isRTL: boolean;
  isMath: boolean;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  confidence: number;
  status: 'pending' | 'recognized' | 'corrected' | 'fallback';
  createdAt: string;
}

export interface WhiteboardPage {
  id: string;
  title: string;
  elements: WhiteboardElement[];
  recognizedBlocks?: RecognizedStrokeBlock[];
  backgroundColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardSession {
  classroomId: string;
  classroomTitle: string;
  teacherName: string;
  activePageId: string;
  pages: WhiteboardPage[];
  isLiveActive: boolean;
  lastUpdated: string;
  version: number;
  presentationSettings: WhiteboardPresentationSettings;
  isRecognizing?: boolean;
}

export interface SavedWhiteboardMaterial {
  id: string;
  classroomId: string;
  title: string;
  pageCount: number;
  thumbnailDataUrl?: string;
  pages: WhiteboardPage[];
  savedAt: string;
  sharedWithClassroom: boolean;
}
