import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useVolunteerAuth } from '../../hooks/useVolunteerAuth';
import Header from '../../components/Header';
import OrganizerSwitcherModal from '../../components/OrganizerSwitcherModal';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerProfileScreen() {
  const router = useRouter();
  const { user, assignedEvent, selectedOrganizer, logout } = useVolunteerAuth();
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of your EventCulture volunteer account?', [
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
    : 'V';

  const organizerName = selectedOrganizer?.name || selectedOrganizer?.organizationName || 'Assigned Organizer';
  const organizerCode = (selectedOrganizer?.organizerCode || assignedEvent?.organizerCode || user?.assignedOrganizerCode || 'GENERAL').toUpperCase();

  return (
    <View style={styles.container}>
      <Header title="Volunteer Profile" subtitle="Scanner staff credentials" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, SHADOWS.md]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{user?.name || 'Volunteer'}</Text>
          <Text style={styles.email}>{user?.email || 'volunteer@eventculture.io'}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>AUTHORIZED SCANNER</Text>
          </View>
        </View>

        {/* Assigned Organizer & Event Details */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            <TouchableOpacity onPress={() => setSwitcherVisible(true)} style={styles.switchPill}>
              <Ionicons name="swap-horizontal" size={12} color={COLORS.primary} />
              <Text style={styles.switchPillText}>Switch</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organizer</Text>
            <View style={styles.orgRowValue}>
              <Text style={[styles.detailValue, { fontWeight: '700' }]}>{organizerName}</Text>
              <View style={styles.miniCodeBadge}>
                <Text style={styles.miniCodeText}>{organizerCode}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Event</Text>
            <Text style={[styles.detailValue, { fontWeight: '700' }]}>
              {assignedEvent?.name || 'No event selected'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Venue</Text>
            <Text style={styles.detailValue}>
              {assignedEvent?.location?.venue || 'Main Gate / Venue'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: COLORS.success, fontWeight: '700' }]}>Active Duty</Text>
          </View>
        </View>

        {/* Security & System Info */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>Verification Engine</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode</Text>
            <Text style={styles.detailValue}>Expo Camera SDK 54</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Validation Speed</Text>
            <Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: '700' }]}>
              &lt; 50ms Atomic Check
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform</Text>
            <Text style={styles.detailValue}>EventCulture 1.0</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutBtnText}>Sign Out from Scanner</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Switch Organizer Modal */}
      <OrganizerSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: 10,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  switchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  orgRowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCodeBadge: {
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
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
