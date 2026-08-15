"use client";

import { useRef, useCallback, useState } from "react";
import { UploadCloud, File as FileIcon, Image as ImageIcon, FileText, Trash2, Eye, Download, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreationFileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function CreationFileUploader({
  files = [],
  onFilesChange,
  maxFiles = 5,
}: CreationFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Filter by size (10MB)
    const validFiles = selectedFiles.filter(f => f.size <= 10 * 1024 * 1024);
    
    const newFiles = [...files, ...validFiles].slice(0, maxFiles);
    onFilesChange(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-[var(--color-turbo)]" />;
    if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-rose-400" />;
    return <FileIcon className="w-4 h-4 text-[var(--color-electric-violet)]" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div 
        className="relative rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center transition-all duration-300 hover:bg-white/[0.04] hover:border-[var(--color-electric-violet)]/60 hover:shadow-[0_0_20px_rgba(131,77,251,0.15)] group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,.xlsx"
        />
        <div className="flex flex-col items-center justify-center gap-3 relative z-0 pointer-events-none">
          <div className="p-3 rounded-2xl bg-[var(--color-electric-violet)]/10 border border-[var(--color-electric-violet)]/30 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <UploadCloud className="w-6 h-6 text-[var(--color-electric-violet)] group-hover:animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-white tracking-wide">
              Déposez vos documents ici
            </h3>
            <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-1">
              PDF, JPG, PNG (Max 10 Mo)
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[9px] font-accent font-bold uppercase tracking-widest text-white/60">
            <span className={`h-1.5 w-1.5 rounded-full ${files.length >= maxFiles ? 'bg-rose-500' : 'bg-[var(--color-turbo)] animate-pulse'}`} />
            {files.length}/{maxFiles} Fichiers
          </span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl glass-panel border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all overflow-hidden group/file cursor-pointer"
                onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name, type: file.type })}
              >
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate pr-2 group-hover/file:text-[var(--color-electric-violet)] transition-colors" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[9px] font-accent uppercase tracking-widest text-white/40 mt-0.5">
                    {formatSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile({ url: URL.createObjectURL(file), name: file.name, type: file.type }); }}
                    className="p-2 text-white/40 hover:text-[var(--color-electric-violet)] bg-black/20 hover:bg-[var(--color-electric-violet)]/10 rounded-lg transition-all"
                    title="Voir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx); }}
                    className="p-2 text-white/40 hover:text-rose-400 bg-black/20 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Retirer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* File Preview Lightbox */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[85vh] mx-4 glass-panel overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02] shrink-0">
                <div>
                  <h3 className="text-sm font-heading font-bold text-white truncate max-w-md">{previewFile.name}</h3>
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-0.5">{previewFile.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white/70 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                  </a>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(null); }}
                    className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
                {previewFile.url && (previewFile.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || previewFile.type?.toLowerCase().includes("image")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl"
                  />
                ) : previewFile.url?.match(/\.pdf$/i) || previewFile.type?.toLowerCase().includes("pdf") ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[70vh] rounded-xl border border-white/10"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                      <FileText className="h-10 w-10 text-white/20" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Aperçu non disponible</p>
                      <p className="text-xs text-white/40 mt-1">Ce type de fichier ne peut pas être prévisualisé en ligne.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
