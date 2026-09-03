import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from '../hooks/useSidebar';
import { useEvent } from '../hooks/useEvent';
import { eventsApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    route: '/(tabs)/dashboard',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
  {
    name: 'Events',
    route: '/(tabs)/events',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    name: 'Participants',
    route: '/(tabs)/participants',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    name: 'Staff',
    route: '/(tabs)/staff',
    icon: 'briefcase-outline',
    activeIcon: 'briefcase',
  },
  {
    name: 'Guests',
    route: '/(tabs)/guest',
    icon: 'star-outline',
    activeIcon: 'star',
  },
  {
    name: 'Pass Types',
    route: '/(tabs)/passes',
    icon: 'ticket-outline',
    activeIcon: 'ticket',
  },
  {
    name: 'Volunteers',
    route: '/(tabs)/volunteers',
    icon: 'shield-outline',
    activeIcon: 'shield',
  },
  {
    name: 'Analytics',
    route: '/(tabs)/analytics',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  {
    name: 'Profile',
    route: '/(tabs)/profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export default function Sidebar({ isDrawer = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { closeSidebar } = useSidebar();
  const { selectedEvent } = useEvent();

  const isDesktop = width >= 768;

  const handleNavigate = (route) => {
    router.push(route);
    if (!isDesktop || isDrawer) {
      closeSidebar();
    }
  };

  const handleOpenPrivacy = async () => {
    if (!isDesktop || isDrawer) {
      closeSidebar();
    }
    const url = 'https://eventculture-backend.vercel.app/privacy/organizer';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Cannot open privacy URL:', error);
    }
  };

  const handleLogout = async () => {
    if (!isDesktop || isDrawer) {
      closeSidebar();
    }
    await logout();
    router.replace('/(auth)/login');
  };

  const handleClearData = async () => {
    if (!selectedEvent) return;
    Alert.alert(
      'Clear Event Data',
      `Are you sure you want to delete all participants, guests, staff, and passes for "${selectedEvent.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsApi.clearData(selectedEvent._id);
              Alert.alert('Success', 'All event data cleared successfully.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const organizerCode = user?.organizerCode || 'ORGANIZER';
  const folderName = user?.folderName || `organizer_${organizerCode.toLowerCase()}`;

  return (
    <Animated.View
      entering={FadeInLeft.duration(300)}
      style={[
        styles.container,
        isDrawer ? styles.drawerContainer : styles.staticContainer,
        {
          paddingTop: Math.max(insets.top + 8, 18),
          paddingBottom: Math.max(insets.bottom + 8, 18),
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>EVENTCULTURE</Text>
            <Text style={styles.brandSubtitle}>ORGANIZER PORTAL</Text>
          </View>
        </View>

        {isDrawer && (
          <TouchableOpacity
            onPress={closeSidebar}
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Organizer Workspace Tenant Card */}
      <View style={styles.workspaceCard}>
        <View style={styles.workspaceHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'O').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.workspaceInfo}>
            <Text style={styles.organizerName} numberOfLines={1}>
              {user?.name || 'Organizer'}
            </Text>
            <View style={styles.codeBadge}>
              <Ionicons name="key-outline" size={10} color={COLORS.primary} />
              <Text style={styles.codeBadgeText}>{organizerCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.folderRow}>
          <Ionicons name="folder" size={13} color={COLORS.primary} />
          <Text style={styles.folderText} numberOfLines={1}>
            {folderName}
          </Text>
        </View>
      </View>

      {/* Navigation Menu Items */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>NAVIGATION</Text>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route === '/(tabs)/dashboard' && (pathname === '/' || pathname === '/(tabs)'));

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              {isActive && <View style={styles.activePill} />}
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={19}
                  color={isActive ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.navItemText,
                  isActive && styles.navItemTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomSection}>
        {selectedEvent && (
          <TouchableOpacity
            onPress={handleClearData}
            activeOpacity={0.7}
            style={styles.clearDataBtn}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.clearDataText}>Clear Event Data</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleOpenPrivacy}
          activeOpacity={0.7}
          style={styles.privacyBtn}
        >
          <View style={styles.privacyIconWrapper}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.privacyText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white, // Solid pure white background
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
    height: '100%',
    width: 270,
  },
  staticContainer: {
    width: 270,
  },
  drawerContainer: {
    width: 290,
    backgroundColor: COLORS.white,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
    ...SHADOWS.lg,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...SHADOWS.sm,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workspaceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
  },
  workspaceInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  folderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
    marginBottom: 6,
    paddingHorizontal: SPACING.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginVertical: 2,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: COLORS.tintLight,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  iconWrapper: {
    width: 26,
    alignItems: 'center',
    marginRight: 10,
  },
  iconWrapperActive: {},
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  navItemTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  bottomSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  privacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  privacyIconWrapper: {
    width: 22,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
  clearDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  clearDataText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
});
