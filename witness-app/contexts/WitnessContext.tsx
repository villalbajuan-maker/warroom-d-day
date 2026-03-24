import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WitnessSession } from '@/types/witness';
import { loadSession, saveSession, clearSession } from '@/lib/auth-service';

interface WitnessContextType {
  session: WitnessSession | null;
  setSession: (session: WitnessSession) => void;
  updateStatus: (status: WitnessSession['status']) => void;
  logout: () => void;
  isLoading: boolean;
}

const WitnessContext = createContext<WitnessContextType | undefined>(undefined);

export function WitnessProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<WitnessSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession) {
      setSessionState(savedSession);
    }
    setIsLoading(false);
  }, []);

  const setSession = (newSession: WitnessSession) => {
    setSessionState(newSession);
    saveSession(newSession);
  };

  const updateStatus = (status: WitnessSession['status']) => {
    if (session) {
      const updatedSession = { ...session, status };
      setSessionState(updatedSession);
      saveSession(updatedSession);
    }
  };

  const logout = () => {
    setSessionState(null);
    clearSession();
  };

  return (
    <WitnessContext.Provider value={{ session, setSession, updateStatus, logout, isLoading }}>
      {children}
    </WitnessContext.Provider>
  );
}

export function useWitness() {
  const context = useContext(WitnessContext);
  if (context === undefined) {
    throw new Error('useWitness must be used within a WitnessProvider');
  }
  return context;
}
