import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  activeChatPartner: any;
  setActiveChatPartner: (partner: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeChatPartner, setActiveChatPartner] = useState<any>(null);

  return (
    <AppContext.Provider value={{ 
      activeChatPartner, 
      setActiveChatPartner 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
