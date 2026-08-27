import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useVolunteerAuth } from '../../hooks/useVolunteerAuth';
import { volunteerScanApi, volunteerEventsApi } from '../../services/api';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import OrganizerSwitcherModal from '../../components/OrganizerSwitcherModal';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerHomeScreen() {
  const router = useRouter();
  const {
    user,
    assignedEvent,
    selectedOrganizer,
    fetchAssignedEvent,
  } = useVolunteerAuth();

  const [scanStats, setScanStats] = useState({ total: 0, successful: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [assignment, setAssignment] = useState(null);

  const loadStats = async () => {
    try {
      await fetchAssignedEvent();
      const res = await volunteerScanApi.getHistory({
        limit: 100,
        eventId: assignedEvent?._id,
      });
      const scans = res.data.data?.scans || [];
      const successful = scans.filter((s) => s.result === 'SUCCESS').length;
      setScanStats({
        total: scans.length,
        successful,
      });
      
      if (assignedEvent?._id) {
        const assignRes = await volunteerEventsApi.getAssignment(assignedEvent._id);
        setAssignment(assignRes.data.data);
      }
    } catch (e) {
      console.warn('Failed to load volunteer stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [assignedEvent?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [assignedEvent?._id]);

  const organizerName = selectedOrganizer?.name || selectedOrganizer?.organizationName || 'Current Organizer';
  const organizerCode = (selectedOrganizer?.organizerCode || assignedEvent?.organizerCode || user?.assignedOrganizerCode || 'GENERAL').toUpperCase();
  const folderName = selectedOrganizer?.folderName || `organizer_${organizerCode.toLowerCase()}`;

  return (
    <View style={styles.container}>
      <Header
        title="Volunteer Portal"
        subtitle={`Logged in as ${user?.name || 'Volunteer'}`}
        rightAction={
          <TouchableOpacity
            onPress={() => setSwitcherVisible(true)}
            style={styles.headerSwitchBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
            <Text style={styles.headerSwitchText}>{organizerCode}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Organizer Workspace Card */}
        <View style={[styles.orgCard, SHADOWS.sm]}>
          <View style={styles.orgHeaderRow}>
            <View style={styles.orgAvatarBadge}>
              <Ionicons name="business" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.orgInfo}>
              <View style={styles.orgNameRow}>
                <Text style={styles.orgName} numberOfLines={1}>
                  {organizerName}
                </Text>
                <View style={styles.orgCodeBadge}>
                  <Text style={styles.orgCodeBadgeText}>{organizerCode}</Text>
                </View>
              </View>
              <View style={styles.folderRow}>
                <Ionicons name="folder-open" size={12} color={COLORS.primary} />
                <Text style={styles.folderText} numberOfLines={1}>
                  {folderName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSwitcherVisible(true)}
              style={styles.switchOrgBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={14} color={COLORS.white} />
              <Text style={styles.switchOrgBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assigned Event Card */}
        <View style={[styles.eventCard, SHADOWS.md]}>
          <View style={styles.eventCardHeader}>
            <View style={styles.eventBadge}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
              <Text style={styles.eventBadgeText}>ACTIVE SCANNING EVENT</Text>
            </View>
            <TouchableOpacity onPress={() => setSwitcherVisible(true)}>
              <Text style={styles.changeEventLink}>Change Event</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.eventName}>{assignedEvent?.name || 'No Active Event Selected'}</Text>
          {assignedEvent?.location?.venue ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {assignedEvent.location.venue}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pass Cards for Scanning */}
        <View style={styles.passCardsContainer}>
          <Text style={styles.sectionTitle}>Select Pass to Scan</Text>
          <Text style={styles.sectionSubtitle}>
            You are authorized to scan the following passes:
          </Text>
          
          {assignment?.allowedPassTypes?.length > 0 ? (
            assignment.allowedPassTypes.map((passType) => (
              <TouchableOpacity
                key={passType._id}
                activeOpacity={0.88}
                onPress={() => router.push(`/(tabs)/scanner?passTypeId=${passType._id}&passName=${encodeURIComponent(passType.name)}`)}
                style={[styles.passScannerBtn, SHADOWS.sm, { borderLeftColor: passType.color || COLORS.primary }]}
              >
                <View style={[styles.passIconCircle, { backgroundColor: (passType.color || COLORS.primary) + '20' }]}>
                  <Ionicons name={passType.icon || 'ticket-outline'} size={24} color={passType.color || COLORS.primary} />
                </View>
                <View style={styles.passBtnContent}>
                  <Text style={styles.passBtnTitle}>{passType.name}</Text>
                  <Text style={styles.passBtnSubtitle}>
                    Scan {passType.category} passes
                  </Text>
                </View>
                <Ionicons name="scan" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPassesState}>
              <Ionicons name="alert-circle-outline" size={32} color={COLORS.warning} />
              <Text style={styles.noPassesText}>No pass types assigned. Please contact the organizer.</Text>
            </View>
          )}
        </View>

        {/* Today's Scan Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, SHADOWS.sm]}>
            <Text style={styles.statNumber}>{scanStats.total}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={[styles.statBox, SHADOWS.sm, { backgroundColor: COLORS.successLight }]}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{scanStats.successful}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C7DBFE',
  },
  headerSwitchText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  orgCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  orgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orgAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  orgCodeBadge: {
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orgCodeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  folderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  switchOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  switchOrgBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#C7DBFE',
    marginBottom: SPACING.lg,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeEventLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  passCardsContainer: {
    marginBottom: SPACING.xl,
  },
  passScannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
  },
  passIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  passBtnContent: {
    flex: 1,
  },
  passBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  passBtnSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  noPassesState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  noPassesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
