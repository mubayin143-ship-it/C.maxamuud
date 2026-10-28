/**
 * SmartEducate Canonical Co-Teachers Management Modal
 * Complete multi-tab interface:
 * 1. Active Co-Teachers Roster (with role badges & member management)
 * 2. Send Invitation (Faculty directory search + email input + role selection)
 * 3. Sent Invitations (Track status & cancel pending)
 * 4. Received Invitations (Review, Accept, and Decline incoming invitations)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlobalClassroom } from '../../types/education';
import { TeacherProfile } from '../../types/student';
import { GLOBAL_TEACHERS } from '../../data/globalEducation';
import {
  coTeacherService,
  CoTeacherMember,
  CoTeacherInvitation,
  CoTeacherRole,
} from '../../services/coTeacherService';
import {
  Users,
  UserPlus,
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  UserCheck,
  Trash2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface CoTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  teacherProfile: TeacherProfile;
  onRefreshClassrooms?: () => void;
  onCountsUpdated?: (counts: { coTeachersCount: number; pendingInvites: number }) => void;
}

const AVAILABLE_ROLES: { role: CoTeacherRole; label: string; desc: string }[] = [
  {
    role: 'Co-Lecturer',
    label: 'Co-Lecturer',
    desc: 'Full course access, lecture delivery, and syllabus management',
  },
  {
    role: 'Teaching Assistant',
    label: 'Teaching Assistant (TA)',
    desc: 'Student doubt resolution, homework review, and grading assistance',
  },
  {
    role: 'Assessment Reviewer',
    label: 'Assessment Reviewer',
    desc: 'Evaluates submitted assignments, quizzes, and examination rubrics',
  },
  {
    role: 'Lab Instructor',
    label: 'Lab Instructor',
    desc: 'Leads practical hands-on exercises, workshops, and lab sessions',
  },
];

export const CoTeachersModal: React.FC<CoTeachersModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  teacherProfile,
  onRefreshClassrooms,
  onCountsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'invite' | 'sent' | 'received'>('roster');

  // State
  const [members, setMembers] = useState<CoTeacherMember[]>([]);
  const [sentInvites, setSentInvites] = useState<CoTeacherInvitation[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CoTeacherInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [inviteMethod, setInviteMethod] = useState<'directory' | 'email'>('directory');
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedDirectoryTeacherId, setSelectedDirectoryTeacherId] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedRole, setSelectedRole] = useState<CoTeacherRole>('Co-Lecturer');
  const [customMessage, setCustomMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const teacherEmail = (teacherProfile.email || '').toLowerCase().trim();
  const teacherUid = teacherProfile.id || '';

  // Load all data
  const loadData = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      if (activeClassroom?.id) {
        const [activeList, sentList] = await Promise.all([
          coTeacherService.getClassroomCoTeachers(activeClassroom.id),
          coTeacherService.getSentInvitations(activeClassroom.id, teacherUid),
        ]);
        setMembers(activeList);
        setSentInvites(sentList);
      }

      const receivedList = await coTeacherService.getReceivedInvitations(teacherEmail, teacherUid);
      setReceivedInvites(receivedList);

      // Notify parent of updated counts
      if (onCountsUpdated && activeClassroom?.id) {
        const counts = await coTeacherService.getCoTeacherCounts(activeClassroom.id, teacherEmail, teacherUid);
        onCountsUpdated({
          coTeachersCount: counts.coTeachersCount,
          pendingInvites: counts.pendingInvites,
        });
      }
    } catch (err) {
      console.warn('Error loading co-teachers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeClassroom?.id, teacherEmail, teacherUid]);

  // Set default tab to received if there are pending received invitations
  useEffect(() => {
    if (isOpen && receivedInvites.some((i) => i.status === 'pending') && members.length === 0) {
      setActiveTab('received');
    }
  }, [isOpen, receivedInvites.length, members.length]);

  // Directory filter
  const filteredDirectoryTeachers = useMemo(() => {
    const q = directorySearch.toLowerCase().trim();
    return GLOBAL_TEACHERS.filter((t) => {
      // Exclude current user
      if (t.id === teacherUid) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.country && t.country.toLowerCase().includes(q)) ||
        (t.institutionName && t.institutionName.toLowerCase().includes(q))
      );
    }).slice(0, 8);
  }, [directorySearch, teacherUid]);

  // Handle Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!activeClassroom) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please select an active classroom first to invite co-teachers.',
      });
      return;
    }

    let recipientEmail = manualEmail.trim();
    let recipientName = manualName.trim();
    let recipientTeacherId: string | undefined = undefined;

    if (inviteMethod === 'directory') {
      const found = GLOBAL_TEACHERS.find((t) => t.id === selectedDirectoryTeacherId);
      if (!found) {
        setFeedbackMessage({
          type: 'error',
          text: 'Please choose an educator from the verified faculty directory.',
        });
        return;
      }
      recipientTeacherId = found.id;
      recipientName = found.name;
      // Synthesize clean institutional email for directory educator
      recipientEmail = `${found.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@institution.edu`;
    }

    if (!recipientEmail) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please provide a valid educator email address.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await coTeacherService.sendInvitation({
        classroom: activeClassroom,
        inviter: {
          uid: teacherUid,
          name: teacherProfile.name || 'Instructor',
          email: teacherEmail,
        },
        recipient: {
          email: recipientEmail,
          name: recipientName,
          teacherId: recipientTeacherId,
        },
        role: selectedRole,
        message: customMessage,
      });

      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message });
        setManualEmail('');
        setManualName('');
        setCustomMessage('');
        setSelectedDirectoryTeacherId(null);
        await loadData();
        // Switch to Sent tab after 1.2s
        setTimeout(() => setActiveTab('sent'), 1200);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to send invitation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Accept Invitation
  const handleAcceptInvite = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setFeedbackMessage(null);
    try {
      const res = await coTeacherService.acceptInvitation(invitationId, {
        uid: teacherUid,
        name: teacherProfile.name || 'Co-Teacher',
        email: teacherEmail,
      });
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message });
        await loadData();
        if (onRefreshClassrooms) {
          onRefreshClassrooms();
        }
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error accepting invitation.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline Invitation
  const handleDeclineInvite = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setFeedbackMessage(null);
    try {
      const res = await coTeacherService.declineInvitation(invitationId, teacherEmail);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message });
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error declining invitation.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Revoke Sent Invitation
  const handleRevokeInvite = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setFeedbackMessage(null);
    try {
      const res = await coTeacherService.revokeInvitation(invitationId);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message });
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error cancelling invitation.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Remove Active Co-Teacher
  const handleRemoveMember = async (memberUid: string, memberName: string) => {
    if (!activeClassroom) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from co-teaching this classroom?`)) {
      return;
    }
    setActionLoadingId(memberUid);
    setFeedbackMessage(null);
    try {
      const res = await coTeacherService.removeCoTeacher(activeClassroom.id, memberUid);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message });
        await loadData();
        if (onRefreshClassrooms) {
          onRefreshClassrooms();
        }
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error removing co-teacher.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingReceivedCount = receivedInvites.filter((i) => i.status === 'pending').length;
  const pendingSentCount = sentInvites.filter((i) => i.status === 'pending').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Co-Teachers & Faculty Collaboration"
      description={`Manage co-instructors, teaching assistants, and classroom roles · ${
        activeClassroom?.title || 'SmartEducate Faculty'
      }`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Role-Based Classroom Access Control</span>
          </div>
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-start max-h-[75vh] overflow-y-auto px-1 py-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('roster');
              setFeedbackMessage(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Co-Teachers</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'roster'
                  ? 'bg-purple-100 text-[#7C3AED] dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('invite');
              setFeedbackMessage(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'invite'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Co-Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sent');
              setFeedbackMessage(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sent Invitations</span>
            {pendingSentCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {pendingSentCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('received');
              setFeedbackMessage(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'received'
                ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Received</span>
            {pendingReceivedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#7C3AED] text-white font-black animate-pulse">
                {pendingReceivedCount}
              </span>
            )}
          </button>
        </div>

        {/* Inline Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <p className="flex-1">{feedbackMessage.text}</p>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: ACTIVE CO-TEACHERS ROSTER                               */}
        {/* ============================================================== */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Classroom Info Strip */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                    Active Classroom
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100">
                    {activeClassroom?.title || 'No Classroom Selected'}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Join Code: <strong className="text-indigo-600">{activeClassroom?.code}</strong> · Owner: You
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('invite');
                  setFeedbackMessage(null);
                }}
              >
                <UserPlus className="w-3.5 h-3.5 me-1.5" />
                Invite
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-400 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    No Co-Teachers Added Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Collaborate with fellow professors, lecturers, and teaching assistants. They can
                    deliver live lectures, evaluate tests, and manage homework with you.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveTab('invite');
                    setFeedbackMessage(null);
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5 me-1.5" />
                  Invite First Co-Teacher
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {member.teacherName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                            {member.teacherName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 font-extrabold text-[10px]">
                            {member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {member.teacherEmail}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoadingId === member.teacherId}
                      onClick={() => handleRemoveMember(member.teacherId, member.teacherName)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Remove Co-Teacher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INVITE CO-TEACHER FORM                                  */}
        {/* ============================================================== */}
        {activeTab === 'invite' && (
          <form onSubmit={handleSendInvite} className="space-y-4">
            {/* Invite Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setInviteMethod('directory')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  inviteMethod === 'directory'
                    ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Select from Faculty Directory
              </button>
              <button
                type="button"
                onClick={() => setInviteMethod('email')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  inviteMethod === 'email'
                    ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Enter Colleague Email
              </button>
            </div>

            {/* Mode 1: Directory Picker */}
            {inviteMethod === 'directory' ? (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search verified faculty by name, subject, or discipline..."
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {filteredDirectoryTeachers.map((teacher) => {
                    const isSelected = selectedDirectoryTeacherId === teacher.id;
                    return (
                      <div
                        key={teacher.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDirectoryTeacherId(teacher.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-[#7C3AED] ring-1 ring-[#7C3AED]'
                            : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {teacher.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                                {teacher.name}
                              </h5>
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {teacher.subject} · {teacher.level}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {teacher.country}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'border-slate-300 dark:border-slate-600 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Mode 2: Manual Email Input */
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Colleague Full Name
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Prof. Jane Doe"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Institutional Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="colleague@institution.edu"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Classroom Role & Permissions *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_ROLES.map(({ role, label, desc }) => {
                  const isSelected = selectedRole === role;
                  return (
                    <div
                      key={role}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-purple-50/80 dark:bg-purple-950/40 border-[#7C3AED] ring-1 ring-[#7C3AED]'
                          : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-[#1E1B4B] dark:text-slate-100">
                          {label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Personal Note */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Personal Invitation Note (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. Hi, please join me in co-teaching Advanced Physics this semester. You can review homework and lead weekly problem-solving recitations."
                rows={2}
                className="w-full p-3 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isLoading ? 'Sending Invitation...' : 'Send Co-Teacher Invitation'}</span>
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SENT INVITATIONS                                        */}
        {/* ============================================================== */}
        {activeTab === 'sent' && (
          <div className="space-y-3">
            {sentInvites.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Send className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                  No Invitations Sent for this Classroom
                </h4>
                <p className="text-xs text-slate-500">
                  Invitations you send to colleagues will appear here with live delivery and response tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                          {inv.recipientName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 font-extrabold text-[10px]">
                          {inv.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{inv.recipientEmail}</p>
                      <span className="text-[10px] text-slate-400">
                        Sent {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                          inv.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inv.status === 'declined'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>

                      {inv.status === 'pending' && (
                        <button
                          type="button"
                          disabled={actionLoadingId === inv.id}
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="px-2.5 py-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: RECEIVED INVITATIONS (ACCEPT / DECLINE)                 */}
        {/* ============================================================== */}
        {activeTab === 'received' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-900 dark:text-purple-200">
                Invitations sent to: <strong>{teacherEmail || 'Your Account'}</strong>
              </span>
              <span className="font-bold text-[#7C3AED] dark:text-purple-400">
                {pendingReceivedCount} Pending
              </span>
            </div>

            {receivedInvites.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Inbox className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                  No Received Invitations
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When other faculty members invite you to co-teach their courses, invitations will appear
                  here for 1-click acceptance.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {receivedInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider block">
                          Invited as {inv.role}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100">
                          {inv.classroomTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {inv.classroomSubject} · Course Code: <strong>{inv.classroomCode}</strong>
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Invited by: <strong>{inv.ownerName}</strong> ({inv.ownerEmail})
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                          inv.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>

                    {inv.message && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700/60">
                        "{inv.message}"
                      </div>
                    )}

                    {inv.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === inv.id}
                          onClick={() => handleDeclineInvite(inv.id)}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === inv.id}
                          onClick={() => handleAcceptInvite(inv.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                          <span>Accept & Join Classroom</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
