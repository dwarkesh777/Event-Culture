import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { volunteerScanApi } from '../../services/api';
import { useVolunteerAuth } from '../../hooks/useVolunteerAuth';
import { useSidebar } from '../../hooks/useSidebar';
import ScannerFrame from '../../components/ScannerFrame';
import ValidationResultModal from '../../components/ValidationResultModal';
import OrganizerSwitcherModal from '../../components/OrganizerSwitcherModal';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function VolunteerScannerScreen() {
  const insets = useSafeAreaInsets();
  const { assignedEvent, selectedOrganizer } = useVolunteerAuth();
  const { width } = useWindowDimensions();
  const { openSidebar } = useSidebar();
  const isDesktop = width >= 768;
  const { passTypeId, passName } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);

  // Modal feedback state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState(null); // 'VALID' | 'REDEEMED' | 'ALREADY_USED' | 'INVALID' | 'UNAUTHORIZED'
  const [modalData, setModalData] = useState(null);
  const [currentScannedToken, setCurrentScannedToken] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const lastScannedTime = useRef(0);

  const handleBarcodeScanned = async ({ data: qrToken }) => {
    const now = Date.now();
    // Debounce to prevent multiple triggers in 1.5s
    if (now - lastScannedTime.current < 1500 || !isScanning) {
      return;
    }
    lastScannedTime.current = now;
    processToken(qrToken);
  };

  const processToken = async (token) => {
    if (!token || !token.trim()) return;

    setIsScanning(false);
    setCurrentScannedToken(token.trim());

    try {
      const res = await volunteerScanApi.validatePass(token.trim(), 'Main Gate', 'APP_SCANNER_1', passTypeId);
      const passInfo = res.data.data?.passInfo;

      setModalData({
        message: res.data.message,
        passInfo,
      });
      setModalState('VALID');
      setModalVisible(true);
    } catch (err) {
      const errData = err.response?.data?.errors || err.response?.data?.data || {};
      const status = errData.status || 'INVALID';
      const message = err.response?.data?.message || err.message || 'Pass validation failed';

      setModalData({
        message,
        passInfo: errData.passInfo || {},
      });
      setModalState(status === 'ALREADY_USED' ? 'ALREADY_USED' : status === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'INVALID');
      setModalVisible(true);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!currentScannedToken) return;

    setIsRedeeming(true);
    try {
      const res = await volunteerScanApi.redeemPass(
        currentScannedToken,
        'Main Gate',
        'APP_SCANNER_1',
        passTypeId
      );
      setModalData({
        message: res.data.message,
        passInfo: res.data.data?.passInfo,
      });
      setModalState('REDEEMED');
    } catch (err) {
      const errData = err.response?.data?.errors || err.response?.data?.data || {};
      const status = errData.status || 'INVALID';
      setModalData({
        message: err.response?.data?.message || 'Failed to redeem pass',
        passInfo: errData.passInfo || {},
      });
      setModalState(status === 'ALREADY_USED' ? 'ALREADY_USED' : 'INVALID');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalState(null);
    setModalData(null);
    setCurrentScannedToken(null);
    setIsScanning(true);
  };

  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={60} color={COLORS.primary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          EventCulture requires camera access to scan attendee digital QR passes rapidly.
        </Text>
        <PrimaryButton
          title="Enable Camera Access"
          onPress={requestPermission}
          style={{ width: '80%', marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-Screen Camera Viewfinder */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Camera HUD Overlay with Safe Area Insets */}
      <View
        style={[
          styles.hudOverlay,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            paddingBottom: Math.max(insets.bottom + 12, 20),
          },
        ]}
        pointerEvents="box-none"
      >
        {/* 1. TOP HEADER & STATUS BAR */}
        <View style={styles.topSection} pointerEvents="box-none">
          {/* Top Bar Navigation Row */}
          <View style={styles.topNavRow} pointerEvents="box-none">
            {!isDesktop && (
              <TouchableOpacity
                onPress={openSidebar}
                style={styles.circleIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="menu" size={22} color={COLORS.white} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setSwitcherVisible(true)}
              style={styles.topWorkspacePill}
              activeOpacity={0.8}
            >
              <View style={styles.scannerOrgCodeBadge}>
                <Text style={styles.scannerOrgCodeText}>
                  {(selectedOrganizer?.organizerCode || assignedEvent?.organizerCode || 'ORG').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.scannerEventTitle} numberOfLines={1} ellipsizeMode="tail">
                {assignedEvent?.name || 'Select Event'}
              </Text>
              <View style={styles.scannerSwitchBtn}>
                <Ionicons name="swap-horizontal" size={12} color={COLORS.primary} />
                <Text style={styles.scannerSwitchText}>Switch</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTorch(!torch)}
              style={[styles.circleIconBtn, torch && styles.circleIconBtnActive]}
            >
              <Ionicons
                name={torch ? 'flash' : 'flash-off'}
                size={20}
                color={torch ? '#FBBF24' : COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* Sub Header Status Chips (Engine Active & Scan Category) */}
          <View style={styles.statusChipsRow}>
            <View style={styles.engineBadge}>
              <View style={styles.engineDot} />
              <Text style={styles.engineText}>ENGINE ACTIVE</Text>
            </View>

            <View style={styles.permBadge}>
              <Ionicons name="scan-outline" size={12} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.permBadgeText}>
                {passName ? `SCANNING: ${passName.toUpperCase()}` : 'ALL ACCESS'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. CENTER VIEWFINDER RETICLE */}
        <View style={styles.centerSection} pointerEvents="none">
          <ScannerFrame isScanning={isScanning} />
        </View>

        {/* 3. BOTTOM CONTROLS & SECURITY BADGE */}
        <View style={styles.bottomSection} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => setShowManualInput(!showManualInput)}
            style={styles.manualEntryBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="keypad-outline" size={15} color={COLORS.white} />
            <Text style={styles.manualEntryText}>Manual Pass Code Entry</Text>
          </TouchableOpacity>

          <View style={styles.securityPill}>
            <Ionicons name="shield-checkmark" size={13} color="#60A5FA" />
            <Text style={styles.securityPillText}>Atomic Anti-Duplicate Protection</Text>
          </View>
        </View>
      </View>

      {/* Manual Input Sheet Modal */}
      {showManualInput && (
        <View style={[styles.manualSheet, { bottom: Math.max(insets.bottom + 90, 100) }, SHADOWS.lg]}>
          <View style={styles.manualSheetHeader}>
            <Text style={styles.manualTitle}>Enter QR Pass Token</Text>
            <TouchableOpacity onPress={() => setShowManualInput(false)} style={styles.closeSheetBtn}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.manualInputRow}>
            <TextInput
              value={manualToken}
              onChangeText={setManualToken}
              placeholder="e.g. evtpass_99abc..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.tokenInput}
              autoCapitalize="none"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowManualInput(false);
                processToken(manualToken);
              }}
              style={styles.tokenSubmitBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.tokenSubmitText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instant Validation Result & Redemption Modal */}
      <ValidationResultModal
        visible={modalVisible}
        state={modalState}
        data={modalData}
        isRedeeming={isRedeeming}
        onConfirmRedemption={handleConfirmRedemption}
        onClose={handleCloseModal}
      />

      {/* Switch Organizer & Event Modal */}
      <OrganizerSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  permissionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  topSection: {
    width: '100%',
    zIndex: 30,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  circleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  circleIconBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#FBBF24',
  },
  topWorkspacePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 6,
  },
  scannerOrgCodeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scannerOrgCodeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  scannerEventTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  scannerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  scannerSwitchText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  statusChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  engineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  engineText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  permBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 78, 216, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  permBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 10,
    zIndex: 30,
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  manualEntryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  securityPillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
  },
  manualSheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    zIndex: 100,
  },
  manualSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeSheetBtn: {
    padding: 4,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tokenInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
  },
  tokenSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  tokenSubmitText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

