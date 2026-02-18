
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface NoContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const NoContactsModal: React.FC<NoContactsModalProps> = ({ visible, onClose, onConfirm }) => {
  const { colors } = useTheme();

  const handleShareLocation = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <LinearGradient
          colors={[colors.backgroundCard, colors.background]}
          style={styles.modalView}
        >
          <Text style={[styles.modalText, { color: colors.text }]}>No Saved Contacts</Text>
          <Text style={[styles.modalSubText, { color: colors.textSecondary }]}>
            You have no emergency contacts saved. Would you like to share your location with a contact of your choice via WhatsApp?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.danger }]}
              onPress={onClose}
            >
              <Text style={[styles.textStyle, { color: '#FFF' }]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleShareLocation}
            >
              <Text style={[styles.textStyle, { color: '#FFF' }]}>Yes</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    width: '45%',
    alignItems: 'center',
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NoContactsModal;
