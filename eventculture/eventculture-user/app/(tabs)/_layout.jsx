import React from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableWithoutFeedback, Modal } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';
import Sidebar from '../../components/Sidebar';
import { useSidebar } from '../../hooks/useSidebar';

export default function UserTabsLayout() {
  const { width } = useWindowDimensions();
  const { isOpen, closeSidebar } = useSidebar();
  const isDesktop = width >= 768;

  return (
    <View style={styles.container}>
      {isDesktop && <Sidebar isDrawer={false} />}
      {!isDesktop && (
        <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={closeSidebar}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={closeSidebar}>
              <View style={styles.scrim} />
            </TouchableWithoutFeedback>
            <View style={styles.drawerWrapper}>
              <Sidebar isDrawer={true} />
            </View>
          </View>
        </Modal>
      )}
      <View style={styles.mainContent}>
        <Tabs tabBar={() => null} screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="events" />
          <Tabs.Screen name="passes" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
    height: '100%',
  },
  modalBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerWrapper: {
    height: '100%',
    zIndex: 10,
  },
});
