// Safety Analysis Module - Core logic for route safety scoring

export interface SafetyReason {
  level: 'safe' | 'caution' | 'unsafe';
  reasons: string[];
  recommendations: string[];
  timeOfDay?: string;
}

export interface SafetySegment {
  coordinates: Array<{ latitude: number; longitude: number }>;
  safetyScore: number;
  color: string;
  safetyReason?: SafetyReason;
  actualScore?: number;
  safetyFactors?: {
    police: { name: string, distance: string, location: { latitude: number, longitude: number } } | null;
    hospital: { name: string, distance: string, location: { latitude: number, longitude: number } } | null;
    lighting: string;
  };
}

const SAFETY_COLORS = {
  1: '#ef4444', // Red - Unsafe
  2: '#eab308', // Yellow - Caution  
  3: '#22c55e'  // Green - Safe
};

// Safety reasons database
const safetyReasonsDatabase = {
  safe: {
    reasons: [
      ["Well-lit street with LED lighting", "24/7 CCTV surveillance coverage"],
      ["High foot traffic area", "Multiple shops and restaurants open"],
      ["Police patrol route", "Near emergency services"],
      ["Busy commercial district", "Well-maintained sidewalks"],
      ["Popular tourist area", "Security guards present"]
    ],
    recommendations: [
      ["Stay alert and aware", "Keep phone charged"],
      ["Share live location with contacts", "Stay on main paths"],
      ["Use well-lit crosswalks", "Avoid distractions"]
    ]
  },
  caution: {
    reasons: [
      ["Moderate lighting conditions", "Some CCTV blind spots"],
      ["Mixed residential/commercial area", "Medium foot traffic"],
      ["Occasional patrol presence", "Some isolated stretches"],
      ["Construction zone nearby", "Uneven lighting coverage"]
    ],
    recommendations: [
      ["Consider traveling in groups", "Keep valuables hidden"],
      ["Stay in well-lit areas", "Have emergency contacts ready"],
      ["Avoid using headphones", "Be extra vigilant"],
      ["Consider alternative timing", "Share your route"]
    ]
  },
  unsafe: {
    reasons: [
      ["Poor street lighting", "No CCTV coverage"],
      ["Isolated area with low visibility", "History of incidents"],
      ["Minimal foot traffic", "Far from help points"],
      ["Known problem area", "Poor maintenance"],
      ["Limited escape routes", "No nearby safe spaces"]
    ],
    recommendations: [
      ["Strongly recommend alternative route", "Travel with others"],
      ["Use transportation if possible", "Inform someone of your route"],
      ["Keep emergency services on speed dial", "Consider different timing"],
      ["Carry safety devices", "Stay highly alert"]
    ]
  }
};

export const getRandomSafetyReason = (score: number): SafetyReason => {
  let level: 'safe' | 'caution' | 'unsafe';
  let timeMessage = '';

  const hour = new Date().getHours();
  if (hour >= 20 || hour <= 6) {
    timeMessage = 'Night time - Extra caution advised';
    score = Math.max(0, score - 10);
  } else if (hour >= 6 && hour <= 9) {
    timeMessage = 'Morning rush hour - Busy period';
  } else if (hour >= 17 && hour <= 19) {
    timeMessage = 'Evening rush hour - High activity';
  }

  if (score >= 70) {
    level = 'safe';
  } else if (score >= 40) {
    level = 'caution';
  } else {
    level = 'unsafe';
  }

  const reasonsArray = safetyReasonsDatabase[level].reasons;
  const recommendationsArray = safetyReasonsDatabase[level].recommendations;

  const randomReasons = reasonsArray[Math.floor(Math.random() * reasonsArray.length)];
  const randomRecommendations = recommendationsArray[Math.floor(Math.random() * recommendationsArray.length)];

  return {
    level,
    reasons: randomReasons,
    recommendations: randomRecommendations,
    timeOfDay: timeMessage || undefined
  };
};

export const calculateSegmentSafetyScore = (): number => {
  // Generate realistic distribution of safety scores
  const random = Math.random();

  if (random < 0.3) {
    // 30% chance of safe area (70-100)
    return 70 + Math.floor(Math.random() * 31);
  } else if (random < 0.7) {
    // 40% chance of caution area (40-69)
    return 40 + Math.floor(Math.random() * 30);
  } else {
    // 30% chance of unsafe area (10-39)
    return 10 + Math.floor(Math.random() * 30);
  }
};

export const analyzeRouteSegments = (
  coordinates: Array<{ latitude: number; longitude: number }>,
  useImproved: boolean = false
): SafetySegment[] => {
  const segments: SafetySegment[] = [];
  const segmentSize = Math.max(5, Math.floor(coordinates.length / 15));

  for (let i = 0; i < coordinates.length - 1; i += segmentSize) {
    const endIndex = Math.min(i + segmentSize, coordinates.length - 1);
    const segmentCoords = coordinates.slice(i, endIndex + 1);

    const actualScore = useImproved ?
      70 + Math.floor(Math.random() * 31) : // Improved route: 70-100
      calculateSegmentSafetyScore(); // Normal distribution

    const safetyScore = actualScore >= 70 ? 3 : actualScore >= 40 ? 2 : 1;
    const safetyReason = getRandomSafetyReason(actualScore);

    segments.push({
      coordinates: segmentCoords,
      safetyScore: safetyScore as keyof typeof SAFETY_COLORS,
      color: SAFETY_COLORS[safetyScore as keyof typeof SAFETY_COLORS],
      safetyReason: safetyReason,
      actualScore: actualScore
    });
  }

  return segments;
};

export const calculateOverallSafetyScore = (segments: SafetySegment[]): number => {
  if (segments.length === 0) return 0;

  const totalScore = segments.reduce((sum, seg) => sum + (seg.actualScore || 50), 0);
  return Math.round(totalScore / segments.length);
};

// Generate alternative route by adding waypoints
export const generateAlternativeRoute = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  attemptNumber: number
): Array<{ latitude: number; longitude: number }> => {
  const waypoints = [start];

  const latDiff = (end.latitude - start.latitude) / 3;
  const lngDiff = (end.longitude - start.longitude) / 3;

  // Create offset waypoints based on attempt number
  const offsetMultiplier = attemptNumber * 0.015;

  if (attemptNumber === 1) {
    // First alternative: slight detour to the right
    waypoints.push({
      latitude: start.latitude + latDiff + offsetMultiplier,
      longitude: start.longitude + lngDiff - offsetMultiplier
    });
  } else if (attemptNumber === 2) {
    // Second alternative: detour to the left
    waypoints.push({
      latitude: start.latitude + latDiff - offsetMultiplier,
      longitude: start.longitude + lngDiff + offsetMultiplier
    });
  } else {
    // Third+ alternatives: wider detours
    const angle = (attemptNumber * 45) * Math.PI / 180;
    waypoints.push({
      latitude: start.latitude + latDiff + Math.cos(angle) * offsetMultiplier * 2,
      longitude: start.longitude + lngDiff + Math.sin(angle) * offsetMultiplier * 2
    });
  }

  // Add another waypoint closer to destination
  waypoints.push({
    latitude: start.latitude + latDiff * 2,
    longitude: start.longitude + lngDiff * 2
  });

  waypoints.push(end);

  return waypoints;
};