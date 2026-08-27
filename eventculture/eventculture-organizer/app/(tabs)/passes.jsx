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
import { passApi } from '../../services/api';
import Header from '../../components/Header';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import EmptyState from '../../components/EmptyState';
import AnimatedBackground from '../../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { key: 'ENTRY', label: 'Event Entry', icon: 'ticket-outline', color: '#1565F9' },
  { key: 'FOOD', label: 'Food / Catering', icon: 'restaurant-outline', color: '#22C55E' },
  { key: 'GOODIE_BAG', label: 'Goodie Bag / Swag', icon: 'gift-outline', color: '#8B5CF6' },
  { key: 'WORKSHOP', label: 'Workshop / Masterclass', icon: 'school-outline', color: '#F59E0B' },
  { key: 'VIP', label: 'VIP Lounge', icon: 'star-outline', color: '#EC4899' },
  { key: 'PARKING', label: 'Parking Space', icon: 'car-outline', color: '#6366F1' },
];

export default function PassesScreen() {
  const { selectedEvent } = useEvent();
  const [passTypes, setPassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ENTRY');
  const [scanLimit, setScanLimit] = useState('1');
  const [selectedGroup, setSelectedGroup] = useState('PARTICIPANT');

  const fetchPassTypes = async () => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const res = await passApi.getPassTypes(selectedEvent._id);
      setPassTypes(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load pass types:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPassTypes();
  }, [selectedEvent?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPassTypes();
  }, [selectedEvent?._id]);

  const handleCreatePassType = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a pass type name');
      return;
    }

    setSaving(true);
    try {
      const selectedCat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
      await passApi.createPassType(selectedEvent._id, {
        name: name.trim(),
        description: description.trim(),
        category,
        scanLimit: parseInt(scanLimit) || 1,
        icon: selectedCat.icon,
        color: selectedCat.color,
        requiredPermission: category,
        targetRole: selectedGroup,
      });

      Alert.alert('Success', 'Pass type created successfully');
      setModalVisible(false);
      setName('');
      setDescription('');
      fetchPassTypes();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to create pass type');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async (passType) => {
    Alert.alert(
      'Issue Passes in Bulk',
      `Assign "${passType.name}" to all registered ${selectedGroup.toLowerCase()}s in this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            try {
              const res = await passApi.bulkAssignPass({
                eventId: selectedEvent._id,
                passTypeId: passType._id,
                filterCriteria: { role: selectedGroup },
              });
              Alert.alert('Success', `Issued ${res.data.data.assignedCount} digital passes!`);
              fetchPassTypes();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to bulk assign');
            }
          },
        },
      ]
    );
  };

  const handleDeletePassType = async (passType) => {
    Alert.alert(
      'Delete Pass Type',
      `Are you sure you want to delete "${passType.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await passApi.deletePassType(passType._id);
              Alert.alert('Success', 'Pass type deleted successfully');
              fetchPassTypes();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete pass type');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground colors={['#F3E8FF', '#E0E7FF', COLORS.background]} />
      
      <Header
        title="Pass Types"
        subtitle={selectedEvent?.name || 'Digital access & coupon passes'}
        rightAction={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createBtn}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.createBtnText}>New Pass</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.formLabel}>Select Target Group for Passes</Text>
          <View style={styles.categoriesGrid}>
            {['PARTICIPANT', 'GUEST', 'STAFF'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setSelectedGroup(g)}
                style={[
                  styles.categoryOption,
                  selectedGroup === g && styles.selectedCategoryOption,
                ]}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    selectedGroup === g && styles.selectedCategoryOptionText,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: SPACING.lg }} />
        </Animated.View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : passTypes.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200)}>
            <EmptyState
              icon="ticket-outline"
              title="No pass types created"
              description="Create digital passes for entry, lunch, merchandise, workshops, or VIP areas."
              actionTitle="Create Pass Type"
              onAction={() => setModalVisible(true)}
            />
          </Animated.View>
        ) : (
          passTypes
            .filter((pt) => {
              const role = pt.targetRole === 'ALL' || !pt.targetRole ? 'PARTICIPANT' : pt.targetRole;
              return role === selectedGroup;
            })
            .map((pt, idx) => {
            const catObj = CATEGORIES.find((c) => c.key === pt.category) || CATEGORIES[0];
            return (
              <Animated.View key={pt._id} entering={FadeInDown.delay(200 + idx * 50)} style={[styles.passCard, SHADOWS.sm]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: pt.color || catObj.color }]}>
                    <Ionicons name={pt.icon || catObj.icon} size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>{pt.name}</Text>
                    <Text style={styles.cardCategory}>{pt.category}</Text>
                  </View>
                  <View style={styles.scanLimitPill}>
                    <Ionicons name="scan-outline" size={14} color={COLORS.primaryDark} />
                    <Text style={styles.scanLimitText}>Limit: {pt.scanLimit}</Text>
                  </View>
                </View>

                {pt.description ? <Text style={styles.cardDescription}>{pt.description}</Text> : null}

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{pt.totalIssued || 0}</Text>
                    <Text style={styles.statLbl}>Issued</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: COLORS.success }]}>{pt.totalRedeemed || 0}</Text>
                    <Text style={styles.statLbl}>Redeemed</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: COLORS.textMuted }]}>
                      {(pt.totalIssued || 0) - (pt.totalRedeemed || 0)}
                    </Text>
                    <Text style={styles.statLbl}>Remaining</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleBulkAssign(pt)}
                    style={styles.bulkAssignBtn}
                  >
                    <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.bulkAssignText}>Assign to {selectedGroup}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePassType(pt)}
                    style={[styles.deleteBtn, { marginTop: 10 }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={styles.deleteBtnText}>Delete Pass Type</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Create Pass Type Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Pass Type</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <InputField
                label="Pass Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Day 1 Lunch Voucher"
                icon="ticket-outline"
              />

              <InputField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Details on what this pass provides..."
                multiline
                numberOfLines={2}
              />

              {/* Category Selector */}
              <Text style={styles.formLabel}>Pass Category & Permission</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={[
                      styles.categoryOption,
                      category === cat.key && styles.selectedCategoryOption,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={category === cat.key ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat.key && styles.selectedCategoryOptionText,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <InputField
                label="Scan Limit (Number of times pass can be redeemed)"
                value={scanLimit}
                onChangeText={setScanLimit}
                placeholder="1"
                keyboardType="number-pad"
                icon="repeat-outline"
                style={{ marginTop: SPACING.md }}
              />

              <View style={styles.modalActions}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <PrimaryButton
                  title="Create Pass Type"
                  onPress={handleCreatePassType}
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
  passCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...SHADOWS.sm,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  cardCategory: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  scanLimitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  scanLimitText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: RADIUS.lg,
    padding: 10,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 4,
  },
  cardActions: {
    marginTop: SPACING.lg,
  },
  bulkAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(239, 246, 255, 0.8)', // blue-50 slightly transparent
    borderWidth: 1,
    borderColor: '#D0E1FD',
    gap: 8,
  },
  bulkAssignText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(254, 242, 242, 0.8)', // red-50 slightly transparent
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.error,
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
    marginBottom: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  selectedCategoryOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tintLight,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedCategoryOptionText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: 12,
  },
});
