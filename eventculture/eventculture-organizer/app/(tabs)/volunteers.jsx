import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useEvent } from '../../hooks/useEvent';
import { volunteerApi, passApi } from '../../services/api';
import Header from '../../components/Header';
import VolunteerCard from '../../components/VolunteerCard';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import EmptyState from '../../components/EmptyState';
import AnimatedBackground from '../../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteersScreen() {
  const { selectedEvent } = useEvent();
  const [volunteers, setVolunteers] = useState([]);
  const [passTypes, setPassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedPassTypeIds, setSelectedPassTypeIds] = useState([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  const fetchVolunteersAndPasses = async () => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const [volRes, passRes] = await Promise.all([
        volunteerApi.getAll(selectedEvent._id),
        passApi.getPassTypes(selectedEvent._id),
      ]);
      setVolunteers(volRes.data.data || []);
      const fetchedPasses = passRes.data.data || [];
      setPassTypes(fetchedPasses);

      // Pre-select all pass types by default for convenience
      if (selectedPassTypeIds.length === 0 && fetchedPasses.length > 0) {
        setSelectedPassTypeIds(fetchedPasses.map((p) => p._id));
      }
    } catch (err) {
      console.warn('Failed to load volunteers or pass types:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVolunteersAndPasses();
  }, [selectedEvent?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVolunteersAndPasses();
  }, [selectedEvent?._id]);

  const togglePassType = (passTypeId) => {
    if (selectedPassTypeIds.includes(passTypeId)) {
      setSelectedPassTypeIds(selectedPassTypeIds.filter((id) => id !== passTypeId));
    } else {
      setSelectedPassTypeIds([...selectedPassTypeIds, passTypeId]);
    }
  };

  const handleAddVolunteer = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid volunteer email');
      return;
    }

    if (selectedPassTypeIds.length === 0 && passTypes.length > 0) {
      Alert.alert('Validation', 'Please select at least one pass type this volunteer is allowed to scan.');
      return;
    }

    const selectedPermissions = passTypes
      .filter((pt) => selectedPassTypeIds.includes(pt._id))
      .map((pt) => pt.requiredPermission || pt.category);

    setSaving(true);
    try {
      if (editingAssignmentId) {
        await volunteerApi.update(editingAssignmentId, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim(),
          allowedPassTypes: selectedPassTypeIds,
          permissions: selectedPermissions.length > 0 ? selectedPermissions : ['ENTRY'],
        });
        Alert.alert('Success', 'Volunteer permissions updated!');
      } else {
        await volunteerApi.add(selectedEvent._id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim(),
          allowedPassTypes: selectedPassTypeIds,
          permissions: selectedPermissions.length > 0 ? selectedPermissions : ['ENTRY'],
        });
        Alert.alert('Success', 'Volunteer added & assigned to event passes!');
      }
      
      closeModal();
      fetchVolunteersAndPasses();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save volunteer');
    } finally {
      setSaving(false);
    }
  };

  const openModalForAdd = () => {
    setEditingAssignmentId(null);
    setName('');
    setEmail('');
    setMobileNumber('');
    setSelectedPassTypeIds(passTypes.map((p) => p._id));
    setModalVisible(true);
  };

  const openModalForEdit = (assignment) => {
    setEditingAssignmentId(assignment._id);
    setName(assignment.volunteerId?.name || '');
    setEmail(assignment.volunteerId?.email || '');
    setMobileNumber(assignment.volunteerId?.mobileNumber || '');
    
    // Extract pass type IDs
    const allowed = assignment.allowedPassTypes || [];
    setSelectedPassTypeIds(allowed.map((p) => (typeof p === 'object' ? p._id : p)));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAssignmentId(null);
    setName('');
    setEmail('');
    setMobileNumber('');
    setSelectedPassTypeIds([]);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    Alert.alert('Remove Volunteer', 'Unassign this volunteer from this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await volunteerApi.delete(assignmentId);
            fetchVolunteersAndPasses();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground colors={['#DCFCE7', '#E0E7FF', COLORS.background]} />
      
      <Header
        title="Volunteers"
        subtitle={selectedEvent?.name || 'Manage scanner personnel & permissions'}
        rightAction={
          <TouchableOpacity onPress={openModalForAdd} style={styles.createBtn}>
            <Ionicons name="person-add" size={18} color={COLORS.white} />
            <Text style={styles.createBtnText}>Add Volunteer</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : volunteers.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100)}>
            <EmptyState
              icon="shield-outline"
              title="No volunteers assigned"
              description="Assign volunteers so they can log into the Volunteer App and scan QR passes."
              actionTitle="Add Volunteer"
              onAction={openModalForAdd}
            />
          </Animated.View>
        ) : (
          volunteers.map((v, idx) => (
            <Animated.View key={v._id} entering={FadeInDown.delay(100 + idx * 50)}>
              <VolunteerCard
                volunteerAssignment={v}
                onEdit={() => openModalForEdit(v)}
                onDelete={() => handleDeleteAssignment(v._id)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Volunteer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAssignmentId ? 'Edit Permissions' : 'Add Volunteer'}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <InputField
                label="Volunteer Email *"
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. volunteer@eventculture.io"
                keyboardType="email-address"
                icon="mail-outline"
              />

              <InputField
                label="Volunteer Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex Johnson"
                icon="person-outline"
              />

              <InputField
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <View style={styles.passHeaderRow}>
                <Text style={styles.formLabel}>Allowed Event Passes to Scan</Text>
                <Text style={styles.passHelperText}>
                  {selectedPassTypeIds.length}/{passTypes.length} Selected
                </Text>
              </View>

              {passTypes.length === 0 ? (
                <View style={styles.emptyPassBox}>
                  <Ionicons name="ticket-outline" size={24} color={COLORS.textMuted} />
                  <Text style={styles.emptyPassText}>
                    No pass types found for this event. Create pass types in the Pass Types tab.
                  </Text>
                </View>
              ) : (
                <View style={styles.passTypeList}>
                  {passTypes.map((pt) => {
                    const isChecked = selectedPassTypeIds.includes(pt._id);
                    return (
                      <TouchableOpacity
                        key={pt._id}
                        onPress={() => togglePassType(pt._id)}
                        activeOpacity={0.7}
                        style={[styles.passTypeCard, isChecked && styles.checkedPassCard]}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={isChecked ? COLORS.primary : COLORS.textMuted}
                        />
                        <View style={[styles.passIconBadge, { backgroundColor: (pt.color || COLORS.primary) + '18' }]}>
                          <Ionicons name={pt.icon || 'ticket-outline'} size={18} color={pt.color || COLORS.primary} />
                        </View>
                        <View style={styles.passInfoContainer}>
                          <Text style={[styles.passNameText, isChecked && styles.checkedPassName]}>
                            {pt.name}
                          </Text>
                          <View style={styles.passMetaRow}>
                            <View style={styles.categoryPill}>
                              <Text style={styles.categoryPillText}>{pt.category || 'ENTRY'}</Text>
                            </View>
                            <Text style={styles.scanLimitText}>
                              Limit: {pt.scanLimit || 1} {pt.scanLimit === 1 ? 'scan' : 'scans'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.modalActions}>
                <SecondaryButton title="Cancel" onPress={closeModal} style={{ flex: 1, marginRight: 10 }} />
                <PrimaryButton
                  title={saving ? 'Saving...' : (editingAssignmentId ? 'Save Changes' : 'Add Volunteer')}
                  onPress={handleAddVolunteer}
                  loading={saving}
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
    paddingHorizontal: 14,
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
  formLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  passHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passHelperText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyPassBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    gap: 8,
    marginBottom: SPACING.md,
  },
  emptyPassText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  passTypeList: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  passTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
  },
  checkedPassCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  passIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passInfoContainer: {
    flex: 1,
  },
  passNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  checkedPassName: {
    color: COLORS.primaryDark,
  },
  passMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  categoryPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  scanLimitText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: 12,
  },
});
