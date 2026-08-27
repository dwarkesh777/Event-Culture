import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { uploadApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export const ImageUploader = ({
  currentImageUrl,
  onImageUploaded,
  folder = 'eventculture',
  label = 'Upload Image',
  aspectRatio = [16, 9],
  style,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');

  const pickAndUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is required to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUrl(asset.uri);
        setIsUploading(true);

        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: asset.uri,
          name: filename,
          type,
        });
        formData.append('folder', folder);

        const res = await uploadApi.uploadImage(formData);
        const uploaded = res.data.data;

        setPreviewUrl(uploaded.url);
        if (onImageUploaded) {
          onImageUploaded(uploaded);
        }
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Could not upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={pickAndUpload}
        disabled={isUploading}
        style={styles.uploadBox}
      >
        {previewUrl ? (
          <Image source={{ uri: previewUrl }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholderBox}>
            <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
            <Text style={styles.uploadTitle}>Tap to select image</Text>
            <Text style={styles.uploadSubtitle}>JPEG, PNG, WEBP up to 10MB</Text>
          </View>
        )}

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.uploadingText}>Uploading to Cloudinary...</Text>
          </View>
        )}

        {previewUrl && !isUploading && (
          <View style={styles.changeBadge}>
            <Ionicons name="camera-outline" size={14} color={COLORS.white} />
            <Text style={styles.changeBadgeText}>Change</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  uploadBox: {
    height: 160,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#C7DBFE',
    borderStyle: 'dashed',
    backgroundColor: COLORS.tintLight,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  changeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  changeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ImageUploader;
