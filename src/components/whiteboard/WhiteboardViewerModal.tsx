/**
 * SmartEducate Whiteboard Viewer Modal
 * Allows teachers and students to review saved multi-page whiteboard lecture notes
 * from the Study Material library in read-only mode with page switching and image export.
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { ClassroomStudyMaterial, StudyMaterialDownloadPermission } from '../../services/studyMaterialService';
import { Download, ChevronLeft, ChevronRight, FileText, Lock, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

interface WhiteboardViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: ClassroomStudyMaterial | null;
  isTeacher?: boolean;
  onPermissionChange?: (materialId: string, newPermission: StudyMaterialDownloadPermission) => void;
}

export const WhiteboardViewerModal: React.FC<WhiteboardViewerModalProps> = ({
  isOpen,
  onClose,
  material,
  isTeacher = false,
  onPermissionChange,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!isOpen || !material) return null;

  const pages = material.whiteboardData?.pages || [];
  const activePage = pages[currentPageIndex] || pages[0];
  const permission = material.downloadPermission || 'allow_download';

  const canDownload = isTeacher || permission === 'allow_download';
  const isDownloadDisabled = !isTeacher && permission === 'download_disabled';
  const isViewOnly = !isTeacher && permission === 'view_only';

  const handleDownloadSnapshot = () => {
    if (!canDownload) return;
    if (material.snapshotUrl) {
      const a = document.createElement('a');
      a.href = material.snapshotUrl;
      a.download = `${material.title.replace(/\s+/g, '_')}_notes.png`;
      a.click();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material.title}
      description={`Lecture Whiteboard Notes · ${pages.length} Pages`}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          {/* Left: Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPageIndex <= 0}
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {currentPageIndex + 1} of {Math.max(1, pages.length)}
            </span>
            <button
              type="button"
              disabled={currentPageIndex >= pages.length - 1}
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Download & Close Actions */}
          <div className="flex items-center gap-2">
            {/* View Only Indicator for Students */}
            {isViewOnly && (
              <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold flex items-center gap-1.5 border border-sky-200">
                <Eye className="w-3.5 h-3.5" />
                <span>View Only (Download Restricted)</span>
              </span>
            )}

            {/* Download Disabled Button for Students */}
            {isDownloadDisabled && (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold flex items-center gap-1.5 border border-amber-200 opacity-60 cursor-not-allowed"
                title="Downloading has been disabled by the instructor"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Download Disabled</span>
              </button>
            )}

            {/* Enabled Download Button for Teachers or Allowed Students */}
            {canDownload && material.snapshotUrl && (
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-purple-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Notes</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Permission & Status Banner */}
        <div className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs bg-[#FAF8FE] border-[#EDE8F5]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E1B4B]">Access Permission:</span>
            {permission === 'allow_download' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                Allow Download
              </span>
            )}
            {permission === 'view_only' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]">
                <Eye className="w-3 h-3" />
                View Only
              </span>
            )}
            {permission === 'download_disabled' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                <Lock className="w-3 h-3" />
                Download Disabled
              </span>
            )}
          </div>

          {/* Teacher Permission Switcher */}
          {isTeacher && onPermissionChange && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold px-1.5">Change:</span>
              {(['view_only', 'allow_download', 'download_disabled'] as StudyMaterialDownloadPermission[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPermissionChange(material.id, p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      permission === p
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p === 'view_only' && 'View Only'}
                    {p === 'allow_download' && 'Allow Download'}
                    {p === 'download_disabled' && 'Disabled'}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Page title strip */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="font-bold text-[#1E1B4B]">
            {activePage?.title || `Page ${currentPageIndex + 1}`}
          </span>
          <span className="text-slate-400">
            {activePage?.elements.length || 0} drawing elements
          </span>
        </div>

        {/* Canvas Display */}
        <div className="w-full h-[440px] rounded-2xl overflow-hidden border border-[#EDE8F5]">
          {activePage ? (
            <WhiteboardCanvas
              elements={activePage.elements}
              recognizedBlocks={activePage.recognizedBlocks || []}
              presentationSettings={material.whiteboardData?.presentationSettings}
              currentTool="pen"
              currentColor="#1E1B4B"
              strokeWidth={4}
              isReadOnly={true}
              className="h-full"
            />
          ) : material.snapshotUrl ? (
            <img
              src={material.snapshotUrl}
              alt={material.title}
              className="w-full h-full object-contain bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <FileText className="w-8 h-8" />
              <span>No drawings found on this page</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
