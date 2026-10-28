/**
 * SmartEducate Canonical Timetable Setup Modal
 *
 * Educate-style clean interface for creating and editing weekly teaching sessions.
 * Matches exact specifications:
 * - Classroom selector
 * - Day (Monday - Sunday)
 * - Start Time & End Time
 * - Lesson / Class Name
 * - Type (Lecture, Discussion, Lab, Live Class, Review, Office Hours)
 * - Repeat (Every week, Once, Bi-weekly)
 * - Optional: Description, Room / Online, Teacher
 * - Actions: Cancel, Save Timetable, Update, Delete
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, MapPin, User, Trash2, Check, Video } from 'lucide-react';
import { TimetableDay, TimetableItem, TimetableLessonType } from '../../services/timetableService';
import { useI18n } from '../../i18n/I18nContext';

export interface SetupTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: { id: string; title: string }[];
  activeClassroomId: string;
  defaultTeacherName?: string;
  editingItem: TimetableItem | null;
  onSave: (item: Omit<TimetableItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<TimetableItem>) => void;
  onDelete?: (id: string) => void;
}

const DAYS_OF_WEEK: TimetableDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const LESSON_TYPES: { value: TimetableLessonType; label: string }[] = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'live_class', label: 'Live Interactive Class' },
  { value: 'discussion', label: 'Discussion & Problem Solving' },
  { value: 'lab', label: 'Lab & Practical Workshop' },
  { value: 'review', label: 'Review & Assessment Prep' },
  { value: 'office_hours', label: 'Office Hours & Consultation' },
];

export const SetupTimetableModal: React.FC<SetupTimetableModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  activeClassroomId,
  defaultTeacherName = 'Prof. Marcus Vance',
  editingItem,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const { t } = useI18n();

  const [classroomId, setClassroomId] = useState(activeClassroomId);
  const [day, setDay] = useState<TimetableDay>('Monday');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');
  const [lessonName, setLessonName] = useState('Main Lecture & Proofs');
  const [type, setType] = useState<TimetableLessonType>('lecture');
  const [repeat, setRepeat] = useState<'Every week' | 'Once' | 'Bi-weekly'>('Every week');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('Room 4B / Online Portal');
  const [teacherName, setTeacherName] = useState(defaultTeacherName);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync state when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setClassroomId(editingItem.classroomId);
      setDay(editingItem.day);
      setStartTime(editingItem.startTime);
      setEndTime(editingItem.endTime);
      setLessonName(editingItem.lessonName);
      setType(editingItem.type);
      setRepeat(editingItem.repeat);
      setDescription(editingItem.description || '');
      setRoom(editingItem.room || 'Room 4B / Online Portal');
      setTeacherName(editingItem.teacherName || defaultTeacherName);
    } else {
      setClassroomId(activeClassroomId);
      setDay('Monday');
      setStartTime('10:00 AM');
      setEndTime('11:30 AM');
      setLessonName('Main Lecture & Proofs');
      setType('lecture');
      setRepeat('Every week');
      setDescription('');
      setRoom('Room 4B / Online Portal');
      setTeacherName(defaultTeacherName);
    }
    setErrorNotice(null);
  }, [editingItem, activeClassroomId, defaultTeacherName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonName.trim()) {
      setErrorNotice('Please provide a lesson or class title');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem.id, {
        classroomId,
        day,
        startTime,
        endTime,
        lessonName: lessonName.trim(),
        type,
        repeat,
        description: description.trim(),
        room: room.trim(),
        teacherName: teacherName.trim(),
        isLiveClass: type === 'live_class' || type === 'lecture',
      });
    } else {
      onSave({
        classroomId,
        day,
        startTime,
        endTime,
        lessonName: lessonName.trim(),
        type,
        repeat,
        description: description.trim(),
        room: room.trim(),
        teacherName: teacherName.trim(),
        isLiveClass: type === 'live_class' || type === 'lecture',
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingItem && onDelete) {
      onDelete(editingItem.id);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set up timetable"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EDE8F5] overflow-hidden my-auto text-start">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-50/80 to-white border-b border-[#EDE8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-[#7C3AED] flex items-center justify-center shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E1B4B]">
                {editingItem ? 'Edit Class Schedule' : 'Set Up Timetable'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingItem
                  ? 'Update teaching hours and room arrangements'
                  : 'Define your weekly teaching schedule for this classroom'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorNotice && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* 1. Classroom Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Classroom</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs cursor-pointer"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Day & Lesson Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Day of the Week</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as TimetableDay)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs cursor-pointer"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Session Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TimetableLessonType)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs cursor-pointer"
              >
                {LESSON_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Start Time</span>
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>End Time</span>
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="11:30 AM"
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs"
                required
              />
            </div>
          </div>

          {/* 4. Lesson / Class Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Lesson / Class Name</span>
            </label>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="e.g. Main Lecture & Proofs"
              className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs"
              required
            />
          </div>

          {/* 5. Repeat Cadence */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Repeat</label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as 'Every week' | 'Once' | 'Bi-weekly')}
              className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-slate-800 font-semibold outline-none shadow-2xs cursor-pointer"
            >
              <option value="Every week">Every week</option>
              <option value="Bi-weekly">Bi-weekly (Alternate weeks)</option>
              <option value="Once">Once only</option>
            </select>
          </div>

          {/* 6. Optional: Room / Online & Teacher */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F0EBF8]">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Room / Online (Optional)</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Room 4B / Online Portal"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 outline-none focus:bg-white focus:border-[#7C3AED]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Teacher (Optional)</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Lead Instructor"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 outline-none focus:bg-white focus:border-[#7C3AED]"
              />
            </div>
          </div>

          {/* 7. Optional Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-500 block">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Core proofs, homework discussion, and student Q&A."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 outline-none focus:bg-white focus:border-[#7C3AED] resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#EDE8F5] flex items-center justify-between gap-2">
            <div>
              {editingItem && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-10 px-3 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'Update Session' : 'Save Timetable'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
