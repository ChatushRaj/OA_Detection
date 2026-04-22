
import React, { useRef, useState, useEffect, Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, PanResponder, BackHandler, ScrollView } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';


import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ScansScreen from './src/screens/ScansScreen';
import ScanDetailScreen from './src/screens/ScanDetailScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadScanScreen from './src/screens/UploadScanScreen';
import PatientsScreen from './src/screens/PatientsScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminLogsScreen from './src/screens/AdminLogsScreen';

// ── Global Error Boundary ──────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 24 }}>⚙️</Text>
          <Text style={{ color: '#e5e2e1', fontSize: 22, fontWeight: '900', marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 }}>Diagnostic Interrupt</Text>
          <Text style={{ color: '#c5c6cd', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22, fontWeight: '600' }}>{this.state.error?.message || 'An unexpected runtime suspension occurred.'}</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            activeOpacity={0.9}
            style={{ backgroundColor: '#45dfa4', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20 }}
          >
            <Text style={{ color: '#003825', fontWeight: '900', fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' }}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

function CustomDrawer({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme);
  const navRef = useNavigationContainerRef();
  const insets = useSafeAreaInsets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // PanResponder for swipe-to-close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isOpen && gestureState.dx < -20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 || gestureState.vx < -0.5) {
          toggleDrawer(false);
        }
      },
    })
  ).current;

  // Open / Close actions
  const toggleDrawer = (open: boolean) => {
    if (open) setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (!open) setIsOpen(false);
    });
  };

  useEffect(() => {
    const backAction = () => { if (isOpen) { toggleDrawer(false); return true; } return false; };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [isOpen]);

  const navTo = (route: string) => {
    toggleDrawer(false);
    navRef.navigate(route as never);
  };

  const DrawerItem = ({ icon, label, route }: { icon: string, label: string, route: string }) => {
    const active = currentRoute === route;
    return (
      <TouchableOpacity 
        style={[styles.drawerItem, active && styles.drawerItemActive]} 
        onPress={() => navTo(route)}
        activeOpacity={0.7}
      >
        <Text style={[styles.drawerIcon, active && { color: theme.primary }]}>{icon}</Text>
        <Text style={[styles.drawerLabel, active && { color: theme.onSurface }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.drawerContainer}>
      <NavigationContainer 
        ref={navRef}
        onStateChange={() => setCurrentRoute(navRef.getCurrentRoute()?.name || '')}
      >
        <Stack.Navigator screenOptions={{ 
            headerStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
            headerTintColor: theme.onBackground,
            headerTitleStyle: { fontWeight: '900', fontSize: 18 },
            contentStyle: { backgroundColor: theme.background },
            headerLeft: () => (
                <TouchableOpacity onPress={() => toggleDrawer(true)} style={styles.menuBtn} activeOpacity={0.6}>
                  <View style={[styles.menuBar, { backgroundColor: theme.onBackground }]} />
                  <View style={[styles.menuBar, { width: 14, marginTop: 6, backgroundColor: theme.onBackground }]} />
                </TouchableOpacity>
            )
        }}>
          {children}
        </Stack.Navigator>
      </NavigationContainer>

      {/* OVERLAY */}
      <Animated.View 
        style={[styles.overlay, { opacity: overlayAnim, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)' }]} 
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleDrawer(false)} activeOpacity={1}/>
      </Animated.View>

      {/* DRAWER MENU */}
      <Animated.View 
        {...panResponder.panHandlers}
        style={[styles.drawer, { backgroundColor: theme.surface, transform: [{ translateX: slideAnim }] }]}
      >
         <View style={[styles.drawerHeader, { paddingTop: insets.top + 40 }]}>
            <View style={styles.headerTopRow}>
               <View style={[styles.avatar, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>{(user?.full_name || 'U').charAt(0)}</Text>
               </View>
               <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: theme.surfaceContainerHigh }]}>
                  <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
               </TouchableOpacity>
            </View>
            <Text style={[styles.userName, { color: theme.onSurface }]}>{user?.full_name}</Text>
            <Text style={[styles.userRole, { color: theme.onSurfaceVariant }]}>{(user?.role || '').toUpperCase()}</Text>
         </View>

         <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
            <DrawerItem icon="🏠" label="Workspace" route="Dashboard" />
            <DrawerItem icon="🩻" label="Observations" route="Scans" />
            <DrawerItem icon="📤" label="Initial Analysis" route="Upload Scan" />
            {(user?.role === 'doctor' || user?.role === 'admin') && (
              <DrawerItem icon="👥" label="Patient Directory" route="Patients" />
            )}
            <DrawerItem icon="💬" label="Clinical Assistant" route="Chat Assistant" />
            
            {user?.role === 'admin' && (
              <>
                <View style={[styles.drawerSeparator, { backgroundColor: theme.outlineVariant }]} />
                <DrawerItem icon="⚙️" label="System Users" route="Manage Users" />
                <DrawerItem icon="📜" label="Audit Records" route="Audit Logs" />
              </>
            )}
            <View style={[styles.drawerSeparator, { backgroundColor: theme.outlineVariant }]} />
            <DrawerItem icon="👤" label="Identity Profile" route="Profile" />
         </ScrollView>

         <TouchableOpacity style={[styles.drawerFooter, { paddingBottom: insets.bottom + 40 }]} onPress={logout}>
            <Text style={[styles.logoutText, { color: theme.onSurfaceVariant }]}>Terminate Session</Text>
            <Text style={[styles.logoutIcon, { color: theme.onSurfaceVariant }]}>→</Text>
         </TouchableOpacity>
      </Animated.View>

      {/* FLOATING CHAT BUTTON */}
      {user && currentRoute !== 'Chat Assistant' && (
        <TouchableOpacity 
          style={[styles.fab, { bottom: insets.bottom + 24, backgroundColor: theme.primary }]} 
          activeOpacity={0.9}
          onPress={() => navTo('Chat Assistant')}
        >
          <View style={styles.fabInner}>
             <Text style={[styles.fabIcon, { color: theme.onPrimary }]}>💬</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  if (loading) return (
     <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
       <ActivityIndicator size="large" color={theme.primary} />
     </View>
  );

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // App with Sidebar
  return (
    <CustomDrawer>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'WORKSPACE' }} />
      <Stack.Screen name="Scans" component={ScansScreen} options={{ title: 'REPOSITORY' }} />
      <Stack.Screen name="ScanDetail" component={ScanDetailScreen} options={{ headerLeft: undefined, title: 'ANALYSIS' }}/>
      <Stack.Screen name="Upload Scan" component={UploadScanScreen} options={{ title: 'DIAGNOSTIC UNIT' }} />
      <Stack.Screen name="Patients" component={PatientsScreen} options={{ title: 'DIRECTORY' }} />
      <Stack.Screen name="Chat Assistant" component={ChatbotScreen} options={{ title: 'ASSISTANT' }} />
      <Stack.Screen name="Manage Users" component={AdminUsersScreen} options={{ title: 'SYSTEM ACCESS' }} />
      <Stack.Screen name="Audit Logs" component={AdminLogsScreen} options={{ title: 'PROTOCOL LOGS' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'IDENTITY' }} />
    </CustomDrawer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  drawerContainer: { flex: 1 },
  menuBtn: { marginLeft: 20, padding: 8 },
  menuBar: { width: 22, height: 2, borderRadius: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, zIndex: 20 },
  drawerHeader: { padding: 40, paddingBottom: 40 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  themeIcon: { fontSize: 20 },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarText: { fontSize: 32, fontWeight: '900' },
  userName: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  userRole: { fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800' },
  drawerContent: { flex: 1, paddingHorizontal: 24 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 20, marginBottom: 4 },
  drawerItemActive: { backgroundColor: theme.surfaceContainerHigh },
  drawerIcon: { fontSize: 20, marginRight: 20 },
  drawerLabel: { fontSize: 16, fontWeight: '800' },
  drawerSeparator: { height: 1, marginVertical: 12, marginHorizontal: 20 },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 32 },
  logoutText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  logoutIcon: { fontSize: 18, fontWeight: '300' },
  fab: {
    position: 'absolute', right: 24, width: 72, height: 72, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4
  },
  fabInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  fabIcon: { fontSize: 32 },
});
