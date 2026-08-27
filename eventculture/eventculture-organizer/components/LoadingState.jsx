import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export const LoadingState = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

export default LoadingState;
