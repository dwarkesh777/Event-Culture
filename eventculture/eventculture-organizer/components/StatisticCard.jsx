import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const StatisticCard = ({
  title,
  value,
  subtitle,
  icon,
  color = COLORS.primary,
  bgColor = COLORS.tintLight,
  style,
}) => {
  return (
    <View style={[styles.card, SHADOWS.sm, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? (
        <View style={styles.subtitleWrapper}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 140,
    flex: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  subtitleWrapper: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default StatisticCard;
