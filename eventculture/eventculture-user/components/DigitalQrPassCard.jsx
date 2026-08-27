import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PASS_WIDTH = Math.min(width - 32, 380);

export const DigitalQrPassCard = ({ pass, style }) => {
  const event = pass.eventId || {};
  const passType = pass.passTypeId || {};
  const participant = pass.participantId || {};

  const isUsed = pass.status === 'USED' || pass.usedCount >= pass.scanLimit;
  const isActive = pass.status === 'ACTIVE' && !isUsed;

  return (
    <View style={[styles.ticketContainer, SHADOWS.lg, style]}>
      {/* Top Header Strip */}
      <View style={[styles.topHeader, { backgroundColor: passType.color || COLORS.primary }]}>
        <View style={styles.passTypeHeader}>
          <Ionicons name={passType.icon || 'ticket-outline'} size={20} color={COLORS.white} />
          <Text style={styles.passTypeTitle}>{passType.name || 'Digital Pass'}</Text>
        </View>
        <StatusBadge status={pass.status || 'ACTIVE'} size="small" />
      </View>

      {/* Ticket Body */}
      <View style={styles.ticketBody}>
        {/* Event Title */}
        <Text style={styles.eventName} numberOfLines={2}>
          {event.name || 'EventCulture Experience'}
        </Text>

        {event.location?.venue ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.location.venue}
            </Text>
          </View>
        ) : null}

        {/* High-Contrast Secure QR Code Display */}
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, isUsed && styles.qrUsedWrapper]}>
            {pass.qrToken ? (
              <QRCode
                value={pass.qrToken}
                size={190}
                color={isUsed ? '#94A3B8' : '#0F172A'}
                backgroundColor="#FFFFFF"
                quietZone={8}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={60} color={COLORS.textMuted} />
              </View>
            )}

            {isUsed && (
              <View style={styles.usedOverlay}>
                <View style={styles.usedStamp}>
                  <Ionicons name="checkmark-done" size={24} color={COLORS.warning} />
                  <Text style={styles.usedStampText}>REDEEMED</Text>
                </View>
              </View>
            )}
          </View>
          <Text style={styles.qrSecurityText}>
            Single-Use Dynamic Secure Token • Ready for scanning
          </Text>
        </View>

        {/* Ticket Perforated Divider */}
        <View style={styles.perforatedLineContainer}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.notchRight} />
        </View>

        {/* Participant & Ticket Metadata */}
        <View style={styles.ticketFooter}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>ATTENDEE</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {participant.name || 'Attendee'}
            </Text>
          </View>

          <View style={styles.metaColRight}>
            <Text style={styles.metaLabel}>REGISTRATION ID</Text>
            <Text style={[styles.metaValue, { color: COLORS.primary }]} numberOfLines={1}>
              {participant.registrationId || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.ticketFooter, { marginTop: 8 }]}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>TICKET TYPE</Text>
            <Text style={styles.metaValueSecondary}>
              {participant.ticketType || 'General Participant'}
            </Text>
          </View>

          <View style={styles.metaColRight}>
            <Text style={styles.metaLabel}>SCAN USAGE</Text>
            <Text style={styles.metaValueSecondary}>
              {pass.usedCount || 0} / {pass.scanLimit || 1} Used
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    width: PASS_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  passTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passTypeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  ticketBody: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrUsedWrapper: {
    borderColor: COLORS.warning,
    opacity: 0.8,
  },
  qrPlaceholder: {
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedStamp: {
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  usedStampText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.warning,
    letterSpacing: 2,
    marginTop: 2,
  },
  qrSecurityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  perforatedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -SPACING.lg,
    marginVertical: SPACING.md,
  },
  notchLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginLeft: -10,
  },
  notchRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  metaValueSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default DigitalQrPassCard;
