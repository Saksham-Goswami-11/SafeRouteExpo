# 🛡️ Technical Audit Report: Safe Route & Safety Score Logic
**Date:** 2025-12-18
**Subject:** Deep Dive Analysis of "Safe Path" Algorithms

## 1. Executive Summary
The application functionality is **PARTIALLY REAL**. 
- The **Routing Data** is real (sourced from Google Maps).
- The **Safety Scoring** is logic-driven but uses **Heuristics** (Time + Local Services) instead of historical crime data.
- It is **NOT** using dummy random numbers. Every score is calculated deterministically based on the user's context.

---

## 2. Detailed Algorithm Analysis

### A. The "Safety Score" Formula 🧮
**Source File:** `src/utils/aiSafetyAnalyzer.ts`

The "AI Score" is actually a weighted sum of two factors: **Time of Day** and **Proximity to Help**.

#### 1. Time Factor (Weight: ~70-95%)
The app checks the current device hour (`new Date().getHours()`) and assigns a base score:
- **Night Risk (10 PM - 5 AM):** Score = **40** (High Danger)
- **Evening Risk (7 PM - 9 PM):** Score = **70** (Moderate)
- **Daytime (All other times):** Score = **95** (Safe)

#### 2. Proximity Factor (Weight: 10-30%)
The app performs `searchNearbyPlaces` (Google Places API) for a 2km radius around the location:
- **Police Station Found:** Adds **+20 points**.
- **Hospital Found:** Adds **+10 points**.

#### 3. The Final Formula
```typescript
Final Score = Clamp(Time_Base_Score + Police_Bonus + Hospital_Bonus, 0, 100)
```
**Example Scenario:**
- It is **midnight** (Base: 40).
- User is near a **Police Station** (+20).
- **Final Score:** 60/100 (Caution).

---

### B. Route Generation & Selection 🗺️
**Source File:** `src/screens/MapScreen.tsx`

The "Safe Path" isn't a special API provided by Google. It is a filter built by the app on top of standard routes.

#### 1. Fetching Routes
The app queries the Google Directions API with `alternatives=true`:
```typescript
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=...&alternatives=true`;
```
This returns 2-3 possible ways to get to the destination.

#### 2. The Selection Loop
The code iterates through **every single step** of all returned routes:
1.  Decodes the route path points.
2.  Runs the **Safety Score Formula** (see above) on key segments of the road.
3.  Averages the score for the entire route.
4.  **Comparision Logic:** The app explicitly selects the route with the highest `averageSafetyScore`.

```typescript
if (score > bestScore) {
  bestScore = score;
  bestRoute = route; // This becomes the "Safe Path"
}
```

---

### C. "Danger Zones" (Red Lines on Map) ⚠️
The red/yellow/green lines are not static database entries. They are generated dynamically based on the score thresholds:

| Score Range | Color | Classification |
| :--- | :--- | :--- |
| **75 - 100** | 🟢 Green | Verified Safe |
| **40 - 74** | 🟡 Yellow | Caution |
| **0 - 39** | 🔴 Red | High Risk |

**Implication:** A "Red Zone" on the map simply means that specific stretch of road is currently deemed unsafe (e.g., it's night time and far from any police/hospital).

---

## 3. Code Evidence (Proof)

### Scoring Implementation
*From `src/utils/aiSafetyAnalyzer.ts`*:
```typescript
// Time Logic
if (hour >= 22 || hour <= 5) {
  timeScore = 40; // High risk at night
}

// Proximity Logic
const policeStations = await searchNearbyPlaces(latitude, longitude, 'police', 2000);
if (policeStations.length > 0) {
  placesScore += 20;
}
```

### Route Comparisons
*From `src/screens/MapScreen.tsx`*:
```typescript
// Analyze all routes
for (const route of routes) {
  // ... split into points ...
  const score = calculateAIOverallSafetyScore(segments);
  
  if (score > bestScore) {
    bestScore = score;
    bestRoute = route; // Winner!
  }
}
```

## 4. Conclusion
The system is honest. It does not fake the "Safe Path"; it genuinely calculates which of the available roads is *theoretically* safer based on the variables it has access to (Time and Emergency Services). It does not, however, know about actual crime history.
