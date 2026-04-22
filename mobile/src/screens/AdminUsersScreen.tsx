import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function AdminUsersScreen() {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "patient", full_name: "", email: "" });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (e: any) {
      console.error('Fetch users error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { 
    fetchUsers(); 
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [fetchUsers, fadeAnim, slideAnim]);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ username: "", password: "", role: "patient", full_name: "", email: "" });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({ username: u.username, password: "", role: u.role, full_name: u.full_name, email: u.email || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || (!editingUser && !form.password) || !form.full_name) {
      Alert.alert('Error', 'Username, full name, and (for new users) password are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, form);
        Alert.alert('Success', 'User updated successfully.');
      } else {
        await createUser(form);
        Alert.alert('Success', 'User created successfully.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (u: any) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete user ${u.full_name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteUser(u.id);
            fetchUsers();
          } catch (err: any) { Alert.alert('Error', err.message || "Failed to delete"); }
      }}
    ]);
  };

  const filtered = users.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'admin': return { bg: theme.errorContainer, text: theme.onError };
      case 'doctor': return { bg: theme.secondaryContainer, text: theme.onSecondaryContainer };
      default: return { bg: theme.surfaceContainerHighest, text: theme.primary };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const rStyle = getRoleStyle(item.role);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.full_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: rStyle.bg }]}>
              <Text style={[styles.roleText, { color: rStyle.text }]}>{item.role.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.detailText}>@{item.username}</Text>
        <Text style={styles.detailText}>{item.email || 'No email provided'}</Text>
        <Text style={styles.dateText}>Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TextInput style={styles.searchInput} placeholder="Search users by name..." placeholderTextColor={theme.onSurfaceVariant} value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ New User</Text>
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={theme.primary} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        </Animated.View>
      )}

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? "Edit User" : "Create New User"}</Text>
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={form.full_name} onChangeText={(t) => setForm({...form, full_name: t})} placeholder="John Doe" placeholderTextColor={theme.onSurfaceVariant} />

              <Text style={styles.label}>Username *</Text>
              <TextInput style={styles.input} value={form.username} onChangeText={(t) => setForm({...form, username: t})} placeholder="johndoe123" placeholderTextColor={theme.onSurfaceVariant} autoCapitalize="none" />

              <Text style={styles.label}>{editingUser ? "Change Password (optional)" : "Password *"}</Text>
              <TextInput style={styles.input} value={form.password} onChangeText={(t) => setForm({...form, password: t})} secureTextEntry placeholder="***" placeholderTextColor={theme.onSurfaceVariant} />

              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({...form, email: t})} placeholder="john@example.com" placeholderTextColor={theme.onSurfaceVariant} keyboardType="email-address" autoCapitalize="none" />
              
              <Text style={styles.label}>Role</Text>
              <View style={styles.rolePickerRow}>
                {['patient', 'doctor', 'admin'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]} onPress={() => setForm({...form, role: r})}>
                    <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={theme.onPrimary} /> : <Text style={styles.saveBtnText}>{editingUser ? "Save Changes" : "Create User"}</Text>}
              </TouchableOpacity>
            </View>
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
  name: { color: theme.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginTop: 12 },
  roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  delBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.errorContainer, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { fontSize: 16 },
  detailText: { color: theme.onSurfaceVariant, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  dateText: { color: theme.outline, fontSize: 11, marginTop: 12, fontWeight: '800', letterSpacing: 0.5 },
  emptyText: { color: theme.onSurfaceVariant, textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, borderWidth: 1, borderColor: theme.outlineVariant },
  modalTitle: { color: theme.onSurface, fontSize: 26, fontWeight: '900', marginBottom: 32, letterSpacing: -1 },
  label: { color: theme.onSurfaceVariant, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, marginTop: 16, letterSpacing: 1.5 },
  input: { backgroundColor: theme.surfaceContainerHigh, borderRadius: 16, padding: 20, color: theme.onSurface, fontSize: 16, fontWeight: '600' },
  
  rolePickerRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 18, borderRadius: 16, backgroundColor: theme.surfaceContainerLow, alignItems: 'center' },
  roleBtnActive: { backgroundColor: theme.primary },
  roleBtnText: { color: theme.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  roleBtnTextActive: { color: theme.onPrimary, fontWeight: '900' },

  modalActions: { gap: 12, marginTop: 40 },
  cancelBtn: { paddingVertical: 18, alignItems: 'center' },
  cancelBtnText: { color: theme.onSurfaceVariant, fontWeight: '800', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: theme.onPrimary, fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
});
