/**
 * SmartEducate Study Material Management Service
 * Provides centralized storage and retrieval of classroom study materials,
 * notes, slides, and saved whiteboard lecture sessions.
 */

import { WhiteboardSession } from '../types/whiteboard';

export type StudyMaterialDownloadPermission = 'view_only' | 'allow_download' | 'download_disabled';

export interface ClassroomLectureRecording {
  id: string;
  classroomId: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds: number;
  instructor: string;
  audioUrl?: string; // Data URL containing the real recorded human voice
  mimeType?: string;
  downloadPermission: StudyMaterialDownloadPermission;
  createdAt: string;
}

export interface ClassroomStudyMaterial {
  id: string;
  classroomId: string;
  title: string;
  type: string;
  size: string;
  downloads: string;
  createdAt: string;
  downloadPermission: StudyMaterialDownloadPermission;
  isWhiteboard?: boolean;
  whiteboardData?: WhiteboardSession;
  snapshotUrl?: string;
  pageCount?: number;
  contentPreview?: string;
}

const STORAGE_KEY_PREFIX = 'smarteducate_study_materials_';

const DEFAULT_MATERIALS: Array<Omit<ClassroomStudyMaterial, 'id' | 'classroomId' | 'createdAt'>> = [
  {
    title: 'Chapter 2: Vector Spaces, Norms & Orthogonality',
    type: 'PDF Document',
    size: '3.4 MB',
    downloads: '24 student downloads',
    downloadPermission: 'allow_download',
    contentPreview:
      'Rigorous foundational notes on linear algebra covering vector spaces, inner product spaces, Cauchy-Schwarz inequality, Gram-Schmidt orthogonalization, and orthonormal projections.',
  },
  {
    title: 'Lecture 4 Slides: Matrices & Linear Systems',
    type: 'Presentation Slides',
    size: '5.8 MB',
    downloads: '21 student downloads',
    downloadPermission: 'view_only',
    contentPreview:
      'Instructor slide deck covering Gaussian elimination, matrix factorizations (LU & QR decomposition), row echelon forms, and computational complexity of solving system Ax = b.',
  },
  {
    title: 'Practice Problem Set 1 (Exercises & Solutions)',
    type: 'Course Workbook',
    size: '1.9 MB',
    downloads: '28 student downloads',
    downloadPermission: 'download_disabled',
    contentPreview:
      '15 curated problem sets with step-by-step mathematical reasoning, proofs, eigenvalue calculations, and classroom discussion questions.',
  },
];

