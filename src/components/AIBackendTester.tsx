import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { runFullDiagnostic, testBackendHealth, getFixSuggestions } from '../utils/aiDebugTool';

/**
 * AI Backend Tester Component
 * Use this component to debug and test your AI backend
 */
export default function AIBackendTester() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const styles = makeStyles(colors);

  const runTest = async (testType: string) => {
    setIsLoading(true);
    setTestResults('');
    
    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    let capturedOutput = '';

    const captureLog = (message: any) => {
      capturedOutput += message + '\n';
      originalLog(message);
    };

    const captureError = (message: any) => {
      capturedOutput += `ERROR: ${message}\n`;
      originalError(message);
    };

    const captureWarn = (message: any) => {
      capturedOutput += `WARNING: ${message}\n`;
      originalWarn(message);
    };

    console.log = captureLog;
    console.error = captureError;
    console.warn = captureWarn;

    try {
      switch (testType) {
        case 'health':
          await testBackendHealth();
          break;
        case 'full':
          await runFullDiagnostic();
          break;
        case 'suggestions':
          getFixSuggestions();
          break;
      }
    } catch (error) {
      capturedOutput += `\nTest failed: ${error}`;
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      setTestResults(capturedOutput);
      setIsLoading(false);
    }
  };

  const testManualEndpoint = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing manual endpoint...');
      
      const response = await fetch('https://amba-analyzer-backend.onrender.com/analyze-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            { latitude: 28.6139, longitude: 77.2090 },
            { latitude: 28.6150, longitude: 77.2100 }
          ],
          analysisType: 'route',
          includeNews: true,
          includeCrimeData: true
        })
      });

      const result = await response.text();
      
      Alert.alert(
        'Manual Test Result',
        `Status: ${response.status}\nResponse: ${result.substring(0, 200)}...`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Manual Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 AI Backend Tester</Text>
      <Text style={styles.subtitle}>Debug your AI backend endpoints</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => runTest('health')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🏥 Test Health</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => runTest('full')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔍 Full Diagnostic</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testManualEndpoint}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧪 Manual Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => runTest('suggestions')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>💡 Fix Suggestions</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Running diagnostic...</Text>
        </View>
      )}

      {testResults && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📋 Test Results:</Text>
          <Text style={styles.resultsText}>{testResults}</Text>
        </ScrollView>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Backend URL:</Text>
        <Text style={styles.infoUrl}>https://amba-analyzer-backend.onrender.com</Text>
        
        <Text style={styles.infoTitle}>Expected Endpoint:</Text>
        <Text style={styles.infoUrl}>/analyze-route</Text>
        
        <Text style={styles.quickFix}>
          💡 Quick Fix: If you get 404 errors, your backend might use different endpoints like:
          {'\n'}• /api/analyze-route
          {'\n'}• /route/analyze
          {'\n'}• /analyze
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    margin: 5,
    minWidth: 150,
  },
  buttonText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.text,
    marginTop: 10,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  resultsText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: colors.backgroundCard,
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  infoUrl: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  quickFix: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
});