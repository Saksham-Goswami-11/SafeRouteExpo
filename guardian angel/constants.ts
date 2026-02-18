import { Volunteer, IncidentReport, RiskLevel, EvidenceItem, Contact } from './types';

export const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: 'v1', name: 'Aarav Patel', rating: 4.9, verified: true, distance: 120, status: 'IDLE' },
  { id: 'v2', name: 'Sneha Gupta', rating: 4.8, verified: true, distance: 350, status: 'IDLE' },
  { id: 'v3', name: 'Vikram Singh', rating: 4.7, verified: true, distance: 600, status: 'OFFLINE' },
];

export const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Mom', phone: '+91 98765 43210', relation: 'Parent', isTrusted: true, avatar: 'M' },
  { id: 'c2', name: 'Rahul (Brother)', phone: '+91 99887 76655', relation: 'Sibling', isTrusted: true, avatar: 'R' },
  { id: 'c3', name: 'Priya', phone: '+91 88776 65544', relation: 'Friend', isTrusted: false, avatar: 'P' },
];

export const MOCK_REPORTS: IncidentReport[] = [
  {
    id: 'r1',
    type: 'Harassment',
    description: 'Group of men loitering near the metro exit late at night.',
    timestamp: '2023-10-25T22:30:00',
    location: 'Sector 18 Metro Station',
    riskLevel: RiskLevel.CAUTION,
    aiAnalysis: 'Pattern detected: High frequency of reports in this zone post 10 PM.'
  },
  {
    id: 'r2',
    type: 'Poor Lighting',
    description: 'Street lights not working for 3 days.',
    timestamp: '2023-10-26T19:15:00',
    location: 'MG Road Back Alley',
    riskLevel: RiskLevel.CAUTION,
  }
];

export const MOCK_EVIDENCE: EvidenceItem[] = [
  {
    id: 'e1',
    type: 'AUDIO',
    timestamp: '2023-10-20T14:30:00',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    verifiedOnBlockchain: true,
  },
  {
    id: 'e2',
    type: 'LOCATION_LOG',
    timestamp: '2023-10-20T14:35:00',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verifiedOnBlockchain: true,
  }
];

export const GEMINI_SYSTEM_INSTRUCTION_WELLNESS = `
You are AMBA, an empathetic, trauma-informed AI mental wellness companion within a women's safety application. 
Your goal is to provide immediate emotional support, grounding techniques, and guidance to resources. 
You are NOT a replacement for professional therapy or emergency services.
If the user seems in immediate danger, urge them to use the SOS button or call emergency services immediately.
Keep responses concise, warm, and supportive.
`;

export const GEMINI_SYSTEM_INSTRUCTION_SAFETY_ANALYSIS = `
You are the AMBA Safety Analyst. Analyze the following incident report description. 
Extract key safety factors, assign a risk level (SAFE, CAUTION, DANGER), and provide a brief safety recommendation.
Return the response in JSON format with keys: riskLevel, analysis, recommendation.
`;