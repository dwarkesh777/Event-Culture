import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { userEventsApi } from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function UserEventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await userEventsApi.getAll();
      setEvents(res.data.data || []);
    } catch (err) {
      console.warn('Error fetching events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="My Events" subtitle="Conferences, hackathons & summits" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No events found"
            description="Events you are registered for will appear here."
          />
        ) : (
          events.map((ev) => {
            const formattedStart = new Date(ev.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <View key={ev._id} style={[styles.eventCard, SHADOWS.sm]}>
                <Image
                  source={{
                    uri:
                      ev.bannerImage?.url ||
                      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000',
                  }}
                  style={styles.banner}
                />
                <View style={styles.content}>
                  <View style={styles.badgeRow}>
                    <StatusBadge status={ev.status || 'UPCOMING'} size="small" />
                    <View style={styles.dateTag}>
                      <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
                      <Text style={styles.dateText}>{formattedStart}</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{ev.name}</Text>
                  {ev.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      {ev.description}
                    </Text>
                  ) : null}

                  {ev.location?.venue ? (
                    <View style={styles.locationBox}>
                      <Ionicons name="location" size={16} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.venueName}>{ev.location.venue}</Text>
                        {ev.location.address ? (
                          <Text style={styles.addressText}>{ev.location.address}</Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
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
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  banner: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.borderLight,
  },
  content: {
    padding: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.borderLight,
    padding: 10,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginTop: 4,
  },
  venueName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
