import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { volunteerScanApi } from '../../services/api';
import { useVolunteerAuth } from '../../hooks/useVolunteerAuth';
import { useSidebar } from '../../hooks/useSidebar';
import ScannerFrame from '../../components/ScannerFrame';
import ValidationResultModal from '../../components/ValidationResultModal';
import OrganizerSwitcherModal from '../../components/OrganizerSwitcherModal';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function VolunteerScannerScreen() {
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

      {/* High-Tech Overlay Frame with Blue Corners */}
      <ScannerFrame
        isTorchOn={torch}
        onToggleTorch={() => setTorch(!torch)}
        isScanning={isScanning}
        categoryLabel={passName ? `SCANNING: ${passName.toUpperCase()}` : 'ALL ACCESS'}
      />

      {/* Top Floating Active Organizer & Event Bar */}
      <View style={styles.topWorkspaceBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {!isDesktop && (
            <TouchableOpacity onPress={openSidebar} style={styles.scannerMenuBtn}>
              <Ionicons name="menu" size={26} color={COLORS.white} />
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
            <Text style={styles.scannerEventTitle} numberOfLines={1}>
              {assignedEvent?.name || 'Select Event'}
            </Text>
            <View style={styles.scannerSwitchBtn}>
              <Ionicons name="swap-horizontal" size={13} color={COLORS.primary} />
              <Text style={styles.scannerSwitchText}>Switch</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Token Trigger floating at bottom */}
      <View style={styles.manualEntryBar}>
        <TouchableOpacity
          onPress={() => setShowManualInput(!showManualInput)}
          style={styles.manualEntryBtn}
        >
          <Ionicons name="keypad-outline" size={16} color={COLORS.white} />
          <Text style={styles.manualEntryText}>Manual Pass Code Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Sheet */}
      {showManualInput && (
        <View style={[styles.manualSheet, SHADOWS.lg]}>
          <Text style={styles.manualTitle}>Enter QR Pass Token</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              value={manualToken}
              onChangeText={setManualToken}
              placeholder="e.g. evtpass_99abc..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.tokenInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => {
                setShowManualInput(false);
                processToken(manualToken);
              }}
              style={styles.tokenSubmitBtn}
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
  topWorkspaceBar: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  scannerMenuBtn: {
    marginRight: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: RADIUS.full,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topWorkspacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
    maxWidth: '96%',
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
    flexShrink: 1,
  },
  scannerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  scannerSwitchText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  manualEntryBar: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  manualEntryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  manualSheet: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
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