class StudyMaterialService {
  /**
   * Retrieves all study materials for a classroom, normalizing download permissions
   */
  public getMaterials(classroomId: string): ClassroomStudyMaterial[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${classroomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize existing records with default permission if missing
          return parsed.map((item) => ({
            ...item,
            downloadPermission: item.downloadPermission || 'allow_download',
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to read study materials from storage:', e);
    }

    // Initialize with default classroom materials
    const initialized: ClassroomStudyMaterial[] = DEFAULT_MATERIALS.map((item, index) => ({
      ...item,
      id: `default_${classroomId}_${index + 1}`,
      classroomId,
      createdAt: new Date(Date.now() - (3 - index) * 86400000).toISOString(),
    }));

    this.saveMaterials(classroomId, initialized);
    return initialized;
  }

  /**
   * Saves materials to localStorage
   */
  public saveMaterials(classroomId: string, materials: ClassroomStudyMaterial[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${classroomId}`, JSON.stringify(materials));
    } catch (e) {
      console.warn('Failed to save study materials to storage:', e);
    }
  }

  /**
   * Updates download permission for a specific classroom material
   */
  public updateMaterialPermission(
    classroomId: string,
    materialId: string,
    permission: StudyMaterialDownloadPermission
  ): ClassroomStudyMaterial[] {
    const materials = this.getMaterials(classroomId);
    const updated = materials.map((m) =>
      m.id === materialId ? { ...m, downloadPermission: permission } : m
    );
    this.saveMaterials(classroomId, updated);
    return updated;
  }

  /**
   * Adds a newly uploaded study material with instructor-selected download permission
   */
  public addMaterial(
    classroomId: string,
    data: {
      title: string;
      type: string;
      size?: string;
      downloadPermission: StudyMaterialDownloadPermission;
      contentPreview?: string;
    }
  ): ClassroomStudyMaterial {
    const existing = this.getMaterials(classroomId);
    const newMaterial: ClassroomStudyMaterial = {
      id: `mat_${Date.now()}`,
      classroomId,
      title: data.title,
      type: data.type,
      size: data.size || '2.4 MB',
      downloads: '0 student downloads',
      createdAt: new Date().toISOString(),
      downloadPermission: data.downloadPermission,
      contentPreview: data.contentPreview || 'Instructor study resource shared with classroom.',
    };

    const updated = [newMaterial, ...existing];
    this.saveMaterials(classroomId, updated);
    return newMaterial;
  }

  /**
   * Saves and shares a live whiteboard session into classroom study materials with permission control
   */
  public saveWhiteboardAsMaterial(
    classroomId: string,
    session: WhiteboardSession,
    snapshotUrl?: string,
    customTitle?: string,
    downloadPermission: StudyMaterialDownloadPermission = 'allow_download'
  ): ClassroomStudyMaterial {
    const existing = this.getMaterials(classroomId);
    const dateFormatted = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const title =
      customTitle ||
      `Live Class Whiteboard Notes — ${session.classroomTitle || 'Class'} (${dateFormatted})`;

    const newMaterial: ClassroomStudyMaterial = {
      id: `wb_mat_${Date.now()}`,
      classroomId,
      title,
      type: 'Whiteboard Notes',
      size: `${Math.max(1, session.pages.length * 0.4).toFixed(1)} MB`,
      downloads: 'Shared with Classroom',
      createdAt: new Date().toISOString(),
      downloadPermission,
      isWhiteboard: true,
      whiteboardData: session,
      snapshotUrl,
      pageCount: session.pages.length,
      contentPreview: `Digital whiteboard lecture notes containing ${session.pages.length} interactive canvas slide(s) authored during live session.`,
    };

    // Prepend to materials list so it appears at top
    const updated = [newMaterial, ...existing];
    this.saveMaterials(classroomId, updated);
    return newMaterial;
  }

  /**
   * Retrieves all archived lecture recordings for a classroom
   */
  public getRecordings(classroomId: string, instructorName?: string): ClassroomLectureRecording[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`smarteducate_recordings_${classroomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read recordings from storage:', e);
    }

    // Default lecture recordings
    const defaults: ClassroomLectureRecording[] = [
      {
        id: `rec_${classroomId}_1`,
        classroomId,
        title: 'Lecture 08: Eigenvalues, Eigenvectors & Diagonalization',
        date: 'Recorded 2 days ago',
        duration: '52 min',
        durationSeconds: 3120,
        instructor: instructorName || 'Prof. Marcus Vance',
        downloadPermission: 'allow_download',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: `rec_${classroomId}_2`,
        classroomId,
        title: 'Lecture 07: Inner Product Spaces & Gram-Schmidt Process',
        date: 'Recorded 5 days ago',
        duration: '47 min',
        durationSeconds: 2820,
        instructor: instructorName || 'Prof. Marcus Vance',
        downloadPermission: 'view_only',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
      },
      {
        id: `rec_${classroomId}_3`,
        classroomId,
        title: 'Lecture 06: Vector Subspaces & Basis Theorems',
        date: 'Recorded Sep 25',
        duration: '55 min',
        durationSeconds: 3300,
        instructor: instructorName || 'Prof. Marcus Vance',
        downloadPermission: 'download_disabled',
        createdAt: new Date(Date.now() - 604800000).toISOString(),
      },
    ];

    this.saveRecordings(classroomId, defaults);
    return defaults;
  }

  public saveRecordings(classroomId: string, recordings: ClassroomLectureRecording[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`smarteducate_recordings_${classroomId}`, JSON.stringify(recordings));
    } catch (e) {
      console.warn('Failed to save recordings to storage:', e);
    }
  }

  public addRecording(
    classroomId: string,
    data: {
      title: string;
      durationSeconds: number;
      instructor: string;
      audioUrl: string;
      mimeType?: string;
      downloadPermission?: StudyMaterialDownloadPermission;
    }
  ): ClassroomLectureRecording {
    const existing = this.getRecordings(classroomId, data.instructor);
    const m = Math.floor(data.durationSeconds / 60);
    const s = Math.floor(data.durationSeconds % 60);
    const durationFormatted = m > 0 ? `${m}m ${s < 10 ? '0' : ''}${s}s` : `${s}s`;

    const newRec: ClassroomLectureRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classroomId,
      title: data.title,
      date: 'Just now',
      duration: durationFormatted,
      durationSeconds: data.durationSeconds,
      instructor: data.instructor,
      audioUrl: data.audioUrl,
      mimeType: data.mimeType || 'audio/webm',
      downloadPermission: data.downloadPermission || 'allow_download',
      createdAt: new Date().toISOString(),
    };

    const updated = [newRec, ...existing];
    this.saveRecordings(classroomId, updated);

    // Also sync to Study Material so it appears in the study material library
    this.addMaterial(classroomId, {
      title: `${data.title} (Audio Recording)`,
      type: 'Audio Lecture Recording',
      size: `${Math.max(0.2, +(data.durationSeconds * 0.04).toFixed(1))} MB`,
      downloadPermission: data.downloadPermission || 'allow_download',
      contentPreview: `Live recorded classroom audio (${durationFormatted}) by ${data.instructor}.`,
    });

    return newRec;
  }

  public updateRecordingPermission(
    classroomId: string,
    recordingId: string,
    permission: StudyMaterialDownloadPermission
  ): ClassroomLectureRecording[] {
    const existing = this.getRecordings(classroomId);
    const updated = existing.map((r) =>
      r.id === recordingId ? { ...r, downloadPermission: permission } : r
    );
    this.saveRecordings(classroomId, updated);
    return updated;
  }
}

export const studyMaterialService = new StudyMaterialService();
