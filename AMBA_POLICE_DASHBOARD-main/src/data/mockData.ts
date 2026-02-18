export interface User {
  name: string;
  phone: string;
  photo: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
  id: string;
  user: User;
  location: Location;
  status: AlertStatus;
  battery: number;
  timestamp: string;
  audioEvidence: string | null;
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: "sos_01",
    user: { name: "Aditi Singh", phone: "+91 98765 43210", photo: "https://i.pravatar.cc/150?img=5" },
    location: { lat: 28.6139, lng: 77.2090, address: "Connaught Place, Delhi" },
    status: "ACTIVE", // Critical red pulse
    battery: 15, // Low battery warning
    timestamp: new Date().toISOString(),
    audioEvidence: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "sos_02",
    user: { name: "Sneha Kapoor", phone: "+91 99887 76655", photo: "https://i.pravatar.cc/150?img=9" },
    location: { lat: 28.5355, lng: 77.3910, address: "Sector 18, Noida" },
    status: "RESOLVED",
    battery: 82,
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    audioEvidence: null
  }
];
