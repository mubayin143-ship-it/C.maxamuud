/**
 * SmartEducate Whiteboard Synchronization Service
 * Handles multi-page whiteboard state, local persistence, cross-tab BroadcastChannel,
 * real-time Firestore cloud synchronization, and AI handwriting recognition integration.
 */

import {
  WhiteboardSession,
  WhiteboardPage,
  WhiteboardElement,
  WhiteboardPresentationSettings,
  RecognizedStrokeBlock,
  WhiteboardDisplayMode,
} from '../types/whiteboard';
import { auth, db } from './firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (_key, value) => (value === undefined ? null : value)));
}

const STORAGE_PREFIX = 'smarteducate_whiteboard_';
const BROADCAST_CHANNEL_NAME = 'smarteducate_whiteboard_sync';

export const DEFAULT_PRESENTATION_SETTINGS: WhiteboardPresentationSettings = {
  displayMode: 'beautified', // Mode 2: Beautiful Handwriting - Default preferred mode per user instructions
  beautifiedFont: 'Caveat',  // Calligraphy / natural educational handwriting font
  textbookFont: 'Plus Jakarta Sans',
  fontSize: 26,
  textColor: '#1E1B4B',
  lineHeight: 1.4,
};

type Listener = (session: WhiteboardSession) => void;

class WhiteboardSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private memoryCache: Map<string, WhiteboardSession> = new Map();
  private firestoreUnsubs: Map<string, Unsubscribe> = new Map();
  private cloudSaveDebounceTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'WHITEBOARD_UPDATE' && event.data.session) {
            const session: WhiteboardSession = event.data.session;
            this.applyRemoteSession(session);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization fallback:', e);
      }
    }

    // Storage event fallback for cross-tab sync if BroadcastChannel is unavailable
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith(STORAGE_PREFIX) && event.newValue) {
          try {
            const session: WhiteboardSession = JSON.parse(event.newValue);
            this.applyRemoteSession(session);
          } catch {
            // ignore JSON parse error
          }
        }
      });
    }
  }

  private applyRemoteSession(session: WhiteboardSession): void {
    if (!session || !session.classroomId) return;
    const current = this.memoryCache.get(session.classroomId);
    if (!current || (session.version && session.version >= (current.version || 0))) {
      // Ensure presentation settings exist
      const completeSession: WhiteboardSession = {
        ...session,
        presentationSettings: {
          ...DEFAULT_PRESENTATION_SETTINGS,
          ...(session.presentationSettings || {}),
        },
      };
      this.memoryCache.set(session.classroomId, completeSession);
      this.notifyListeners(session.classroomId, completeSession);
    }
  }

  /**
   * Generates a clean initial session for a classroom
   */
  public createInitialSession(
    classroomId: string,
    classroomTitle: string = 'Live Classroom',
    teacherName: string = 'Instructor'
  ): WhiteboardSession {
    const pageId = `page_1_${Date.now()}`;
    const initialPage: WhiteboardPage = {
      id: pageId,
      title: 'Page 1 — Main Board',
      elements: [],
      recognizedBlocks: [],
      backgroundColor: '#FFFFFF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      classroomId,
      classroomTitle,
      teacherName,
      activePageId: pageId,
      pages: [initialPage],
      isLiveActive: true,
      lastUpdated: new Date().toISOString(),
      version: 1,
      presentationSettings: { ...DEFAULT_PRESENTATION_SETTINGS },
      isRecognizing: false,
    };
  }

  /**
   * Retrieves active session for classroom, loading from memory or localStorage
   */
  public getSession(
    classroomId: string,
    classroomTitle?: string,
    teacherName?: string
  ): WhiteboardSession {
    if (this.memoryCache.has(classroomId)) {
      return this.memoryCache.get(classroomId)!;
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${classroomId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            parsed.presentationSettings = {
              ...DEFAULT_PRESENTATION_SETTINGS,
              ...(parsed.presentationSettings || {}),
            };
            this.memoryCache.set(classroomId, parsed);
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load whiteboard session from localStorage:', err);
      }
    }

    const initial = this.createInitialSession(classroomId, classroomTitle, teacherName);
    this.saveSession(initial);
    return initial;
  }

  /**
   * Saves updated session, updates local memory and storage, broadcasts to peers, and syncs to Firestore
   */
  public saveSession(session: WhiteboardSession, isLocalEdit: boolean = true): void {
    const updatedSession: WhiteboardSession = {
      ...session,
      presentationSettings: {
        ...DEFAULT_PRESENTATION_SETTINGS,
        ...(session.presentationSettings || {}),
      },
      lastUpdated: new Date().toISOString(),
      version: (session.version || 0) + 1,
    };

    this.memoryCache.set(session.classroomId, updatedSession);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `${STORAGE_PREFIX}${session.classroomId}`,
          JSON.stringify(updatedSession)
        );
      } catch (err) {
        console.warn('Failed to save whiteboard session to storage:', err);
      }
    }

    // Broadcast cross-tab/window
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'WHITEBOARD_UPDATE',
          session: updatedSession,
        });
      } catch (err) {
        console.warn('Failed to broadcast whiteboard state:', err);
      }
    }

    // Debounced sync to Firestore cloud document so remote students on separate devices receive updates
    if (isLocalEdit && session.classroomId) {
      if (this.cloudSaveDebounceTimer) {
        clearTimeout(this.cloudSaveDebounceTimer);
      }
      this.cloudSaveDebounceTimer = setTimeout(async () => {
        try {
          const docRef = doc(db, 'classrooms', session.classroomId, 'whiteboard', 'live');
          const payload = sanitizeForFirestore({
            classroomId: session.classroomId,
            classroomTitle: session.classroomTitle,
            teacherName: session.teacherName,
            activePageId: updatedSession.activePageId,
            pages: updatedSession.pages,
            presentationSettings: updatedSession.presentationSettings,
            isLiveActive: updatedSession.isLiveActive,
            version: updatedSession.version,
            lastUpdated: updatedSession.lastUpdated,
          });
          await setDoc(docRef, payload, { merge: true });
        } catch (cloudErr) {
          console.warn('Firestore whiteboard sync notice (local and peer sync remain active):', cloudErr);
        }
      }, 350);
    }

    // Notify local in-memory listeners
    this.notifyListeners(session.classroomId, updatedSession);
  }

  /**
   * Sets the live active status of the classroom whiteboard and synchronizes to cloud & peers
   */
  public setLiveActive(
    classroomId: string,
    isLiveActive: boolean,
    metadata?: { classroomTitle?: string; teacherName?: string }
  ): WhiteboardSession {
    const session = this.getSession(classroomId);
    const nextSession: WhiteboardSession = {
      ...session,
      isLiveActive,
      classroomTitle: metadata?.classroomTitle || session.classroomTitle,
      teacherName: metadata?.teacherName || session.teacherName,
    };
    this.saveSession(nextSession, true);
    return nextSession;
  }

  /**
   * Subscribes to updates for a specific classroom whiteboard across local and cloud
   */
  public subscribe(classroomId: string, listener: Listener): () => void {
    if (!this.listeners.has(classroomId)) {
      this.listeners.set(classroomId, new Set());
    }
    this.listeners.get(classroomId)!.add(listener);

    // Initial trigger with current local state
    const current = this.getSession(classroomId);
    listener(current);

    // Connect to Firestore real-time snapshot listener (public read allowed in rules)
    if (!this.firestoreUnsubs.has(classroomId) && classroomId) {
      try {
        const docRef = doc(db, 'classrooms', classroomId, 'whiteboard', 'live');
        const unsub = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as WhiteboardSession;
              if (data && Array.isArray(data.pages)) {
                this.applyRemoteSession(data);
              }
            }
          },
          (err) => {
            console.warn('Firestore whiteboard onSnapshot notice:', err);
          }
        );
        this.firestoreUnsubs.set(classroomId, unsub);
      } catch (e) {
        console.warn('Could not register Firestore whiteboard subscription:', e);
      }
    }

    return () => {
      const set = this.listeners.get(classroomId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(classroomId);
          const unsub = this.firestoreUnsubs.get(classroomId);
          if (unsub) {
            unsub();
            this.firestoreUnsubs.delete(classroomId);
          }
        }
      }
    };
  }

  private notifyListeners(classroomId: string, session: WhiteboardSession): void {
    const listeners = this.listeners.get(classroomId);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(session);
        } catch (e) {
          console.error('Error in whiteboard listener:', e);
        }
      });
    }
  }

  /**
   * Updates presentation settings (displayMode, fonts, size, color) and synchronizes to all students
   */
  public updatePresentationSettings(
    classroomId: string,
    settings: Partial<WhiteboardPresentationSettings>
  ): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedSettings: WhiteboardPresentationSettings = {
      ...session.presentationSettings,
      ...settings,
    };

    const nextSession: WhiteboardSession = {
      ...session,
      presentationSettings: updatedSettings,
    };

    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Sets whether AI handwriting recognition is currently processing
   */
  public setRecognizingStatus(classroomId: string, isRecognizing: boolean): void {
    const session = this.getSession(classroomId);
    session.isRecognizing = isRecognizing;
    this.memoryCache.set(classroomId, session);
    this.notifyListeners(classroomId, session);
  }

  /**
   * Updates recognized blocks for a page
   */
  public updateRecognizedBlocks(
    classroomId: string,
    pageId: string,
    blocks: RecognizedStrokeBlock[]
  ): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedPages = session.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            recognizedBlocks: blocks,
            updatedAt: new Date().toISOString(),
          }
        : page
    );

    const nextSession: WhiteboardSession = {
      ...session,
      pages: updatedPages,
      isRecognizing: false,
    };

    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Corrects a recognized text block (Teacher manually amends text while preserving stroke association)
   */
  public correctRecognizedBlock(
    classroomId: string,
    pageId: string,
    blockId: string,
    newText: string
  ): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedPages = session.pages.map((page) => {
      if (page.id !== pageId) return page;
      const updatedBlocks = (page.recognizedBlocks || []).map((block) =>
        block.id === blockId
          ? {
              ...block,
              renderedText: newText.trim(),
              status: 'corrected' as const,
            }
          : block
      );
      return {
        ...page,
        recognizedBlocks: updatedBlocks,
        updatedAt: new Date().toISOString(),
      };
    });

    const nextSession: WhiteboardSession = {
      ...session,
      pages: updatedPages,
    };

    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Adds a new page to the classroom whiteboard
   */
  public addPage(classroomId: string, title?: string): WhiteboardSession {
    const session = this.getSession(classroomId);
    const pageNumber = session.pages.length + 1;
    const newPageId = `page_${pageNumber}_${Date.now()}`;
    const newPage: WhiteboardPage = {
      id: newPageId,
      title: title || `Page ${pageNumber} — Notes`,
      elements: [],
      recognizedBlocks: [],
      backgroundColor: '#FFFFFF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextSession: WhiteboardSession = {
      ...session,
      pages: [...session.pages, newPage],
      activePageId: newPageId,
    };

    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Switches the active page
   */
  public switchPage(classroomId: string, pageId: string): WhiteboardSession {
    const session = this.getSession(classroomId);
    const pageExists = session.pages.some((p) => p.id === pageId);
    if (!pageExists) return session;

    const nextSession: WhiteboardSession = {
      ...session,
      activePageId: pageId,
    };
    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Renames a page
   */
  public renamePage(classroomId: string, pageId: string, newTitle: string): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedPages = session.pages.map((page) =>
      page.id === pageId ? { ...page, title: newTitle.trim() || page.title, updatedAt: new Date().toISOString() } : page
    );

    const nextSession: WhiteboardSession = {
      ...session,
      pages: updatedPages,
    };
    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Deletes a page, ensuring at least one page remains
   */
  public deletePage(classroomId: string, pageId: string): WhiteboardSession {
    const session = this.getSession(classroomId);
    if (session.pages.length <= 1) {
      return this.clearPage(classroomId, pageId);
    }

    const filteredPages = session.pages.filter((p) => p.id !== pageId);
    let nextActiveId = session.activePageId;
    if (session.activePageId === pageId) {
      nextActiveId = filteredPages[0].id;
    }

    const nextSession: WhiteboardSession = {
      ...session,
      pages: filteredPages,
      activePageId: nextActiveId,
    };
    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Clears elements of a specific page
   */
  public clearPage(classroomId: string, pageId: string): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedPages = session.pages.map((page) =>
      page.id === pageId ? { ...page, elements: [], recognizedBlocks: [], updatedAt: new Date().toISOString() } : page
    );

    const nextSession: WhiteboardSession = {
      ...session,
      pages: updatedPages,
    };
    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Updates elements of a specific page
   */
  public updatePageElements(
    classroomId: string,
    pageId: string,
    elements: WhiteboardElement[]
  ): WhiteboardSession {
    const session = this.getSession(classroomId);
    const updatedPages = session.pages.map((page) =>
      page.id === pageId ? { ...page, elements, updatedAt: new Date().toISOString() } : page
    );

    const nextSession: WhiteboardSession = {
      ...session,
      pages: updatedPages,
    };
    this.saveSession(nextSession);
    return nextSession;
  }

  /**
   * Sends stroke image crop to the server-side AI handwriting recognition engine
   */
  public async recognizeHandwriting(
    imageBase64: string,
    context?: string,
    languageHint: string = 'auto'
  ): Promise<{
    success: boolean;
    fallback?: boolean;
    recognizedText?: string;
    language?: 'en' | 'so' | 'ar' | 'math' | 'mixed';
    isRTL?: boolean;
    isMath?: boolean;
    confidence?: number;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/whiteboard/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          context: context || 'University Lecture Notes',
          languageHint,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          fallback: true,
          message: `Server returned status ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn('Handwriting recognition request failed:', err);
      return {
        success: false,
        fallback: true,
        message: err?.message || 'Network error during recognition',
      };
    }
  }
}

export const whiteboardSyncService = new WhiteboardSyncService();
