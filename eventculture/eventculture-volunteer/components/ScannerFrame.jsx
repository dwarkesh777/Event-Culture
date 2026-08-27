import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;

export const ScannerFrame = ({
  isTorchOn = false,
  onToggleTorch,
  isScanning = true,
  categoryLabel,
}) => {
  return (
    <View style={styles.overlay}>
      {/* Top Header Bar inside camera overlay */}
      <View style={styles.topBar}>
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>ENGINE ACTIVE</Text>
        </View>

        {categoryLabel && (
          <View style={styles.permBadge}>
            <Text style={styles.permBadgeText}>{categoryLabel}</Text>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.8} onPress={onToggleTorch} style={styles.torchBtn}>
          <Ionicons
            name={isTorchOn ? 'flash' : 'flash-off'}
            size={22}
            color={isTorchOn ? '#FBBF24' : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* Center Target Box with Blue Corners */}
      <View style={styles.centerContainer}>
        <View style={styles.targetFrame}>
          {/* 4 Blue Corners */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>

        <Text style={styles.instructionText}>
          Align attendee QR pass within frame
        </Text>
      </View>

      {/* Bottom status bar */}
      <View style={styles.bottomBar}>
        <View style={styles.securePill}>
          <Ionicons name="lock-closed" size={14} color="#60A5FA" />
          <Text style={styles.securePillText}>Atomic Anti-Duplicate Protection</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  networkText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  permBadge: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  permBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  torchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
  },
  targetFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  instructionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  securePillText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ScannerFrame;
