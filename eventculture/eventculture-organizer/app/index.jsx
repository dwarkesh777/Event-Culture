import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import VideoSplash from '../components/VideoSplash';
import { COLORS } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [videoDone, setVideoDone] = useState(false);

  useEffect(() => {
    if (videoDone && !isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/dashboard');
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
          <ActivityIndicator size="small" color={COLORS?.primary || '#6C5CE7'} />
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
