import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// --- Param Lists ---

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Login: undefined;
  Signup: undefined;
  EditProfile: undefined;
  EmergencyContacts: undefined;
  SavedAddresses: undefined;
  AudioEvidence: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Navigate: undefined;
  Safety: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<RootTabParamList>;
  NearbyPlaces: { type: 'hospital' | 'police' };
};