import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useUserAuth } from '../hooks/useUserAuth';
import { useSidebar } from '../hooks/useSidebar';
import { Ionicons } from '@expo/vector-icons';

const NAV_ITEMS = [
  {
    name: 'Home',
    route: '/(tabs)/home',
    icon: 'home-outline',
    activeIcon: 'home',
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
  const { user, logout } = useUserAuth();
  const { closeSidebar } = useSidebar();

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
    const url = 'https://eventculture-backend.vercel.app/privacy/user';
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

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <View
      style={[
        styles.container,
        isDrawer ? styles.drawerContainer : styles.staticContainer,
        {
          paddingTop: Math.max(insets.top + 10, 20),
          paddingBottom: Math.max(insets.bottom + 10, 20),
        },
      ]}
    >
      {/* Top Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="ticket" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>EVENTCULTURE</Text>
            <Text style={styles.brandSubtitle}>ATTENDEE PORTAL</Text>
          </View>
        </View>

        {isDrawer && (
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Attendee Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Attendee'}
            </Text>
            <Text style={styles.userIdentifier} numberOfLines={1}>
              {user?.mobileNumber || user?.email || 'Participant'}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
          <Text style={styles.badgeText}>Verified Participant</Text>
        </View>
      </View>

      {/* Navigation Menu Items */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>MENU</Text>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route === '/(tabs)/home' && (pathname === '/' || pathname === '/(tabs)'));

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={20}
                  color={isActive ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                {item.name}
              </Text>
              {isActive && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Section with Privacy Policy & Sign Out */}
      <View style={styles.bottomSection}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    height: '100%',
    width: 260,
  },
  staticContainer: {
    width: 260,
  },
  drawerContainer: {
    width: 280,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7DBFE',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userIdentifier: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
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
  },
  iconWrapper: {
    width: 28,
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
    color: COLORS.primary,
    fontWeight: '800',
  },
  activePill: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  bottomSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  privacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorLight,
    gap: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
});
