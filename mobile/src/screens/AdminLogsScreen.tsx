import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { getAuditLogs } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function AdminLogsScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data.logs || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { 
    fetchLogs(); 
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fetchLogs, fadeAnim]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.action}>{item.action}</Text>
      <Text style={styles.resource}>{item.resource} — User {item.user_id || 'System'}</Text>
      <Text style={styles.ip}>IP: {item.ip_address}</Text>
      <Text style={styles.timestamp}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audit Logs</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={logs}
            keyExtractor={i => String(i.id)}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} tintColor={theme.primary} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 24, paddingTop: 60 },
  title: { color: theme.onSurface, fontSize: 36, fontWeight: '900', marginBottom: 32, letterSpacing: -1.5 },
  card: { backgroundColor: theme.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.outlineVariant },
  action: { color: theme.onSurface, fontSize: 17, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  resource: { color: theme.onSurfaceVariant, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  ip: { color: theme.outline, fontSize: 12, fontWeight: '700' },
  timestamp: { color: theme.primary, fontSize: 10, alignSelf: 'flex-start', marginTop: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
});
