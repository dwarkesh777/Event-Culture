import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useVolunteerAuth } from '../hooks/useVolunteerAuth';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizerSwitcherModal({ visible, onClose }) {
  const {
    organizers,
    selectedOrganizer,
    assignedEvent,
    selectOrganizer,
    selectEvent,
  } = useVolunteerAuth();

  const handleSelectOrg = (org) => {
    selectOrganizer(org.organizerCode);
  };

  const handleSelectEv = (ev) => {
    selectEvent(ev);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.scrim} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheetContainer, SHADOWS.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.title}>Switch Organizer / Event</Text>
                <Text style={styles.subtitle}>Select the active organizer workspace for scanning</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {organizers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Organizers Found</Text>
                <Text style={styles.emptyDesc}>
                  Ask your event organizer to assign your email as a volunteer for their event.
                </Text>
              </View>
            ) : (
              organizers.map((org) => {
                const isOrgSelected = selectedOrganizer?.organizerCode === org.organizerCode;

                return (
                  <View
                    key={org.organizerCode}
                    style={[
                      styles.orgCard,
                      isOrgSelected && styles.orgCardSelected,
                    ]}
                  >
                    {/* Organizer Header Row */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectOrg(org)}
                      style={styles.orgHeader}
                    >
                      <View style={styles.orgAvatar}>
                        <Ionicons
                          name="business"
                          size={18}
                          color={isOrgSelected ? COLORS.primary : COLORS.textSecondary}
                        />
                      </View>

                      <View style={styles.orgInfo}>
                        <View style={styles.orgNameRow}>
                          <Text style={[styles.orgName, isOrgSelected && styles.orgNameActive]}>
                            {org.name || org.organizationName}
                          </Text>
                          <View style={[styles.codeBadge, isOrgSelected && styles.codeBadgeActive]}>
                            <Text style={[styles.codeBadgeText, isOrgSelected && styles.codeBadgeTextActive]}>
                              {org.organizerCode}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.folderText}>{org.folderName}</Text>
                      </View>

                      <View style={styles.radioContainer}>
                        <Ionicons
                          name={isOrgSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={22}
                          color={isOrgSelected ? COLORS.primary : COLORS.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Assigned Events under this Organizer */}
                    {isOrgSelected && org.events && org.events.length > 0 && (
                      <View style={styles.eventsSection}>
                        <Text style={styles.eventsLabel}>SELECT EVENT TO SCAN:</Text>
                        {org.events.map((ev) => {
                          const isEvSelected = assignedEvent?._id === ev._id;

                          return (
                            <TouchableOpacity
                              key={ev._id}
                              activeOpacity={0.7}
                              onPress={() => handleSelectEv(ev)}
                              style={[
                                styles.eventItem,
                                isEvSelected && styles.eventItemSelected,
                              ]}
                            >
                              <Ionicons
                                name={isEvSelected ? 'checkmark-circle' : 'calendar-outline'}
                                size={18}
                                color={isEvSelected ? COLORS.primary : COLORS.textSecondary}
                              />
                              <View style={styles.eventItemInfo}>
                                <Text style={[styles.eventItemName, isEvSelected && styles.eventItemNameSelected]}>
                                  {ev.name}
                                </Text>
                                {ev.location?.venue ? (
                                  <Text style={styles.eventItemLocation} numberOfLines={1}>
                                    📍 {ev.location.venue}
                                  </Text>
                                ) : null}
                              </View>
                              {isEvSelected && (
                                <View style={styles.activePill}>
                                  <Text style={styles.activePillText}>ACTIVE</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '85%',
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  body: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: SPACING.lg,
  },
  orgCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  orgCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  orgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orgNameActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  codeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeActive: {
    backgroundColor: COLORS.tintLight,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  codeBadgeTextActive: {
    color: COLORS.primary,
  },
  folderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontFamily: 'monospace',
  },
  radioContainer: {
    marginLeft: 10,
  },
  eventsSection: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  eventsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  eventItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  eventItemInfo: {
    flex: 1,
  },
  eventItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  eventItemNameSelected: {
    color: COLORS.primary,
  },
  eventItemLocation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
