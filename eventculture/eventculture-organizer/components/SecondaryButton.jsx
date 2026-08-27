import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const SecondaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  color = COLORS.primary,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { borderColor: disabled ? COLORS.border : color },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={disabled ? COLORS.textMuted : color} style={styles.icon} />}
          <Text style={[styles.title, { color: disabled ? COLORS.textMuted : color }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SecondaryButton;
