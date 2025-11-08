import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SOSContextType = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem('sos_enabled');
      if (v !== null) setEnabled(v === '1');
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('sos_enabled', enabled ? '1' : '0');
  }, [enabled]);

  return (
    <SOSContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS must be used within SOSProvider');
  return ctx;
};
