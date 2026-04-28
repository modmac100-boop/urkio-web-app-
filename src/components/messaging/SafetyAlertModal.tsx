import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getEmergencyContacts } from '../../security/safetyGuard';
import { useTranslation } from 'react-i18next';

interface SafetyAlertModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const contacts = getEmergencyContacts();

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-[#a2b5bb]/30 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl text-[#fdfbf7] font-serif font-bold text-center mb-2">
            {isRTL ? 'تنبيه سلامة مهم' : 'Important Safety Alert'}
          </h2>
          <p className="text-[#a2b5bb] text-center leading-relaxed">
            {isRTL 
              ? 'لقد لاحظنا كلمات تثير قلقنا. أنت لست وحدك، والمساعدة متاحة الآن.' 
              : 'We noticed keywords that concern us. You are not alone, and help is available right now.'}
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto mb-6 custom-scrollbar pr-2">
          {contacts.map((contact, index) => (
            <div key={index} className="mb-4 bg-white/5 p-4 rounded-xl">
              <h3 className="text-[#00e5ff] font-bold mb-2 text-left">{contact.country}</h3>
              {contact.numbers.map((num, i) => (
                <p key={i} className="text-[#fdfbf7]/80 text-sm mb-1 text-left">• {num}</p>
              ))}
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#0f172a] py-4 rounded-xl font-bold text-lg transition-colors"
        >
          {isRTL ? 'أفهم ذلك' : 'I understand'}
        </button>
      </div>
    </div>
  );
};
