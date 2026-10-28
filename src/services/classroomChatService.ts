/**
 * SmartEducate Classroom Chat Service
 * Handles persistent classroom group chat, direct 1:1 teacher-student messaging,
 * voice note recording/playback, delivery receipts, permissions, and multi-user
 * real-time synchronization via Google Cloud Firestore onSnapshot() listeners.
 */

import {
  ChatMessage,
  ClassroomChatSettings,
  MessageSenderRole,
} from '../types/chat';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  where,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';

const CHAT_STORAGE_PREFIX = 'smarteducate_chat_messages_';
const SETTINGS_STORAGE_PREFIX = 'smarteducate_chat_settings_';
const BROADCAST_CHANNEL_NAME = 'smarteducate_chat_sync_channel';

// Valid standard audio sample data URL for instructor demo voice note
const SAMPLE_DEMO_AUDIO_URL =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

class ClassroomChatService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<() => void>> = new Map();

  // Firestore onSnapshot reference counting & unsubscribe handlers keyed by canonicalClassroomId
  private firestoreUnsubscribers: Map<string, Unsubscribe> = new Map();
  private inFlightInits: Map<string, Promise<void>> = new Map();
  private canonicalSubscriberCounts: Map<string, number> = new Map();

  // Resolved canonical Firestore document IDs cache (e.g. 'WSC-6666' -> 'cls-xxx')
  private canonicalIdCache: Map<string, string> = new Map();

  // In-memory messages cache: canonicalClassroomId -> ChatMessage[]
  private memoryCache: Map<string, ChatMessage[]> = new Map();

  // Error and loading states keyed by canonicalClassroomId
  private errorStates: Map<string, string | null> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.classroomId) {
            this.notifyListeners(event.data.classroomId);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available for chat:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith(CHAT_STORAGE_PREFIX)) {
          const classroomId = event.key.replace(CHAT_STORAGE_PREFIX, '');
          this.notifyListeners(classroomId);
        }
      });
    }

    // Auth state observer: reconnect onSnapshot listeners once user logs in
    try {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // Re-initialize active canonical listeners that may have failed while unauthenticated
          this.canonicalSubscriberCounts.forEach((count, canonicalId) => {
            if (count > 0 && !this.firestoreUnsubscribers.has(canonicalId)) {
              this.initFirestoreListener(canonicalId);
            }
          });
        } else {
          // Disconnect active Firestore listeners to prevent permission-denied errors when signed out
          this.firestoreUnsubscribers.forEach((unsub) => {
            try {
              unsub();
            } catch {}
          });
          this.firestoreUnsubscribers.clear();
        }
      });
    } catch (e) {
      console.warn('Error attaching auth state listener to chat service:', e);
    }
  }

  /**
   * Resolves the canonical Firestore document ID for a classroom.
   * Ensures that Student and Teacher resolve the EXACT same Firestore document
   * and messages subcollection path, whether referenced by doc ID or verified classroom code.
   */
  public async resolveCanonicalClassroomId(classroomIdOrCode: string): Promise<string> {
    if (!classroomIdOrCode) return '';
    const trimmed = classroomIdOrCode.trim();

    if (this.canonicalIdCache.has(trimmed)) {
      return this.canonicalIdCache.get(trimmed)!;
    }

    // 1. Try directly checking if doc exists with this ID
    try {
      const docRef = doc(db, 'classrooms', trimmed);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const canonical = docSnap.id;
        this.canonicalIdCache.set(trimmed, canonical);
        const data = docSnap.data();
        if (data?.code) {
          this.canonicalIdCache.set(String(data.code).trim().toUpperCase(), canonical);
        }
        return canonical;
      }
    } catch {
      // Ignore and proceed to code query
    }

    // 2. Try looking up by classroom join code (case-insensitive)
    try {
      const upperCode = trimmed.toUpperCase();
      const codeQuery = query(collection(db, 'classrooms'), where('code', '==', upperCode));
      const snap = await getDocs(codeQuery);
      if (!snap.empty) {
        const canonical = snap.docs[0].id;
        this.canonicalIdCache.set(trimmed, canonical);
        this.canonicalIdCache.set(upperCode, canonical);
        return canonical;
      }
    } catch (e) {
      console.warn('Error resolving canonical classroom by code:', e);
    }

    // 3. Fallback to input string
    this.canonicalIdCache.set(trimmed, trimmed);
    return trimmed;
  }

  /**
   * Synchronous quick check for cached canonical ID
   */
  public getCachedCanonicalId(classroomIdOrCode: string): string {
    if (!classroomIdOrCode) return '';
    return this.canonicalIdCache.get(classroomIdOrCode.trim()) || classroomIdOrCode.trim();
  }

  /**
   * Starts a Firestore onSnapshot() listener on /classrooms/{canonicalId}/messages
   */
  public async initFirestoreListener(classroomId: string): Promise<void> {
    const canonicalId = await this.resolveCanonicalClassroomId(classroomId);
    if (!canonicalId) return;

    // Only attach onSnapshot listener if user is authenticated (prevents permission-denied errors on startup)
    if (!auth.currentUser) {
      return;
    }

    if (this.firestoreUnsubscribers.has(canonicalId)) {
      return; // Already actively listening to this canonical classroom
    }

    if (this.inFlightInits.has(canonicalId)) {
      return this.inFlightInits.get(canonicalId);
    }

    const initPromise = (async () => {
      this.loadingStates.set(canonicalId, true);

      try {
        const messagesCol = collection(db, 'classrooms', canonicalId, 'messages');
        const messagesQuery = query(messagesCol, orderBy('timestamp', 'asc'));

        const unsub = onSnapshot(
          messagesQuery,
          (snapshot) => {
            this.loadingStates.set(canonicalId, false);
            this.errorStates.set(canonicalId, null);

            const remoteMessages: ChatMessage[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              remoteMessages.push({
                id: d.id,
                classroomId: canonicalId,
                senderId: data.senderId || 'unknown',
                senderName: data.senderName || 'Anonymous',
                senderRole: (data.senderRole as MessageSenderRole) || 'student',
                senderAvatar: data.senderAvatar,
                recipientId: data.recipientId || 'group',
                type: data.type || 'text',
                text: data.text,
                voiceNote: data.voiceNote,
                timestamp: data.timestamp || new Date().toISOString(),
                status: data.status || 'delivered',
              });
            });

            // Consistent ascending timestamp sort
            remoteMessages.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            if (remoteMessages.length > 0) {
              // Preserve any pending optimistic messages that haven't landed in snapshot yet
              const remoteIds = new Set(remoteMessages.map((m) => m.id));
              const currentCache = this.memoryCache.get(canonicalId) || [];
              const pendingOptimistic = currentCache.filter(
                (m) =>
                  !remoteIds.has(m.id) &&
                  !m.id.startsWith(`msg_${canonicalId}_`) &&
                  !m.id.startsWith(`msg_${classroomId}_`)
              );

              const merged = [...remoteMessages, ...pendingOptimistic].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );

              this.memoryCache.set(canonicalId, merged);
              this.saveToLocalStorage(canonicalId, merged);
            } else {
              // If remote is empty, check existing local or seed messages
              const existing = this.getLocalStorageMessages(canonicalId);
              this.memoryCache.set(canonicalId, existing);
            }

            this.notifyListeners(canonicalId);
            if (canonicalId !== classroomId) {
              this.notifyListeners(classroomId);
            }
          },
          (error) => {
            console.warn(`Firestore chat onSnapshot notice for classroom ${canonicalId}:`, error.message);
            this.loadingStates.set(canonicalId, false);
            this.errorStates.set(canonicalId, error.message);

            // Clear unsubscriber so future subscribe() or auth changes can cleanly retry
            const currentUnsub = this.firestoreUnsubscribers.get(canonicalId);
            if (currentUnsub) {
              try {
                currentUnsub();
              } catch {}
              this.firestoreUnsubscribers.delete(canonicalId);
            }

            // Fallback notify so UI stays responsive
            this.notifyListeners(canonicalId);
            if (canonicalId !== classroomId) {
              this.notifyListeners(classroomId);
            }
          }
        );

        this.firestoreUnsubscribers.set(canonicalId, unsub);
      } catch (err: any) {
        console.warn('Failed to initialize Firestore onSnapshot listener:', err);
        this.loadingStates.set(canonicalId, false);
        this.errorStates.set(canonicalId, err?.message || 'Listener setup failed');
      } finally {
        this.inFlightInits.delete(canonicalId);
      }
    })();

    this.inFlightInits.set(canonicalId, initPromise);
    return initPromise;
  }

  private cleanupFirestoreListener(canonicalId: string): void {
    const unsub = this.firestoreUnsubscribers.get(canonicalId);
    if (unsub) {
      try {
        unsub();
      } catch (e) {
        console.warn('Error unsubscribing Firestore listener:', e);
      }
      this.firestoreUnsubscribers.delete(canonicalId);
    }
    this.loadingStates.delete(canonicalId);
    this.errorStates.delete(canonicalId);
  }

  /**
   * Retrieves chat settings for a classroom (e.g. permission mode)
   */
  public getSettings(classroomId: string): ClassroomChatSettings {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    if (typeof window === 'undefined') {
      return { permissionMode: 'everyone', directMessagesEnabled: true };
    }

    try {
      const raw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${canonicalId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse chat settings:', e);
    }

    const defaults: ClassroomChatSettings = {
      permissionMode: 'everyone',
      directMessagesEnabled: true,
    };
    this.saveSettings(canonicalId, defaults);
    return defaults;
  }

  /**
   * Updates chat settings (e.g. permission mode between everyone and teacher_only)
   */
  public updateSettings(
    classroomId: string,
    partial: Partial<ClassroomChatSettings>
  ): ClassroomChatSettings {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    const current = this.getSettings(canonicalId);
    const updated: ClassroomChatSettings = { ...current, ...partial };
    this.saveSettings(canonicalId, updated);
    this.broadcast(canonicalId);
    return updated;
  }

  private saveSettings(classroomId: string, settings: ClassroomChatSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${classroomId}`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save chat settings:', e);
    }
  }

  /**
   * Retrieves initial or demo seeded messages for active learning experience
   */
  private getInitialSeedMessages(classroomId: string): ChatMessage[] {
    const now = Date.now();
    return [
      {
        id: `msg_${classroomId}_1`,
        classroomId,
        senderId: 'teacher_1',
        senderName: 'Prof. Marcus Vance',
        senderRole: 'teacher',
        recipientId: 'group',
        type: 'text',
        text: "Welcome everyone to our course! Please make sure to review the lecture notes and problem set in the Study Material section before tomorrow's live class.",
        timestamp: new Date(now - 14400000).toISOString(),
        status: 'read',
      },
      {
        id: `msg_${classroomId}_2`,
        classroomId,
        senderId: 'teacher_1',
        senderName: 'Prof. Marcus Vance',
        senderRole: 'teacher',
        recipientId: 'group',
        type: 'voice_note',
        text: 'Instructor Voice Note: Problem Set & Whiteboard Walkthrough',
        voiceNote: {
          audioUrl: SAMPLE_DEMO_AUDIO_URL,
          durationSeconds: 8,
          waveform: [25, 45, 70, 85, 95, 60, 40, 30, 65, 80, 90, 75, 50, 30],
        },
        timestamp: new Date(now - 10800000).toISOString(),
        status: 'read',
      },
      {
        id: `msg_${classroomId}_3`,
        classroomId,
        senderId: 'st-1',
        senderName: 'Nimco Nuura',
        senderRole: 'student',
        recipientId: 'group',
        type: 'text',
        text: 'Thank you Professor! Is question 3 on the assignment using row reduction or cofactor expansion?',
        timestamp: new Date(now - 7200000).toISOString(),
        status: 'read',
      },
      {
        id: `msg_${classroomId}_4`,
        classroomId,
        senderId: 'st-2',
        senderName: 'Ahmed Farah',
        senderRole: 'student',
        recipientId: 'group',
        type: 'text',
        text: 'Row reduction is much faster for a 4x4 matrix, like the professor demonstrated in Lecture 7 on the whiteboard!',
        timestamp: new Date(now - 3600000).toISOString(),
        status: 'read',
      },
      {
        id: `msg_${classroomId}_5`,
        classroomId,
        senderId: 'teacher_1',
        senderName: 'Prof. Marcus Vance',
        senderRole: 'teacher',
        recipientId: 'group',
        type: 'text',
        text: 'Spot on, Ahmed! Row reduction is optimal here. We will review question 3 step-by-step during tomorrow’s live session.',
        timestamp: new Date(now - 1800000).toISOString(),
        status: 'delivered',
      },
      {
        id: `msg_${classroomId}_dm_1`,
        classroomId,
        senderId: 'st-1',
        senderName: 'Nimco Nuura',
        senderRole: 'student',
        recipientId: 'teacher_1',
        type: 'text',
        text: 'Hello Professor Vance, I reviewed Theorem 4.2 in the study material notes. Could you clarify how the projection matrix is orthogonal?',
        timestamp: new Date(now - 5400000).toISOString(),
        status: 'read',
      },
      {
        id: `msg_${classroomId}_dm_2`,
        classroomId,
        senderId: 'teacher_1',
        senderName: 'Prof. Marcus Vance',
        senderRole: 'teacher',
        recipientId: 'st-1',
        type: 'text',
        text: 'Hi Nimco! Remember that P^2 = P and P^T = P for orthogonal projection. I added a dedicated diagram on page 2 of the saved whiteboard notes.',
        timestamp: new Date(now - 2700000).toISOString(),
        status: 'delivered',
      },
    ];
  }

  private getLocalStorageMessages(classroomId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${classroomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local chat messages:', e);
    }
    return this.getInitialSeedMessages(classroomId);
  }

  private saveToLocalStorage(classroomId: string, messages: ChatMessage[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${CHAT_STORAGE_PREFIX}${classroomId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat messages to localStorage:', e);
    }
  }

  /**
   * Retrieves all messages for a classroom (group and direct)
   * Consistently ordered chronologically by timestamp
   */
  public getMessages(classroomId: string): ChatMessage[] {
    const canonicalId = this.getCachedCanonicalId(classroomId);

    if (canonicalId && this.memoryCache.has(canonicalId)) {
      return this.memoryCache.get(canonicalId)!;
    }
    if (classroomId !== canonicalId && this.memoryCache.has(classroomId)) {
      return this.memoryCache.get(classroomId)!;
    }

    const targetKey = canonicalId || classroomId;
    const messages = this.getLocalStorageMessages(targetKey);
    this.memoryCache.set(targetKey, messages);
    return messages;
  }

  /**
   * Sends a new text or voice note message.
   * Optimistically updates local cache and broadcasts immediately,
   * then writes to Firestore at /classrooms/{canonicalId}/messages/{messageId}.
   */
  public async sendMessage(
    data: Omit<ChatMessage, 'id' | 'timestamp' | 'status'> & { id?: string; timestamp?: string }
  ): Promise<ChatMessage> {
    const canonicalId = await this.resolveCanonicalClassroomId(data.classroomId);

    // Guaranteed to match firestore.rules regex: ^[a-zA-Z0-9_\-]+$
    const messageId =
      data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = data.timestamp || new Date().toISOString();

    const senderId = auth.currentUser?.uid || data.senderId;
    const senderName = (data.senderName || auth.currentUser?.displayName || 'Participant').slice(0, 128);
    const senderRole = data.senderRole;
    const recipientId = (data.recipientId || 'group').slice(0, 128);

    const newMessage: ChatMessage = {
      ...data,
      classroomId: canonicalId,
      id: messageId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      timestamp,
      status: 'delivered',
    };

    // 1. Optimistic update in memory cache & localStorage
    const current = this.getMessages(canonicalId);
    const existingIndex = current.findIndex((m) => m.id === messageId);
    let updated: ChatMessage[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newMessage;
    } else {
      updated = [...current, newMessage];
    }

    // Consistently sort by timestamp
    updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    this.memoryCache.set(canonicalId, updated);
    this.saveToLocalStorage(canonicalId, updated);
    this.broadcast(canonicalId);
    if (data.classroomId !== canonicalId) {
      this.broadcast(data.classroomId);
    }

    // 2. Real-time persistent write to Firestore
    if (auth.currentUser) {
      try {
        const messageRef = doc(db, 'classrooms', canonicalId, 'messages', messageId);

        // Build clean payload complying with firestore.rules isValidChatMessage
        const payload: Record<string, any> = {
          id: messageId,
          classroomId: canonicalId,
          senderId: auth.currentUser.uid, // Guarantees rule compliance (senderId == request.auth.uid)
          senderName,
          senderRole,
          recipientId,
          type: data.type,
          timestamp,
          status: 'delivered',
        };

        if (data.senderAvatar) {
          payload.senderAvatar = String(data.senderAvatar).slice(0, 512);
        }
        if (data.text) {
          payload.text = data.text.slice(0, 5000);
        }
        if (data.voiceNote) {
          payload.voiceNote = {
            audioUrl: data.voiceNote.audioUrl,
            durationSeconds: data.voiceNote.durationSeconds,
            waveform: data.voiceNote.waveform || [],
          };
        }

        await setDoc(messageRef, payload);
      } catch (err: any) {
        console.error('Error writing message to Firestore /classrooms/' + canonicalId + '/messages:', err);
        this.errorStates.set(canonicalId, err?.message || 'Failed to sync message to cloud');
      }
    } else {
      console.warn('User not signed in to Firebase Auth. Chat message stored locally.');
    }

    return newMessage;
  }

  /**
   * Marks unread messages as read by the recipient/reader
   */
  public async markMessagesAsRead(
    classroomId: string,
    readerRole: MessageSenderRole,
    channelOrRecipientId?: string
  ): Promise<void> {
    const canonicalId = await this.resolveCanonicalClassroomId(classroomId);
    const messages = this.getMessages(canonicalId);
    let changed = false;
    const toUpdateInFirestore: string[] = [];

    const updated = messages.map((msg) => {
      const isOppositeRole = msg.senderRole !== readerRole;
      const isTargetChannel =
        !channelOrRecipientId || channelOrRecipientId === 'group'
          ? msg.recipientId === 'group' || !msg.recipientId
          : msg.recipientId === channelOrRecipientId || msg.senderId === channelOrRecipientId;

      if (isOppositeRole && isTargetChannel && msg.status !== 'read') {
        changed = true;
        toUpdateInFirestore.push(msg.id);
        return { ...msg, status: 'read' as const };
      }
      return msg;
    });

    if (changed) {
      this.memoryCache.set(canonicalId, updated);
      this.saveToLocalStorage(canonicalId, updated);
      this.broadcast(canonicalId);

      // Async Firestore update for read status
      if (auth.currentUser && toUpdateInFirestore.length > 0) {
        for (const msgId of toUpdateInFirestore) {
          try {
            const msgDocRef = doc(db, 'classrooms', canonicalId, 'messages', msgId);
            await updateDoc(msgDocRef, { status: 'read' });
          } catch {
            // Ignore if doc doesn't exist or already read
          }
        }
      }
    }
  }

  /**
   * Calculates unread count for a user role in a classroom
   */
  public getUnreadCount(classroomId: string, userRole: MessageSenderRole): number {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    const messages = this.getMessages(canonicalId);
    const unread = messages.filter(
      (msg) => msg.senderRole !== userRole && msg.status !== 'read'
    );
    return unread.length;
  }

  /**
   * Subscribes to live chat changes in a classroom.
   * Manages Firestore onSnapshot listener lifecycle with canonical reference counting and cleanup.
   */
  public subscribe(classroomId: string, callback: () => void): () => void {
    if (!classroomId) return () => {};

    if (!this.listeners.has(classroomId)) {
      this.listeners.set(classroomId, new Set());
    }
    this.listeners.get(classroomId)!.add(callback);

    let activeCanonicalId = this.getCachedCanonicalId(classroomId);

    const incrementAndInit = (canonId: string) => {
      const count = (this.canonicalSubscriberCounts.get(canonId) || 0) + 1;
      this.canonicalSubscriberCounts.set(canonId, count);
      if (count === 1 || !this.firestoreUnsubscribers.has(canonId)) {
        this.initFirestoreListener(canonId);
      }
    };

    if (activeCanonicalId) {
      incrementAndInit(activeCanonicalId);
    }

    // Resolve asynchronously to guarantee accurate canonical ID
    this.resolveCanonicalClassroomId(classroomId).then((resolved) => {
      if (resolved && resolved !== activeCanonicalId) {
        // Adjust counts if canonical ID changed after resolution
        if (activeCanonicalId) {
          const oldCount = (this.canonicalSubscriberCounts.get(activeCanonicalId) || 1) - 1;
          if (oldCount <= 0) {
            this.canonicalSubscriberCounts.delete(activeCanonicalId);
            this.cleanupFirestoreListener(activeCanonicalId);
          } else {
            this.canonicalSubscriberCounts.set(activeCanonicalId, oldCount);
          }
        }
        activeCanonicalId = resolved;
        incrementAndInit(resolved);
      } else if (!activeCanonicalId && resolved) {
        activeCanonicalId = resolved;
        incrementAndInit(resolved);
      }
    });

    return () => {
      const set = this.listeners.get(classroomId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(classroomId);
        }
      }

      const targetId = activeCanonicalId || this.getCachedCanonicalId(classroomId);
      if (targetId) {
        const count = (this.canonicalSubscriberCounts.get(targetId) || 1) - 1;
        if (count <= 0) {
          this.canonicalSubscriberCounts.delete(targetId);
          this.cleanupFirestoreListener(targetId);
        } else {
          this.canonicalSubscriberCounts.set(targetId, count);
        }
      }
    };
  }

  public getLoadingState(classroomId: string): boolean {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    return this.loadingStates.get(canonicalId) || false;
  }

  public getErrorState(classroomId: string): string | null {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    return this.errorStates.get(canonicalId) || null;
  }

  private notifyListeners(classroomId: string): void {
    const canonicalId = this.getCachedCanonicalId(classroomId);
    const notified = new Set<() => void>();

    // Notify listeners for raw classroomId
    const rawListeners = this.listeners.get(classroomId);
    if (rawListeners) {
      rawListeners.forEach((cb) => notified.add(cb));
    }

    // Notify listeners for canonicalId
    if (canonicalId && canonicalId !== classroomId) {
      const canonicalListeners = this.listeners.get(canonicalId);
      if (canonicalListeners) {
        canonicalListeners.forEach((cb) => notified.add(cb));
      }
    }

    // Also check any reverse mapped keys in canonicalIdCache
    this.canonicalIdCache.forEach((canon, key) => {
      if (canon === canonicalId || canon === classroomId) {
        const mappedListeners = this.listeners.get(key);
        if (mappedListeners) {
          mappedListeners.forEach((cb) => notified.add(cb));
        }
      }
    });

    notified.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in chat listener callback:', e);
      }
    });
  }

  private broadcast(classroomId: string): void {
    this.notifyListeners(classroomId);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ classroomId, timestamp: Date.now() });
      } catch (e) {
        console.warn('Failed to broadcast chat update:', e);
      }
    }
  }
}

export const classroomChatService = new ClassroomChatService();
