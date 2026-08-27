import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  variant = 'primary', // 'primary' | 'success' | 'danger'
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.textMuted;
    if (variant === 'success') return COLORS.success;
    if (variant === 'danger') return COLORS.error;
    return COLORS.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        SHADOWS.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={COLORS.white} style={styles.icon} />}
          <Text style={[styles.title, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PrimaryButton;
