import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AnimatedCard, AnimatedButton, AnimatedShapes } from '../components/AnimatedUI';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AnimatedShapes />

      <AnimatedCard delay={100} style={styles.cardWrapper}>
        <View style={styles.card}>
          <View style={styles.brandBadge}>
             <Text style={styles.brandBadgeText}>VELVET PORTAL</Text>
          </View>

          <Text style={styles.title}>OA Detection</Text>
          <Text style={styles.subtitle}>Enter your clinical workspace</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={theme.onSurfaceVariant}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.onSurfaceVariant}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <AnimatedButton
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <View style={styles.gradientSim}>
              {loading ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Authorize Access</Text>
              )}
            </View>
          </AnimatedButton>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Access Credentials</Text>
            <View style={styles.demoRow}>
               <Text style={styles.demoLabel}>Doctor</Text>
               <Text style={styles.demoValue}>doctor1 / doctor123</Text>
            </View>
            <View style={styles.demoRow}>
               <Text style={styles.demoLabel}>Patient</Text>
               <Text style={styles.demoValue}>patient1 / patient123</Text>
            </View>
          </View>
        </View>
      </AnimatedCard>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardWrapper: { width: '100%', maxWidth: 420 },
  card: { 
    backgroundColor: theme.surfaceContainer, 
    borderRadius: 32, 
    padding: 32, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: theme.outlineVariant
  },
  brandBadge: {
    backgroundColor: theme.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 20,
  },
  brandBadgeText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: theme.onSurface, 
    marginBottom: 8, 
    letterSpacing: -1,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 15, 
    color: theme.onSurfaceVariant, 
    marginBottom: 40, 
    fontWeight: '500', 
    letterSpacing: 0.2 
  },
  inputContainer: {
    width: '100%',
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden'
  },
  input: { 
    width: '100%', 
    padding: 20, 
    fontSize: 16, 
    color: theme.onSurface, 
    fontWeight: '500' 
  },
  button: { 
    width: '100%', 
    borderRadius: 20, 
    marginTop: 12,
    overflow: 'hidden',
  },
  gradientSim: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  buttonText: { color: theme.onPrimary, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  demoBox: { 
    marginTop: 40, 
    paddingTop: 32, 
    borderTopWidth: 1, 
    borderTopColor: theme.outlineVariant, 
    width: '100%' 
  },
  demoTitle: { 
    color: theme.onSurfaceVariant, 
    fontSize: 11, 
    fontWeight: '900', 
    marginBottom: 20, 
    textAlign: 'center', 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  demoLabel: { color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '700' },
  demoValue: { color: theme.onSurface, fontSize: 13, fontWeight: '600' },
});
