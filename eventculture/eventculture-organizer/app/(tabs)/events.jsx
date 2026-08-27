import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useEvent } from '../../hooks/useEvent';
import Header from '../../components/Header';
import EventCard from '../../components/EventCard';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ImageUploader from '../../components/ImageUploader';
import EmptyState from '../../components/EmptyState';
import AnimatedBackground from '../../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen() {
  const { events, selectedEvent, fetchEvents, selectEvent, createEvent, updateEvent } = useEvent();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  
  // Date Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [pickerTarget, setPickerTarget] = useState('start');
  const [bannerImage, setBannerImage] = useState({
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    publicId: '',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setVenue('');
    setCity('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    setBannerImage({
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      publicId: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (event) => {
    setIsEditing(true);
    setEditingId(event._id);
    setName(event.name);
    setDescription(event.description || '');
    setVenue(event.location?.venue || '');
    setCity(event.location?.city || '');
    setStartDate(event.startDate ? new Date(event.startDate) : new Date());
    setEndDate(event.endDate ? new Date(event.endDate) : new Date());
    setBannerImage(
      event.bannerImage || {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        publicId: '',
      }
    );
    setModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Event Name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: {
          venue: venue.trim(),
          city: city.trim(),
        },
        startDate: startDate,
        endDate: endDate,
        bannerImage,
      };

      if (isEditing) {
        await updateEvent(editingId, payload);
        Alert.alert('Success', 'Event updated successfully');
      } else {
        await createEvent(payload);
        Alert.alert('Success', 'Event created successfully');
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (target, mode) => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onPickerChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (pickerTarget === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const formatDate = (date) => date.toLocaleDateString();
  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <AnimatedBackground colors={['#E0E7FF', '#F3F7FF', COLORS.background]} />
      
      <Header
        title="Events"
        subtitle="Manage all your hackathons & conferences"
        rightAction={
          <TouchableOpacity onPress={openCreateModal} style={styles.createBtn}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.createBtnText}>New Event</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {events.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100)}>
            <EmptyState
              icon="calendar-outline"
              title="No events yet"
              description="Create your first event to start importing participants and issuing passes."
              actionTitle="Create Event"
              onAction={openCreateModal}
            />
          </Animated.View>
        ) : (
          events.map((event, idx) => (
            <Animated.View key={event._id} entering={FadeInDown.delay(100 + idx * 50)}>
              <EventCard
                event={event}
                isSelected={selectedEvent?._id === event._id}
                onSelect={() => selectEvent(event)}
                onEdit={() => openEditModal(event)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create / Edit Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'Create New Event'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ImageUploader
                label="Event Banner Image"
                currentImageUrl={bannerImage.url}
                onImageUploaded={(img) => setBannerImage(img)}
              />

              <InputField
                label="Event Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. TechNexus Global Summit"
                icon="trophy-outline"
              />

              <InputField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Short description of the event..."
                multiline
                numberOfLines={3}
              />

              <InputField
                label="Venue / Campus"
                value={venue}
                onChangeText={setVenue}
                placeholder="e.g. Convention Center, Hall B"
                icon="business-outline"
              />

              <InputField
                label="City / Location"
                value={city}
                onChangeText={setCity}
                placeholder="e.g. San Francisco, CA"
                icon="location-outline"
              />

              <View style={{ marginBottom: SPACING.md }}>
                <Text style={styles.label}>Start Date & Time</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1, marginRight: 8 }]}
                    onPress={() => openPicker('start', 'date')}
                  >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnText}>{formatDate(startDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1 }]}
                    onPress={() => openPicker('start', 'time')}
                  >
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnText}>{formatTime(startDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: SPACING.md }}>
                <Text style={styles.label}>End Date & Time</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1, marginRight: 8 }]}
                    onPress={() => openPicker('end', 'date')}
                  >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnText}>{formatDate(endDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1 }]}
                    onPress={() => openPicker('end', 'time')}
                  >
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnText}>{formatTime(endDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={pickerTarget === 'start' ? startDate : endDate}
                  mode={pickerMode}
                  display="default"
                  onChange={onPickerChange}
                />
              )}

              <View style={styles.modalActions}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <PrimaryButton
                  title={isEditing ? 'Save Changes' : 'Create Event'}
                  onPress={handleSaveEvent}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
  },
  modalBody: {
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerBtnText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginLeft: 10,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
});
