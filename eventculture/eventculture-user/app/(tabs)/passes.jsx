import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { userPassApi } from '../../services/api';
import Header from '../../components/Header';
import DigitalQrPassCard from '../../components/DigitalQrPassCard';
import FilterChip from '../../components/FilterChip';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function UserPassesScreen() {
  const [passes, setPasses] = useState([]);
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'USED'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const res = await userPassApi.getMyPasses();
      const passList = res.data.data || [];
      setPasses(passList);
      if (passList.length > 0 && selectedPassIndex >= passList.length) {
        setSelectedPassIndex(0);
      }
    } catch (err) {
      console.warn('Error loading passes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPasses();
  }, []);

  const filteredPasses = passes.filter((p) => {
    if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE' && p.usedCount < p.scanLimit;
    if (filterStatus === 'USED') return p.status === 'USED' || p.usedCount >= p.scanLimit;
    return true;
  });

  const currentPass = filteredPasses[selectedPassIndex] || filteredPasses[0];

  return (
    <View style={styles.container}>
      <Header
        title="Digital QR Passes"
        subtitle="Present this QR code to the volunteer scanner"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Pass Category Tabs Filter */}
        <View style={styles.filterSection}>
          <FilterChip
            label="All Passes"
            isSelected={filterStatus === 'ALL'}
            onPress={() => {
              setFilterStatus('ALL');
              setSelectedPassIndex(0);
            }}
            count={passes.length}
          />
          <FilterChip
            label="Active"
            isSelected={filterStatus === 'ACTIVE'}
            onPress={() => {
              setFilterStatus('ACTIVE');
              setSelectedPassIndex(0);
            }}
            count={passes.filter((p) => p.status === 'ACTIVE' && p.usedCount < p.scanLimit).length}
          />
          <FilterChip
            label="Used / Past"
            isSelected={filterStatus === 'USED'}
            onPress={() => {
              setFilterStatus('USED');
              setSelectedPassIndex(0);
            }}
            count={passes.filter((p) => p.status === 'USED' || p.usedCount >= p.scanLimit).length}
          />
        </View>

        {/* Pass Selector Pill Carousel */}
        {filteredPasses.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.passSelectorScroll}
            contentContainerStyle={{ paddingHorizontal: SPACING.md }}
          >
            {filteredPasses.map((p, idx) => (
              <TouchableOpacity
                key={p._id}
                onPress={() => setSelectedPassIndex(idx)}
                style={[
                  styles.passTab,
                  selectedPassIndex === idx && styles.selectedPassTab,
                ]}
              >
                <Ionicons
                  name={p.passTypeId?.icon || 'ticket-outline'}
                  size={16}
                  color={selectedPassIndex === idx ? COLORS.white : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.passTabText,
                    selectedPassIndex === idx && styles.selectedPassTabText,
                  ]}
                >
                  {p.passTypeId?.name || `Pass ${idx + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : !currentPass ? (
          <EmptyState
            icon="ticket-outline"
            title="No passes found"
            description="You do not have any passes in this category. Make sure you registered with this mobile number."
          />
        ) : (
          <View style={styles.passWrapper}>
            {/* Primary Pass Display */}
            <DigitalQrPassCard pass={currentPass} />

            <View style={styles.instructionsCard}>
              <View style={styles.instructionHeader}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.instructionTitle}>How to use your pass</Text>
              </View>
              <Text style={styles.instructionText}>
                1. Keep your screen brightness high when presenting your QR code.{'\n'}
                2. The volunteer will scan your pass using the EventCulture scanner.{'\n'}
                3. The pass status will update to USED immediately upon verification.
              </Text>
            </View>
          </View>
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
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  passSelectorScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  passTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    gap: 6,
  },
  selectedPassTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  passTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedPassTabText: {
    color: COLORS.white,
  },
  passWrapper: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  instructionsCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#D0E1FD',
    marginTop: SPACING.sm,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
