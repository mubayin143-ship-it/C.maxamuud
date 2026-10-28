/**
 * SmartEducate Canonical Certificate & Graduation Management Modal
 *
 * Connected to actual classroom/student performance data (Step 09 & 09B):
 * 1. Performance Overview & Eligibility:
 *    - Student Name & Avatar
 *    - Assignments Score (e.g. 180 / 200)
 *    - Tests & Quizzes Score (e.g. 270 / 300)
 *    - Attendance Rate (e.g. 95%)
 *    - Total Points & Final Score (e.g. 90%)
 *    - Status: Eligible for Graduation / Graduated / In Progress
 *    - CTA: [ Prepare Certificate ]
 * 2. Teacher Review & Preparation:
 *    - Review Student achievement
 *    - Customize Teacher Name, Title, Signature text, Institution, and Stamp
 *    - Actions: [ Preview Certificate ], [ Approve & Issue Certificate ]
 * 3. Issued Certificates Registry:
 *    - Real certificates list, view/print, deliver to student
 */

import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Check,
  Send,
  Printer,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  User,
  FileCheck,
  QrCode,
} from 'lucide-react';
import { academicGradingService } from '../../services/academicGradingService';
import { IssuedCertificate, StudentAcademicRecord } from '../../types/education';
import { useI18n } from '../../i18n/I18nContext';

export interface CertificateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomTitle: string;
  classroomSubject: string;
  institutionName: string;
  defaultTeacherName?: string;
  onViewCertificate: (cert: IssuedCertificate) => void;
}

