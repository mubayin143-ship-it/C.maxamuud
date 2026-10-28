import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlobalClassroom, ClassroomStudentItem } from '../../types/education';
import { SAMPLE_CLASSROOM_STUDENTS } from '../../data/globalEducation';
import { Check, UserCheck, Clock, UserX, CheckCircle2 } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  students?: ClassroomStudentItem[];
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  students,
}) => {
  const studentList =
    students !== undefined
      ? students
      : activeClassroom?.id.startsWith('cls-')
      ? SAMPLE_CLASSROOM_STUDENTS
      : [];
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({
    'st-1': 'present',
    'st-2': 'present',
    'st-3': 'late',
    'st-4': 'present',
    'st-5': 'present',
    'st-6': 'absent',
  });
  const [savedToast, setSavedToast] = useState(false);

  const setStatus = (id: string, st: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: st }));
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Class Session Attendance"
      description={`Daily roll call & student presence · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={savedToast}
            className="gap-2"
          >
            {savedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Attendance Recorded!</span>
              </>
            ) : (
              <span>Save Attendance Record</span>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-[#7C3AED]">
          <span>Present: {presentCount} / {studentList.length} Students</span>
          <span>Date: Today ({new Date().toLocaleDateString()})</span>
        </div>

        {studentList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#EDE8F5] text-center text-xs text-slate-500 font-medium">
            No students enrolled in this classroom yet.
          </div>
        ) : (
          <div className="space-y-2">
            {studentList.map((st) => {
              const currentStatus = attendanceMap[st.id] || 'present';
              return (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#1E1B4B] truncate">{st.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{st.email}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatus(st.id, 'present')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(st.id, 'late')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(st.id, 'absent')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
