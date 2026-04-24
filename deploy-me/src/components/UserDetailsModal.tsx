import React from 'react';
import { X, CheckCircle, XCircle, User, Mail, Shield, FileText, Link as LinkIcon, Calendar, Info } from 'lucide-react';

export function UserDetailsModal({ 
  isOpen, 
  onClose, 
  user,
  onApprove,
  onReject
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-background-dark rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden my-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 inset-e-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <div className="flex items-center gap-6 mb-8">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
              alt="Profile" 
              className="w-20 h-20 rounded-full border-4 border-slate-50" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.displayName || 'Unknown Name'}</h2>
              <p className="text-slate-500">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium text-xs uppercase tracking-wider">
                  {user.role}
                </span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md font-medium text-xs uppercase tracking-wider">
                  {user.verificationStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Professional Info</h3>
              
              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><Shield className="w-3.5 h-3.5" /> Primary Role</p>
                <p className="text-slate-900 dark:text-white font-medium">{user.primaryRole || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><FileText className="w-3.5 h-3.5" /> NPI Number</p>
                <p className="text-slate-900 dark:text-white font-medium">{user.npiNumber || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><LinkIcon className="w-3.5 h-3.5" /> Credential URL</p>
                {user.credentialUrl ? (
                  <a href={user.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-medium break-all">
                    {user.credentialUrl}
                  </a>
                ) : (
                  <p className="text-slate-900 dark:text-white font-medium">N/A</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Account Details</h3>
              
              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" /> User ID (UID)</p>
                <p className="text-slate-900 dark:text-white font-mono text-sm break-all">{user.uid || user.id}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Created At</p>
                <p className="text-slate-900 dark:text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1"><Info className="w-3.5 h-3.5" /> Preferences</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.joinCommunity && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-medium text-xs">
                      Community Opt-in
                    </span>
                  )}
                  {user.baaAccepted && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium text-xs">
                      BAA Accepted
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Optional extra fields that might exist from signup */}
          {(user.bio || user.goals || user.pronouns || user.whatsapp || user.twitter || user.linkedin || user.instagram || user.website) && (
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Additional Profile Info</h3>
              {user.pronouns && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Pronouns</p>
                  <p className="text-slate-900 dark:text-white">{user.pronouns}</p>
                </div>
              )}
              {user.goals && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Primary Goal</p>
                  <p className="text-slate-900 dark:text-white">{user.goals}</p>
                </div>
              )}
              {user.bio && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Bio</p>
                  <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}
              
              {/* Social Links */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {user.whatsapp && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">WhatsApp</p>
                    <p className="text-slate-900 dark:text-white">{user.whatsapp}</p>
                  </div>
                )}
                {user.website && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Website</p>
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">{user.website}</a>
                  </div>
                )}
                {user.linkedin && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">LinkedIn</p>
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">{user.linkedin}</a>
                  </div>
                )}
                {user.twitter && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Twitter</p>
                    <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">{user.twitter}</a>
                  </div>
                )}
                {user.instagram && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Instagram</p>
                    <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">{user.instagram}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                onReject(user.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-semibold transition-all"
            >
              <XCircle className="w-5 h-5" />
              Reject Application
            </button>
            <button
              onClick={() => {
                onApprove(user.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/20"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Expert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
