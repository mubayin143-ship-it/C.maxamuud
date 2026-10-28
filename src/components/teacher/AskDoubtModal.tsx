import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlobalClassroom } from '../../types/education';
import { HelpCircle, MessageSquare, Send, Check } from 'lucide-react';

interface AskDoubtModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
}

interface StudentDoubt {
  id: string;
  studentName: string;
  question: string;
  time: string;
  status: 'answered' | 'pending';
  answer?: string;
}

export const AskDoubtModal: React.FC<AskDoubtModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
}) => {
  const [doubts, setDoubts] = useState<StudentDoubt[]>([
    {
      id: 'd-1',
      studentName: 'Nimco Nuura',
      question: 'Professor, on Problem Set 2 question 4, can we use L’Hopital’s Rule directly or do we need to prove the indeterminacy first?',
      time: '2 hours ago',
      status: 'pending',
    },
    {
      id: 'd-2',
      studentName: 'Ahmed Farah',
      question: 'Will the Friday quiz cover eigenvalue matrix inversion or only standard 2x2 determinants?',
      time: 'Yesterday',
      status: 'answered',
      answer: 'The quiz will only cover up to 2x2 determinants and eigenvalue definitions. 3x3 inversion will be on the midterm.',
    },
  ]);

  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (doubtId: string) => {
    if (!replyText.trim()) return;
    setDoubts((prev) =>
      prev.map((d) =>
        d.id === doubtId
          ? { ...d, status: 'answered', answer: replyText.trim() }
          : d
      )
    );
    setReplyText('');
    setActiveDoubtId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Inquiries & Doubts"
      description={`Review and answer student academic questions · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">
            {doubts.filter((d) => d.status === 'pending').length} Unanswered Inquiries
          </span>
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        {doubts.map((d) => (
          <div
            key={d.id}
            className="p-4 rounded-3xl bg-white border border-[#EDE8F5] shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center">
                  {d.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1E1B4B] block">{d.studentName}</span>
                  <span className="text-[11px] text-slate-400">{d.time}</span>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  d.status === 'answered'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {d.status === 'answered' ? 'Answered' : 'Pending Reply'}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl">
              "{d.question}"
            </p>

            {d.answer ? (
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 text-xs text-purple-950 space-y-1">
                <span className="font-bold text-[#7C3AED] block">Your Answer:</span>
                <p className="leading-relaxed">{d.answer}</p>
              </div>
            ) : activeDoubtId === d.id ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your explanation or guidance for the student..."
                  rows={2}
                  className="w-full p-3 rounded-2xl border border-[#EDE8F5] bg-white text-xs text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveDoubtId(null);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSendReply(d.id)}
                    disabled={!replyText.trim()}
                    className="gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDoubtId(d.id)}
                className="text-xs font-bold"
              >
                Answer Student
              </Button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};
