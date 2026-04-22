import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { getPatients, createPatient, updatePatient } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { AnimatedCard, AnimatedShapes } from '../components/AnimatedUI';

export default function PatientsScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "" });
  const [createdCreds, setCreatedCreds] = useState<{username: string, password: string} | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchPatients = useCallback(async () => {
    try {
      const data = await getPatients();
      setPatients(data.patients || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { 
    fetchPatients(); 
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [fetchPatients, fadeAnim, slideAnim]);

  const openAdd = () => {
    setEditingPatient(null);
    setForm({ name: "", age: "", gender: "Male", phone: "" });
    setCreatedCreds(null);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditingPatient(p);
    setForm({ name: p.name, age: p.age?.toString() || "", gender: p.gender || "Male", phone: p.phone || "" });
    setCreatedCreds(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, age: form.age ? parseInt(form.age) : null, gender: form.gender, phone: form.phone };
      if (editingPatient) {
        await updatePatient(editingPatient.id, payload);
        setShowModal(false);
        Alert.alert('Success', 'Patient updated successfully.');
      } else {
        const res = await createPatient(payload);
        if (res.patient && res.patient.credentials) setCreatedCreds(res.patient.credentials);
        else { setShowModal(false); Alert.alert('Success', 'Patient added successfully.'); }
      }
      fetchPatients();
    } catch (err: any) {
      Alert.alert('Error', err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = (p: any) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete patient ${p.name}? This will also delete all their scan records.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const { deletePatient } = await import('../services/api');
            await deletePatient(p.id);
            fetchPatients();
          } catch (err: any) { Alert.alert('Error', err.message || "Failed to delete patient"); }
        }
      }
    ]);
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedCard delay={index * 50}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.age ? `${item.age}y` : ""} {item.gender || ""}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
              <Text style={styles.delBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          {item.phone ? <Text style={styles.detailsText}>📞 {item.phone}</Text> : null}
          <Text style={styles.detailsText}>🔬 <Text style={{fontWeight:'700'}}>{item.scan_count || 0}</Text> scan(s)</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <AnimatedShapes />
      <Animated.View style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TextInput style={styles.searchInput} placeholder="Search patients..." placeholderTextColor={theme.onSurfaceVariant} value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add New</Text>
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPatients(); }} tintColor={theme.primary} />}
            ListEmptyComponent={<Text style={styles.empty}>No patients found. Click Add to get started.</Text>}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        </Animated.View>
      )}

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingPatient ? "Edit Patient" : "New Patient"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {createdCreds ? (
              <View style={styles.credsSuccess}>
                <Text style={styles.credsTitle}>Patient added successfully!</Text>
                <View style={styles.credsBox}>
                  <Text style={styles.credsText}><Text style={{fontWeight:'800', color: theme.primary}}>Username:</Text> {createdCreds.username}</Text>
                  <Text style={styles.credsText}><Text style={{fontWeight:'800', color: theme.primary}}>Password:</Text> {createdCreds.password}</Text>
                </View>
                <Text style={styles.credsWarn}>Share these credentials securely. They can now log in.</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} placeholder="Jane Doe" placeholderTextColor={theme.onSurfaceVariant} />

                <View style={styles.modalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} value={form.age} onChangeText={(t) => setForm({...form, age: t})} placeholder="45" placeholderTextColor={theme.onSurfaceVariant} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female'].map((g) => (
                        <TouchableOpacity key={g} style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]} onPress={() => setForm({...form, gender: g})}>
                          <Text style={[styles.genderBtnText, form.gender === g && styles.genderBtnTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} placeholder="(Optional) Phone number" placeholderTextColor={theme.onSurfaceVariant} keyboardType="phone-pad" />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} disabled={saving}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color={theme.onPrimary} /> : <Text style={styles.saveBtnText}>{editingPatient ? "Update" : "Save Patient"}</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 12, paddingTop: 20 },
  searchInput: { flex: 1, backgroundColor: theme.surfaceContainer, borderRadius: 20, padding: 20, color: theme.onSurface, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: theme.outlineVariant },
  addButton: { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 18, borderRadius: 20, justifyContent: 'center' },
  addButtonText: { color: theme.onPrimary, fontWeight: '900', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  
  card: { backgroundColor: theme.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.outlineVariant },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.primary, fontSize: 18, fontWeight: '900' },
  name: { color: theme.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  meta: { color: theme.onSurfaceVariant, fontSize: 12, marginTop: 4, fontWeight: '600' },
  editBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: theme.surfaceContainerHighest, borderRadius: 12 },
  editBtnText: { color: theme.primary, fontSize: 13, fontWeight: '800' },
  delBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: theme.errorContainer, borderRadius: 12 },
  delBtnText: { color: theme.error, fontSize: 14 },
  
  detailsRow: { flexDirection: 'row', gap: 20, padding: 4 },
  detailsText: { color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  empty: { color: theme.onSurfaceVariant, textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, borderWidth: 1, borderColor: theme.outlineVariant },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: theme.onSurface, fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  closeIcon: { color: theme.onSurfaceVariant, fontSize: 20, fontWeight: '300' },
  
  label: { color: theme.onSurfaceVariant, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, marginTop: 16, letterSpacing: 1.5 },
  input: { backgroundColor: theme.surfaceContainerHigh, borderRadius: 16, padding: 20, color: theme.onSurface, fontSize: 16, fontWeight: '600' },
  modalRow: { flexDirection: 'row', gap: 16 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, paddingVertical: 18, borderRadius: 16, backgroundColor: theme.surfaceContainerLow, alignItems: 'center' },
  genderBtnActive: { backgroundColor: theme.primary },
  genderBtnText: { color: theme.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  genderBtnTextActive: { color: theme.onPrimary, fontWeight: '900' },

  modalActions: { gap: 12, marginTop: 40 },
  cancelBtn: { paddingVertical: 18, alignItems: 'center' },
  cancelBtnText: { color: theme.onSurfaceVariant, fontWeight: '800', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: theme.onPrimary, fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },

  // Credentials view
  credsSuccess: { alignItems: 'center', paddingVertical: 10 },
  credsTitle: { color: theme.primary, fontSize: 20, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  credsBox: { backgroundColor: theme.surfaceContainerHigh, borderRadius: 20, padding: 24, width: '100%', marginBottom: 20 },
  credsText: { color: theme.onSurface, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 16, marginBottom: 12 },
  credsWarn: { color: theme.onSurfaceVariant, fontSize: 13, backgroundColor: theme.surfaceContainerLowest, padding: 20, borderRadius: 16, textAlign: 'center', marginBottom: 32, fontWeight: '600', lineHeight: 22 },
  doneBtn: { backgroundColor: theme.primary, width: '100%', paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  doneBtnText: { color: theme.onPrimary, fontWeight: '900', fontSize: 17 },
});