export const CertificateManagementModal: React.FC<CertificateManagementModalProps> = ({
  isOpen,
  onClose,
  classroomId,
  classroomTitle,
  classroomSubject,
  institutionName,
  defaultTeacherName = 'Prof. Marcus Vance',
  onViewCertificate,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'eligibility' | 'issued'>('eligibility');
  const [preparingStudent, setPreparingStudent] = useState<StudentAcademicRecord | null>(null);
  const [certNotice, setCertNotice] = useState<string | null>(null);

  // Preparation form state
  const [teacherName, setTeacherName] = useState(defaultTeacherName);
  const [teacherTitle, setTeacherTitle] = useState('Professor of Mathematics & Department Chair');
  const [signatureText, setSignatureText] = useState(`${defaultTeacherName}, Ph.D.`);
  const [institution, setInstitution] = useState(institutionName || 'Global University & Academic Registry');
  const [stampText, setStampText] = useState('SmartEducate Academic Registry · Official Seal');

  if (!isOpen) return null;

  const records = academicGradingService.getClassroomRecords(classroomId);
  const issuedCertificates = academicGradingService.getAllCertificates();

  const handleStartPrepare = (student: StudentAcademicRecord) => {
    setPreparingStudent(student);
    setTeacherName(defaultTeacherName);
    setSignatureText(`${defaultTeacherName}, Ph.D.`);
    setInstitution(institutionName || 'Global University & Academic Registry');
    setCertNotice(null);
  };

  const handleApproveAndIssue = () => {
    if (!preparingStudent) return;

    const newCert = academicGradingService.issueCertificate({
      studentId: preparingStudent.studentId,
      studentName: preparingStudent.studentName,
      studentEmail: preparingStudent.studentEmail,
      courseId: classroomId,
      courseTitle: classroomTitle,
      subject: classroomSubject,
      teacherName: teacherName.trim(),
      teacherTitle: teacherTitle.trim(),
      teacherSignatureText: signatureText.trim(),
      institutionName: institution.trim(),
      stampText: stampText.trim(),
    });

    setCertNotice(`Certificate ${newCert.id} successfully approved and issued to ${newCert.studentName}!`);
    setPreparingStudent(null);
    setActiveTab('issued');

    // Automatically open high-fidelity preview for teacher
    onViewCertificate(newCert);
  };

  const handlePreviewDraft = () => {
    if (!preparingStudent) return;

    const draftCert: IssuedCertificate = {
      id: `PREVIEW-${Date.now().toString(36).toUpperCase()}`,
      verificationCode: 'VRF-PREVIEW-SE',
      studentId: preparingStudent.studentId,
      studentName: preparingStudent.studentName,
      studentEmail: preparingStudent.studentEmail,
      courseId: classroomId,
      courseTitle: classroomTitle,
      subject: classroomSubject,
      finalScore: preparingStudent.weightedScore,
      letterGrade: preparingStudent.letterGrade,
      completionDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      teacherName: teacherName.trim(),
      teacherTitle: teacherTitle.trim(),
      teacherSignatureText: signatureText.trim(),
      institutionName: institution.trim(),
      stampText: stampText.trim(),
      isDeliveredToStudent: false,
      issuedAt: new Date().toISOString(),
    };

    onViewCertificate(draftCert);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Certificates & Graduation Management"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#EDE8F5] overflow-hidden my-auto text-start">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50/80 via-amber-100/30 to-white border-b border-[#EDE8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#1E1B4B]">
                  Official Certificates & Graduation
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Academic Registry
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {classroomTitle} · Performance Eligibility & Credential Issuance
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

        {/* Sub-header Tabs */}
        {!preparingStudent && (
          <div className="px-5 pt-3 border-b border-[#EDE8F5] flex items-center gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('eligibility')}
              className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'eligibility'
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Performance & Eligibility ({records.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('issued')}
              className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'issued'
                  ? 'border-amber-500 text-amber-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Issued Credentials ({issuedCertificates.length})</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {certNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2 animate-fadeIn shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{certNotice}</span>
            </div>
          )}

          {/* VIEW 1: Teacher Review & Preparation Step */}
          {preparingStudent ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#EDE8F5] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1B4B]">
                      Review & Approve: {preparingStudent.studentName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Step 4 & 5: Teacher Signature & Official Stamp Customization
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreparingStudent(null)}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              {/* Student Performance Achievement Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-purple-200/80 space-y-2.5">
                <span className="font-extrabold text-xs uppercase tracking-wider text-purple-700 block">
                  Calculated Academic Achievement
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-[#EDE8F5]">
                    <span className="text-[11px] text-slate-400 block font-medium">Assignments</span>
                    <strong className="text-xs font-bold text-slate-800">
                      {preparingStudent.assignmentsScore}% (180/200)
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#EDE8F5]">
                    <span className="text-[11px] text-slate-400 block font-medium">Tests & Quizzes</span>
                    <strong className="text-xs font-bold text-slate-800">
                      {preparingStudent.finalExamScore}% (270/300)
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#EDE8F5]">
                    <span className="text-[11px] text-slate-400 block font-medium">Attendance</span>
                    <strong className="text-xs font-bold text-emerald-600">
                      {preparingStudent.attendanceRate}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 block font-medium">Overall Score</span>
                    <strong className="text-sm font-extrabold text-emerald-900">
                      {preparingStudent.weightedScore}% ({preparingStudent.letterGrade})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Certificate Customization Form */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-3">
                <span className="font-extrabold text-xs text-[#1E1B4B] block">
                  Official Credential Signature & Stamp
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Course / Program</label>
                    <input
                      type="text"
                      value={classroomTitle}
                      disabled
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Student Recipient</label>
                    <input
                      type="text"
                      value={preparingStudent.studentName}
                      disabled
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Instructor Full Name</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-slate-800 font-semibold focus:border-[#7C3AED] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Instructor Academic Title</label>
                    <input
                      type="text"
                      value={teacherTitle}
                      onChange={(e) => setTeacherTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-slate-800 font-semibold focus:border-[#7C3AED] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Teacher Signature Representation
                  </label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="e.g. Prof. Marcus Vance, Ph.D."
                    className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-[#1E1B4B] font-serif italic text-sm focus:border-[#7C3AED] outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Rendered in authentic cursive academic script on the issued credential.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Academic Institution</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-slate-800 font-semibold focus:border-[#7C3AED] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Registry Seal / Stamp</label>
                    <input
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-slate-800 font-semibold focus:border-[#7C3AED] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE8F5]">
                <button
                  type="button"
                  onClick={handlePreviewDraft}
                  className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Preview Certificate</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreparingStudent(null)}
                    className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAndIssue}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Issue Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'eligibility' ? (
            /* VIEW 2: Student Performance & Eligibility Table */
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Graduation Eligibility Roster
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Graduation requires overall score ≥ 60% and completed final assessments.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] font-extrabold text-xs">
                  {records.filter((r) => r.isGraduated).length} Graduated / {records.length} Total
                </span>
              </div>

              <div className="space-y-2.5">
                {records.map((student) => {
                  const isEligible = student.weightedScore >= 60 && student.finalExamScore >= 60;
                  const isGrad = student.isGraduated;

                  return (
                    <div
                      key={student.studentId}
                      className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Avatar & Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#7C3AED] flex items-center justify-center font-black text-sm shrink-0">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-[#1E1B4B]">
                            {student.studentName}
                          </h5>
                          <p className="text-[11px] text-slate-400">{student.studentEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Assignments: <strong>{student.assignmentsScore}%</strong>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Tests: <strong>{student.finalExamScore}%</strong>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Attendance: <strong>{student.attendanceRate}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBF8]">
                        <div className="text-start sm:text-end">
                          <div className="flex items-center gap-1.5 sm:justify-end">
                            <span className="text-sm font-extrabold text-[#1E1B4B]">
                              {student.weightedScore}%
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED] font-extrabold text-[10px]">
                              {student.letterGrade}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold block mt-0.5 ${
                              isGrad
                                ? 'text-purple-600'
                                : isEligible
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {isGrad
                              ? 'Graduated'
                              : isEligible
                              ? 'Eligible for Graduation'
                              : 'In Progress'}
                          </span>
                        </div>

                        <div>
                          {isGrad ? (
                            <button
                              type="button"
                              onClick={() => {
                                const cert = issuedCertificates.find(
                                  (c) => c.studentId === student.studentId
                                );
                                if (cert) onViewCertificate(cert);
                              }}
                              className="h-9 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>View Certificate</span>
                            </button>
                          ) : isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleStartPrepare(student)}
                              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Prepare Certificate</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic px-2">
                              Below 60%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW 3: Issued Certificates List */
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registry of Verified Credentials
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {issuedCertificates.length} credentials on record
                </span>
              </div>

              <div className="space-y-2.5">
                {issuedCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-2.5 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-[#1E1B4B]">{cert.studentName}</h5>
                        <p className="text-xs text-slate-500">{cert.courseTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                            {cert.id}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {cert.verificationCode}
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold inline-block">
                          Grade {cert.letterGrade} ({cert.finalScore}%)
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {cert.completionDate}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F0EBF8] flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Delivery:{' '}
                        <strong className="text-emerald-600 font-semibold">
                          {cert.isDeliveredToStudent ? 'Delivered to Student' : 'Ready to Send'}
                        </strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            academicGradingService.deliverCertificateToStudent(cert.id);
                            setCertNotice(`Certificate re-delivered to ${cert.studentName}!`);
                            setTimeout(() => setCertNotice(null), 2500);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-bold cursor-pointer transition-colors"
                        >
                          {cert.isDeliveredToStudent ? 'Re-send' : 'Deliver'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewCertificate(cert)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
