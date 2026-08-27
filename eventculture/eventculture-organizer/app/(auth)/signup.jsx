import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import OtpInput from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizerSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendSignupOtp, verifySignupOtp } = useAuth();

  const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP' | 'SUCCESS'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organizerCode, setOrganizerCode] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

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

  const handleSendOtp = async () => {
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

      setStep('OTP');
      setCooldown(30);

      // In dev environment, auto-fill OTP if returned
      if (res?.data?.devOtp) {
        setOtp(res.data.devOtp);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send signup verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
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
        otp: otp.trim(),
      });

      setCreatedInfo(result);
      setStep('SUCCESS');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
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
                title="Send Verification OTP"
                onPress={handleSendOtp}
                loading={loading}
                icon="arrow-forward-outline"
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

          {step === 'OTP' && (
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
              </View>

              <Text style={styles.cardTitle}>Verify Organizer Email</Text>
              <Text style={styles.cardSubtitle}>
                We sent a 6-digit registration code to <Text style={styles.boldHighlight}>{email}</Text> for organization <Text style={styles.boldHighlight}>{name}</Text>.
              </Text>

              <OtpInput
                codeLength={6}
                value={otp}
                onChangeCode={(code) => {
                  setOtp(code);
                  setErrorMessage('');
                }}
              />

              {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

              <PrimaryButton
                title="Verify & Create Account"
                onPress={handleVerifyOtp}
                loading={loading}
                icon="checkmark-circle-outline"
                style={styles.actionBtn}
              />

              <View style={styles.resendRow}>
                {cooldown > 0 ? (
                  <Text style={styles.cooldownText}>Resend code in {cooldown}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-done" size={48} color={COLORS.white} />
              </View>

              <Text style={styles.successTitle}>Successfully Created!</Text>
              <Text style={styles.successSubtitle}>
                Your organizer account and database workspace folder have been initialized.
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
                  <Text style={styles.detailLabel}>Scope</Text>
                  <Text style={styles.detailValue}>All Users & Volunteers Linked</Text>
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
  resendRow: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cooldownText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
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
