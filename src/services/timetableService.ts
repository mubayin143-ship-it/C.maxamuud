/**
 * SmartEducate Canonical Timetable Service
 *
 * Single source of truth for all classroom weekly timetables:
 * - Per-classroom persistence in localStorage
 * - Supports empty state for classrooms without a schedule
 * - Full CRUD: Add, Edit, Delete, Duplicate
 * - Integrated with Live Class feature (live streams & attendance)
 */

export type TimetableDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TimetableLessonType =
  | 'lecture'
  | 'discussion'
  | 'lab'
  | 'live_class'
  | 'review'
  | 'office_hours';

export interface TimetableItem {
  id: string;
  classroomId: string;
  day: TimetableDay;
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "11:30 AM"
  lessonName: string; // e.g. "Main Lecture & Proofs"
  type: TimetableLessonType;
  repeat: 'Every week' | 'Once' | 'Bi-weekly';
  description?: string;
  room?: string; // e.g. "Room 4B / Online Portal"
  teacherName?: string;
  isLiveClass?: boolean;
}

const STORAGE_TIMETABLE_KEY = 'smarteducate_timetable_v1';

class TimetableService {
  private items: TimetableItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_TIMETABLE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        // By default, start with an empty schedule so teachers see the empty state
        // and can set up their weekly schedule per Requirement 4
        this.items = [];
      }
    } catch {
      this.items = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_TIMETABLE_KEY, JSON.stringify(this.items));
    } catch {
      // safe fallback
    }
  }

  // Get timetable items for a specific classroom
  public getClassroomTimetable(classroomId: string): TimetableItem[] {
    return this.items.filter((item) => item.classroomId === classroomId);
  }

  // Add a new timetable item
  public addTimetableItem(item: Omit<TimetableItem, 'id'>): TimetableItem {
    const newItem: TimetableItem = {
      ...item,
      id: 'tt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      isLiveClass: item.type === 'live_class' || item.isLiveClass === true,
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  // Update an existing timetable item
  public updateTimetableItem(id: string, updates: Partial<TimetableItem>): TimetableItem | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    const updatedItem: TimetableItem = {
      ...this.items[index],
      ...updates,
      isLiveClass: updates.type === 'live_class' || updates.isLiveClass === true,
    };
    this.items[index] = updatedItem;
    this.saveToStorage();
    return updatedItem;
  }

  // Delete a timetable item
  public deleteTimetableItem(id: string): boolean {
    const prevLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== prevLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Duplicate a timetable item
  public duplicateTimetableItem(id: string): TimetableItem | undefined {
    const original = this.items.find((item) => item.id === id);
    if (!original) return undefined;

    const duplicated: TimetableItem = {
      ...original,
      id: 'tt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      lessonName: `${original.lessonName} (Copy)`,
    };
    this.items.push(duplicated);
    this.saveToStorage();
    return duplicated;
  }

  // Clear all timetable items for testing / reset
  public clearClassroomTimetable(classroomId: string) {
    this.items = this.items.filter((item) => item.classroomId !== classroomId);
    this.saveToStorage();
  }
}

export const timetableService = new TimetableService();
