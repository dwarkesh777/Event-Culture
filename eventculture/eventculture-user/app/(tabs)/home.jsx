import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useUserAuth } from '../../hooks/useUserAuth';
import { userEventsApi } from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function UserHomeScreen() {
  const router = useRouter();
  const { user } = useUserAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const res = await userEventsApi.getAll();
      setEvents(res.data.data || []);
    } catch (err) {
      console.warn('Error loading user home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="EventCulture"
        subtitle={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Attendee'}`}
        rightIcon="notifications-outline"
        onRightPress={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Registered Events</Text>
        </View>

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
            
            const now = new Date();
            const start = new Date(ev.startDate);
            const end = new Date(ev.endDate);
            let computedStatus = 'UPCOMING';
            if (now >= start && now <= end) computedStatus = 'LIVE';
            else if (now > end) computedStatus = 'COMPLETED';

            return (
              <TouchableOpacity
                key={ev._id}
                activeOpacity={0.9}
                onPress={() => router.push(`/event/${ev._id}`)}
                style={[styles.eventCard, SHADOWS.sm]}
              >
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
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <StatusBadge status={computedStatus} size="small" />
                      {ev.userRole ? (
                        <View style={[
                          styles.roleTag,
                          ev.userRole === 'STAFF' ? { backgroundColor: '#8B5CF6' } :
                          ev.userRole === 'GUEST' ? { backgroundColor: '#F59E0B' } :
                          { backgroundColor: '#3B82F6' }
                        ]}>
                          <Ionicons 
                            name={ev.userRole === 'STAFF' ? 'briefcase' : ev.userRole === 'GUEST' ? 'star' : 'person'} 
                            size={10} 
                            color={COLORS.white} 
                          />
                          <Text style={styles.roleText}>{ev.userRole}</Text>
                        </View>
                      ) : null}
                    </View>
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
              </TouchableOpacity>
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
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
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
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
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
