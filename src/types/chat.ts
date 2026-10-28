/**
 * SmartEducate Canonical Classroom Chat Types
 * Defines data structures for text chat, voice notes,
 * delivery receipts, permissions, and classroom messaging.
 */

export type MessageSenderRole = 'teacher' | 'student';
export type MessageType = 'text' | 'voice_note';
export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface ChatVoiceNote {
  audioUrl: string;
  durationSeconds: number;
  waveform?: number[];
}

export interface ChatMessage {
  id: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  senderRole: MessageSenderRole;
  senderAvatar?: string;
  recipientId?: string; // If 'group' or undefined -> classroom group chat; otherwise student ID or teacher ID
  type: MessageType;
  text?: string;
  voiceNote?: ChatVoiceNote;
  timestamp: string; // ISO string
  status: MessageDeliveryStatus;
}

export type ClassroomChatPermissionMode =
  | 'everyone' // All enrolled students and teacher can participate
  | 'teacher_only'; // Announcements mode: only teacher can send text and voice notes

export interface ClassroomChatSettings {
  permissionMode: ClassroomChatPermissionMode;
  directMessagesEnabled: boolean;
}
