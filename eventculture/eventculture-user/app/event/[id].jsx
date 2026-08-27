import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { userEventsApi, userPassApi } from '../../services/api';
import DigitalQrPassCard from '../../components/DigitalQrPassCard';
import StatusBadge from '../../components/StatusBadge';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passLoading, setPassLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [venueVisible, setVenueVisible] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const res = await userEventsApi.getById(id);
        setEvent(res.data.data);
      } catch (err) {
        console.warn('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEventDetails();
  }, [id]);

  const handleShowPass = async () => {
    if (passes.length === 0) {
      try {
        setPassLoading(true);
        const res = await userPassApi.getMyPasses();
        const allPasses = res.data.data || [];
        // Find all passes for this specific event
        const eventPasses = allPasses.filter((p) => p.eventId?._id === id || p.eventId === id);
        setPasses(eventPasses);
      } catch (err) {
        console.warn('Error fetching passes:', err);
      } finally {
        setPassLoading(false);
      }
    }
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Event not found.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedStart = new Date(event.startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  let computedStatus = 'UPCOMING';
  if (now >= start && now <= end) computedStatus = 'LIVE';
  else if (now > end) computedStatus = 'COMPLETED';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Image
          source={{
            uri: event.bannerImage?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000',
          }}
          style={styles.banner}
        />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.badgeRow}>
            <StatusBadge status={computedStatus} size="small" />
          </View>
          <Text style={styles.title}>{event.name}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.metaText}>{formattedStart}</Text>
          </View>
          
          {event.location?.venue ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.metaText}>{event.location.venue}</Text>
            </View>
          ) : null}

          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.tintLight }]}
            onPress={handleShowPass}
          >
            {passLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="qr-code" size={28} color={COLORS.primary} />
            )}
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>My QR Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F3E8FF' }]}
            onPress={() => setScheduleVisible(true)}
          >
            <Ionicons name="calendar" size={28} color={COLORS.purple} />
            <Text style={[styles.actionBtnText, { color: COLORS.purple }]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
            onPress={() => setVenueVisible(true)}
          >
            <Ionicons name="map" size={28} color={COLORS.success} />
            <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Venue Info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Pass Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Your Digital Pass</Text>

            {passes.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {passes.map((p) => (
                  <DigitalQrPassCard key={p._id} pass={p} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noPassContainer}>
                <Ionicons name="ticket-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.noPassText}>You do not have a pass for this event yet.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        visible={scheduleVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScheduleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setScheduleVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Schedule</Text>
            
            <View style={{ marginTop: SPACING.md }}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <View>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>START</Text>
                  <Text style={{ fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' }}>
                    {new Date(event.startDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.metaRow, { marginTop: SPACING.md }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <View>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>END</Text>
                  <Text style={{ fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' }}>
                    {new Date(event.endDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Venue Modal */}
      <Modal
        visible={venueVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVenueVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVenueVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Venue Information</Text>
            
            {event.location ? (
              <View style={{ marginTop: SPACING.md }}>
                <View style={styles.metaRow}>
                  <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>VENUE</Text>
                    <Text style={{ fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' }}>
                      {event.location.venue || 'TBA'}
                    </Text>
                  </View>
                </View>
                
                {event.location.address && (
                  <View style={[styles.metaRow, { marginTop: SPACING.md, alignItems: 'flex-start' }]}>
                    <Ionicons name="map-outline" size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>ADDRESS</Text>
                      <Text style={{ fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 }}>
                        {event.location.address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.textSecondary }}>
                Venue information is not available yet.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  banner: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.borderLight,
  },
  infoBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: 12,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: 40,
    minHeight: '70%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  noPassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  noPassText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
