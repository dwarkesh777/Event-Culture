import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSidebar } from '../hooks/useSidebar';

export const Header = ({
  title,
  subtitle,
  rightAction,
  rightIcon,
  onRightPress,
  showBack,
  onBack,
  showMenu = true,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { openSidebar } = useSidebar();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.contentRow}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : showMenu && !isDesktop ? (
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction ? (
          rightAction
        ) : rightIcon && onRightPress ? (
          <TouchableOpacity onPress={onRightPress} style={styles.rightBtn}>
            <Ionicons name={rightIcon} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  menuBtn: {
    marginRight: 10,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  rightBtn: {
    padding: 8,
  },
});

export default Header;
