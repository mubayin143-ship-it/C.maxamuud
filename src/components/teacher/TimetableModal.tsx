import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TimetableEntry, GlobalClassroom } from '../../types/education';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  timetableEntries: TimetableEntry[];
  onAddEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  onRemoveEntry: (id: string) => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  timetableEntries,
  onAddEntry,
  onRemoveEntry,
}) => {
  const [day, setDay] = useState<typeof DAYS_OF_WEEK[number]>('Monday');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');
  const [title, setTitle] = useState(activeClassroom?.title || 'Lecture');
  const [roomOrLink, setRoomOrLink] = useState('Lecture Hall 3 / Live Stream');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEntry({
      day,
      startTime,
      endTime,
      title: title.trim(),
      roomOrLink: roomOrLink.trim() || 'Online Live',
      classroomId: activeClassroom?.id || '',
    });

    setIsAdding(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Timetable & Schedule Setup"
      description={`Manage weekly lecture slots and consultation hours · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          {!isAdding && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAdding(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Class Slot</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        {/* If Adding New Slot */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="p-4 rounded-3xl bg-purple-50/60 border border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                Add New Class Session
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Day of Week
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`py-1.5 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      day === d
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'bg-white border border-[#EDE8F5] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Start Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                required
              />
              <Input
                label="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 11:30 AM"
                required
              />
            </div>

            <Input
              label="Session Title / Topic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus & Linear Algebra"
              required
            />

            <Input
              label="Location / Room / Online Stream"
              value={roomOrLink}
              onChange={(e) => setRoomOrLink(e.target.value)}
              placeholder="e.g. Hall 3, Lab 102, or Online Stream"
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" className="w-full">
                Save to Timetable
              </Button>
            </div>
          </form>
        ) : null}

        {/* Existing Timetable Entries List */}
        {timetableEntries.length === 0 && !isAdding ? (
          <div className="p-8 rounded-3xl bg-white border border-[#EDE8F5] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1E1B4B]">Your Timetable is Empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No lecture hours or live sessions configured yet. Tap below to set up your weekly schedule.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAdding(true)}
              className="gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Set Up Timetable</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {timetableEntries.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                      {item.day}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.startTime} – {item.endTime}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1E1B4B] truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.roomOrLink}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveEntry(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  title="Remove Slot"
                  aria-label="Remove Slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
