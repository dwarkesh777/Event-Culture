import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import { OtpInput } from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizerSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendSignupOtp, verifySignupOtp } = useAuth();

  const [step, setStep] = useState('FORM'); // 'FORM' | 'SETUP' | 'SUCCESS'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organizerCode, setOrganizerCode] = useState('');
  const [code, setCode] = useState('');

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdInfo, setCreatedInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Auto redirect on success
  useEffect(() => {
    let redirectTimer;
    if (step === 'SUCCESS') {
      redirectTimer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(redirectTimer);
            router.replace('/(tabs)/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(redirectTimer);
  }, [step]);

  // Helper to generate a suggested organizer code from name
  const handleAutoGenerateCode = () => {
    if (!name.trim()) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      setOrganizerCode(`ORG${randomDigits}`);
      return;
    }
    const cleanPrefix = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const suffix = new Date().getFullYear().toString().slice(-2);
    setOrganizerCode(`${cleanPrefix || 'ORG'}${suffix}`);
    setErrorMessage('');
  };

  const handleSendSignupDetails = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your Organizer or Organization name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid organizer email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }
    if (!organizerCode.trim() || organizerCode.trim().length < 3) {
      setErrorMessage('Organizer Code must be at least 3 alphanumeric characters.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const cleanCode = organizerCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const res = await sendSignupOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: phone.trim(),
        organizerCode: cleanCode,
      });

      const data = res?.data || {};
      setQrCodeUrl(data.qrCodeUrl || '');
      setSecretKey(data.secretKey || '');
      setStep('SETUP');
      setCode('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate organizer registration');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit Authenticator code.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const cleanCode = organizerCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const result = await verifySignupOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: phone.trim(),
        organizerCode: cleanCode,
        otp: code.trim(),
      });

      setCreatedInfo(result);
      setStep('SUCCESS');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired Authenticator code.');
    } finally {
      setLoading(false);
    }
  };

  const copySecretKey = async () => {
    if (!secretKey) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(secretKey);
      }
    } catch {}
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const folderPreview = organizerCode.trim()
    ? `organizer_${organizerCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')}`
    : 'organizer_workspace';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 20, 36), paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="business" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>EVENTCULTURE</Text>
          <Text style={styles.tagline}>ORGANIZER REGISTRATION</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>MULTI-TENANT PORTAL</Text>
          </View>
        </View>

        {/* Dynamic Step Card */}
        <View style={[styles.card, SHADOWS.md]}>
          {step === 'FORM' && (
            <>
              <Text style={styles.cardTitle}>Create Organizer Account</Text>
              <Text style={styles.cardSubtitle}>
                Register your organization to create events, manage volunteers, and deploy cryptographic passes.
              </Text>

              <InputField
                label="Organizer / Organization Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMessage('');
                }}
                placeholder="e.g. Acme Events or John Doe"
                icon="business-outline"
                autoCapitalize="words"
              />

              <InputField
                label="Work Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                placeholder="e.g. contact@acmeevents.com"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setErrorMessage('');
                }}
                placeholder="e.g. +91 9876543210"
                icon="call-outline"
                keyboardType="phone-pad"
              />

              <View style={styles.codeFieldContainer}>
                <View style={styles.codeLabelRow}>
                  <Text style={styles.inputLabel}>Organizer Code</Text>
                  <TouchableOpacity onPress={handleAutoGenerateCode} style={styles.suggestBtn}>
                    <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                    <Text style={styles.suggestBtnText}>Auto-Suggest</Text>
                  </TouchableOpacity>
                </View>

                <InputField
                  value={organizerCode}
                  onChangeText={(text) => {
                    setOrganizerCode(text.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="e.g. ACME26"
                  icon="keypad-outline"
                  autoCapitalize="characters"
                  maxLength={15}
                />

                {/* Live Database Folder Indicator */}
                <View style={styles.folderPreviewBox}>
                  <Ionicons name="folder-open" size={16} color={COLORS.primary} />
                  <View style={styles.folderPreviewContent}>
                    <Text style={styles.folderPreviewLabel}>Database Tenant Folder:</Text>
                    <Text style={styles.folderPreviewPath}>{folderPreview}</Text>
                  </View>
                </View>
              </View>

              {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

              <PrimaryButton
                title="Continue to 2FA Setup"
                onPress={handleSendSignupDetails}
                loading={loading}
                icon="shield-checkmark-outline"
                style={styles.actionBtn}
              />

              <View style={styles.loginPromptRow}>
                <Text style={styles.loginPromptText}>Already registered as an organizer?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginPromptLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'SETUP' && (
            <>
              <View style={styles.otpHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setStep('FORM');
                    setErrorMessage('');
                  }}
                  style={styles.backToForm}
                >
                  <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                  <Text style={styles.backToFormText}>Edit Details</Text>
                </TouchableOpacity>
                <View style={styles.setupBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
                  <Text style={styles.setupBadgeText}>Google Authenticator</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Set Up 2FA Security</Text>
              <Text style={styles.cardSubtitle}>
                Link Google Authenticator for <Text style={styles.boldHighlight}>{email}</Text> to secure your organizer workspace:
              </Text>

              <View style={styles.instructionsBox}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                  <Text style={styles.stepText}>Open <Text style={styles.boldText}>Google Authenticator</Text> on your phone.</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                  <Text style={styles.stepText}>Scan the QR code below or enter the key manually.</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                  <Text style={styles.stepText}>Enter the 6-digit code shown to complete registration.</Text>
                </View>
              </View>

              {/* QR Code Container */}
              {qrCodeUrl ? (
                <View style={styles.qrFrame}>
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}

              {/* Manual Key Box */}
              {secretKey ? (
                <View style={styles.keyBox}>
                  <View style={styles.keyTextContainer}>
                    <Text style={styles.keyLabel}>MANUAL SETUP KEY</Text>
                    <Text style={styles.keyValue} numberOfLines={1} ellipsizeMode="middle">
                      {secretKey}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={copySecretKey} style={styles.copyBtn} activeOpacity={0.7}>
                    <Ionicons
                      name={copiedKey ? 'checkmark-circle' : 'copy-outline'}
                      size={16}
                      color={copiedKey ? COLORS.success : COLORS.primary}
                    />
                    <Text style={[styles.copyBtnText, copiedKey && { color: COLORS.success }]}>
                      {copiedKey ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={styles.inputPromptLabel}>Enter 6-Digit Authenticator Code</Text>
              <OtpInput
                codeLength={6}
                value={code}
                onChangeCode={(c) => {
                  setCode(c);
                  setErrorMessage('');
                }}
              />

              {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

              <PrimaryButton
                title="Verify & Create Organization"
                onPress={handleVerifySetup}
                loading={loading}
                icon="checkmark-circle-outline"
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-done" size={48} color={COLORS.white} />
              </View>

              <Text style={styles.successTitle}>Successfully Created!</Text>
              <Text style={styles.successSubtitle}>
                Your organizer account and database workspace folder have been initialized with Google Authenticator security.
              </Text>

              <View style={styles.successCardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Organizer Name</Text>
                  <Text style={styles.detailValue}>{name}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Organizer Code</Text>
                  <Text style={styles.detailValueBadge}>{organizerCode.toUpperCase()}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Database Folder</Text>
                  <Text style={styles.detailFolderValue}>{createdInfo?.folderName || folderPreview}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Security</Text>
                  <Text style={styles.detailValue}>Google Authenticator 2FA Enabled</Text>
                </View>
              </View>

              <PrimaryButton
                title={`Launch Dashboard (${redirectCountdown}s)`}
                onPress={() => router.replace('/(tabs)/dashboard')}
                icon="rocket-outline"
                style={styles.actionBtn}
              />
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>EventCulture Multi-Tenant Security Architecture</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#C7DBFE',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  roleTag: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 10,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: SPACING.lg,
  },
  codeFieldContainer: {
    marginBottom: SPACING.md,
  },
  codeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inputPromptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.sm,
  },
  suggestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  folderPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F6FE',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: '#D4E4FC',
  },
  folderPreviewContent: {
    flex: 1,
  },
  folderPreviewLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  folderPreviewPath: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  boldHighlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionBtn: {
    marginTop: SPACING.md,
  },
  errorBanner: {
    color: COLORS.error,
    backgroundColor: COLORS.errorLight,
    padding: 10,
    borderRadius: RADIUS.md,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  loginPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: 6,
  },
  loginPromptText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loginPromptLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backToForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backToFormText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  setupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  setupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  qrFrame: {
    alignSelf: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  keyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: SPACING.lg,
  },
  keyTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  keyLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  keyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.xl,
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  successCardDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  detailValueBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  detailFolderValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
