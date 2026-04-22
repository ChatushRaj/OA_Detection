import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getScans, BASE_URL } from '../services/api';
import { AnimatedCard, AnimatedButton, AnimatedShapes } from '../components/AnimatedUI';

export default function ScansScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getScans();
      setScans(data.scans || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDelete = (s: any) => {
    Alert.alert("Confirm Delete", "Delete this scan permanently?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const { deleteScan } = await import('../services/api');
            await deleteScan(s.id);
            fetchScans();
          } catch(e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const renderScan = ({ item, index }: { item: any, index: number }) => {
    const isNormal = item.predicted_class === 'Normal';
    return (
      <AnimatedCard delay={index * 50}>
        <AnimatedButton 
          style={styles.card}
          onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
        >
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.scanImagePlaceholder}>
              <Image 
                source={{ 
                  uri: `${BASE_URL}/api/scans/${item.id}/image?token=${token}`,
                  headers: { 'Bypass-Tunnel-Reminder': 'true' } 
                }} 
                style={styles.thumbnailImage} 
              />
            </View>
            <View style={{ flex: 1, paddingVertical: 4 }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{item.patient_name || 'Self'}</Text>
                  <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}</Text>
                </View>
                {user?.role === 'admin' && (
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
                    <Text style={{fontSize: 14}}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.badge, { backgroundColor: isNormal ? theme.surfaceContainerLowest : theme.errorContainer }]}>
                  <Text style={[styles.badgeText, { color: isNormal ? theme.primary : theme.onError }]}>
                    {item.predicted_class || 'Pending'}
                  </Text>
                </View>
                <Text style={styles.confidence}>{item.confidence != null ? `${(item.confidence * 100).toFixed(0)}% Match` : 'Pending'}</Text>
              </View>
            </View>
          </View>
        </AnimatedButton>
      </AnimatedCard>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedShapes />
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderScan}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchScans(); }} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.title}>All Database Scans</Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No scans available.</Text>
          }
        />
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  listContent: { padding: 24, paddingBottom: 100 },
  title: { fontSize: 36, fontWeight: '900', color: theme.onSurface, marginBottom: 20, letterSpacing: -1.5, paddingTop: 20 },
  card: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.outlineVariant
  },
  scanImagePlaceholder: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: theme.surfaceContainerHigh,
    marginRight: 20, overflow: 'hidden'
  },
  thumbnailImage: { width: '100%', height: '100%', opacity: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  patientName: { color: theme.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  date: { color: theme.onSurfaceVariant, fontSize: 12, fontWeight: '600', marginTop: 2 },
  delBtn: { padding: 10, backgroundColor: theme.surfaceContainerHighest, borderRadius: 12 },
  cardBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  confidence: { color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '700' },
  empty: { color: theme.onSurfaceVariant, textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
