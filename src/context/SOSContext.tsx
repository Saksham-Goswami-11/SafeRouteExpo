import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { fetchContacts } from '../services/contactsService';

export interface SOSContextType {
  shakeEnabled: boolean;
  setShakeEnabled: (enabled: boolean) => void;
  isConfirmingSOS: boolean;
  noContactsModalVisible: boolean; // New state for no-contacts modal
  startSOSConfirmation: () => void;
  cancelSOSConfirmation: () => void;
  confirmSOS: () => void;
  openWhatsApp: () => void; // Function to open WhatsApp
  closeNoContactsModal: () => void; // Function to close the no-contacts modal
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [isConfirmingSOS, setIsConfirmingSOS] = useState(false);
  const [noContactsModalVisible, setNoContactsModalVisible] = useState(false);

  const startSOSConfirmation = useCallback(async () => {
    if (!user) {
      // Should not happen if user is logged in, but as a safeguard
      Alert.alert('Error', 'You must be logged in to use this feature.');
      return;
    }
    if (isConfirmingSOS || noContactsModalVisible) return;

    try {
      const contacts = await fetchContacts(user.id);
      if (contacts && contacts.length > 0) {
        // Contacts exist, proceed with normal SOS confirmation
        setIsConfirmingSOS(true);
      } else {
        // No contacts, show the specific modal for it
        setNoContactsModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to fetch contacts for SOS:', error);
      Alert.alert('Error', 'Could not verify emergency contacts. Please try again.');
    }
  }, [isConfirmingSOS, noContactsModalVisible, user]);

  const cancelSOSConfirmation = useCallback(() => setIsConfirmingSOS(false), []);
  const confirmSOS = useCallback(() => setIsConfirmingSOS(false), []);
  const closeNoContactsModal = useCallback(() => setNoContactsModalVisible(false), []);

  const openWhatsApp = useCallback(async () => {
    closeNoContactsModal(); // Close the modal first
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to share your location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const message = `Emergency! I need help. My current location is: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      // Opens WhatsApp to let the user choose a contact
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    } catch (error) {
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
    }
  }, [closeNoContactsModal]);

  const value = useMemo(() => ({
    shakeEnabled,
    setShakeEnabled,
    isConfirmingSOS,
    noContactsModalVisible,
    startSOSConfirmation,
    cancelSOSConfirmation,
    confirmSOS,
    openWhatsApp,
    closeNoContactsModal,
  }), [
    shakeEnabled,
    isConfirmingSOS,
    noContactsModalVisible,
    startSOSConfirmation,
    cancelSOSConfirmation,
    confirmSOS,
    openWhatsApp,
    closeNoContactsModal,
  ]);

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

export const useSOS = (): SOSContextType => {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOS must be used within a SOSProvider');
  }
  return context;
};