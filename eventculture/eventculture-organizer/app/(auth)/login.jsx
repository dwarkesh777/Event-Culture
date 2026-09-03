import React, { useState, useRef } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import { OtpInput } from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import AnimatedBackground from '../../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizerLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useAuth();
  
  const otpRef = useRef(null);

  // Steps: 'EMAIL' | 'SETUP' | 'CODE'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2FA Setup data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleInitiateLogin = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid organizer email address.');
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
      setErrorMessage(err.message || 'Failed to initiate organizer login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit Authenticator code.');
      otpRef.current?.triggerShake();
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim());
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired Google Authenticator code');
      otpRef.current?.triggerShake();
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
      <AnimatedBackground colors={[COLORS.tintLight, '#E0E7FF', COLORS.background]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 16, 36), paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>EVENTCULTURE</Text>
          <Text style={styles.tagline}>ONE SCAN. ZERO QUEUES.</Text>
          <View style={styles.roleTag}>
            <Ionicons name="business-outline" size={12} color={COLORS.white} />
            <Text style={styles.roleTagText}>ORGANIZER PORTAL</Text>
          </View>
        </Animated.View>

        {/* Crisp Solid White Form Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, SHADOWS.md]}>
          {step === 'EMAIL' && (
            <View>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>
                Enter your registered organizer email address to access your operations dashboard.
              </Text>

              <InputField
                label="Organizer Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                placeholder="e.g. organizer@eventculture.io"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Continue with Authenticator"
                onPress={handleInitiateLogin}
                loading={loading}
                icon="shield-checkmark-outline"
                style={styles.actionBtn}
              />

              <View style={styles.signupPromptRow}>
                <Text style={styles.signupPromptText}>New to EventCulture?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={styles.signupPromptLink}>Register Organization</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'SETUP' && (
            <View>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBackToEmail} style={styles.backToEmail} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
                  <Text style={styles.backToEmailText}>Change Email</Text>
                </TouchableOpacity>
                <View style={styles.setupBadge}>
                  <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                  <Text style={styles.setupBadgeText}>2FA Setup</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Set Up Google Authenticator</Text>
              <Text style={styles.cardSubtitle}>
                Secure your organizer account with Google Authenticator (or any TOTP app).
              </Text>

              <View style={styles.instructionsBox}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                  <Text style={styles.stepText}>Open Google Authenticator on your mobile device.</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                  <Text style={styles.stepText}>Scan the QR code below or enter the key manually.</Text>
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

              <Text style={styles.inputLabel}>Enter 6-Digit Code from Authenticator</Text>
              <OtpInput
                ref={otpRef}
                codeLength={6}
                value={code}
                onChangeCode={(c) => {
                  setCode(c);
                  setErrorMessage('');
                }}
              />

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Verify & Complete Setup"
                onPress={handleVerifyCode}
                loading={loading}
                icon="checkmark-done"
                style={styles.actionBtn}
              />
            </View>
          )}

          {step === 'CODE' && (
            <View>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBackToEmail} style={styles.backToEmail} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
                  <Text style={styles.backToEmailText}>Change Email</Text>
                </TouchableOpacity>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
                  <Text style={styles.verifiedBadgeText}>2FA Active</Text>
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
                ref={otpRef}
                codeLength={6}
                value={code}
                onChangeCode={(c) => {
                  setCode(c);
                  setErrorMessage('');
                }}
              />

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Verify & Enter Dashboard"
                onPress={handleVerifyCode}
                loading={loading}
                icon="checkmark-done"
                style={styles.actionBtn}
              />

              <View style={styles.helperTip}>
                <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
                <Text style={styles.helperTipText}>
                  Codes in Google Authenticator refresh automatically every 30 seconds.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Footer Info */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.footerText}>Google Authenticator TOTP • Multi-Tenant Protection</Text>
        </Animated.View>
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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...SHADOWS.blueGlow,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 2.5,
    marginTop: 3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: 10,
    gap: 5,
    ...SHADOWS.sm,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.2,
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
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backToEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  backToEmailText: {
    fontSize: 12,
    fontWeight: '700',
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
  boldEmail: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    fontSize: 13,
  },
  actionBtn: {
    marginTop: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
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
  signupPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: 6,
  },
  signupPromptText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  signupPromptLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
});
