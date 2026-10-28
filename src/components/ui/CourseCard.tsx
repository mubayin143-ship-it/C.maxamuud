/**
 * SmartEducate Canonical Course Card Primitive
 * Used across Student & Lecturer experiences for course curricula and schedules.
 */

import React from 'react';
import { BookOpen, User, Clock, MapPin, Award } from 'lucide-react';
import { StudentCourseItem } from '../../types/student';

export interface CourseCardProps {
  course: StudentCourseItem;
  onClick?: () => void;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  actionSlot,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full rounded-2xl sm:rounded-3xl border border-[#EDE8F5] bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(20,10,50,0.03)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.06)] hover:border-[#DDD6FE] transition-all text-start ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top Header: Code badge, Credit hours pill */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full uppercase tracking-wider">
          {course.courseCode}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-[#F5F2FA] px-2.5 py-1 rounded-full">
          <Award className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{course.creditHours} Credits</span>
        </span>
      </div>

      {/* Course Title */}
      <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug mb-3">
        {course.courseTitle}
      </h3>

      {/* Metadata Badges / Info Rows */}
      <div className="space-y-1.5 text-xs sm:text-sm text-[#64748B]">
        {course.lecturerName && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{course.lecturerName}</span>
          </div>
        )}

        {(course.scheduleDay || course.scheduleTime) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {[course.scheduleDay, course.scheduleTime].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {course.roomOrLocation && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{course.roomOrLocation}</span>
          </div>
        )}
      </div>

      {actionSlot && <div className="mt-4 pt-3 border-t border-[#F1ECF8]">{actionSlot}</div>}
    </div>
  );
};
