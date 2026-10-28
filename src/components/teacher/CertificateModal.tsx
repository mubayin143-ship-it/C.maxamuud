import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StudentCertificate, GlobalClassroom } from '../../types/education';
import { TeacherProfile } from '../../types/student';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Send,
  Download,
  Share2,
  Check,
  GraduationCap,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  teacherProfile: TeacherProfile;
  certificates: StudentCertificate[];
  onApproveCertificate: (certId: string) => void;
  onIssueCertificate: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  teacherProfile,
  certificates,
  onApproveCertificate,
  onIssueCertificate,
}) => {
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);
  const [stampApplied, setStampApplied] = useState(false);
  const [sentToast, setSentToast] = useState(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  const classroomCerts = certificates.filter(
    (c) => !activeClassroom || c.classroomCode === activeClassroom?.code || true
  );

  const handleSelectCert = (cert: StudentCertificate) => {
    setSelectedCert(cert);
    setStampApplied(cert.teacherSignatureStamp);
    setSentToast(false);
  };

  const handleApplyTeacherStamp = () => {
    if (!selectedCert) return;
    onApproveCertificate(selectedCert.id);
    setStampApplied(true);
    setSelectedCert((prev) =>
      prev ? { ...prev, status: 'approved', teacherSignatureStamp: true } : null
    );
  };

  const handleIssueAndSend = () => {
    if (!selectedCert) return;
    onIssueCertificate(selectedCert.id);
    setSelectedCert((prev) =>
      prev
        ? {
            ...prev,
            status: 'issued',
            teacherSignatureStamp: true,
            issuedAt: new Date().toISOString().split('T')[0],
          }
        : null
    );
    setSentToast(true);
    setTimeout(() => setSentToast(false), 3000);
  };

  const handleCopyLink = () => {
    if (!selectedCert) return;
    const link = `https://smarteducate.org/verify/${selectedCert.certificateNumber}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Certificates & Academic Credentials"
      description={`Review achievement, approve credentials, and issue certificates · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          {selectedCert ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedCert(null)}
              >
                Back to List
              </Button>
              {!selectedCert.teacherSignatureStamp ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApplyTeacherStamp}
                  className="gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>Confirm Teacher Approval & Stamp</span>
                </Button>
              ) : selectedCert.status !== 'issued' ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleIssueAndSend}
                  disabled={sentToast}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{sentToast ? 'Sent to Student!' : 'Issue & Send to Student'}</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  {copiedLinkToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLinkToast ? 'Verification Link Copied!' : 'Copy Credential Link'}</span>
                </Button>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              {classroomCerts.length} Students with Completed Coursework
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[72vh] overflow-y-auto px-1 py-1">
        {!selectedCert ? (
          /* Student Certificates List */
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/60 text-xs text-[#7C3AED] font-medium leading-relaxed">
              💡 <strong>Instructor Approval Required:</strong> In accordance with academic integrity rules, certificates are never issued automatically. Review each student's calculated score, apply your teacher stamp, and issue the certificate.
            </div>

            {classroomCerts.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-3xl bg-white border border-[#EDE8F5] shadow-2xs hover:border-[#7C3AED]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#1E1B4B] truncate">
                        {cert.studentName}
                      </h4>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {cert.certificateNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {cert.courseTitle}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">
                      {cert.achievement}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cert.status === 'issued'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cert.status === 'approved'
                        ? 'bg-purple-100 text-[#7C3AED]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cert.status === 'issued'
                      ? 'Issued'
                      : cert.status === 'approved'
                      ? 'Approved'
                      : 'Pending Review'}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCert(cert)}
                    className="text-xs font-bold gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Certificate</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* OFFICIAL CERTIFICATE PREVIEW */
          <div className="space-y-4">
            {/* Visual Certificate Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white via-[#FAF8FF] to-white border-2 border-[#7C3AED]/30 shadow-[0_8px_30px_rgba(124,58,237,0.08)] text-center relative overflow-hidden space-y-4">
              {/* Decorative Corner Borders */}
              <div className="absolute top-2 start-2 w-6 h-6 border-t-2 border-s-2 border-[#7C3AED]/40 rounded-tl-lg" />
              <div className="absolute top-2 end-2 w-6 h-6 border-t-2 border-e-2 border-[#7C3AED]/40 rounded-tr-lg" />
              <div className="absolute bottom-2 start-2 w-6 h-6 border-b-2 border-s-2 border-[#7C3AED]/40 rounded-bl-lg" />
              <div className="absolute bottom-2 end-2 w-6 h-6 border-b-2 border-e-2 border-[#7C3AED]/40 rounded-br-lg" />

              {/* Header Branding */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] pt-1">
                  SmartEducate Verified Credential
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                  CERTIFICATE OF ACHIEVEMENT
                </h2>
              </div>

              {/* Presented To */}
              <div className="space-y-1 pt-1">
                <p className="text-xs text-slate-400 font-medium">This is officially awarded to</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#7C3AED] tracking-tight">
                  {selectedCert.studentName}
                </h3>
              </div>

              {/* Achievement Body */}
              <div className="max-w-md mx-auto space-y-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                <p>
                  For exceptional performance and successfully meeting all curricular standards in:
                </p>
                <p className="font-extrabold text-base text-[#1E1B4B]">
                  {selectedCert.courseTitle}
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mt-1">
                  {selectedCert.achievement}
                </div>
              </div>

              {/* Bottom Signatures & Seal */}
              <div className="pt-4 border-t border-[#EDE8F5] grid grid-cols-2 gap-4 text-start text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Instructor / Teacher:
                  </span>
                  <p className="font-bold text-[#1E1B4B]">
                    {teacherProfile.name || selectedCert.instructorName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {teacherProfile.institution || selectedCert.institutionOrTutor}
                  </p>
                </div>

                <div className="text-end">
                  <span className="text-[11px] text-slate-400 font-medium block">Date & Credential ID:</span>
                  <p className="font-bold text-[#1E1B4B]">{selectedCert.issueDate}</p>
                  <p className="text-[11px] font-mono text-[#7C3AED]">
                    {selectedCert.certificateNumber}
                  </p>
                </div>
              </div>

              {/* Official Stamp Badge */}
              <div className="pt-2 flex items-center justify-center">
                {selectedCert.teacherSignatureStamp ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-xs animate-fadeIn">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>✓ Officially Approved & Signed by Teacher</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                    <span>⚠ Pending Teacher Signature & Stamp Approval</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Decision Controls */}
            <div className="p-4 rounded-3xl bg-white border border-[#EDE8F5] shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Teacher Verification Controls
              </h4>

              <div className="flex flex-col sm:flex-row gap-2">
                {!selectedCert.teacherSignatureStamp ? (
                  <button
                    type="button"
                    onClick={handleApplyTeacherStamp}
                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply Official Stamp & Approve</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleIssueAndSend}
                    disabled={sentToast}
                    className="flex-1 h-12 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sentToast ? 'Sent to Student!' : 'Issue & Send to Student'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedLinkToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLinkToast ? 'Copied' : 'Share Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
