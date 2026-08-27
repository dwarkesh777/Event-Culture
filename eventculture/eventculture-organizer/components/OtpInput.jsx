import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export const OtpInput = forwardRef(({ codeLength = 6, value = '', onChangeCode }, ref) => {
  const inputsRef = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = value.split('');
  while (digits.length < codeLength) {
    digits.push('');
  }

  const handleChange = (text, index) => {
    // Handle paste of complete 6-digit OTP
    if (text.length > 1) {
      const cleanDigits = text.replace(/[^0-9]/g, '').slice(0, codeLength);
      onChangeCode(cleanDigits);
      if (cleanDigits.length > 0 && cleanDigits.length <= codeLength) {
        const nextIdx = Math.min(cleanDigits.length, codeLength - 1);
        inputsRef.current[nextIdx]?.focus();
      }
      return;
    }

    const cleanChar = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    const newCode = newDigits.join('').slice(0, codeLength);
    onChangeCode(newCode);

    if (cleanChar && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Error Shake Animation
  const shakeOffset = useSharedValue(0);
  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
  };

  useImperativeHandle(ref, () => ({
    triggerShake,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {Array.from({ length: codeLength }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!digits[index];

        return (
          <View
            key={index}
            style={[
              styles.box,
              hasValue && styles.filledBox,
              isFocused && styles.focusedBox,
              SHADOWS.sm,
            ]}
          >
            <TextInput
              ref={(el) => (inputsRef.current[index] = el)}
              value={digits[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              keyboardType="number-pad"
              maxLength={codeLength}
              selectTextOnFocus
              textAlign="center"
              style={styles.input}
            />
          </View>
        );
      })}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
    width: '100%',
    gap: 6,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#CBD5E1', // Crisp high definition border
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedBox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tintLight,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  filledBox: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  input: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default OtpInput;
