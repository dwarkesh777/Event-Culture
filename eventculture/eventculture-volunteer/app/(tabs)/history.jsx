import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { volunteerScanApi } from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import FilterChip from '../../components/FilterChip';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerHistoryScreen() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resultFilter, setResultFilter] = useState('ALL');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        result: resultFilter !== 'ALL' ? resultFilter : undefined,
        limit: 100,
      };
      const res = await volunteerScanApi.getHistory(params);
      setScans(res.data.data?.scans || []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [resultFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [resultFilter]);

  return (
    <View style={styles.container}>
      <Header title="Scan History" subtitle="Audit trail of verified attendee passes" />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <FilterChip
          label="All Scans"
          isSelected={resultFilter === 'ALL'}
          onPress={() => setResultFilter('ALL')}
        />
        <FilterChip
          label="Success"
          isSelected={resultFilter === 'SUCCESS'}
          onPress={() => setResultFilter('SUCCESS')}
        />
        <FilterChip
          label="Already Used"
          isSelected={resultFilter === 'ALREADY_USED'}
          onPress={() => setResultFilter('ALREADY_USED')}
        />
        <FilterChip
          label="Denied"
          isSelected={resultFilter === 'UNAUTHORIZED'}
          onPress={() => setResultFilter('UNAUTHORIZED')}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={[styles.historyCard, SHADOWS.sm]}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Ionicons
                    name={
                      item.result === 'SUCCESS'
                        ? 'checkmark-circle'
                        : item.result === 'ALREADY_USED'
                        ? 'warning'
                        : 'close-circle'
                    }
                    size={20}
                    color={
                      item.result === 'SUCCESS'
                        ? COLORS.success
                        : item.result === 'ALREADY_USED'
                        ? COLORS.warning
                        : COLORS.error
                    }
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.participantName}>
                    {item.participantId?.name || 'Attendee'}
                  </Text>
                  <Text style={styles.passName}>
                    {item.passTypeId?.name || 'Digital Pass'} •{' '}
                    <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                      {item.participantId?.registrationId || 'REG-ID'}
                    </Text>
                  </Text>
                </View>
                <StatusBadge status={item.result} size="small" />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.locationText}>{item.location || 'Entrance Gate'}</Text>
                <Text style={styles.timeText}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No scan records found"
              description="Scans performed during your active session will be logged here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  passName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
