import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlobalClassroom, ClassroomStudentItem } from '../../types/education';
import { SAMPLE_CLASSROOM_STUDENTS } from '../../data/globalEducation';
import { DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  students?: ClassroomStudentItem[];
}

export const FeesModal: React.FC<FeesModalProps> = ({
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Classroom Fees & Tuition Status"
      description={`Track tuition and enrolled student payments · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">Cohort Tuition: Free / Institutional</span>
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Tuition Status
            </span>
            <h4 className="text-base font-extrabold text-emerald-950">
              Institutional / Open Enrollment
            </h4>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xs">
            Active
          </span>
        </div>

        {studentList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#EDE8F5] text-center text-xs text-slate-500 font-medium">
            No students enrolled in this classroom yet.
          </div>
        ) : (
          <div className="space-y-2">
            {studentList.map((st) => (
              <div
                key={st.id}
                className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-[#1E1B4B] block">{st.name}</span>
                  <span className="text-slate-400">{st.email}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cleared</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
