import React, { useState } from 'react';
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
import { useUserAuth } from '../../hooks/useUserAuth';
import InputField from '../../components/InputField';
import OtpInput from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function UserLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useUserAuth();

  // Steps: 'EMAIL' | 'SETUP' | 'CODE'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2FA Setup details returned from backend
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleInitiateLogin = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase());
      const data = res.data || {};

      if (data.isSetupRequired) {
        setQrCodeUrl(data.qrCodeUrl || '');
        setSecretKey(data.secretKey || '');
        setStep('SETUP');
      } else {
        setStep('CODE');
      }
      setCode('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit Authenticator code.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim());
      router.replace('/(tabs)/home');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired Google Authenticator code');
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

  const goBackToEmail = () => {
    setStep('EMAIL');
    setCode('');
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="ticket" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>EVENTCULTURE</Text>
          <Text style={styles.tagline}>ONE SCAN. ZERO QUEUES.</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>PARTICIPANT PASS PORTAL</Text>
          </View>
        </View>

        {/* Auth Form Card */}
        <View style={[styles.card, SHADOWS.md]}>
          {step === 'EMAIL' && (
            <>
              <Text style={styles.cardTitle}>Participant Login</Text>
              <Text style={styles.cardSubtitle}>
                Enter your registered email address to access your event passes with Google Authenticator security.
              </Text>

              <InputField
                label="Registered Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                placeholder="e.g. jordan.smith@example.com"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

              <PrimaryButton
                title="Continue with Authenticator"
                onPress={handleInitiateLogin}
                loading={loading}
                icon="shield-checkmark-outline"
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 'SETUP' && (
            <>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBackToEmail} style={styles.backLink}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={styles.backLinkText}>Change Email</Text>
                </TouchableOpacity>
                <View style={styles.setupBadge}>
                  <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                  <Text style={styles.setupBadgeText}>First Time Setup</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Set Up Authenticator</Text>
              <Text style={styles.cardSubtitle}>
                Link <Text style={styles.boldEmail}>{email}</Text> with Google Authenticator in 3 simple steps:
              </Text>

              <View style={styles.instructionsBox}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                  <Text style={styles.stepText}>Open <Text style={styles.boldText}>Google Authenticator</Text> or any 2FA app.</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                  <Text style={styles.stepText}>Scan this QR code or copy the secret key below.</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                  <Text style={styles.stepText}>Enter the 6-digit code shown in the app to verify.</Text>
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

              <Text style={styles.inputLabel}>Enter 6-Digit Authenticator Code</Text>
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
                title="Verify & Complete Setup"
                onPress={handleVerifyCode}
                loading={loading}
                icon="checkmark-circle-outline"
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 'CODE' && (
            <>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBackToEmail} style={styles.backLink}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={styles.backLinkText}>Change Email</Text>
                </TouchableOpacity>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
                  <Text style={styles.verifiedBadgeText}>2FA Protected</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Authenticator Code</Text>
              <Text style={styles.cardSubtitle}>
                Enter the 6-digit verification code from Google Authenticator for:
              </Text>

              <View style={styles.emailBadge}>
                <Ionicons name="mail" size={14} color={COLORS.primary} />
                <Text style={styles.boldEmail}>{email}</Text>
              </View>

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
                title="Verify & Open Passes"
                onPress={handleVerifyCode}
                loading={loading}
                icon="checkmark-circle-outline"
                style={styles.actionBtn}
              />

              <View style={styles.helperTip}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.helperTipText}>
                  Codes in Google Authenticator refresh automatically every 30 seconds.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>Google Authenticator TOTP Security</Text>
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
    borderWidth: 1,
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
    marginBottom: SPACING.md,
  },
  boldEmail: {
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLinkText: {
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: SPACING.lg,
  },
  helperTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  helperTipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
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
