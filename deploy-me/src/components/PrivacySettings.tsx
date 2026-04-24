import React from 'react';
import { Shield, Eye, Bell, Lock, Smartphone, Globe, Check } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface PrivacySettingsProps {
  formData: any;
  onChange: (e: any) => void;
  isExpert: boolean;
}

export function PrivacySettings({ formData, onChange, isExpert }: PrivacySettingsProps) {
  const { t } = useTranslation();

  const privacyOptions = [
    {
      id: 'profileVisibility',
      title: 'Profile Visibility',
      description: 'Control who can see your profile and activity feed.',
      icon: <Eye className="w-5 h-5" />,
      type: 'select',
      options: [
        { value: 'public', label: 'Public (Everyone)' },
        { value: 'members', label: 'Members Only' },
        { value: 'private', label: 'Private (Followers)' }
      ]
    },
    {
      id: 'showPresence',
      title: 'Active Status',
      description: 'Show when you are online to other users.',
      icon: <Globe className="w-5 h-5" />,
      type: 'toggle'
    },
    {
      id: 'allowMessages',
      title: 'Direct Messages',
      description: 'Who can send you direct messages.',
      icon: <Bell className="w-5 h-5" />,
      type: 'select',
      options: [
        { value: 'everyone', label: 'Everyone' },
        { value: 'following', label: 'People I follow' },
        { value: 'none', label: 'No one' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/20 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight">Privacy & Security</h2>
        </div>

        <div className="space-y-6">
          {privacyOptions.map((option) => (
            <div key={option.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-white/20 dark:border-slate-700/50 transition-all hover:bg-white/50 dark:hover:bg-slate-800/50">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-500">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{option.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{option.description}</p>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                {option.type === 'toggle' ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name={option.id} 
                      checked={formData[option.id] ?? true} 
                      onChange={(e) => onChange({ target: { name: option.id, value: e.target.checked, type: 'checkbox' } })} 
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </label>
                ) : (
                  <select
                    name={option.id}
                    value={formData[option.id] || option.options?.[0].value}
                    onChange={(e) => onChange({ target: { name: option.id, value: e.target.value } })}
                    className="bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 p-6 flex items-start gap-4" style={{ borderRadius: '2rem' }}>
        <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-600">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight text-sm mb-1">Data Protection</h4>
          <p className="text-xs text-amber-600/80 font-medium leading-relaxed">
            Your personal data is encrypted and stored securely. We never share your private health milestones or journal entries without your explicit permission.
          </p>
        </div>
      </div>
    </div>
  );
}
