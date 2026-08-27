import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const StatusBadge = ({ status, size = 'medium', style }) => {
  const getColors = () => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'CHECKED_IN':
      case 'SUCCESS':
      case 'ONGOING':
      case 'LIVE':
        return { bg: COLORS.successLight, text: COLORS.success, dot: COLORS.success };
      case 'USED':
      case 'ALREADY_USED':
      case 'WARNING':
      case 'UPCOMING':
        return { bg: COLORS.warningLight, text: COLORS.warning, dot: COLORS.warning };
      case 'INVALID':
      case 'EXPIRED':
      case 'UNAUTHORIZED':
      case 'DISABLED':
      case 'CANCELLED':
      case 'COMPLETED':
        return { bg: COLORS.errorLight, text: COLORS.error, dot: COLORS.error };
      case 'REGISTERED':
      case 'ENTRY':
      default:
        return { bg: COLORS.tintLight, text: COLORS.primary, dot: COLORS.primary };
    }
  };

  const colors = getColors();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isSmall && styles.smallBadge,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.text, { color: colors.text }, isSmall && styles.smallText]}>
        {status?.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  smallBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  smallText: {
    fontSize: 10,
  },
});

export default StatusBadge;
