import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Lock, Send, Trash2, Mic, Video, Eye, EyeOff, 
  UserCheck, Clock, ShieldCheck, ChevronRight, 
  Search, Filter, Activity, Sparkles, Calendar,
  MoreVertical, Share2, Download, Shield, Play, Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GlassButton } from '../components/GlassButton';
import { motion, AnimatePresence } from 'framer-motion';
// import { saveAs } from 'file-saver';
import clsx from 'clsx';

interface SecretVaultProps {
  user: any;
  userData: any;
}

export function SecretVault({ user, userData }: SecretVaultProps) {
  const [activeTab, setActiveTab] = useState<'voice' | 'video'>('voice');
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [videoRecordings, setVideoRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState<{id: string, collection: string} | null>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'specialist'));
        const snap = await getDocs(q);
        setExperts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch experts", err);
      }
    };
    fetchExperts();
  }, []);

  // Real-time load from Firestore
  useEffect(() => {
    const voiceQ = query(
      collection(db, 'voiceNotes'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubVoice = onSnapshot(voiceQ, snap => {
      setVoiceNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const videoQ = query(
      collection(db, 'recordings'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubVideo = onSnapshot(videoQ, snap => {
      setVideoRecordings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubVoice(); unsubVideo(); };
  }, [user.uid]);

  const confirmShare = async (expertId: string) => {
    if (!showShareModal) return;
    try {
      await updateDoc(doc(db, showShareModal.collection, showShareModal.id), {
        sentToTherapist: true,
        therapistVisible: true,
        sharedWith: expertId,
        sentAt: new Date().toISOString(),
      });
      alert('✅ Sent to the selected specialist. They will be notified securely.');
    } catch (e) {
      console.error(e);
      alert('Security error: Failed to share recording.');
    }
    setShowShareModal(null);
  };

  const togglePrivacy = async (id: string, collection_name: string, current: boolean) => {
    await updateDoc(doc(db, collection_name, id), { isPrivate: !current });
  };

  const sendToTherapist = (id: string, collection: string) => {
    setShowShareModal({ id, collection });
  };

  const deleteItem = async (id: string, collection_name: string) => {
    if (!window.confirm('Delete this neural reflection? This action is permanent.')) return;
    await deleteDoc(doc(db, collection_name, id));
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '0:00';
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const handleExport = () => {
    const data = {
      voiceNotes,
      videoRecordings,
      exportDate: new Date().toISOString(),
      user: user.uid
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `urkio_vault_export_${new Date().getTime()}.json`;
    a.click();
    alert('Security Protocol: Neural data package exported successfully.');
  };

  const filteredItems = (activeTab === 'voice' ? voiceNotes : videoRecordings).filter(item => 
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.insight || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#e1e2ea] font-['Manrope'] p-8 lg:p-12">
      
      {/* Immersive Header - Bento Style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8 bg-linear-to-br from-[#1a2233] to-[#080a0f] rounded-6xl p-12 border border-white/10 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-[#a8c8ff]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="size-24 rounded-4xl bg-linear-to-tr from-[#a8c8ff] to-[#4c75ff] flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
                 <Lock className="size-10 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4 leading-none">Secret Vault</h1>
                <p className="text-lg text-[#8b919e] font-medium tracking-tight max-w-md">Your architectural archive of neural reflections. Protected by Urkio's end-to-end encryption protocol.</p>
              </div>
           </div>

           <div className="mt-12 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                <Mic className="size-5 text-[#a8c8ff]" />
                <span className="text-sm font-black text-white tabular-nums">{voiceNotes.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5b616e]">Voice Journals</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                <Video className="size-5 text-[#ffb4ab]" />
                <span className="text-sm font-black text-white tabular-nums">{videoRecordings.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5b616e]">Video Archives</span>
              </div>
              <div className="ms-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 text-[#a8c8ff]">
                <Shield className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Quantum Secured</span>
              </div>
           </div>
        </div>

        {/* Tactical Search & Filter */}
        <aside className="lg:col-span-4 bg-[#0f111a] border border-white/5 rounded-6xl p-10 flex flex-col justify-between shadow-xl">
           <div>
             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-8">System Query</h4>
             <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-[#5b616e]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reflections..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[11px] uppercase font-black tracking-widest text-white outline-none focus:ring-1 focus:ring-[#a8c8ff]/30 transition-all placeholder-msgr-on-surface-variant"
                />
             </div>
             <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setActiveTab('voice')}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                    activeTab === 'voice' ? "bg-white text-[#080a0f] shadow-xl" : "text-[#5b616e] hover:text-white"
                  )}
                >
                  <Mic className="size-4" /> Voice
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                    activeTab === 'video' ? "bg-white text-[#080a0f] shadow-xl" : "text-[#5b616e] hover:text-white"
                  )}
                >
                  <Video className="size-4" /> Video
                </button>
             </div>
           </div>

           <div className="mt-8 pt-8 border-t border-white/5">
              <GlassButton 
                onClick={handleExport}
                className="w-full h-14 rounded-2xl! text-[11px] uppercase font-black tracking-widest shadow-lg shadow-white/5 active:scale-95" 
                variant="dark"
              >
                <Download className="size-4" /> Export All Data
              </GlassButton>
           </div>
        </aside>
      </div>

      <div className="mb-10 flex items-center justify-between px-6">
         <h2 className="text-3xl font-black italic text-white tracking-tighter">
            {activeTab === 'voice' ? 'Neural Reflections' : 'Cognitive Captures'}
         </h2>
         <div className="flex gap-4">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5b616e]">Indexing {filteredItems.length} secure units</span>
         </div>
      </div>

      {/* Bento Grid Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-80 rounded-[3rem] bg-white/2 border border-white/5 animate-pulse" />
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={clsx(
                  "group relative bg-[#0f111a]/80 border rounded-[3rem] p-8 transition-all hover:scale-[1.02] cursor-pointer flex flex-col h-full",
                  item.sentToTherapist ? "border-[#a8c8ff]/30 shadow-[0_0_30px_rgba(168,200,255,0.1)]" : "border-white/5 hover:border-white/10"
                )}
              >
                {/* Internal Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a8c8ff]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={clsx("size-14 rounded-2xl flex items-center justify-center shrink-0 border", activeTab === 'voice' ? "bg-[#a8c8ff]/10 border-[#a8c8ff]/20 text-[#a8c8ff]" : "bg-[#ffb4ab]/10 border-[#ffb4ab]/20 text-[#ffb4ab]")}>
                    {activeTab === 'voice' ? <Mic className="size-6" /> : <Video className="size-6" />}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 mb-2">
                      {item.isPrivate ? <Lock className="size-3 text-[#5b616e]" /> : <Eye className="size-3 text-[#a8c8ff]" />}
                      {item.sentToTherapist && <ShieldCheck className="size-3 text-[#a8c8ff]" />}
                    </div>
                    <span className="text-[9px] font-black text-[#5b616e] uppercase tracking-[0.2em]">
                      {item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Neural Origin'}
                    </span>
                  </div>
                </div>

                <h4 className="text-xl font-black text-white italic tracking-tighter mb-2 truncate">
                  {item.title || (activeTab === 'voice' ? 'Voice Reflection' : 'Session Capture')}
                </h4>
                
                <p className="text-xs text-[#8b919e] font-medium leading-relaxed italic mb-8 line-clamp-3">
                  {item.insight ? `"${item.insight}"` : "Memory sequence secured in temporal vault..."}
                </p>

                {/* Playback Preview / Controls */}
                <div className="space-y-4 mb-8">
                    {activeTab === 'voice' ? (
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-[#a8c8ff] rounded-full group-hover:w-[40%] transition-all duration-[2s]" />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-3xl bg-black/40 flex items-center justify-center border border-white/5 relative overflow-hidden group/thumb">
                        <Play className="size-8 text-white/20 group-hover/thumb:text-white group-hover/thumb:scale-110 transition-all" />
                        {item.url && <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover/thumb:opacity-60 transition-opacity" />}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-msgr-on-surface-variant">
                      <span className="flex items-center gap-2">
                        <Clock className="size-3" /> {formatDuration(item.duration)}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[#a8c8ff]">
                        {item.emotion || 'Neural'}
                      </span>
                    </div>
                </div>

                {/* Tactical Actions */}
                <div className="mt-auto flex items-center gap-3 pt-6 border-t border-white/5">
                  {!item.sentToTherapist ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); sendToTherapist(item.id, activeTab === 'voice' ? 'voiceNotes' : 'recordings'); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
                    >
                      <Share2 className="size-3" /> Share
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 text-[9px] font-black uppercase tracking-widest text-[#a8c8ff]">
                        <UserCheck className="size-3" /> Shared
                    </div>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePrivacy(item.id, activeTab === 'voice' ? 'voiceNotes' : 'recordings', item.isPrivate); }}
                    className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5b616e] hover:text-white transition-all shadow-hover"
                  >
                    {item.isPrivate ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id, activeTab === 'voice' ? 'voiceNotes' : 'recordings'); }}
                    className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5b616e] hover:text-[#ffb4ab] transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white/2 border-2 border-dashed border-white/5 rounded-[4rem] animate-in fade-in zoom-in duration-500">
              <Lock className="size-20 text-msgr-on-surface-variant mx-auto mb-8 opacity-20" />
              <p className="text-xl font-black text-white italic tracking-tighter mb-2">Vault is currently sealed</p>
              <p className="text-sm text-[#5b616e] font-bold tracking-widest uppercase mb-10">Visit the Sanctuary to begin your first neural sync.</p>
              <GlassButton onClick={() => window.open('/messenger', '_self')} className="px-12 h-14 rounded-2xl! text-[11px] uppercase font-black tracking-widest">
                 Initialize Capture
              </GlassButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Immersive Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#080a0f]/90 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
          <div className="bg-[#0f111a] border border-white/10 rounded-[4rem] max-w-xl w-full p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#a8c8ff] to-transparent" />
            
            <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Share with Specialist</h3>
            <p className="text-sm text-[#8b919e] font-medium leading-relaxed mb-10">Select a verified professional to securely share your neural reflection. This establishes a clinical synchronization bridge.</p>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto mb-10 pe-4 scrollbar-hidden">
              {experts.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-4xl">
                   <Users className="size-12 text-[#5b616e] mx-auto mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#5b616e]">No specialists found in nexus</p>
                </div>
              ) : (
                experts.map(expert => (
                  <button
                    key={expert.id}
                    onClick={() => confirmShare(expert.id)}
                    className="w-full flex items-center gap-5 p-5 rounded-4xl bg-white/5 border border-white/5 hover:border-[#a8c8ff]/40 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="size-14 rounded-2xl overflow-hidden border border-white/10 p-0.5 group-hover:scale-110 transition-transform">
                      <img src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=080a0f&color=a8c8ff`} alt={expert.displayName} className="w-full h-full object-cover rounded-[0.9rem]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight leading-none mb-1.5">{expert.displayName || 'Unnamed Specialist'}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black uppercase tracking-widest text-[#a8c8ff]">{expert.primaryRole || 'Clinical Lead'}</span>
                         <div className="size-1 rounded-full bg-white/20" />
                         <span className="text-[9px] font-bold text-[#5b616e] uppercase tracking-widest">Verified Badge</span>
                      </div>
                    </div>
                    <ChevronRight className="ms-auto size-5 text-[#5b616e] group-hover:text-white transition-colors" />
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowShareModal(null)}
                className="flex-1 py-5 rounded-3xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all font-['Manrope']"
              >
                Abort Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
