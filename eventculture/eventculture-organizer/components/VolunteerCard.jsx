import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { Ionicons } from '@expo/vector-icons';

export const VolunteerCard = ({ volunteerAssignment, onEdit, onDelete, style }) => {
  const volunteer = volunteerAssignment.volunteerId || {};
  const allowedPasses = volunteerAssignment.allowedPassTypes || [];
  const permissions = volunteerAssignment.permissions || [];

  return (
    <View style={[styles.card, SHADOWS.sm, style]}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{volunteer.name || 'Volunteer'}</Text>
          <Text style={styles.email}>{volunteer.email || 'No email'}</Text>
        </View>
        <StatusBadge
          status={volunteerAssignment.isActive ? 'ACTIVE' : 'DISABLED'}
          size="small"
        />
      </View>

      <View style={styles.permissionSection}>
        <Text style={styles.permLabel}>Allowed Event Passes:</Text>
        <View style={styles.permChips}>
          {allowedPasses.length > 0
            ? allowedPasses.map((pass) => {
                const passName = typeof pass === 'object' ? pass.name : pass;
                const passColor = (typeof pass === 'object' && pass.color) || COLORS.primary;
                return (
                  <View key={typeof pass === 'object' ? pass._id : pass} style={[styles.permChip, { borderColor: passColor + '40', backgroundColor: passColor + '12' }]}>
                    <Text style={[styles.permChipText, { color: passColor }]}>{passName}</Text>
                  </View>
                );
              })
            : permissions.map((perm) => (
                <View key={perm} style={styles.permChip}>
                  <Text style={styles.permChipText}>{perm}</Text>
                </View>
              ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Ionicons name="options-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Permissions</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  permissionSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  permLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  permChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permChip: {
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#D0E1FD',
  },
  permChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  deleteBtn: {},
});

export default VolunteerCard;
