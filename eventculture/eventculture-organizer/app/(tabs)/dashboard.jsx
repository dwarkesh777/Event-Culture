import React, { useEffect, useState, useCallback } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useEvent } from '../../hooks/useEvent';
import { analyticsApi } from '../../services/api';
import Header from '../../components/Header';
import StatisticCard from '../../components/StatisticCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events, selectedEvent, fetchEvents, selectEvent } = useEvent();

  const [analytics, setAnalytics] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const loadData = async () => {
    try {
      const eventList = await fetchEvents();
      const currentEv = selectedEvent || eventList[0];
      if (currentEv) {
        const [statsRes, scansRes] = await Promise.all([
          analyticsApi.getStats(currentEv._id),
          analyticsApi.getRecentScans(currentEv._id),
        ]);
        setAnalytics(statsRes.data.data);
        setRecentScans(scansRes.data.data || []);
      }
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEvent?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [selectedEvent?._id]);

  return (
    <View style={styles.container}>
      <AnimatedBackground colors={[COLORS.tintLight, '#E0E7FF', COLORS.background]} />
      
      <Header
        title="Event Operations"
        subtitle={`Welcome back, ${user?.name || 'Organizer'}`}
        rightIcon="notifications-outline"
        onRightPress={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Event Card Banner */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.eventSelectorCard, SHADOWS.sm]}>
          <View style={styles.eventSelectorHeader}>
            <View style={styles.eventBadge}>
              <Ionicons name="sparkles" size={13} color={COLORS.primary} />
              <Text style={styles.eventBadgeText}>ACTIVE EVENT</Text>
            </View>
            {events.length > 1 && (
              <TouchableOpacity
                onPress={() => setShowEventPicker(!showEventPicker)}
                style={styles.switchEventBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.switchEventText}>Switch Event</Text>
                <Ionicons name="chevron-down" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.eventName}>{selectedEvent?.name || 'No Active Event Selected'}</Text>
          {selectedEvent?.location?.venue ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedEvent.location.venue}
                {selectedEvent.location.city ? `, ${selectedEvent.location.city}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Event Picker Dropdown */}
          {showEventPicker && (
            <View style={styles.eventDropdown}>
              {events.map((ev) => (
                <TouchableOpacity
                  key={ev._id}
                  onPress={() => {
                    selectEvent(ev);
                    setShowEventPicker(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    selectedEvent?._id === ev._id && styles.selectedDropdownItem,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedEvent?._id === ev._id && styles.selectedDropdownItemText,
                    ]}
                  >
                    {ev.name}
                  </Text>
                  {selectedEvent?._id === ev._id && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Quick Operations Shortcuts */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Operations</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/csv-import')}
              style={[styles.actionCard, SHADOWS.sm]}
            >
              <View style={[styles.actionIconBg, { backgroundColor: '#EAF2FF' }]}>
                <Ionicons name="cloud-upload" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionTitle}>Import CSV</Text>
              <Text style={styles.actionSubtitle}>Upload Attendees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/passes')}
              style={[styles.actionCard, SHADOWS.sm]}
            >
              <View style={[styles.actionIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="ticket" size={22} color={COLORS.purple} />
              </View>
              <Text style={styles.actionTitle}>Pass Types</Text>
              <Text style={styles.actionSubtitle}>Create Digital Passes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/volunteers')}
              style={[styles.actionCard, SHADOWS.sm]}
            >
              <View style={[styles.actionIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.actionTitle}>Volunteers</Text>
              <Text style={styles.actionSubtitle}>Scanner Access</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Live Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatisticCard
              title="Total Registered"
              value={analytics?.totalParticipants?.toLocaleString() || '0'}
              icon="people"
              color={COLORS.primary}
              bgColor={COLORS.tintLight}
            />
            <StatisticCard
              title="Checked In"
              value={analytics?.checkedInCount?.toLocaleString() || '0'}
              subtitle={`${analytics?.checkInPercentage || 0}% attendance`}
              icon="checkmark-circle"
              color={COLORS.success}
              bgColor={COLORS.successLight}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatisticCard
              title="Food Redeemed"
              value={analytics?.foodRedeemed?.toLocaleString() || '0'}
              icon="restaurant"
              color="#EA580C"
              bgColor="#FFEDD5"
            />
            <StatisticCard
              title="Goodie Bags Given"
              value={analytics?.goodieBagsCollected?.toLocaleString() || '0'}
              icon="gift"
              color={COLORS.purple}
              bgColor={COLORS.purpleLight}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatisticCard
              title="Total Scans"
              value={analytics?.totalScans?.toLocaleString() || '0'}
              subtitle={`${analytics?.successfulScans || 0} valid`}
              icon="barcode"
              color={COLORS.indigo}
              bgColor="#EEF2FF"
            />
            <StatisticCard
              title="Active Volunteers"
              value={analytics?.totalVolunteers?.toLocaleString() || '0'}
              subtitle="on floor"
              icon="shield"
              color={COLORS.primary}
              bgColor={COLORS.tintLight}
            />
          </View>
        </Animated.View>

        {/* Live Scan Activity Stream */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scan Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
              <Text style={styles.viewAllText}>View Analytics</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : recentScans.length === 0 ? (
            <EmptyState
              icon="scan-outline"
              title="No scan activity yet"
              description="Scans from volunteers will appear in real-time as participants check in."
            />
          ) : (
            recentScans.slice(0, 8).map((scan, idx) => (
              <Animated.View key={scan._id} entering={FadeInDown.delay(400 + idx * 50)} style={[styles.scanItem, SHADOWS.sm]}>
                <View
                  style={[
                    styles.scanIconBox,
                    {
                      backgroundColor:
                        scan.result === 'SUCCESS'
                          ? COLORS.successLight
                          : scan.result === 'ALREADY_USED'
                          ? COLORS.warningLight
                          : COLORS.errorLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      scan.result === 'SUCCESS'
                        ? 'checkmark-circle'
                        : scan.result === 'ALREADY_USED'
                        ? 'time'
                        : 'alert-circle'
                    }
                    size={20}
                    color={
                      scan.result === 'SUCCESS'
                        ? COLORS.success
                        : scan.result === 'ALREADY_USED'
                        ? COLORS.warning
                        : COLORS.error
                    }
                  />
                </View>

                <View style={styles.scanInfo}>
                  <Text style={styles.scanName} numberOfLines={1}>
                    {scan.participantId?.name || 'Participant'}
                  </Text>
                  <Text style={styles.scanPassType}>
                    {scan.passTypeId?.name || 'Digital Pass'} •{' '}
                    {scan.volunteerId?.name ? `By ${scan.volunteerId.name}` : ''}
                  </Text>
                </View>

                <View style={styles.scanRight}>
                  <StatusBadge status={scan.result} size="small" />
                  <Text style={styles.scanTime}>
                    {new Date(scan.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>
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
  eventSelectorCard: {
    backgroundColor: COLORS.white, // Solid pure white
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  eventSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  switchEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchEventText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  eventDropdown: {
    marginTop: SPACING.md,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  selectedDropdownItem: {
    backgroundColor: COLORS.tintLight,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  selectedDropdownItemText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  scanIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scanPassType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  scanRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scanTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
});
