import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserAuth } from '../hooks/useUserAuth';
import VideoSplash from '../components/VideoSplash';
import { COLORS } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserAuth();
  const [videoDone, setVideoDone] = useState(false);

  useEffect(() => {
    if (videoDone && !isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [videoDone, isAuthenticated, isLoading, router]);

  return (
    <View style={styles.container}>
      <VideoSplash onFinish={() => setVideoDone(true)} />
      {videoDone && isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="small" color={COLORS?.primary || '#FF5A5F'} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
