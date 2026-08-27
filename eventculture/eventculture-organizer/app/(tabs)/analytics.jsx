import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useEvent } from '../../hooks/useEvent';
import { analyticsApi } from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const { selectedEvent } = useEvent();
  const [analytics, setAnalytics] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const [statsRes, scansRes] = await Promise.all([
        analyticsApi.getStats(selectedEvent._id),
        analyticsApi.getRecentScans(selectedEvent._id),
      ]);
      setAnalytics(statsRes.data.data);
      setRecentScans(scansRes.data.data || []);
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedEvent?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [selectedEvent?._id]);

  return (
    <View style={styles.container}>
      <Header
        title="Real-Time Analytics"
        subtitle={selectedEvent?.name || 'Live verification & pass usage statistics'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Attendance Progress Card */}
            <View style={[styles.mainCard, SHADOWS.md]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Overall Check-In Rate</Text>
                  <Text style={styles.cardSubtitle}>
                    {analytics?.checkedInCount || 0} of {analytics?.totalParticipants || 0} participants
                  </Text>
                </View>
                <Text style={styles.percentageText}>{analytics?.checkInPercentage || 0}%</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(analytics?.checkInPercentage || 0, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Scan Outcome Breakdown */}
            <Text style={styles.sectionTitle}>Scan Verification Outcomes</Text>
            <View style={styles.outcomesGrid}>
              <View style={[styles.outcomeCard, { borderLeftColor: COLORS.success }]}>
                <Text style={styles.outcomeVal}>{analytics?.successfulScans || 0}</Text>
                <Text style={styles.outcomeLbl}>Successful</Text>
              </View>
              <View style={[styles.outcomeCard, { borderLeftColor: COLORS.warning }]}>
                <Text style={styles.outcomeVal}>{analytics?.alreadyUsedScans || 0}</Text>
                <Text style={styles.outcomeLbl}>Already Used</Text>
              </View>
              <View style={[styles.outcomeCard, { borderLeftColor: COLORS.error }]}>
                <Text style={styles.outcomeVal}>{analytics?.invalidScans || 0}</Text>
                <Text style={styles.outcomeLbl}>Invalid / Denied</Text>
              </View>
            </View>

            {/* Pass Type Redemption Breakdown */}
            <Text style={styles.sectionTitle}>Redemption by Pass Category</Text>
            <View style={[styles.passTypesContainer, SHADOWS.sm]}>
              {analytics?.passTypeStats?.length === 0 ? (
                <Text style={styles.emptyText}>No pass types registered</Text>
              ) : (
                analytics?.passTypeStats?.map((pt) => (
                  <View key={pt.id} style={styles.passStatRow}>
                    <View style={styles.passStatInfo}>
                      <Text style={styles.passStatName}>{pt.name}</Text>
                      <Text style={styles.passStatNumbers}>
                        {pt.redeemedCount} / {pt.totalAssigned} ({pt.redemptionRate}%)
                      </Text>
                    </View>
                    <View style={styles.passProgressTrack}>
                      <View
                        style={[
                          styles.passProgressFill,
                          {
                            width: `${Math.min(pt.redemptionRate, 100)}%`,
                            backgroundColor: pt.color || COLORS.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Full Scan Logs Stream */}
            <Text style={styles.sectionTitle}>Verification Logs</Text>
            {recentScans.length === 0 ? (
              <EmptyState
                icon="scan-outline"
                title="No scan logs yet"
                description="Live volunteer scans will be audited here in chronological order."
              />
            ) : (
              recentScans.map((scan) => (
                <View key={scan._id} style={[styles.logCard, SHADOWS.sm]}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logParticipant}>{scan.participantId?.name || 'Attendee'}</Text>
                    <StatusBadge status={scan.result} size="small" />
                  </View>
                  <Text style={styles.logPass}>
                    {scan.passTypeId?.name || 'Pass'} • {scan.participantId?.registrationId || ''}
                  </Text>
                  <View style={styles.logFooter}>
                    <Text style={styles.logVolunteer}>
                      Scanned by: {scan.volunteerId?.name || 'Volunteer'}
                    </Text>
                    <Text style={styles.logTime}>
                      {new Date(scan.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
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
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  outcomesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  outcomeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  outcomeVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  outcomeLbl: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  passTypesContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.md,
  },
  passStatRow: {
    marginBottom: 12,
  },
  passStatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  passStatName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  passStatNumbers: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  passProgressTrack: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  passProgressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logParticipant: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logPass: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  logVolunteer: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
