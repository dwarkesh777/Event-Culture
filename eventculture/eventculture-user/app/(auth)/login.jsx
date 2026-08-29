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
import { useUserAuth } from '../../hooks/useUserAuth';
import InputField from '../../components/InputField';
import OtpInput from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function UserLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useUserAuth();

  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const res = await sendOtp(email.trim());
      setMaskedEmail(res.data?.email || email.trim());
      setStep('OTP');
      setCooldown(30);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp);
      router.replace('/(tabs)/home');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: insets.bottom + 20 },
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
          {step === 'EMAIL' ? (
            <>
              <Text style={styles.cardTitle}>Participant Login</Text>
              <Text style={styles.cardSubtitle}>
                Enter the email address you used during event registration to access your digital passes.
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
                title="Continue & Send Code"
                onPress={handleSendOtp}
                loading={loading}
                icon="arrow-forward-outline"
                style={styles.actionBtn}
              />

            </>
          ) : (
            <>
              <View style={styles.otpHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setStep('EMAIL');
                    setErrorMessage('');
                  }}
                  style={styles.backLink}
                >
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={styles.backLinkText}>Change Email</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardTitle}>Verify Your Identity</Text>
              <Text style={styles.cardSubtitle}>
                We sent a 6-digit code to your registered email: <Text style={styles.boldEmail}>{maskedEmail}</Text>
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
                title="Verify & Open Passes"
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
                    <Text style={styles.resendText}>Resend Verification Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>Secure Event Verification System</Text>
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
    marginBottom: SPACING.lg,
  },
  boldEmail: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionBtn: {
    marginTop: SPACING.sm,
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
  otpHeader: {
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
