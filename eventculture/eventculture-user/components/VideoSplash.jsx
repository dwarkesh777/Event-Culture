import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as SplashScreen from 'expo-splash-screen';

const videoSource = require('../assets/splash-video.mp4');

export default function VideoSplash({ onFinish }) {
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);
  const webVideoRef = useRef(null);

  const handleFinish = useCallback(() => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      setFinished(true);
      if (onFinish) {
        onFinish();
      }
    }
  }, [onFinish]);

  // Hide native static splash screen once video component mounts
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Web volume control (very gentle background level)
  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.volume = 0.08;
    }
  }, []);

  // Native player setup with expo-video (very gentle audio volume)
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 0.08;
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playToEnd', () => {
      handleFinish();
    });
    return () => {
      subscription.remove();
    };
  }, [player, handleFinish]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <video
          ref={webVideoRef}
          src={videoSource}
          autoPlay
          playsInline
          onEnded={handleFinish}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
