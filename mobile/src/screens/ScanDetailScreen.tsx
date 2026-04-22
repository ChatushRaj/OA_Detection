import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { getScan, deleteScan, updateScan, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ScanDetailScreen({ route, navigation }: any) {
  const { scanId } = route.params;
  const { user, token } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ predicted_class: '', grade_index: '', notes: '' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadScan = async () => {
    try {
      const data = await getScan(scanId);
      setScan(data.scan || data);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadScan(); }, [scanId]);

  const openEdit = () => {
    setEditForm({
      predicted_class: scan.predicted_class || '',
      grade_index: scan.grade_index != null ? scan.grade_index.toString() : '',
      notes: scan.notes || ''
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateScan(scan.id, {
        predicted_class: editForm.predicted_class,
        grade_index: editForm.grade_index ? parseInt(editForm.grade_index) : null,
        notes: editForm.notes
      });
      setShowEdit(false);
      Alert.alert('Success', 'Scan updated successfully.');
      loadScan();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update scan');
    }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this scan record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteScan(scan.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete scan');
          }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Scan not found.</Text>
      </View>
    );
  }

  const isNormal = scan.predicted_class === 'Normal' || scan.predicted_class === 'Grade 0 \u2013 Normal';
  let sugg = null;
  try { sugg = typeof scan.suggestions === 'string' ? JSON.parse(scan.suggestions) : scan.suggestions; } catch {}

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.topHeader}>
           <Text style={styles.headerLabel}>CLINICAL OBSERVATION</Text>
           <Text style={styles.patientName}>{scan.patient_name || 'Anonymous'}</Text>
           <Text style={styles.dateText}>{scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'Unknown date'}</Text>
        </View>

        <View style={styles.imageCard}>
          <Image 
            source={{ 
              uri: `${BASE_URL}/api/scans/${scan.id}/image?token=${token}`,
              headers: { 'Bypass-Tunnel-Reminder': 'true' } 
            }} 
            style={styles.fullImage} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.resultRow}>
            <View>
              <Text style={styles.label}>PROVISIONAL DIAGNOSIS</Text>
              <Text style={styles.mainDiagnosis}>{scan.predicted_class || 'Pending'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>AI CONFIDENCE</Text>
              <Text style={[styles.confidenceScore, { color: theme.primary }]}>{scan.confidence != null ? `${(scan.confidence * 100).toFixed(1)}%` : 'N/A'}</Text>
            </View>
          </View>

          {sugg && Object.keys(sugg).length > 0 && (
            <View style={styles.suggestionsCard}>
              <Text style={styles.suggestionsTitle}>CLINICAL INSIGHTS</Text>
              {sugg?.summary && <Text style={styles.suggText}>{sugg.summary}</Text>}
              
              <View style={styles.metaRow}>
                 <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>GRADE</Text>
                    <Text style={styles.metaValue}>Level {scan.grade_index ?? 'N/A'}</Text>
                 </View>
                 <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>URGENCY</Text>
                    <Text style={[styles.metaValue, { color: sugg?.urgency?.toLowerCase() === 'high' ? theme.error : theme.onSurface }]}>{sugg.urgency || 'Normal'}</Text>
                 </View>
              </View>
            </View>
          )}

          {scan.notes ? (
            <View style={styles.notesSection}>
               <Text style={styles.label}>PRACTITIONER NOTES</Text>
               <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{scan.notes}</Text>
               </View>
            </View>
          ) : null}

          {/* ACTION BUTTONS (Doctor/Admin) */}
          {(user?.role === 'admin' || user?.role === 'doctor') && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnEdit} onPress={openEdit} activeOpacity={0.8}>
                <View style={styles.gradientSim}>
                  <Text style={styles.actionBtnText}>Update Record</Text>
                </View>
              </TouchableOpacity>
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.actionBtnDelete} onPress={handleDelete} activeOpacity={0.8}>
                  <Text style={styles.deleteBtnText}>Purge Data</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.View>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} animationType="fade" transparent>
        <KeyboardAvoidingView style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0,0,0,0.5)' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Modify Observation</Text>
               <TouchableOpacity onPress={() => setShowEdit(false)}>
                  <Text style={styles.closeIcon}>✕</Text>
               </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Classification</Text>
            <TextInput 
                style={styles.input} 
                value={editForm.predicted_class} 
                onChangeText={t => setEditForm({...editForm, predicted_class: t})} 
                placeholderTextColor={theme.onSurfaceVariant} 
            />
            
            <Text style={styles.modalLabel}>Severity Level (0-4)</Text>
            <TextInput 
                style={styles.input} 
                value={editForm.grade_index} 
                onChangeText={t => setEditForm({...editForm, grade_index: t})} 
                keyboardType="number-pad" 
                placeholderTextColor={theme.onSurfaceVariant} 
            />
            
            <Text style={styles.modalLabel}>Clinical Notes</Text>
            <TextInput 
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
                value={editForm.notes} 
                onChangeText={t => setEditForm({...editForm, notes: t})} 
                multiline 
                placeholderTextColor={theme.onSurfaceVariant} 
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleUpdate} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.modalSaveText}>Commit Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  topHeader: { marginTop: 20, marginBottom: 32 },
  headerLabel: { fontSize: 10, color: theme.primary, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  patientName: { color: theme.onSurface, fontSize: 36, fontWeight: '900', letterSpacing: -1.5, marginBottom: 4 },
  dateText: { color: theme.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  
  imageCard: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 32,
    width: '100%',
    height: 360,
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.outlineVariant
  },
  fullImage: { width: '100%', height: '100%', opacity: 0.9 },
  
  infoSection: {},
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 48 },
  label: { color: theme.onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '900', marginBottom: 16 },
  mainDiagnosis: { color: theme.onSurface, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  confidenceScore: { fontSize: 32, fontWeight: '900', letterSpacing: -1, textAlign: 'right' },
  
  suggestionsCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
  },
  suggestionsTitle: { color: theme.primary, fontSize: 11, fontWeight: '900', marginBottom: 16, letterSpacing: 2 },
  suggText: { color: theme.onSurface, fontSize: 15, marginBottom: 24, lineHeight: 24, fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 40 },
  metaItem: {},
  metaLabel: { fontSize: 9, color: theme.onSurfaceVariant, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  metaValue: { color: theme.onSurface, fontSize: 16, fontWeight: '800' },
  
  notesSection: { marginBottom: 40 },
  notesBox: {
    backgroundColor: theme.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
  },
  notesText: { color: theme.onSurfaceVariant, lineHeight: 24, fontSize: 15, fontWeight: '500' },
  errorText: { color: theme.error, fontSize: 16, fontWeight: '600' },
  
  actionRow: { marginTop: 8, gap: 16 },
  actionBtnEdit: { 
    borderRadius: 20, 
    overflow: 'hidden',
    backgroundColor: theme.primary,
  },
  actionBtnDelete: {
     paddingVertical: 12,
     paddingHorizontal: 20,
     marginTop: 12,
     alignItems: 'center',
  },
  gradientSim: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionBtnText: { color: theme.onPrimary, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  deleteBtnText: { color: theme.error, fontWeight: '800', fontSize: 14, textAlign: 'center', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: theme.surface, 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    padding: 32,
    borderWidth: 1,
    borderColor: theme.outlineVariant
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: theme.onSurface, fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  closeIcon: { color: theme.onSurfaceVariant, fontSize: 20, fontWeight: '300' },
  modalLabel: { color: theme.onSurfaceVariant, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: '900' },
  input: { backgroundColor: theme.surfaceContainerHigh, borderRadius: 20, padding: 20, color: theme.onSurface, fontSize: 16, fontWeight: '600', marginBottom: 28 },
  modalActions: { marginTop: 12 },
  modalBtnSave: { backgroundColor: theme.primary, borderRadius: 16, padding: 20, alignItems: 'center' },
  modalSaveText: { color: theme.onPrimary, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
});
;
