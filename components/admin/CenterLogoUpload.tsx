'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CenterLogoUploadProps {
  currentLogo?: string;
  onLogoUpdated: (logoUrl: string) => void;
}

export default function CenterLogoUpload({ currentLogo, onLogoUpdated }: CenterLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateFile = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const maxSize = 5 * 1024 * 1024;

    const hasValidMimeType = allowedTypes.includes(file.type);
    const hasValidExtension = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExtension);

    if (!hasValidMimeType && !hasValidExtension) {
      throw new Error('Logo must be a PNG, JPEG, or WebP image');
    }

    if (file.size <= 0 || file.size > maxSize) {
      throw new Error('Logo image must be 5 MB or smaller');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsUploading(true);
    setStatusMsg(null);

    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/center/logo', {
        method: 'POST',
        body: formData,
      });

      let uploadData: { error?: string; logoUrl?: string } | null = null;
      try {
        uploadData = await uploadRes.json();
      } catch {
        uploadData = null;
      }

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || 'Failed to upload center logo');
      }

      const uploadedUrl = uploadData?.logoUrl?.trim();
      if (typeof uploadedUrl !== 'string' || !uploadedUrl) {
        throw new Error('Logo URL missing from upload response');
      }

      onLogoUpdated(uploadedUrl);
      setStatusMsg({ type: 'success', text: 'Center Logo updated successfully!' });
    } catch (error: unknown) {
      console.error('Logo upload error:', error);
      setStatusMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0d121c] border border-white/[0.07] max-w-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white">Branch / Center Logo</h3>
        <p className="text-[11px] text-slate-400">Upload a PNG, JPEG, or WebP logo up to 5 MB. Students enrolled at your center will see it in their portal.</p>
      </div>

      {currentLogo ? (
        <div className="relative w-32 h-32 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center p-2 overflow-hidden">
          <img src={currentLogo} alt="Center Logo" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-32 h-32 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
          <span className="text-xs text-slate-500 font-medium">No Logo</span>
        </div>
      )}

      <div>
        <label className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
          ) : (
            <UploadCloud className="w-4 h-4 text-orange-400" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Upload New Logo'}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {statusMsg && (
        <div className={`p-2.5 rounded-xl text-[11px] flex items-center gap-1.5 font-medium ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}