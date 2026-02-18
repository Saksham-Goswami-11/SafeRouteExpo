import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

/**
 * Defines the shape of the SOS context data.
 * This now includes state and functions for the SOS confirmation modal.
 */
export interface SOSContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
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
  const [enabled, setEnabled] = useState(false);
  
  // State to control the visibility of the SOS confirmation modal.
  const [isConfirmingSOS, setIsConfirmingSOS] = useState(false);

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  const value = useMemo(() => ({
    enabled,
    setEnabled,
    isConfirmingSOS,
    // Function to show the confirmation modal.
    startSOSConfirmation: () => setIsConfirmingSOS(true),
    // Function to hide the modal if the user cancels.
    cancelSOSConfirmation: () => setIsConfirmingSOS(false),
    // Function to hide the modal after the SOS action is confirmed and completed.
    confirmSOS: () => setIsConfirmingSOS(false),
  }), [enabled, isConfirmingSOS]);

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