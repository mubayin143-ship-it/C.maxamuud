import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Target,
  BarChart2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export interface TestResultPoint {
  id: string;
  date: string;
  fullDate: string;
  title: string;
  category: 'quiz' | 'assignment' | 'exam' | 'test';
  subject: string;
  score: number;
  maxScore: number;
  classAverage: number;
  letterGrade: string;
  status: 'graded' | 'submitted';
}

const CANONICAL_TEST_HISTORY: TestResultPoint[] = [
  {
    id: 't-1',
    date: 'Sep 08',
    fullDate: 'Sep 08, 2026',
    title: 'Diagnostic Math Assessment',
    category: 'quiz',
    subject: 'General Mathematics',
    score: 84,
    maxScore: 100,
    classAverage: 74,
    letterGrade: 'B',
    status: 'graded',
  },
  {
    id: 't-2',
    date: 'Sep 16',
    fullDate: 'Sep 16, 2026',
    title: 'Quiz 1: Vector Spaces',
    category: 'quiz',
    subject: 'Linear Algebra',
    score: 94,
    maxScore: 100,
    classAverage: 81,
    letterGrade: 'A',
    status: 'graded',
  },
  {
    id: 't-3',
    date: 'Sep 25',
    fullDate: 'Sep 25, 2026',
    title: 'Problem Set: Linear Systems',
    category: 'assignment',
    subject: 'Linear Algebra',
    score: 88,
    maxScore: 100,
    classAverage: 79,
    letterGrade: 'B+',
    status: 'graded',
  },
  {
    id: 't-4',
    date: 'Oct 04',
    fullDate: 'Oct 04, 2026',
    title: 'Calculus & Derivatives Check',
    category: 'test',
    subject: 'Calculus',
    score: 91,
    maxScore: 100,
    classAverage: 82,
    letterGrade: 'A-',
    status: 'graded',
  },
  {
    id: 't-5',
    date: 'Oct 12',
    fullDate: 'Oct 12, 2026',
    title: 'Grade 8 Algebra Assignment',
    category: 'assignment',
    subject: 'Mathematics',
    score: 95,
    maxScore: 100,
    classAverage: 80,
    letterGrade: 'A',
    status: 'graded',
  },
  {
    id: 't-6',
    date: 'Oct 19',
    fullDate: 'Oct 19, 2026',
    title: 'Quiz 2: Matrix Inverses & Determinants',
    category: 'quiz',
    subject: 'Linear Algebra',
    score: 98,
    maxScore: 100,
    classAverage: 84,
    letterGrade: 'A+',
    status: 'graded',
  },
];

interface StudentProgressChartProps {
  onOpenTestModal?: () => void;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TestResultPoint;
    value: number;
    dataKey: string;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const diffFromAvg = Math.round(data.score - data.classAverage);

    return (
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 p-3 rounded-2xl shadow-lg text-xs space-y-1.5 min-w-[200px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <span className="font-bold text-[#1E1B4B] dark:text-slate-100 truncate max-w-[140px]">
            {data.title}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-300 font-extrabold text-[10px]">
            {data.letterGrade}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
          <span>{data.fullDate}</span>
          <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">
            {data.subject}
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-slate-600 dark:text-slate-400">Your Score:</span>
          <span className="font-extrabold text-sm text-[#7C3AED] dark:text-purple-400 font-mono">
            {data.score}%
          </span>
        </div>
        <div className="flex items-baseline justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Class Average:</span>
          <span className="font-mono">{data.classAverage}%</span>
        </div>
        <div className="pt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>+{diffFromAvg}% vs Class Benchmark</span>
        </div>
      </div>
    );
  }
  return null;
};

export const StudentProgressChart: React.FC<StudentProgressChartProps> = ({
  onOpenTestModal,
  className = '',
}) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'quiz' | 'assignment'>('all');

  // Filter dataset
  const filteredData = useMemo(() => {
    if (filter === 'all') return CANONICAL_TEST_HISTORY;
    return CANONICAL_TEST_HISTORY.filter(
      (item) => item.category === filter || (filter === 'assignment' && item.category === 'test')
    );
  }, [filter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const list = CANONICAL_TEST_HISTORY;
    if (list.length === 0) {
      return { average: 0, highest: 0, count: 0, trend: 0 };
    }
    const sum = list.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Math.round((sum / list.length) * 10) / 10;
    const highest = Math.max(...list.map((i) => i.score));
    const firstScore = list[0].score;
    const lastScore = list[list.length - 1].score;
    const trend = lastScore - firstScore;

    return {
      average: avg,
      highest,
      count: list.length,
      trend,
    };
  }, []);

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}
    >
      {/* Header & Filter Controls */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shadow-2xs">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100">
              Academic Progress & Test Results
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Performance over time across quizzes, problem sets, and tests
          </p>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('quiz')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'quiz'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Quizzes
          </button>
          <button
            type="button"
            onClick={() => setFilter('assignment')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'assignment'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Assignments
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Average
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-[#1E1B4B] dark:text-slate-100 font-mono tabular-nums">
              {metrics.average}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 inline me-0.5" />
              +{metrics.trend}%
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            Highest
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-[#1E1B4B] dark:text-slate-100 font-mono tabular-nums">
              {metrics.highest}%
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Grade A+
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Completed
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-[#1E1B4B] dark:text-slate-100 font-mono tabular-nums">
              {metrics.count}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              evaluated
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Area/Line Chart */}
      <div className="pt-2">
        <div className="w-full h-44 sm:h-48 -ms-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                opacity={0.5}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', opacity: 0.4 }}
                tick={{ fontSize: 11, fill: '#64748B' }}
                dy={6}
              />

              <YAxis
                domain={[60, 100]}
                ticks={[60, 70, 80, 90, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(val: number) => `${val}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Class Average Reference Line */}
              <Line
                type="monotone"
                dataKey="classAverage"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                name="Class Average"
              />

              {/* Student Score Curve with Gradient Area */}
              <Area
                type="monotone"
                dataKey="score"
                stroke="#7C3AED"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreAreaGradient)"
                name="Your Score"
                dot={{
                  r: 3.5,
                  fill: '#7C3AED',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5.5,
                  fill: '#7C3AED',
                  stroke: '#EDE9FE',
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Test Modal Link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] ring-2 ring-purple-200 dark:ring-purple-950" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Your Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 border-b-2 border-dashed border-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Class Avg</span>
            </div>
          </div>

          {onOpenTestModal && (
            <button
              type="button"
              onClick={onOpenTestModal}
              className="font-bold text-[#7C3AED] dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All Tests</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
