import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
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
  const { width } = useWindowDimensions();
  const { sendOtp, verifyOtp } = useAuth();
  
  const otpRef = useRef(null);

  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Animation values for sliding between Email and OTP
  const slideX = useSharedValue(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid organizer email address.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      setStep('OTP');
      setCooldown(30);
      slideX.value = withSpring(-width);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      otpRef.current?.triggerShake();
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), otp);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification code');
      otpRef.current?.triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep('EMAIL');
    setErrorMessage('');
    slideX.value = withSpring(0);
  };


  const animatedEmailStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: withTiming(step === 'EMAIL' ? 1 : 0),
    position: 'absolute',
    width: '100%',
  }));

  const animatedOtpStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value + width }],
    opacity: withTiming(step === 'OTP' ? 1 : 0),
    width: '100%',
  }));

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AnimatedBackground colors={[COLORS.tintLight, '#E0E7FF', COLORS.background]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 16, 36), paddingBottom: insets.bottom + 20 },
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
          <View style={{ overflow: 'hidden', minHeight: 330 }}>
            {/* EMAIL STEP */}
            <Animated.View style={animatedEmailStyle} pointerEvents={step === 'EMAIL' ? 'auto' : 'none'}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>
                Enter your organizer email address to access your event operations dashboard.
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

              {errorMessage && step === 'EMAIL' ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Continue with Email"
                onPress={handleSendOtp}
                loading={loading}
                icon="arrow-forward"
                style={styles.actionBtn}
              />

              
              <View style={styles.signupPromptRow}>
                <Text style={styles.signupPromptText}>New to EventCulture?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={styles.signupPromptLink}>Register Organization</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* OTP STEP */}
            <Animated.View style={animatedOtpStyle} pointerEvents={step === 'OTP' ? 'auto' : 'none'}>
              <View style={styles.otpHeader}>
                <TouchableOpacity onPress={goBackToEmail} style={styles.backToEmail} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={styles.backToEmailText}>Change Email</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardTitle}>Verify Login</Text>
              <Text style={styles.cardSubtitle}>
                We sent a 6-digit verification code to
              </Text>
              <View style={styles.emailBadge}>
                <Ionicons name="mail" size={14} color={COLORS.primary} />
                <Text style={styles.boldEmail}>{email}</Text>
              </View>

              <OtpInput
                ref={otpRef}
                codeLength={6}
                value={otp}
                onChangeCode={(code) => {
                  setOtp(code);
                  setErrorMessage('');
                }}
              />

              {errorMessage && step === 'OTP' ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Verify & Enter Dashboard"
                onPress={handleVerifyOtp}
                loading={loading}
                icon="checkmark-done"
                style={styles.actionBtn}
              />

              <View style={styles.resendRow}>
                {cooldown > 0 ? (
                  <View style={styles.cooldownBadge}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.cooldownText}>Resend code in {cooldown}s</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={styles.resendBtn}>
                    <Ionicons name="refresh-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.resendText}>Resend Verification Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Footer Info */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.footerText}>Enterprise Grade Security • Multi-Tenant Encryption</Text>
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
    backgroundColor: COLORS.white, // Solid pure white card
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
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
    marginBottom: 4,
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
  otpHeader: {
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
  resendRow: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
  },
  cooldownText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
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
