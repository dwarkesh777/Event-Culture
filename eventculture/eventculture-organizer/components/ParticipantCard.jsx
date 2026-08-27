import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { Ionicons } from '@expo/vector-icons';

export const ParticipantCard = ({ participant, onPress, style }) => {
  const initials = participant.name
    ? participant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'P';

  const extraFieldsCount = participant.csvData ? Object.keys(participant.csvData).length : 0;
  const passesCount = participant.passes ? participant.passes.length : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, SHADOWS.sm, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {participant.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {participant.email}
          </Text>
        </View>
        <StatusBadge status={participant.status || 'REGISTERED'} size="small" />
      </View>

      <View style={styles.detailRow}>
        <View style={styles.tag}>
          <Ionicons name="call-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.tagText}>{participant.mobileNumber}</Text>
        </View>
        <View style={styles.tag}>
          <Ionicons name="barcode-outline" size={12} color={COLORS.primary} />
          <Text style={[styles.tagText, { color: COLORS.primary, fontWeight: '700' }]}>
            {participant.registrationId}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeGroup}>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketText}>{participant.ticketType || 'General'}</Text>
          </View>
          {passesCount > 0 && (
            <View style={styles.passCountBadge}>
              <Ionicons name="ticket-outline" size={12} color={COLORS.primary} />
              <Text style={styles.passCountText}>{passesCount} passes</Text>
            </View>
          )}
        </View>
        {extraFieldsCount > 0 && (
          <Text style={styles.extraText}>+{extraFieldsCount} custom fields</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketBadge: {
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  ticketText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  passCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  passCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 3,
  },
  extraText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

export default ParticipantCard;
