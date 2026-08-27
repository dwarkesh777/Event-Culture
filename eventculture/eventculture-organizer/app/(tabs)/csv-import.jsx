import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useEvent } from '../../hooks/useEvent';
import { csvApi } from '../../services/api';
import Header from '../../components/Header';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function CsvImportScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { selectedEvent } = useEvent();

  const [step, setStep] = useState('UPLOAD'); // 'UPLOAD' | 'MAP' | 'SUMMARY'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importRole, setImportRole] = useState(role || 'PARTICIPANT');

  // Column Mapping state
  const [mapping, setMapping] = useState({
    name: 'Name',
    email: 'Email',
    mobileNumber: 'Mobile Number',
    registrationId: 'Registration ID',
    ticketType: 'Ticket Type',
  });

  // Import Result Summary
  const [importSummary, setImportSummary] = useState(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (!file.name.toLowerCase().endsWith('.csv')) {
          Alert.alert('Invalid File', 'Please select a valid .csv file.');
          return;
        }

        setSelectedFile(file);
        setLoading(true);

        // Fetch CSV preview from backend
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: 'text/csv',
        });

        const res = await csvApi.preview(selectedEvent?._id, formData);
        setPreviewData(res.data.data);

        // Auto-match headers to standard columns
        const headers = res.data.data.headers || [];
        const findBestHeader = (candidates) => {
          for (const cand of candidates) {
            const match = headers.find(
              (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (match) return match;
          }
          return headers[0] || '';
        };

        setMapping({
          name: findBestHeader(['Name', 'Full Name', 'Participant Name', 'First Name']),
          email: findBestHeader(['Email', 'Email Address', 'Mail']),
          mobileNumber: findBestHeader(['Mobile Number', 'Phone', 'Phone Number', 'Contact Number', 'Mobile']),
          registrationId: findBestHeader(['Registration ID', 'Reg ID', 'Ticket ID', 'ID']),
          ticketType: findBestHeader(['Ticket Type', 'Pass Type', 'Category', 'Role']),
        });
      }
    } catch (err) {
      Alert.alert('Error Reading File', err.message || 'Failed to select CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleRunImport = async () => {
    if (!selectedEvent) {
      Alert.alert('Event Required', 'Please select an event first.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: 'text/csv',
      });
      formData.append('columnMapping', JSON.stringify(mapping));
      formData.append('role', importRole);

      const res = await csvApi.import(selectedEvent._id, formData);
      setImportSummary(res.data.data);
      setStep('SUMMARY');
    } catch (err) {
      Alert.alert('Import Failed', err.response?.data?.message || err.message || 'Error importing CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setPreviewData(null);
    setImportSummary(null);
  };

  useEffect(() => {
    if (selectedEvent?._id) {
      handleReset();
    }
  }, [selectedEvent?._id]);

  const targetTab = importRole === 'STAFF' ? 'staff' : importRole === 'GUEST' ? 'guest' : 'participants';
  const displayRole = importRole.charAt(0).toUpperCase() + importRole.slice(1).toLowerCase();

  return (
    <View style={styles.container}>
      <Header
        title={`Import ${displayRole}s`}
        subtitle={selectedEvent?.name || 'Upload CSV from any platform'}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'UPLOAD' && (
          <View>
            <View style={styles.introBox}>
              <Text style={styles.introTitle}>Seamless Registration Ingestion</Text>
              <Text style={styles.introSubtitle}>
                Export registrations from Google Forms, Devfolio, Eventbrite, or custom forms as CSV and import them directly into EventCulture.
              </Text>
            </View>

            {/* Large Upload Drop Area with Blue Dashed Border */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickFile}
              disabled={loading}
              style={[styles.uploadArea, SHADOWS.sm]}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={42} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadAreaTitle}>
                {selectedFile ? selectedFile.name : 'Choose CSV File'}
              </Text>
              <Text style={styles.uploadAreaSubtitle}>
                {selectedFile
                  ? `${previewData?.sampleRows?.length || 0}+ rows detected`
                  : 'Tap to browse files from your device (.csv)'}
              </Text>

              {loading && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Analyzing CSV structure...</Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedFile && previewData && (
              <View style={[styles.fileDetectedCard, SHADOWS.sm]}>
                <View style={styles.fileIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileMeta}>
                    {previewData.headers?.length} columns detected • Ready for mapping
                  </Text>
                </View>
              </View>
            )}

            <View style={{ marginTop: SPACING.lg, marginBottom: SPACING.md }}>
              <Text style={styles.mappingSectionTitle}>Select Target Group</Text>
              <View style={styles.chipScroll}>
                {['PARTICIPANT', 'GUEST', 'STAFF'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setImportRole(r)}
                    style={[
                      styles.colChip,
                      importRole === r && styles.selectedColChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.colChipText,
                        importRole === r && styles.selectedColChipText,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <PrimaryButton
              title="Continue to Column Mapping"
              onPress={() => setStep('MAP')}
              disabled={!selectedFile || !previewData || loading}
              icon="arrow-forward-outline"
              style={styles.continueBtn}
            />
          </View>
        )}

        {step === 'MAP' && (
          <View>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setStep('UPLOAD')} style={styles.backLink}>
                <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                <Text style={styles.backLinkText}>Change File</Text>
              </TouchableOpacity>
              <Text style={styles.stepTitle}>Map CSV Columns</Text>
              <Text style={styles.stepSubtitle}>
                Match the columns from <Text style={{ fontWeight: '700' }}>{selectedFile?.name}</Text> to EventCulture fields.
              </Text>
            </View>

            {/* Field Mappers */}
            <View style={[styles.mappingCard, SHADOWS.sm]}>
              <Text style={styles.mappingSectionTitle}>Required Target Fields</Text>

              {[
                { key: 'name', label: 'Full Name *', desc: 'Participant full name' },
                { key: 'email', label: 'Email Address *', desc: 'Used for OTP verification & passes' },
                { key: 'mobileNumber', label: 'Mobile Number *', desc: 'Participant login mobile number' },
              ].map((field) => (
                <View key={field.key} style={styles.mapRow}>
                  <View style={styles.mapTarget}>
                    <Text style={styles.targetLabel}>{field.label}</Text>
                    <Text style={styles.targetDesc}>{field.desc}</Text>
                  </View>
                  <View style={styles.columnSelector}>
                    <Text style={styles.selectedColText}>
                      Mapped: <Text style={styles.highlightCol}>{mapping[field.key] || 'Not Selected'}</Text>
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                      {previewData?.headers?.map((header) => (
                        <TouchableOpacity
                          key={header}
                          onPress={() => setMapping({ ...mapping, [field.key]: header })}
                          style={[
                            styles.colChip,
                            mapping[field.key] === header && styles.selectedColChip,
                          ]}
                        >
                          <Text
                            style={[
                              styles.colChipText,
                              mapping[field.key] === header && styles.selectedColChipText,
                            ]}
                          >
                            {header}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ))}

              <Text style={[styles.mappingSectionTitle, { marginTop: 16 }]}>Optional Fields</Text>
              {[
                { key: 'registrationId', label: 'Registration ID', desc: 'Ticket or Booking ID' },
                { key: 'ticketType', label: 'Ticket / Pass Type', desc: 'e.g. VIP, General, Mentor' },
              ].map((field) => (
                <View key={field.key} style={styles.mapRow}>
                  <View style={styles.mapTarget}>
                    <Text style={styles.targetLabel}>{field.label}</Text>
                    <Text style={styles.targetDesc}>{field.desc}</Text>
                  </View>
                  <View style={styles.columnSelector}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                      {previewData?.headers?.map((header) => (
                        <TouchableOpacity
                          key={header}
                          onPress={() => setMapping({ ...mapping, [field.key]: header })}
                          style={[
                            styles.colChip,
                            mapping[field.key] === header && styles.selectedColChip,
                          ]}
                        >
                          <Text
                            style={[
                              styles.colChipText,
                              mapping[field.key] === header && styles.selectedColChipText,
                            ]}
                          >
                            {header}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ))}
            </View>

            <PrimaryButton
              title="Import Participants Now"
              onPress={handleRunImport}
              loading={loading}
              icon="cloud-upload-outline"
              style={styles.importBtn}
            />
          </View>
        )}

        {step === 'SUMMARY' && importSummary && (
          <View>
            <View style={[styles.summaryCard, SHADOWS.md]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={40} color={COLORS.white} />
              </View>

              <Text style={styles.summaryTitle}>Import Complete</Text>
              <Text style={styles.summarySubtitle}>
                Participant data has been processed and securely saved into MongoDB.
              </Text>

              <View style={styles.summaryStatsGrid}>
                <View style={styles.summaryStatBox}>
                  <Text style={styles.summaryStatNumber}>{importSummary.totalRows}</Text>
                  <Text style={styles.summaryStatLabel}>Total Rows</Text>
                </View>
                <View style={[styles.summaryStatBox, { backgroundColor: COLORS.successLight }]}>
                  <Text style={[styles.summaryStatNumber, { color: COLORS.success }]}>
                    {importSummary.importedCount}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Imported</Text>
                </View>
                <View style={[styles.summaryStatBox, { backgroundColor: COLORS.warningLight }]}>
                  <Text style={[styles.summaryStatNumber, { color: COLORS.warning }]}>
                    {importSummary.duplicateCount}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Duplicates</Text>
                </View>
                <View style={[styles.summaryStatBox, { backgroundColor: COLORS.errorLight }]}>
                  <Text style={[styles.summaryStatNumber, { color: COLORS.error }]}>
                    {importSummary.invalidCount}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Invalid</Text>
                </View>
              </View>

              {importSummary.errors?.length > 0 && (
                <View style={styles.errorLogBox}>
                  <Text style={styles.errorLogTitle}>Errors / Duplicates Encountered:</Text>
                  {importSummary.errors.slice(0, 5).map((err, idx) => (
                    <Text key={idx} style={styles.errorLogItem}>
                      • Row {err.row}: {err.reason}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.summaryActions}>
                <PrimaryButton
                  title={`View ${displayRole}s`}
                  onPress={() => router.push(`/(tabs)/${targetTab}`)}
                  icon="people-outline"
                  style={{ marginBottom: 10 }}
                />
                <SecondaryButton
                  title="Import Another File"
                  onPress={handleReset}
                  icon="cloud-upload-outline"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  introBox: {
    backgroundColor: COLORS.tintLight,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#D0E1FD',
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  introSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  uploadArea: {
    height: 220,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadAreaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  uploadAreaSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  fileDetectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fileMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  continueBtn: {
    marginTop: SPACING.sm,
  },
  stepHeader: {
    marginBottom: SPACING.md,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mappingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  mappingSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mapTarget: {
    marginBottom: 6,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  targetDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  columnSelector: {
    marginTop: 4,
  },
  selectedColText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  highlightCol: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  colChip: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedColChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  colChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedColChipText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  importBtn: {
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summarySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: COLORS.tintLight,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorLogBox: {
    width: '100%',
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: SPACING.lg,
  },
  errorLogTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 4,
  },
  errorLogItem: {
    fontSize: 11,
    color: '#7F1D1D',
    marginBottom: 2,
  },
  summaryActions: {
    width: '100%',
  },
});
