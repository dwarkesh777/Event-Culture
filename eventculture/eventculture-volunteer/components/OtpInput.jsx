import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export const OtpInput = ({ codeLength = 6, value = '', onChangeCode }) => {
  const inputsRef = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = value.split('');
  while (digits.length < codeLength) {
    digits.push('');
  }

  const handleChange = (text, index) => {
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

  return (
    <View style={styles.container}>
      {Array.from({ length: codeLength }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!digits[index];

        return (
          <View
            key={index}
            style={[
              styles.box,
              isFocused && styles.focusedBox,
              hasValue && styles.filledBox,
              SHADOWS.sm,
            ]}
          >
            <TextInput
              ref={(ref) => (inputsRef.current[index] = ref)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    width: '100%',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedBox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tintLight,
    borderWidth: 2,
  },
  filledBox: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.tintLight,
  },
  input: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default OtpInput;
