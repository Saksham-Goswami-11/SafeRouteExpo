import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import EmergencyContactsScreen from '../screens/profile/EmergencyContactsScreen';
import SavedAddressesScreen from '../screens/profile/SavedAddressesScreen';
import AudioEvidenceScreen from '../screens/AudioEvidenceScreen';

import { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="AudioEvidence" component={AudioEvidenceScreen} />
    </Stack.Navigator>
  );
}
