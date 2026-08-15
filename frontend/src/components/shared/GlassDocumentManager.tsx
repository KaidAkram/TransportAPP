"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, File, Image as ImageIcon, FileText, Download, Trash2, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { DocumentResponse } from "@/types/document";

interface GlassDocumentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
}

export function GlassDocumentManager({
  entityType,
  entityId,
  title = "Documents & Fichiers",
  subtitle = "Gérez les pièces jointes associées",
}: GlassDocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/entities/${entityType}/${entityId}/documents`);
      setDocuments((res.data as any).items || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des documents", err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);
    formData.append("entity_id", entityId);
    formData.append("document_type", "Autre"); // Default

    try {
      // Configure axios to send FormData properly
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Une erreur est survenue lors du téléchargement.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    
    try {
      await api.delete(`/documents/${docId}`);
      fetchDocuments();
    } catch (err: any) {
      setError("Impossible de supprimer le document.");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="glass-panel p-6 border-white/5 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-1">{subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          uploading ? "border-white/20 bg-white/5" : "border-white/10 hover:border-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/5"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,.xlsx"
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className={`p-4 rounded-full ${uploading ? 'bg-[var(--color-electric-violet)]/20 animate-pulse' : 'bg-white/5'}`}>
            <UploadCloud className={`w-8 h-8 ${uploading ? 'text-[var(--color-electric-violet)]' : 'text-white/40'}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">
              {uploading ? "Téléchargement en cours..." : "Cliquez ou glissez un fichier ici"}
            </p>
            <p className="text-[10px] font-accent uppercase tracking-widest text-white/40">
              PDF, JPG, PNG, DOCX, XLSX (Max 10 Mo)
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-electric-violet)] border-t-transparent animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-6 border border-white/5 rounded-xl bg-black/20">
            <p className="text-xs text-white/40 font-accent uppercase tracking-widest">Aucun document attaché</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                    {getFileIcon(doc.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate pr-6" title={doc.nom}>
                      {doc.nom}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-accent uppercase tracking-widest text-white/40">
                        {doc.size_formatted}
                      </span>
                      <span className="text-[9px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)]">
                        {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <a
                      href={API_BASE_URL.replace('/api/v1', '') + doc.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-white/40 hover:text-white bg-black/40 hover:bg-black/60 rounded-md transition-colors"
                      title="Télécharger"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(doc.id); }}
                      className="p-1.5 text-white/40 hover:text-red-400 bg-black/40 hover:bg-red-500/20 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
