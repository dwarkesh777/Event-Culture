import { create } from 'zustand';
import { volunteerAuthApi, volunteerEventsApi } from '../services/api';
import { storage } from '../services/storage';

export const useVolunteerAuth = create((set, get) => ({
  user: null,
  assignedEvent: null,
  events: [],
  organizers: [],
  selectedOrganizer: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await storage.getItem('volunteerAccessToken');
      const savedUser = await storage.getItem('volunteerProfile');

      if (token && savedUser) {
        set({ user: savedUser, isAuthenticated: true, isLoading: false });
        try {
          const res = await volunteerAuthApi.getMe();
          const freshUser = res.data.data.user;
          await storage.setItem('volunteerProfile', freshUser);
          set({ user: freshUser });
          await get().fetchAssignedEvent();
        } catch {}
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  sendOtp: async (email) => {
    set({ error: null });
    try {
      const res = await volunteerAuthApi.sendOtp(email);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP to volunteer email';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  verifyOtp: async (email, otp) => {
    set({ error: null });
    try {
      const res = await volunteerAuthApi.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } = res.data.data;

      await storage.setItem('volunteerAccessToken', accessToken);
      await storage.setItem('volunteerRefreshToken', refreshToken);
      await storage.setItem('volunteerProfile', user);

      set({ user, isAuthenticated: true, error: null });
      await get().fetchAssignedEvent();
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  fetchAssignedEvent: async () => {
    try {
      const res = await volunteerEventsApi.getAll();
      const events = res.data.data || [];

      // Build unique organizers map from assigned events
      const organizerMap = new Map();

      events.forEach((ev) => {
        const org = ev.organizerId;
        const code = (ev.organizerCode || org?.organizerCode || 'GENERAL').toUpperCase();
        if (!organizerMap.has(code)) {
          organizerMap.set(code, {
            organizerCode: code,
            name: org?.name || org?.organizationName || `Organizer ${code}`,
            organizationName: org?.organizationName || org?.name || `Organization ${code}`,
            email: org?.email,
            folderName: org?.folderName || `organizer_${code.toLowerCase()}`,
            events: [],
          });
        }
        organizerMap.get(code).events.push(ev);
      });

      // If user has an assignedOrganizerCode but no events yet
      const currentUser = get().user;
      if (currentUser?.assignedOrganizerCode && !organizerMap.has(currentUser.assignedOrganizerCode.toUpperCase())) {
        const code = currentUser.assignedOrganizerCode.toUpperCase();
        organizerMap.set(code, {
          organizerCode: code,
          name: `Organizer ${code}`,
          organizationName: `Workspace ${code}`,
          email: '',
          folderName: `organizer_${code.toLowerCase()}`,
          events: [],
        });
      }

      const organizers = Array.from(organizerMap.values());

      // Restore saved organizer or default to first
      const savedOrganizerCode = await storage.getItem('volunteer_selected_org_code');
      const savedEventId = await storage.getItem('volunteer_selected_event_id');

      let currentOrg = organizers.find((o) => o.organizerCode === savedOrganizerCode) || organizers[0] || null;
      let currentEvent = null;

      if (currentOrg && currentOrg.events.length > 0) {
        currentEvent = currentOrg.events.find((e) => e._id === savedEventId) || currentOrg.events[0];
      } else if (events.length > 0) {
        currentEvent = events.find((e) => e._id === savedEventId) || events[0];
      }

      set({
        events,
        organizers,
        selectedOrganizer: currentOrg,
        assignedEvent: currentEvent,
      });
    } catch (e) {
      console.warn('Failed to load assigned events and organizers:', e);
    }
  },

  selectOrganizer: async (organizerCode) => {
    const { organizers } = get();
    const org = organizers.find((o) => o.organizerCode === organizerCode);
    if (!org) return;

    await storage.setItem('volunteer_selected_org_code', organizerCode);
    const firstEvent = org.events && org.events.length > 0 ? org.events[0] : null;

    if (firstEvent) {
      await storage.setItem('volunteer_selected_event_id', firstEvent._id);
    }

    set({
      selectedOrganizer: org,
      assignedEvent: firstEvent,
    });
  },

  selectEvent: async (event) => {
    if (!event) return;
    await storage.setItem('volunteer_selected_event_id', event._id);
    const { organizers } = get();
    const eventOrgCode = (event.organizerCode || event.organizerId?.organizerCode || '').toUpperCase();
    const matchingOrg = organizers.find((o) => o.organizerCode === eventOrgCode);

    set({
      assignedEvent: event,
      ...(matchingOrg && { selectedOrganizer: matchingOrg }),
    });
  },

  logout: async () => {
    try {
      await volunteerAuthApi.logout();
    } catch {}
    await storage.clear();
    set({
      user: null,
      assignedEvent: null,
      events: [],
      organizers: [],
      selectedOrganizer: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
