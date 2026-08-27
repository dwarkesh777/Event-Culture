import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Tabs } from 'expo-router';
import Sidebar from '../../components/Sidebar';
import { useSidebar } from '../../hooks/useSidebar';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { isOpen, closeSidebar } = useSidebar();
  const isDesktop = width >= 768;

  return (
    <View style={styles.container}>
      {/* Desktop Persistent Left Sidebar */}
      {isDesktop && <Sidebar isDrawer={false} />}

      {/* Mobile Slide-Out Drawer Modal */}
      {!isDesktop && (
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={closeSidebar}
        >
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

      {/* Main Application Area */}
      <View style={styles.mainContent}>
        <Tabs
          tabBar={() => null}
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="dashboard" />
          <Tabs.Screen name="events" />
          <Tabs.Screen name="participants" />
          <Tabs.Screen name="staff" />
          <Tabs.Screen name="guest" />
          <Tabs.Screen name="csv-import" />
          <Tabs.Screen name="passes" />
          <Tabs.Screen name="volunteers" />
          <Tabs.Screen name="analytics" />
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // Strong dark scrim to isolate drawer
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
    backgroundColor: COLORS.white,
  },
});
