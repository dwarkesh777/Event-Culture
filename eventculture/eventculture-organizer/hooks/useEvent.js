import { create } from 'zustand';
import { eventsApi } from '../services/api';

export const useEvent = create((set, get) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await eventsApi.getAll();
      const eventsList = res.data.data || [];
      const currentSelected = get().selectedEvent;

      let newSelected = null;
      if (currentSelected) {
        newSelected = eventsList.find((e) => e._id === currentSelected._id) || eventsList[0] || null;
      } else {
        newSelected = eventsList[0] || null;
      }

      set({ events: eventsList, selectedEvent: newSelected, isLoading: false });
      return eventsList;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch events';
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  selectEvent: (event) => {
    set({ selectedEvent: event });
  },

  createEvent: async (eventData) => {
    try {
      const res = await eventsApi.create(eventData);
      const newEvent = res.data.data;
      await get().fetchEvents();
      set({ selectedEvent: newEvent });
      return newEvent;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create event');
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      const res = await eventsApi.update(id, eventData);
      const updated = res.data.data;
      await get().fetchEvents();
      if (get().selectedEvent?._id === id) {
        set({ selectedEvent: updated });
      }
      return updated;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update event');
    }
  },

  deleteEvent: async (id) => {
    try {
      await eventsApi.delete(id);
      await get().fetchEvents();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete event');
    }
  },
}));
