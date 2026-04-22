import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPatients, getScans, BASE_URL } from '../services/api';
import { AnimatedCard, AnimatedButton, AnimatedShapes } from '../components/AnimatedUI';

export default function DashboardScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [stats, setStats] = useState({ totalPatients: 0, totalScans: 0, criticalScans: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      if (user?.role === 'doctor' || user?.role === 'admin') {
        const pData = await getPatients();
        const sData = await getScans();
        setStats({
          totalPatients: pData.patients?.length || 0,
          totalScans: sData.scans?.length || 0,
          criticalScans: (sData.scans || []).filter((s: any) => s.grade_index >= 3).length,
        });
        setRecentScans((sData.scans || []).slice(0, 3));
      } else {
        const sData = await getScans();
        setStats({
          totalPatients: 0,
          totalScans: sData.scans?.length || 0,
          criticalScans: (sData.scans || []).filter((s: any) => s.grade_index >= 3).length,
        });
        setRecentScans((sData.scans || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Dash fetch error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderScan = ({ item, index }: { item: any, index: number }) => (
    <AnimatedCard delay={100 + index * 50}>
      <AnimatedButton 
        style={styles.scanCard}
        onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
      >
        <View style={styles.scanImagePlaceholder}>
          <Image 
            source={{ 
              uri: `${BASE_URL}/api/scans/${item.id}/image?token=${token}`,
              headers: { 'Bypass-Tunnel-Reminder': 'true' } 
            }} 
            style={styles.thumbnailImage} 
          />
        </View>
        <View style={styles.scanInfo}>
          <Text style={styles.scanTitle}>Patient: {item.patient_name || 'Self'}</Text>
          <Text style={styles.scanDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: item.predicted_class === 'Normal' ? theme.surfaceContainerLowest : theme.errorContainer }]}>
              <Text style={[styles.badgeText, { color: item.predicted_class === 'Normal' ? theme.primary : theme.onError }]}>{item.predicted_class || 'Pending'}</Text>
            </View>
            <Text style={styles.confidence}>{item.confidence != null ? `${(item.confidence * 100).toFixed(0)}% Match` : 'Pending'}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </AnimatedButton>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <AnimatedShapes />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={recentScans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderScan}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerArea}>
              <AnimatedCard delay={0}>
                <View style={styles.topRow}>
                   <View>
                     <Text style={styles.greeting}>WORKSPACE</Text>
                     <Text style={styles.name}>{user?.full_name?.split(' ')[0]}</Text>
                   </View>
                   <View style={styles.avatarPlaceholder}>
                     <Text style={styles.avatarText}>{user?.full_name?.charAt(0)}</Text>
                   </View>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, styles.statBox1]}>
                    <Text style={styles.statLabel}>TOTAL SCANS</Text>
                    <Text style={styles.statValue}>{stats.totalScans}</Text>
                  </View>
                  {(user?.role === 'doctor' || user?.role === 'admin') && (
                    <View style={[styles.statBox, styles.statBox2]}>
                      <Text style={styles.statLabel}>PATIENTS</Text>
                      <Text style={styles.statValue}>{stats.totalPatients}</Text>
                    </View>
                  )}
                  <View style={[styles.statBox, styles.statBox3, user?.role === 'patient' && { flex: 1 }]}>
                    <Text style={styles.statLabel}>CRITICAL</Text>
                    <Text style={[styles.statValue, { color: theme.primary }]}>{stats.criticalScans}</Text>
                  </View>
                </View>
              </AnimatedCard>

              <AnimatedCard delay={50}>
                <AnimatedButton 
                  style={styles.uploadBtn}
                  onPress={() => navigation.navigate('Upload Scan')}
                >
                  <View style={styles.uploadBtnInner}>
                    <Text style={styles.uploadBtnText}>Initialize New Analysis</Text>
                    <Text style={styles.uploadBtnIcon}>→</Text>
                  </View>
                </AnimatedButton>
              </AnimatedCard>

              <AnimatedCard delay={100}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Observations</Text>
                  <AnimatedButton style={{ padding: 4 }} onPress={() => navigation.navigate('Scans')}>
                    <Text style={styles.seeAll}>Archive</Text>
                  </AnimatedButton>
                </View>
              </AnimatedCard>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Empty repository.</Text>
          }
        />
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  listContent: { paddingBottom: 40 },
  headerArea: { padding: 24, paddingTop: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 11, color: theme.primary, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  name: { fontSize: 42, fontWeight: '900', color: theme.onSurface, letterSpacing: -1.5 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.onSurface, fontWeight: '800', fontSize: 18 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  statBox: { 
    flex: 1, 
    borderRadius: 20, 
    padding: 20, 
    backgroundColor: theme.surfaceContainerLow,
  },
  statBox1: {},
  statBox2: {},
  statBox3: {},
  
  statValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1, color: theme.onSurface },
  statLabel: { fontSize: 9, color: theme.onSurfaceVariant, fontWeight: '900', marginBottom: 8, letterSpacing: 1.5 },

  uploadBtn: {
    backgroundColor: theme.primary,
    borderRadius: 24,
    marginBottom: 48,
    overflow: 'hidden',
  },
  uploadBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  uploadBtnText: { color: theme.onPrimary, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  uploadBtnIcon: { color: theme.onPrimary, fontSize: 24, fontWeight: '300' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: theme.onSurface, letterSpacing: -0.5 },
  seeAll: { color: theme.onSurfaceVariant, fontWeight: '800', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },

  scanCard: {
    backgroundColor: theme.surfaceContainer,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanImagePlaceholder: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: theme.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center', marginRight: 20, overflow: 'hidden'
  },
  thumbnailImage: { width: '100%', height: '100%', opacity: 0.8 },
  scanInfo: { flex: 1 },
  scanTitle: { color: theme.onSurface, fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  scanDate: { color: theme.onSurfaceVariant, fontSize: 12, marginBottom: 12, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  confidence: { color: theme.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  chevron: { color: theme.outline, fontSize: 24, fontWeight: '300', marginLeft: 8 },

  emptyText: { color: theme.onSurfaceVariant, textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
