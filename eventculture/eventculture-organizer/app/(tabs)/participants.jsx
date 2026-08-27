import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useEvent } from '../../hooks/useEvent';
import { participantsApi } from '../../services/api';
import Header from '../../components/Header';
import SearchBar from '../../components/SearchBar';
import FilterChip from '../../components/FilterChip';
import ParticipantCard from '../../components/ParticipantCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import SecondaryButton from '../../components/SecondaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function ParticipantsScreen() {
  const router = useRouter();
  const { selectedEvent } = useEvent();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);

  // Participant Detail Modal State
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchParticipants = async (querySearch = search, filter = statusFilter) => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const params = {
        search: querySearch || undefined,
        status: filter !== 'ALL' ? filter : undefined,
        role: 'PARTICIPANT',
        limit: 100,
      };
      const res = await participantsApi.getAll(selectedEvent._id, params);
      setParticipants(res.data.data.participants || []);
      setTotalCount(res.data.data.pagination?.total || 0);
    } catch (err) {
      console.warn('Error fetching participants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParticipants(search, statusFilter);
  }, [selectedEvent?._id, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParticipants(search, statusFilter);
  }, [selectedEvent?._id, search, statusFilter]);

  const handleSearchSubmit = () => {
    fetchParticipants(search, statusFilter);
  };

  const handleOpenDetail = (item) => {
    setSelectedParticipant(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Participants"
        subtitle={`${totalCount} registered attendees`}
        rightAction={
          <TouchableOpacity onPress={() => router.push({ pathname: '/csv-import', params: { role: 'PARTICIPANT' } })} style={styles.createBtn}>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
            <Text style={styles.createBtnText}>Import</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (text === '') fetchParticipants('', statusFilter);
          }}
          onClear={() => fetchParticipants('', statusFilter)}
          placeholder="Search name, email, mobile, or ID..."
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <FilterChip
            label="All"
            isSelected={statusFilter === 'ALL'}
            onPress={() => setStatusFilter('ALL')}
            count={totalCount}
          />
          <FilterChip
            label="Registered"
            isSelected={statusFilter === 'REGISTERED'}
            onPress={() => setStatusFilter('REGISTERED')}
          />
          <FilterChip
            label="Checked In"
            isSelected={statusFilter === 'CHECKED_IN'}
            onPress={() => setStatusFilter('CHECKED_IN')}
          />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ParticipantCard participant={item} onPress={() => handleOpenDetail(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No participants found"
              description="Import a CSV file to add participants or modify your search terms."
            />
          }
        />
      )}

      {/* Participant Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participant Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedParticipant && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Header Info */}
                <View style={styles.profileHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                      {selectedParticipant.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{selectedParticipant.name}</Text>
                    <Text style={styles.profileEmail}>{selectedParticipant.email}</Text>
                    <View style={{ marginTop: 6 }}>
                      <StatusBadge status={selectedParticipant.status} size="small" />
                    </View>
                  </View>
                </View>

                {/* Primary Identifiers */}
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registration ID</Text>
                    <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '800' }]}>
                      {selectedParticipant.registrationId}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile Number</Text>
                    <Text style={styles.infoValue}>{selectedParticipant.mobileNumber}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ticket Category</Text>
                    <Text style={styles.infoValue}>{selectedParticipant.ticketType}</Text>
                  </View>
                </View>

                {/* Custom CSV Fields */}
                {selectedParticipant.csvData && Object.keys(selectedParticipant.csvData).length > 0 && (
                  <View style={styles.csvCard}>
                    <Text style={styles.csvTitle}>Registration Data (From CSV)</Text>
                    {Object.entries(selectedParticipant.csvData).map(([key, val]) => (
                      <View key={key} style={styles.csvRow}>
                        <Text style={styles.csvKey}>{key}:</Text>
                        <Text style={styles.csvVal}>{String(val)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Assigned Digital Passes */}
                <View style={styles.passesCard}>
                  <Text style={styles.passesTitle}>
                    Assigned Passes ({selectedParticipant.passes?.length || 0})
                  </Text>
                  {selectedParticipant.passes?.map((p) => (
                    <View key={p._id} style={styles.passRow}>
                      <View style={styles.passInfo}>
                        <Text style={styles.passName}>{p.passTypeId?.name || 'Pass'}</Text>
                        <Text style={styles.passCategory}>{p.passTypeId?.category || 'ENTRY'}</Text>
                      </View>
                      <StatusBadge status={p.status} size="small" />
                    </View>
                  ))}
                </View>

                <SecondaryButton
                  title="Close Details"
                  onPress={() => setModalVisible(false)}
                  style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
                />
              </ScrollView>
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
  searchSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  filterScroll: {
    flexDirection: 'row',
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
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  csvCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  csvTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  csvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  csvKey: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  csvVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  passesCard: {
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D0E1FD',
    marginBottom: SPACING.md,
  },
  passesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 6,
  },
  passInfo: {
    flex: 1,
  },
  passName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  passCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
