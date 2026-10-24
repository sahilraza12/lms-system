'use client';

import { useState } from 'react';
import { UploadCloud, GitBranch, Globe, X, File as FileIcon, Trash2, Send } from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  githubLink?: string;
  liveLink?: string;
  fileNames?: string[];
  remarks?: string;
}

interface Props {
  task: TaskItem;
  onClose: () => void;
  onSubmit: (data: { githubUrl: string; liveUrl: string; files: string[]; remarks: string }) => void;
}

export default function TaskSubmissionModal({ task, onClose, onSubmit }: Props) {
  const [githubUrl, setGithubUrl] = useState(task.githubLink || '');
  const [liveUrl, setLiveUrl] = useState(task.liveLink || '');
  const [remarks, setRemarks] = useState(task.remarks || '');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSubmit({
      githubUrl,
      liveUrl,
      files: files.map((f) => f.name),
      remarks,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="viq-card bg-[var(--bg-primary)] max-w-lg w-full p-6 space-y-5 border border-[var(--border-color)]">
        <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-3">
          <div>
            <span className="text-orange-500 font-mono text-[11px] font-bold uppercase flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> Lab Submission
            </span>
            <h3 className="text-sm sm:text-base font-bold mt-1 line-clamp-1">{task.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-mono uppercase viq-text-muted font-bold block mb-1">GitHub Repo</label>
            <div className="relative">
              <GitBranch className="w-4 h-4 text-orange-500 absolute left-3 top-2.5" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="viq-input w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-mono uppercase viq-text-muted font-bold block mb-1">Live Demo / Drive URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-cyan-500 absolute left-3 top-2.5" />
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://deployed-app.com"
                className="viq-input w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-mono uppercase viq-text-muted font-bold block mb-1">Upload Files</label>
            <label className="viq-input w-full p-3 text-center flex flex-col items-center justify-center border-dashed border-2 cursor-pointer">
              <UploadCloud className="w-5 h-5 text-orange-500 mb-1" />
              <span className="font-medium">Attach files (PDF, ZIP, Images)</span>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {files.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 rounded bg-[var(--bg-secondary)] text-[11px]">
                  <span className="truncate flex items-center gap-1.5">
                    <FileIcon className="w-3 h-3 text-emerald-500 shrink-0" /> {f.name}
                  </span>
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="font-mono uppercase viq-text-muted font-bold block mb-1">Remarks (Optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Credentials or deployment notes..."
              className="viq-input w-full p-2.5 text-xs resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 viq-pill font-bold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 viq-btn-primary font-bold flex items-center justify-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}