// Yeh hamari nayi file hai jo loop ko todegi
// Ismein hamare Tab Navigator ke sabhi screens ki list hai

export type RootTabParamList = {
  Home: undefined;
  Navigate: undefined;
  Safety: undefined;
  Profile: undefined;
  NearbyPlaces: { type: 'hospital' | 'police' };
};