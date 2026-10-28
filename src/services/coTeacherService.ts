/**
 * SmartEducate Canonical Co-Teacher Service
 * Manages co-teacher invitations, roles (Co-Lecturer, TA, etc.),
 * classroom membership, and real-time synchronization with Firestore and local persistence.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { GlobalClassroom } from '../types/education';

export type CoTeacherRole =
  | 'Co-Lecturer'
  | 'Teaching Assistant'
  | 'Assessment Reviewer'
  | 'Lab Instructor';

export interface CoTeacherMember {
  id: string; // Teacher UID
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  classroomId: string;
  classroomTitle: string;
  classroomCode: string;
  role: CoTeacherRole;
  status: 'active';
  joinedAt: string;
  invitedBy: string; // Classroom owner UID
}

export interface CoTeacherInvitation {
  id: string;
  classroomId: string;
  classroomTitle: string;
  classroomSubject: string;
  classroomCode: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  recipientEmail: string;
  recipientTeacherId?: string;
  recipientName: string;
  role: CoTeacherRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

const INVITATIONS_STORAGE_KEY = 'smarteducate_coteacher_invitations';
const COTEACHERS_STORAGE_PREFIX = 'smarteducate_coteachers_';

function getLocalInvitations(): CoTeacherInvitation[] {
  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalInvitations(invites: CoTeacherInvitation[]): void {
  try {
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invites));
  } catch (e) {
    // ignore
  }
}

function getLocalCoTeachers(classroomId: string): CoTeacherMember[] {
  try {
    const raw = localStorage.getItem(COTEACHERS_STORAGE_PREFIX + classroomId);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCoTeachers(classroomId: string, members: CoTeacherMember[]): void {
  try {
    localStorage.setItem(COTEACHERS_STORAGE_PREFIX + classroomId, JSON.stringify(members));
  } catch (e) {
    // ignore
  }
}

export const coTeacherService = {
  /**
   * Fetch all active co-teachers for a specific classroom
   */
  async getClassroomCoTeachers(classroomId: string): Promise<CoTeacherMember[]> {
    if (!classroomId) return [];
    try {
      const q = collection(db, 'classrooms', classroomId, 'coTeachers');
      const snap = await getDocs(q);
      const members: CoTeacherMember[] = snap.docs.map((d) => d.data() as CoTeacherMember);

      // Save to local cache
      saveLocalCoTeachers(classroomId, members);
      return members;
    } catch (err) {
      console.warn('Falling back to local storage for co-teachers of', classroomId, err);
      return getLocalCoTeachers(classroomId);
    }
  },

  /**
   * Fetch sent invitations for a classroom created by this owner
   */
  async getSentInvitations(classroomId: string, ownerId: string): Promise<CoTeacherInvitation[]> {
    if (!classroomId) return [];
    try {
      const q = query(
        collection(db, 'coTeacherInvitations'),
        where('classroomId', '==', classroomId)
      );
      const snap = await getDocs(q);
      const fromFirestore: CoTeacherInvitation[] = snap.docs.map((d) => d.data() as CoTeacherInvitation);

      // Merge with local storage in case of offline additions
      const local = getLocalInvitations().filter((i) => i.classroomId === classroomId);
      const mergedMap = new Map<string, CoTeacherInvitation>();
      local.forEach((inv) => mergedMap.set(inv.id, inv));
      fromFirestore.forEach((inv) => mergedMap.set(inv.id, inv));

      const merged = Array.from(mergedMap.values());
      saveLocalInvitations(merged);
      return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Falling back to local storage for sent invitations:', err);
      return getLocalInvitations().filter((i) => i.classroomId === classroomId);
    }
  },

  /**
   * Fetch invitations received by a specific teacher email or UID
   */
  async getReceivedInvitations(email: string, teacherUid?: string): Promise<CoTeacherInvitation[]> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail && !teacherUid) return [];

    try {
      const invCol = collection(db, 'coTeacherInvitations');
      const resultsMap = new Map<string, CoTeacherInvitation>();

      if (cleanEmail) {
        const qEmail = query(invCol, where('recipientEmail', '==', cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => resultsMap.set(d.id, d.data() as CoTeacherInvitation));
      }

      if (teacherUid) {
        const qUid = query(invCol, where('recipientTeacherId', '==', teacherUid));
        const snapUid = await getDocs(qUid);
        snapUid.docs.forEach((d) => resultsMap.set(d.id, d.data() as CoTeacherInvitation));
      }

      // Merge with local storage
      const local = getLocalInvitations().filter(
        (i) =>
          (cleanEmail && i.recipientEmail.toLowerCase() === cleanEmail) ||
          (teacherUid && i.recipientTeacherId === teacherUid)
      );
      local.forEach((inv) => {
        if (!resultsMap.has(inv.id)) {
          resultsMap.set(inv.id, inv);
        }
      });

      return Array.from(resultsMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.warn('Falling back to local storage for received invitations:', err);
      return getLocalInvitations().filter(
        (i) =>
          (cleanEmail && i.recipientEmail.toLowerCase() === cleanEmail) ||
          (teacherUid && i.recipientTeacherId === teacherUid)
      );
    }
  },

  /**
   * Send a new co-teacher invitation
   */
  async sendInvitation(params: {
    classroom: GlobalClassroom;
    inviter: { uid: string; name: string; email: string };
    recipient: { email: string; name?: string; teacherId?: string };
    role: CoTeacherRole;
    message?: string;
  }): Promise<{ success: boolean; message: string; invitation?: CoTeacherInvitation }> {
    const cleanEmail = params.recipient.email.trim().toLowerCase();
    const cleanInviterEmail = params.inviter.email.trim().toLowerCase();

    // 1. Email validation
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Please provide a valid educator email address.' };
    }

    // 2. Prevent self-invitation
    if (
      cleanEmail === cleanInviterEmail ||
      (params.recipient.teacherId && params.recipient.teacherId === params.inviter.uid)
    ) {
      return { success: false, message: 'You cannot invite yourself as a co-teacher to your own classroom.' };
    }

    // 3. Prevent duplicate active co-teachers
    const currentMembers = await this.getClassroomCoTeachers(params.classroom.id);
    const alreadyMember = currentMembers.some(
      (m) =>
        m.teacherEmail.toLowerCase() === cleanEmail ||
        (params.recipient.teacherId && m.teacherId === params.recipient.teacherId)
    );
    if (alreadyMember) {
      return {
        success: false,
        message: `${params.recipient.name || cleanEmail} is already an active co-teacher in this classroom.`,
      };
    }

    // 4. Prevent duplicate pending invitations
    const existingInvites = await this.getSentInvitations(params.classroom.id, params.inviter.uid);
    const hasPending = existingInvites.some(
      (i) => i.recipientEmail.toLowerCase() === cleanEmail && i.status === 'pending'
    );
    if (hasPending) {
      return {
        success: false,
        message: `A pending invitation has already been sent to ${cleanEmail}. Please await their response or cancel the existing invitation first.`,
      };
    }

    // 5. Construct canonical invitation document
    const safeClassroomId = params.classroom.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeEmail = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const inviteId = `inv_${safeClassroomId}_${safeEmail}_${Date.now().toString(36)}`;

    const newInvitation: CoTeacherInvitation = {
      id: inviteId,
      classroomId: params.classroom.id,
      classroomTitle: params.classroom.title,
      classroomSubject: params.classroom.subject || 'General Education',
      classroomCode: params.classroom.code,
      ownerId: params.inviter.uid,
      ownerName: params.inviter.name || 'Classroom Instructor',
      ownerEmail: cleanInviterEmail,
      recipientEmail: cleanEmail,
      recipientTeacherId: params.recipient.teacherId,
      recipientName: params.recipient.name || cleanEmail.split('@')[0],
      role: params.role,
      message: params.message?.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      const inviteRef = doc(db, 'coTeacherInvitations', inviteId);
      await setDoc(inviteRef, newInvitation);
    } catch (err) {
      console.warn('Could not write invitation to Firestore directly, saving to local store:', err);
    }

    // Update local cache
    const allLocal = getLocalInvitations().filter((i) => i.id !== inviteId);
    allLocal.unshift(newInvitation);
    saveLocalInvitations(allLocal);

    return {
      success: true,
      message: `Invitation successfully sent to ${newInvitation.recipientName} (${cleanEmail}) as ${params.role}!`,
      invitation: newInvitation,
    };
  },

  /**
   * Accept an invitation as the recipient teacher
   */
  async acceptInvitation(
    invitationId: string,
    acceptingTeacher: { uid: string; name: string; email: string }
  ): Promise<{ success: boolean; message: string; classroomId?: string }> {
    const cleanTeacherEmail = (acceptingTeacher.email || '').trim().toLowerCase();
    let invitation: CoTeacherInvitation | null = null;

    // Try reading from Firestore
    try {
      const invRef = doc(db, 'coTeacherInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (snap.exists()) {
        invitation = snap.data() as CoTeacherInvitation;
      }
    } catch (e) {
      console.warn('Could not read invitation from Firestore:', e);
    }

    // Fallback to local
    if (!invitation) {
      const local = getLocalInvitations();
      invitation = local.find((i) => i.id === invitationId) || null;
    }

    if (!invitation) {
      return { success: false, message: 'Invitation not found.' };
    }

    if (invitation.status !== 'pending') {
      return {
        success: false,
        message: `This invitation is no longer pending (current status: ${invitation.status}).`,
      };
    }

    // Verify authorized recipient
    const matchesEmail = invitation.recipientEmail.toLowerCase() === cleanTeacherEmail;
    const matchesId = invitation.recipientTeacherId && invitation.recipientTeacherId === acceptingTeacher.uid;
    if (!matchesEmail && !matchesId) {
      return {
        success: false,
        message: 'You are not authorized to accept this invitation. The recipient email does not match your account.',
      };
    }

    const updatedInvitation: CoTeacherInvitation = {
      ...invitation,
      status: 'accepted',
      updatedAt: new Date().toISOString(),
    };

    // Member record
    const memberRecord: CoTeacherMember = {
      id: acceptingTeacher.uid,
      teacherId: acceptingTeacher.uid,
      teacherName: acceptingTeacher.name || cleanTeacherEmail.split('@')[0],
      teacherEmail: cleanTeacherEmail,
      classroomId: invitation.classroomId,
      classroomTitle: invitation.classroomTitle,
      classroomCode: invitation.classroomCode,
      role: invitation.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: invitation.ownerId,
    };

    // 1. Update invitation document in Firestore
    try {
      const invRef = doc(db, 'coTeacherInvitations', invitationId);
      await updateDoc(invRef, {
        status: 'accepted',
        updatedAt: updatedInvitation.updatedAt,
      });
    } catch (err) {
      console.warn('Could not update invitation doc in Firestore:', err);
    }

    // 2. Add to classroom's coTeachers subcollection
    try {
      const memberRef = doc(db, 'classrooms', invitation.classroomId, 'coTeachers', acceptingTeacher.uid);
      await setDoc(memberRef, memberRecord);
    } catch (err) {
      console.warn('Could not write coTeacher member to Firestore:', err);
    }

    // 3. Update classroom parent document with coTeacherIds
    try {
      const classroomRef = doc(db, 'classrooms', invitation.classroomId);
      await updateDoc(classroomRef, {
        coTeacherIds: arrayUnion(acceptingTeacher.uid),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not update coTeacherIds in classroom document:', err);
    }

    // 4. Update local storage
    const allInv = getLocalInvitations().map((i) => (i.id === invitationId ? updatedInvitation : i));
    saveLocalInvitations(allInv);

    const classroomMembers = getLocalCoTeachers(invitation.classroomId).filter(
      (m) => m.teacherId !== acceptingTeacher.uid
    );
    classroomMembers.push(memberRecord);
    saveLocalCoTeachers(invitation.classroomId, classroomMembers);

    return {
      success: true,
      message: `You have successfully joined "${invitation.classroomTitle}" as ${invitation.role}!`,
      classroomId: invitation.classroomId,
    };
  },

  /**
   * Decline an invitation as the recipient
   */
  async declineInvitation(
    invitationId: string,
    teacherEmail: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (teacherEmail || '').trim().toLowerCase();

    try {
      const invRef = doc(db, 'coTeacherInvitations', invitationId);
      await updateDoc(invRef, {
        status: 'declined',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not update declined invitation in Firestore:', err);
    }

    // Update local storage
    const allInv = getLocalInvitations().map((i) =>
      i.id === invitationId ? { ...i, status: 'declined' as const, updatedAt: new Date().toISOString() } : i
    );
    saveLocalInvitations(allInv);

    return { success: true, message: 'Invitation declined.' };
  },

  /**
   * Revoke an invitation by the classroom owner
   */
  async revokeInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const invRef = doc(db, 'coTeacherInvitations', invitationId);
      await updateDoc(invRef, {
        status: 'revoked',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not update revoked invitation in Firestore:', err);
    }

    // Update local storage
    const allInv = getLocalInvitations().map((i) =>
      i.id === invitationId ? { ...i, status: 'revoked' as const, updatedAt: new Date().toISOString() } : i
    );
    saveLocalInvitations(allInv);

    return { success: true, message: 'Invitation cancelled.' };
  },

  /**
   * Remove an active co-teacher from the classroom (by owner or co-teacher leaving)
   */
  async removeCoTeacher(
    classroomId: string,
    teacherUid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const memberRef = doc(db, 'classrooms', classroomId, 'coTeachers', teacherUid);
      await deleteDoc(memberRef);

      const classroomRef = doc(db, 'classrooms', classroomId);
      await updateDoc(classroomRef, {
        coTeacherIds: arrayRemove(teacherUid),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not remove co-teacher from Firestore:', err);
    }

    // Update local storage
    const updated = getLocalCoTeachers(classroomId).filter((m) => m.teacherId !== teacherUid);
    saveLocalCoTeachers(classroomId, updated);

    return { success: true, message: 'Co-teacher removed successfully.' };
  },

  /**
   * Synchronize active co-teachers count and pending count for dashboard badges
   */
  async getCoTeacherCounts(
    classroomId: string,
    teacherEmail: string,
    teacherUid: string
  ): Promise<{ coTeachersCount: number; pendingInvites: number; receivedPendingCount: number }> {
    let coTeachersCount = 0;
    let pendingSent = 0;
    let receivedPendingCount = 0;

    if (classroomId) {
      const members = await this.getClassroomCoTeachers(classroomId);
      coTeachersCount = members.length;

      const sent = await this.getSentInvitations(classroomId, teacherUid);
      pendingSent = sent.filter((i) => i.status === 'pending').length;
    }

    if (teacherEmail || teacherUid) {
      const received = await this.getReceivedInvitations(teacherEmail, teacherUid);
      receivedPendingCount = received.filter((i) => i.status === 'pending').length;
    }

    const pendingInvites = pendingSent + receivedPendingCount;

    return {
      coTeachersCount,
      pendingInvites,
      receivedPendingCount,
    };
  },

  /**
   * Real-time subscription to active co-teachers of a classroom
   */
  subscribeCoTeachers(classroomId: string, callback: (members: CoTeacherMember[]) => void): () => void {
    if (!classroomId) {
      callback([]);
      return () => {};
    }

    try {
      const q = collection(db, 'classrooms', classroomId, 'coTeachers');
      const unsub = onSnapshot(
        q,
        (snap) => {
          const members = snap.docs.map((d) => d.data() as CoTeacherMember);
          saveLocalCoTeachers(classroomId, members);
          callback(members);
        },
        (err) => {
          console.warn('Real-time coTeachers subscription error, falling back to local:', err);
          callback(getLocalCoTeachers(classroomId));
        }
      );
      return unsub;
    } catch (e) {
      callback(getLocalCoTeachers(classroomId));
      return () => {};
    }
  },

  /**
   * Real-time subscription to invitations received by a teacher
   */
  subscribeReceivedInvitations(
    email: string,
    callback: (invitations: CoTeacherInvitation[]) => void
  ): () => void {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'coTeacherInvitations'),
        where('recipientEmail', '==', cleanEmail)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => d.data() as CoTeacherInvitation);
          callback(items);
        },
        (err) => {
          console.warn('Real-time received invitations error:', err);
          const local = getLocalInvitations().filter((i) => i.recipientEmail.toLowerCase() === cleanEmail);
          callback(local);
        }
      );
      return unsub;
    } catch (e) {
      const local = getLocalInvitations().filter((i) => i.recipientEmail.toLowerCase() === cleanEmail);
      callback(local);
      return () => {};
    }
  },
};
