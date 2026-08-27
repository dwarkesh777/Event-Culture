import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useUserAuth } from '../../hooks/useUserAuth';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

export default function UserProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUserAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of your EventCulture participant account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
    <View style={styles.container}>
      <Header title="Profile" subtitle="Attendee identity & credentials" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, SHADOWS.md]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{user?.name || 'Attendee'}</Text>
          <Text style={styles.email}>{user?.email || 'participant@eventculture.io'}</Text>

          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.statusPillText}>Verified Participant</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>Contact & Identifiers</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered Mobile</Text>
            <Text style={styles.detailValue}>{user?.mobileNumber || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered Email</Text>
            <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Security Access</Text>
            <Text style={[styles.detailValue, { color: COLORS.primary }]}>
              Fast Dynamic QR Verification
            </Text>
          </View>
        </View>

        {/* Brand Info */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>EventCulture Platform</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Version</Text>
            <Text style={styles.detailValue}>1.0 (Expo SDK 54)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Experience</Text>
            <Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: '700' }]}>
              ONE SCAN. ZERO QUEUES.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: 10,
    gap: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    height: 52,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    gap: 8,
  },
  logoutBtnText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
