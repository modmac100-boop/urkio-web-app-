import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { 
  Handshake, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Heart, 
  Users, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Activity {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  image: string;
}

interface FoundationData {
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  bio: string;
  bioAr: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  locationAr: string;
  established: string;
  mission: string;
  missionAr: string;
  vision: string;
  visionAr: string;
  impactStats: {
    beneficiaries: number;
    projects: number;
    volunteers: number;
  };
  activities: Activity[];
}

const defaultData: FoundationData = {
  name: 'Ashraqat Foundation',
  nameAr: 'مؤسسة أشرقت التنموية',
  tagline: 'Empowering Communities, Illuminating Futures',
  taglineAr: 'تمكين المجتمعات، إضاءة المستقبل',
  bio: 'Ashraqat Foundation is dedicated to sustainable community development, providing educational resources, mental health support, and vocational training to create lasting positive impact.',
  bioAr: 'تعمل مؤسسة أشرقت التنموية على تحقيق التنمية المجتمعية المستدامة، وتقديم الموارد التعليمية، والدعم النفسي، والتدريب المهني لخلق أثر إيجابي دائم.',
  email: 'contact@ashraqat.org',
  phone: '+966 500 000 000',
  website: 'https://ashraqat.org',
  location: 'Riyadh, Saudi Arabia',
  locationAr: 'الرياض، المملكة العربية السعودية',
  established: '2020',
  mission: 'To foster resilience and growth in underprivileged communities through targeted educational and wellness programs.',
  missionAr: 'تعزيز المرونة والنمو في المجتمعات الأقل حظاً من خلال البرامج التعليمية والصحية المستهدفة.',
  vision: 'A world where every individual has access to the tools and support needed to achieve their full potential.',
  visionAr: 'عالم يتمتع فيه كل فرد بإمكانية الوصول إلى الأدوات والدعم اللازمين لتحقيق كامل إمكاناته.',
  impactStats: {
    beneficiaries: 15000,
    projects: 45,
    volunteers: 350
  },
  activities: [
    {
      id: '1',
      title: 'Youth Empowerment Workshop',
      titleAr: 'ورشة عمل تمكين الشباب',
      description: 'A comprehensive program teaching leadership and digital literacy skills to young adults.',
      descriptionAr: 'برنامج شامل لتعليم مهارات القيادة والمعرفة الرقمية للشباب.',
      date: '2026-05-15',
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '2',
      title: 'Community Wellness Initiative',
      titleAr: 'مبادرة الصحة المجتمعية',
      description: 'Providing free mental health resources and counseling sessions in partnership with Urkio.',
      descriptionAr: 'تقديم موارد الصحة النفسية وجلسات الاستشارة المجانية بالشراكة مع أوركيو.',
      date: '2026-04-01',
      status: 'ongoing',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

export function AshraqatProfile({ user, userData }: any) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [data, setData] = useState<FoundationData>(defaultData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<FoundationData>(defaultData);
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ashraqat_foundation_data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved foundation data');
      }
    }
  }, []);

  const handleSave = () => {
    setData(editData);
    localStorage.setItem('ashraqat_foundation_data', JSON.stringify(editData));
    setIsEditing(false);
    toast.success(isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditData(data);
    setIsEditing(true);
  };

  // Activity CRUD
  const handleAddActivity = () => {
    const newAct: Activity = {
      id: Date.now().toString(),
      title: 'New Activity',
      titleAr: 'نشاط جديد',
      description: 'Description goes here',
      descriptionAr: 'الوصف هنا',
      date: new Date().toISOString().split('T')[0],
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
    };
    setEditData({
      ...editData,
      activities: [...editData.activities, newAct]
    });
  };

  const handleRemoveActivity = (id: string) => {
    setEditData({
      ...editData,
      activities: editData.activities.filter(a => a.id !== id)
    });
  };

  const handleUpdateActivity = (id: string, field: keyof Activity, value: string) => {
    setEditData({
      ...editData,
      activities: editData.activities.map(a => a.id === id ? { ...a, [field]: value } : a)
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-body pb-12">
      {/* Hero Section */}
      <div className="relative h-80 md:h-96 bg-linear-to-r from-pink-950 via-slate-950 to-indigo-950 overflow-hidden rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#D81B60,transparent_40%)] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#1A237E,transparent_40%)] opacity-30" />
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px]" />
        
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Profile Info Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-start">
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl p-3 shadow-xl flex items-center justify-center border border-zinc-800 shrink-0 group hover:scale-105 transition-transform duration-300">
              <img 
                src="/ashraqat_logo.png" 
                alt="Ashraqat Foundation" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight bg-linear-to-r from-pink-500 to-indigo-400 bg-clip-text text-transparent">
                    {isRTL ? data.nameAr : data.name}
                  </h1>
                  <p className="text-pink-400 font-semibold mt-1 text-sm md:text-base">
                    {isRTL ? data.taglineAr : data.tagline}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <span className="flex items-center gap-1 px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-xs font-black tracking-widest uppercase">
                    <ShieldCheck className="w-4 h-4" />
                    {isRTL ? 'شريك معتمد' : 'Verified Partner'}
                  </span>
                </div>
              </div>

              <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl">
                {isRTL ? data.bioAr : data.bio}
              </p>

              {/* Contact & Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-xs md:text-sm text-zinc-400">
                <a href={`mailto:${data.email}`} className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Mail className="w-4 h-4 text-pink-500" />
                  {data.email}
                </a>
                <a href={`tel:${data.phone}`} className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Phone className="w-4 h-4 text-pink-500" />
                  {data.phone}
                </a>
                <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Globe className="w-4 h-4 text-pink-500" />
                  {data.website.replace('https://', '')}
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  {isRTL ? data.locationAr : data.location}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-center md:justify-start gap-3 pt-4">
                {!isEditing ? (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-zinc-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isRTL ? 'تعديل البيانات' : 'Edit Profile'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/20"
                    >
                      <Save className="w-4 h-4" />
                      {isRTL ? 'حفظ' : 'Save'}
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <X className="w-4 h-4" />
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Form */}
        {isEditing && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl font-black font-headline text-zinc-100 border-b border-zinc-800 pb-4">
              {isRTL ? 'تعديل بيانات المؤسسة' : 'Edit Foundation Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Name (English)</label>
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">الاسم (عربي)</label>
                <input 
                  type="text" 
                  value={editData.nameAr} 
                  onChange={(e) => setEditData({...editData, nameAr: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tagline (English)</label>
                <input 
                  type="text" 
                  value={editData.tagline} 
                  onChange={(e) => setEditData({...editData, tagline: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">الشعار اللفظي (عربي)</label>
                <input 
                  type="text" 
                  value={editData.taglineAr} 
                  onChange={(e) => setEditData({...editData, taglineAr: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bio (English)</label>
                <textarea 
                  value={editData.bio} 
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">السيرة الذاتية (عربي)</label>
                <textarea 
                  value={editData.bioAr} 
                  onChange={(e) => setEditData({...editData, bioAr: e.target.value})}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors resize-none text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={editData.email} 
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</label>
                <input 
                  type="text" 
                  value={editData.phone} 
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Website</label>
                <input 
                  type="text" 
                  value={editData.website} 
                  onChange={(e) => setEditData({...editData, website: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  value={editData.location} 
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Impact Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          {[
            { label: isRTL ? 'المستفيدين' : 'Beneficiaries', value: data.impactStats.beneficiaries.toLocaleString() + '+', icon: Users, color: 'from-pink-500 to-rose-500' },
            { label: isRTL ? 'المشاريع' : 'Projects', value: data.impactStats.projects, icon: Sparkles, color: 'from-purple-500 to-indigo-500' },
            { label: isRTL ? 'المتطوعين' : 'Volunteers', value: data.impactStats.volunteers, icon: Heart, color: 'from-blue-500 to-teal-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4 hover:bg-zinc-900 transition-colors">
              <div className={`size-12 rounded-2xl bg-linear-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-pink-500/10 shrink-0`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black font-headline text-zinc-100">{stat.value}</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 md:p-8 hover:border-pink-500/20 transition-colors">
            <h3 className="text-xl font-black font-headline text-pink-400 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" />
              {isRTL ? 'رسالتنا' : 'Our Mission'}
            </h3>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed italic">
              "{isRTL ? data.missionAr : data.mission}"
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 md:p-8 hover:border-indigo-500/20 transition-colors">
            <h3 className="text-xl font-black font-headline text-indigo-400 flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" />
              {isRTL ? 'رؤيتنا' : 'Our Vision'}
            </h3>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed italic">
              "{isRTL ? data.visionAr : data.vision}"
            </p>
          </div>
        </div>

        {/* Activities & Initiatives */}
        <div className="mt-12 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-black font-headline text-zinc-100 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-pink-500" />
              {isRTL ? 'الأنشطة والمبادرات' : 'Activities & Initiatives'}
            </h2>
            
            {isEditing && (
              <button 
                onClick={handleAddActivity}
                className="flex items-center gap-2 px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'إضافة نشاط' : 'Add Activity'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(isEditing ? editData.activities : data.activities).map((act) => (
              <div 
                key={act.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={act.image} 
                    alt={act.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 inset-e-4 flex justify-end">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                      act.status === 'upcoming' && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                      act.status === 'ongoing' && "bg-green-500/20 text-green-400 border-green-500/30",
                      act.status === 'completed' && "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                    )}>
                      {act.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={act.title} 
                        onChange={(e) => handleUpdateActivity(act.id, 'title', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-100 focus:border-pink-500 focus:outline-none"
                        placeholder="Title (EN)"
                      />
                      <input 
                        type="text" 
                        value={act.titleAr} 
                        onChange={(e) => handleUpdateActivity(act.id, 'titleAr', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-100 focus:border-pink-500 focus:outline-none text-right"
                        placeholder="العنوان (عربي)"
                        dir="rtl"
                      />
                      <textarea 
                        value={act.description} 
                        onChange={(e) => handleUpdateActivity(act.id, 'description', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-pink-500 focus:outline-none resize-none"
                        placeholder="Description (EN)"
                        rows={2}
                      />
                      <textarea 
                        value={act.descriptionAr} 
                        onChange={(e) => handleUpdateActivity(act.id, 'descriptionAr', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-pink-500 focus:outline-none resize-none text-right"
                        placeholder="الوصف (عربي)"
                        rows={2}
                        dir="rtl"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="date" 
                          value={act.date} 
                          onChange={(e) => handleUpdateActivity(act.id, 'date', e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                        />
                        <select 
                          value={act.status} 
                          onChange={(e) => handleUpdateActivity(act.id, 'status', e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handleRemoveActivity(act.id)}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold tracking-wider uppercase mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isRTL ? 'حذف النشاط' : 'Delete Activity'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-lg font-black font-headline text-zinc-100 group-hover:text-pink-400 transition-colors">
                          {isRTL ? act.titleAr : act.title}
                        </h3>
                        <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest block mt-1">
                          {act.date}
                        </span>
                        <p className="text-zinc-400 text-xs md:text-sm font-medium mt-3 leading-relaxed">
                          {isRTL ? act.descriptionAr : act.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
