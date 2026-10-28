import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlobalClassroom, TestAnalysisReport, StudentTestResult } from '../../types/education';
import {
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Percent,
  FileCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface TestAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  onOpenCertificates?: () => void;
}

const SAMPLE_TEST_REPORT: TestAnalysisReport = {
  testId: 'tst-calc-midterm',
  testTitle: 'Calculus & Linear Algebra — Midterm Assessment',
  classroomName: 'Calculus & Linear Algebra (MATH-101)',
  date: 'October 2026',
  averageScore: 86.4,
  passRate: 91.6,
  totalStudents: 24,
  overallWeakAreas: [
    'Question 8 (Chain Rule & Implicit Differentiation): 42% of students made sign errors when differentiating composite trigonometric functions.',
    'Question 12 (Matrix Inversion 3x3): 29% struggled with cofactor sign distribution in the determinant expansion.',
  ],
  overallStrongAreas: [
    'Questions 1–5 (Limits & Continuous Functions): 98% accuracy across the cohort.',
    'Questions 9–10 (Basic Eigenvalues): High conceptual grasp with 92% complete derivations.',
    'Proof Construction: Step-by-step logic was well articulated by over 85% of participants.',
  ],
  summaryNote:
    'Overall cohort demonstrated strong foundational grasp of fundamental limits and eigenvalue derivations. Target upcoming live revision session on implicit differentiation and 3x3 cofactor inversion prior to finals.',
  results: [
    {
      studentId: 'st-1',
      studentName: 'Nimco Nuura',
      score: 96,
      totalPoints: 100,
      percentage: 96,
      status: 'distinction',
      weakAreas: ['None identified — minor rounding on question 12.'],
      strongAreas: ['Calculus limits', 'Matrix proofs', 'Optimization'],
      eligibleForCertificate: true,
    },
    {
      studentId: 'st-2',
      studentName: 'Ahmed Farah',
      score: 88,
      totalPoints: 100,
      percentage: 88,
      status: 'passed',
      weakAreas: ['Question 8: Implicit differentiation sign flip.'],
      strongAreas: ['Linear algebra', 'Determinants', 'Continuous limits'],
      eligibleForCertificate: true,
    },
    {
      studentId: 'st-3',
      studentName: 'Lucas Silva',
      score: 82,
      totalPoints: 100,
      percentage: 82,
      status: 'passed',
      weakAreas: ['Question 12: Matrix cofactor inversion.'],
      strongAreas: ['Algebraic simplification', 'Derivative definitions'],
      eligibleForCertificate: true,
    },
    {
      studentId: 'st-4',
      studentName: 'Elena Rostova',
      score: 94,
      totalPoints: 100,
      percentage: 94,
      status: 'distinction',
      weakAreas: ['Question 15: Minor unit designation omission.'],
      strongAreas: ['Trigonometric substitution', 'Eigenvectors', 'Limits'],
      eligibleForCertificate: true,
    },
    {
      studentId: 'st-5',
      studentName: 'Khadija Ali',
      score: 78,
      totalPoints: 100,
      percentage: 78,
      status: 'passed',
      weakAreas: ['Question 8 & 12: Chain rule applications and matrix inversion.'],
      strongAreas: ['Fundamental calculus theorem', 'Linear systems'],
      eligibleForCertificate: true,
    },
    {
      studentId: 'st-6',
      studentName: 'Chen Wei',
      score: 90,
      totalPoints: 100,
      percentage: 90,
      status: 'distinction',
      weakAreas: ['Question 11: Integration by parts choice of u/dv.'],
      strongAreas: ['Linear transformations', 'Limit bounds', 'Proofs'],
      eligibleForCertificate: true,
    },
  ],
};

export const TestAnalysisModal: React.FC<TestAnalysisModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  onOpenCertificates,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview');
  const [report, setReport] = useState<TestAnalysisReport>(SAMPLE_TEST_REPORT);

  const eligibleCount = report.results.filter((r) => r.eligibleForCertificate).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Test Analysis & Performance"
      description={`${report.testTitle} · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          {onOpenCertificates && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onOpenCertificates();
              }}
              className="gap-2"
            >
              <Award className="w-4 h-4 text-purple-200" />
              <span>Review Certificates ({eligibleCount} Eligible)</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#7C3AED] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Cohort Analysis & Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-white text-[#7C3AED] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Scores & Certificate Status ({report.results.length})
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Average
            </span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xl font-extrabold text-[#1E1B4B]">
                {report.averageScore}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pass Rate
            </span>
            <div className="flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span className="text-xl font-extrabold text-emerald-700">
                {report.passRate}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xl font-extrabold text-[#1E1B4B]">
                {report.totalStudents} Students
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
              Certificate Ready
            </span>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xl font-extrabold text-[#7C3AED]">
                {eligibleCount} / {report.results.length}
              </span>
            </div>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Pedagogical Summary */}
            <div className="p-4 rounded-3xl bg-white border border-[#EDE8F5] shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
                <Sparkles className="w-4 h-4" />
                <span>AI Pedagogical Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {report.summaryNote}
              </p>
            </div>

            {/* Weak Areas (Needs Attention) */}
            <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Identified Weak Areas & Recommended Focus</span>
              </div>
              <div className="space-y-2">
                {report.overallWeakAreas.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                    <span className="font-bold shrink-0">•</span>
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strong Areas (Mastered Concepts) */}
            <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mastered Concepts & Strong Competencies</span>
              </div>
              <div className="space-y-2">
                {report.overallStrongAreas.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="font-bold shrink-0">•</span>
                    <span className="leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Student Scores & Certificate Eligibility Roster */
          <div className="space-y-3">
            {report.results.map((st) => (
              <div
                key={st.studentId}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      {st.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1E1B4B] truncate">
                        {st.studentName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Score: {st.score} / {st.totalPoints} ({st.percentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        st.status === 'distinction'
                          ? 'bg-purple-100 text-[#7C3AED]'
                          : st.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.status === 'distinction' ? 'Distinction' : 'Passed'}
                    </span>
                    {st.eligibleForCertificate && (
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>Eligible</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div>
                    <span className="font-semibold text-emerald-700">Strong: </span>
                    <span>{st.strongAreas.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-amber-700">Feedback: </span>
                    <span>{st.weakAreas.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
