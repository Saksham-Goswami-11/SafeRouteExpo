import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';

/**
 * Defines the shape of the SOS context data.
 * This now includes state and functions for the SOS confirmation modal.
 */
export interface SOSContextType {
  shakeEnabled: boolean;
  setShakeEnabled: (enabled: boolean) => void;
  isConfirmingSOS: boolean;
  startSOSConfirmation: () => void;
  cancelSOSConfirmation: () => void;
  confirmSOS: () => void;
}

// Create the context with an undefined initial value.
const SOSContext = createContext<SOSContextType | undefined>(undefined);

/**
 * The provider component that wraps parts of the app that need access to SOS state.
 */
export const SOSProvider = ({ children }: { children: ReactNode }) => {
  // State for enabling/disabling the shake-to-SOS feature.
  const [shakeEnabled, setShakeEnabled] = useState(false);
  
  // State to control the visibility of the SOS confirmation modal.
  const [isConfirmingSOS, setIsConfirmingSOS] = useState(false);

  const startSOSConfirmation = useCallback(() => {
    if (!isConfirmingSOS) {
      setIsConfirmingSOS(true);
    }
  }, [isConfirmingSOS]);

  const cancelSOSConfirmation = useCallback(() => setIsConfirmingSOS(false), []);
  const confirmSOS = useCallback(() => setIsConfirmingSOS(false), []);

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  const value = useMemo(() => ({
    shakeEnabled,
    setShakeEnabled,
    isConfirmingSOS,
    startSOSConfirmation,
    cancelSOSConfirmation,
    confirmSOS,
  }), [shakeEnabled, isConfirmingSOS, startSOSConfirmation, cancelSOSConfirmation, confirmSOS]);

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

/**
 * Custom hook to easily access the SOS context.
 * This hook ensures it's used within a SOSProvider.
 */
export const useSOS = (): SOSContextType => {
  const context = useContext(SOSContext);
  if (context === undefined) {
    // This error is thrown if useSOS is used outside of a SOSProvider.
    throw new Error('useSOS must be used within a SOSProvider');
  }
  // The defensive code in App.tsx is no longer strictly necessary
  // but is good practice. We can now safely return the context.
  return context;
};