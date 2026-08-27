import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { Ionicons } from '@expo/vector-icons';

export const ValidationResultModal = ({
  visible,
  state, // 'VALID' | 'REDEEMED' | 'ALREADY_USED' | 'INVALID' | 'UNAUTHORIZED'
  data, // passInfo & validation metadata
  onConfirmRedemption,
  onClose,
  isRedeeming = false,
}) => {
  if (!visible || !state) return null;

  const isSuccessValid = state === 'VALID';
  const isRedeemedSuccess = state === 'REDEEMED';
  const isAlreadyUsed = state === 'ALREADY_USED';
  const isInvalidOrDenied = state === 'INVALID' || state === 'UNAUTHORIZED' || state === 'EXPIRED';

  const getHeaderDetails = () => {
    if (isSuccessValid) {
      return {
        icon: 'checkmark-circle',
        iconBg: COLORS.successLight,
        iconColor: COLORS.success,
        title: 'PASS VALID',
        subtitle: 'Ready for check-in & verification',
      };
    }
    if (isRedeemedSuccess) {
      return {
        icon: 'checkmark-done-circle',
        iconBg: COLORS.successLight,
        iconColor: COLORS.success,
        title: 'PASS REDEEMED SUCCESSFULLY',
        subtitle: 'Attendee access granted',
      };
    }
    if (isAlreadyUsed) {
      return {
        icon: 'warning',
        iconBg: COLORS.warningLight,
        iconColor: COLORS.warning,
        title: 'PASS ALREADY USED',
        subtitle: 'This pass has already reached its scan limit',
      };
    }
    return {
      icon: 'close-circle',
      iconBg: COLORS.errorLight,
      iconColor: COLORS.error,
      title: 'INVALID PASS',
      subtitle: data?.message || 'Unauthorized or expired token',
    };
  };

  const header = getHeaderDetails();
  const passInfo = data?.passInfo || {};

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, SHADOWS.lg]}>
          {/* Status Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: header.iconBg }]}>
            <Ionicons name={header.icon} size={48} color={header.iconColor} />
          </View>

          {/* Title & Subtitle */}
          <Text
            style={[
              styles.modalTitle,
              isSuccessValid || isRedeemedSuccess
                ? { color: COLORS.success }
                : isAlreadyUsed
                ? { color: COLORS.warning }
                : { color: COLORS.error },
            ]}
          >
            {header.title}
          </Text>
          <Text style={styles.modalSubtitle}>{header.subtitle}</Text>

          {/* Attendee & Pass Details Card */}
          {(passInfo.participantName || passInfo.passName) && (
            <View style={styles.detailsBox}>
              {passInfo.participantName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Participant</Text>
                  <Text style={styles.detailValue}>{passInfo.participantName}</Text>
                </View>
              )}

              {passInfo.registrationId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registration ID</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                    {passInfo.registrationId}
                  </Text>
                </View>
              )}

              {passInfo.passName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pass Type</Text>
                  <Text style={styles.detailValue}>{passInfo.passName}</Text>
                </View>
              )}

              {passInfo.ticketType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ticket Category</Text>
                  <Text style={styles.detailValue}>{passInfo.ticketType}</Text>
                </View>
              )}

              {passInfo.lastUsedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Original Scan</Text>
                  <Text style={[styles.detailValue, { color: COLORS.warning }]}>
                    {new Date(passInfo.lastUsedAt).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isSuccessValid && (
              <>
                <PrimaryButton
                  title="CONFIRM REDEMPTION"
                  onPress={onConfirmRedemption}
                  loading={isRedeeming}
                  variant="success"
                  icon="checkmark"
                  style={styles.mainBtn}
                />
                <SecondaryButton
                  title="Cancel"
                  onPress={onClose}
                  style={styles.secBtn}
                />
              </>
            )}

            {isRedeemedSuccess && (
              <PrimaryButton
                title="SCAN NEXT ATTENDEE"
                onPress={onClose}
                icon="qr-code-outline"
                style={styles.mainBtn}
              />
            )}

            {isAlreadyUsed && (
              <PrimaryButton
                title="SCAN ANOTHER PASS"
                onPress={onClose}
                variant="warning"
                icon="reload-outline"
                style={styles.mainBtn}
              />
            )}

            {isInvalidOrDenied && (
              <PrimaryButton
                title="DISMISS & SCAN NEXT"
                onPress={onClose}
                variant="danger"
                icon="arrow-forward-outline"
                style={styles.mainBtn}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
    marginBottom: SPACING.md,
  },
  mainBtn: {
    width: '100%',
  },
  secBtn: {
    width: '100%',
  },
});

export default ValidationResultModal;
