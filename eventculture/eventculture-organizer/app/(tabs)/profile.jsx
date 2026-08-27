import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import ImageUploader from '../../components/ImageUploader';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfileUser } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of EventCulture?', [
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

  return (
    <View style={styles.container}>
      <Header title="Organizer Profile" subtitle="Account settings & preferences" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.profileCard, SHADOWS.md]}>
          <ImageUploader
            label=""
            currentImageUrl={user?.profileImage?.url}
            onImageUploaded={(img) => {
              updateProfileUser({ ...user, profileImage: img });
            }}
            folder="organizers"
            aspectRatio={[1, 1]}
            style={{ width: 100, alignSelf: 'center', marginBottom: 12 }}
          />

          <Text style={styles.userName}>{user?.name || 'Event Organizer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'organizer@eventculture.io'}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>{user?.role || 'ORGANIZER'}</Text>
          </View>
        </View>

        {/* Account Details */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile</Text>
            <Text style={styles.detailValue}>{user?.mobileNumber || '+1 (555) 019-2834'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: COLORS.success }]}>Verified Organizer</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Security</Text>
            <Text style={styles.detailValue}>Cryptographic Pass Validation</Text>
          </View>
        </View>

        {/* Platform Info */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>Platform Info</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Version</Text>
            <Text style={styles.detailValue}>EventCulture 1.0 (Expo SDK 54)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Architecture</Text>
            <Text style={styles.detailValue}>Node.js + MongoDB + Cloudinary</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tagline</Text>
            <Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: '700' }]}>
              ONE SCAN. ZERO QUEUES.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutBtnText}>Sign Out from EventCulture</Text>
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
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
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
