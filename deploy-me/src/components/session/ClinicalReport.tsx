import React, { useState } from 'react';
import { FileText, Save, History, CheckCircle, Shield, X, Download } from 'lucide-react';
import clsx from 'clsx';
import { SessionMetadata } from '../../hooks/useSessionMetadata';
import { useTranslation } from 'react-i18next';

interface ClinicalReportProps {
  metadata: SessionMetadata;
  onUpdate: (content: string) => void;
  onArchive: () => void;
  onClose: () => void;
}

export function ClinicalReport({ metadata, onUpdate, onArchive, onClose }: ClinicalReportProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Sync to Firestore
    onUpdate(metadata.liveReport);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-is border-white/5 font-body">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-linear-to-b from-zinc-900/50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-ur-primary/10 rounded-xl flex items-center justify-center border border-ur-primary/20">
            <FileText className="size-5 text-ur-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Clinical Report</h3>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mt-1">Live Intelligence Log</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
          <X className="size-6" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="size-3 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 italic">HIPAA Compliant Input</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {isSaving ? 'Syncing...' : 'Autosaved'}
          </div>
        </div>

        <textarea
          value={metadata.liveReport}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Start documenting the session observations, metrics, and progress here..."
          className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 text-sm text-zinc-300 placeholder:text-zinc-700 outline-none focus:ring-2 focus:ring-ur-primary/20 transition-all resize-none leading-relaxed custom-scrollbar font-medium"
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all group"
          >
            <Save className="size-4 text-zinc-500 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest">Update Draft</span>
          </button>
          <button 
            onClick={onArchive}
            disabled={metadata.isArchived}
            className={clsx(
              "flex items-center justify-center gap-3 py-4 rounded-2xl transition-all shadow-xl",
              metadata.isArchived 
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" 
                : "bg-ur-primary text-white hover:opacity-90 shadow-ur-primary/20"
            )}
          >
            {metadata.isArchived ? <CheckCircle className="size-4" /> : <History className="size-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {metadata.isArchived ? 'Archived' : 'Archive Report'}
            </span>
          </button>
        </div>
      </div>

      {/* Tools Footer */}
      <div className="p-8 border-t border-white/5 bg-black/40">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Expert Tools</h4>
        <div className="flex gap-4">
          <button className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
            <Download className="size-4 text-zinc-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Export PDF</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
            <Shield className="size-4 text-zinc-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Verify Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
}
