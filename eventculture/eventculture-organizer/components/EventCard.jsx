import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { Ionicons } from '@expo/vector-icons';

export const EventCard = ({ event, isSelected, onSelect, onEdit, style }) => {
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  let computedStatus = 'UPCOMING';
  if (now >= start && now <= end) computedStatus = 'LIVE';
  else if (now > end) computedStatus = 'COMPLETED';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        SHADOWS.sm,
        style,
      ]}
    >
      <Image
        source={{
          uri:
            event.bannerImage?.url ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        }}
        style={styles.banner}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <StatusBadge status={computedStatus} size="small" />
          {isSelected && (
            <View style={styles.activeTag}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {event.name}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>

        {event.location?.venue ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location.venue} {event.location.city ? `• ${event.location.city}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.statBadge}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{event.totalParticipants || 0} Registered</Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F3F7FF',
  },
  banner: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.borderLight,
  },
  content: {
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  editBtn: {
    padding: 6,
  },
});

export default EventCard;
