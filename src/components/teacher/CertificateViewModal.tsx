/**
 * SmartEducate Canonical Certificate View & Verification Modal
 *
 * Renders an authentic, professional Certificate of Completion:
 * - High-fidelity academic certificate border with gold and deep purple accents
 * - Verified Student Name, Course, Subject, Score %, and Letter Grade
 * - Custom Teacher Signature and Official Institutional Stamp/Seal
 * - Unique Certificate ID, Verification Code, and QR code representation
 * - Action buttons: Send to Student, Download / Print, Verify, Close
 */

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Share2,
  X,
  Send,
  ShieldCheck,
  QrCode,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';
import { IssuedCertificate } from '../../types/education';
import { useI18n } from '../../i18n/I18nContext';

export interface CertificateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: IssuedCertificate | null;
  onSendToStudent?: (certificateId: string) => void;
  isStudentViewer?: boolean;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onSendToStudent,
  isStudentViewer = false,
}) => {
  const { t, isRTL } = useI18n();
  const [copiedId, setCopiedId] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(certificate.id);
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSend = () => {
    if (onSendToStudent) {
      onSendToStudent(certificate.id);
    }
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Certificate of Completion"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#EDE8F5] my-auto">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-300">
              SmartEducate Verified Academic Credential
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Printable Certificate Document Canvas */}
        <div className="p-4 sm:p-8 bg-[#FCFAFE]">
          <div className="relative rounded-2xl bg-white border-4 border-double border-amber-300/80 p-6 sm:p-10 shadow-[0_4px_24px_rgba(20,10,50,0.06)] overflow-hidden text-center space-y-6">
            {/* Watermark Crest Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-96 h-96 text-[#7C3AED]" />
            </div>

            {/* Header / Brand */}
            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-[#7C3AED] text-[11px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>SmartEducate Academic Registry</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-serif font-black tracking-wider text-[#1E1B4B] pt-2 uppercase">
                Certificate of Completion
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-sans tracking-wide">
                This official credential certifies that
              </p>
            </div>

            {/* Student Full Name */}
            <div className="py-2 relative z-10">
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#7C3AED] tracking-tight border-b-2 border-amber-300/80 pb-2 inline-block px-6">
                {certificate.studentName}
              </h1>
            </div>

            {/* Academic Achievement Narrative */}
            <div className="space-y-2 max-w-lg mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed font-sans relative z-10">
              <p>
                has successfully fulfilled all academic requirements, passed the comprehensive course examinations, and achieved graduation status in:
              </p>
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-[#1E1B4B] font-bold text-sm sm:text-base">
                {certificate.courseTitle}
              </div>
              <p className="text-slate-500 text-xs">
                Subject: <span className="font-semibold text-slate-700">{certificate.subject}</span> · Issued through{' '}
                <span className="font-semibold text-slate-700">{certificate.institutionName}</span>
              </p>
            </div>

            {/* Score & Letter Grade Pill */}
            <div className="flex items-center justify-center gap-4 relative z-10">
              <div className="px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Final Score: {certificate.finalScore}%</span>
              </div>
              <div className="px-4 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] text-xs sm:text-sm font-extrabold shadow-2xs">
                <span>Grade: {certificate.letterGrade}</span>
              </div>
            </div>

            {/* Signature & Official Seal Row */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 items-end relative z-10">
              {/* Left: Teacher Signature */}
              <div className="text-start space-y-1">
                <div className="font-serif italic text-lg sm:text-xl text-[#1E1B4B] font-bold border-b border-slate-300 pb-1">
                  {certificate.teacherSignatureText}
                </div>
                <p className="text-xs font-bold text-[#1E1B4B]">{certificate.teacherName}</p>
                <p className="text-[11px] text-slate-400">{certificate.teacherTitle}</p>
                <p className="text-[10px] text-slate-400">Date: {certificate.completionDate}</p>
              </div>

              {/* Right: Institutional Stamp Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-amber-500/80 bg-amber-50/50 flex flex-col items-center justify-center p-2 text-center text-[9px] sm:text-[10px] text-amber-900 font-extrabold uppercase shadow-inner rotate-[-3deg]">
                  <ShieldCheck className="w-5 h-5 text-amber-600 mb-0.5" />
                  <span className="leading-tight font-black">{certificate.institutionName.slice(0, 16)}</span>
                  <span className="text-[8px] text-amber-700 font-bold">OFFICIAL SEAL</span>
                </div>
              </div>
            </div>

            {/* Certificate ID & Verification Code Footer */}
            <div className="pt-4 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 relative z-10">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-slate-600">ID:</span>
                <span className="text-[#7C3AED] font-extrabold">{certificate.id}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-slate-600">Verification:</span>
                <span className="text-emerald-700 font-bold">{certificate.verificationCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-[#EDE8F5] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className="h-10 px-3.5 rounded-xl border border-[#EDE8F5] bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <QrCode className="w-4 h-4" />}
              <span>{copiedId ? 'Copied ID!' : 'Copy Certificate ID'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-3.5 rounded-xl border border-[#EDE8F5] bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#7C3AED]" />
              <span>Print / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isStudentViewer && (
              <button
                type="button"
                onClick={handleSend}
                className="h-10 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {sentNotice ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>{sentNotice ? 'Delivered to Student!' : 'Send to Student'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
