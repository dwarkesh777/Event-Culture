import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const FilterChip = ({ label, isSelected, onPress, count, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        isSelected && styles.selectedChip,
        style,
      ]}
    >
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, isSelected && styles.selectedCount]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedLabel: {
    color: COLORS.white,
  },
  count: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    color: COLORS.textMuted,
  },
  selectedCount: {
    color: COLORS.white,
  },
});

export default FilterChip;
