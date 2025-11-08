import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { analyzeAreaSafetyFromNews, SafetyAnalysisResult } from '../utils/newsSafetyAnalyzer';
import { useTheme } from '../context/ThemeContext';

const TEST_LOCATION = {
  // A location in Mumbai, India
  latitude: 19.0760,
  longitude: 72.8777,
};
const TEST_RADIUS_KM = 5; // 5 km radius

export default function NewsAnalyzerTester() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafetyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const analysisResult = await analyzeAreaSafetyFromNews(
        TEST_LOCATION.latitude,
        TEST_LOCATION.longitude,
        TEST_RADIUS_KM
      );
      setResult(analysisResult);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>News Safety Analyzer Test</Text>
      <Text style={styles.description}>
        Press the button to test the safety analysis for a sample location in Mumbai.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handlePress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Analysis</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <Text style={styles.score}>Safety Score: {result.safetyScore} / 100</Text>
          <Text style={styles.headlinesTitle}>Contributing Headlines:</Text>
          <ScrollView style={styles.headlinesContainer}>
            {result.contributingHeadlines.map((headline, index) => (
              <Text key={index} style={styles.headline}>
                {index + 1}: {headline}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>An Error Occurred</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: colors.backgroundCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  headlinesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  headlinesContainer: {
    maxHeight: 150,
  },
  headline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  errorContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.danger,
    borderRadius: 5,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorMessage: {
    fontSize: 14,
    color: '#fff',
  },
});
