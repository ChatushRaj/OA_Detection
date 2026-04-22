import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile } from '../services/api';

export default function ProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (fullName !== user?.full_name) payload.full_name = fullName;
      if (email !== user?.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        Alert.alert('Info', 'No changes made.');
        setLoading(false);
        return;
      }

      await updateProfile(payload);
      await refreshProfile();
      setPassword('');
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.full_name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>@{user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor={theme.onSurfaceVariant} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.onSurfaceVariant} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password (Optional)</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Leave blank to keep current" placeholderTextColor={theme.onSurfaceVariant} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  headerCard: { 
    alignItems: 'center', 
    backgroundColor: theme.surfaceContainer, 
    padding: 40, 
    borderRadius: 32, 
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.outlineVariant
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: theme.surfaceContainerHigh, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.outlineVariant
  },
  avatarText: { fontSize: 44, fontWeight: '900', color: theme.primary, letterSpacing: -2 },
  username: { fontSize: 28, fontWeight: '900', color: theme.onSurface, marginBottom: 12, letterSpacing: -1.5 },
  roleBadge: { backgroundColor: theme.surfaceContainerHighest, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  roleText: { color: theme.onSurfaceVariant, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  
  formContainer: { backgroundColor: theme.surfaceContainerLow, padding: 24, borderRadius: 32, borderWidth: 1, borderColor: theme.outlineVariant },
  formGroup: { marginBottom: 28 },
  label: { color: theme.onSurfaceVariant, fontSize: 10, marginBottom: 12, marginLeft: 4, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  input: { backgroundColor: theme.surfaceContainerHigh, borderRadius: 20, padding: 20, color: theme.onSurface, fontSize: 16, fontWeight: '600' },
  
  saveBtn: { 
    backgroundColor: theme.primary, 
    padding: 24, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 16,
  },
  saveBtnText: { color: theme.onPrimary, fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});
