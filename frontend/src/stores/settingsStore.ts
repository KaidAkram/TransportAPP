import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'quantum' | 'racing-red' | 'volcanic-ash' | 'exposure-green' | 'solar-flare' | 'digital-ocean';
export type TypographyVibeId = 'quantum-tech' | 'luxury-impact' | 'future-grid' | 'elegant-soft';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  vibe: string;
  colors: {
    primary: string;
    secondary: string;
    bg: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'quantum',
    name: 'Quantum',
    vibe: 'Futuriste & Sleek',
    colors: { primary: '#834DFB', secondary: '#F0E100', bg: '#1B102B' },
  },
  {
    id: 'racing-red',
    name: 'Racing Red',
    vibe: 'Haute performance, agressif',
    colors: { primary: '#FF1F1F', secondary: '#EFEEE8', bg: '#0B0606' },
  },
  {
    id: 'volcanic-ash',
    name: 'Volcanic Ash',
    vibe: 'Vibrant, créatif, startup',
    colors: { primary: '#FF5C0A', secondary: '#9B4DFF', bg: '#0E0C12' },
  },
  {
    id: 'exposure-green',
    name: 'Exposure Green',
    vibe: 'Organique, vivid, nature',
    colors: { primary: '#7ED63B', secondary: '#C8B97A', bg: '#090D08' },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    vibe: 'Corporate, confiance, clean',
    colors: { primary: '#E85002', secondary: '#A7A7A7', bg: '#111111' },
  },
  {
    id: 'digital-ocean',
    name: 'Digital Ocean',
    vibe: 'Tech épuré, trustworthy',
    colors: { primary: '#1E90FF', secondary: '#00C896', bg: '#060D12' },
  },
];

export interface TypographyVibeDefinition {
  id: TypographyVibeId;
  name: string;
  vibe: string;
  fontUrl: string;
  displayFont: string;
  bodyFont: string;
}

export const TYPOGRAPHY_VIBES: TypographyVibeDefinition[] = [
  {
    id: 'quantum-tech',
    name: 'Quantum Tech',
    vibe: 'Sleek, energetic, high-tech',
    fontUrl: 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=clash-display@500,600&f[]=general-sans@400,500&display=swap',
    displayFont: 'Clash Display',
    bodyFont: 'Satoshi'
  },
  {
    id: 'luxury-impact',
    name: 'Luxury Impact',
    vibe: 'Bold, authoritative, distinct',
    fontUrl: 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700&display=swap&subset=latin',
    displayFont: 'Cabinet Grotesk',
    bodyFont: 'DM Sans' // Note: DM Sans loaded from Google Fonts in ClientLayout
  },
  {
    id: 'future-grid',
    name: 'Future Grid',
    vibe: 'Strict, sci-fi, highly geometric',
    fontUrl: 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap',
    displayFont: 'Space Grotesk', // Note: loaded from Google Fonts
    bodyFont: 'General Sans'
  },
  {
    id: 'elegant-soft',
    name: 'Elegant Soft',
    vibe: 'Rounded, friendly, high-end',
    fontUrl: '', // Both loaded from Google Fonts in ClientLayout
    displayFont: 'Poppins',
    bodyFont: 'Inter'
  }
];

export interface CompanySettings {
  name: string;
  address: string;
  logoBase64: string | null;
  rc: string;
  nif: string;
  nis: string;
  ai: string;
  phone: string;
}

interface SettingsState {
  company: CompanySettings;
  updateCompany: (newSettings: Partial<CompanySettings>) => void;
  resetCompany: () => void;

  adminTheme: ThemeId;
  setAdminTheme: (theme: ThemeId) => void;

  adminTypographyVibe: TypographyVibeId;
  setAdminTypographyVibe: (vibe: TypographyVibeId) => void;

  userPreferences: {
    language: 'fr' | 'en' | 'ar';
    tableDensity: 'compact' | 'comfortable';
    notificationsEnabled: boolean;
  };
  updatePreferences: (newPrefs: Partial<SettingsState['userPreferences']>) => void;

  fetchGlobalSettings: () => Promise<void>;
  saveGlobalSettings: () => Promise<void>;
}

const defaultCompany: CompanySettings = {
  name: 'Fl\u014d',
  address: '123 Route Nationale, Alger',
  logoBase64: null,
  rc: '1234567890',
  nif: '0987654321',
  nis: '1122334455',
  ai: '9988776655',
  phone: '+213 555 123 456',
};

import { api } from '@/lib/api';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      company: defaultCompany,
      updateCompany: (newSettings) =>
        set((state) => ({ company: { ...state.company, ...newSettings } })),
      resetCompany: () => set({ company: defaultCompany }),

      adminTheme: 'quantum',
      setAdminTheme: (theme) => set({ adminTheme: theme }),

      adminTypographyVibe: 'quantum-tech',
      setAdminTypographyVibe: (vibe) => set({ adminTypographyVibe: vibe }),

      userPreferences: {
        language: 'fr',
        tableDensity: 'comfortable',
        notificationsEnabled: true,
      },
      updatePreferences: (newPrefs) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...newPrefs },
        })),

      fetchGlobalSettings: async () => {
        try {
          const res = await api.get<{
            theme: ThemeId;
            typography: TypographyVibeId;
            company: CompanySettings;
          }>('/settings/global');
          
          if (res.data) {
            set({
              adminTheme: res.data.theme,
              adminTypographyVibe: res.data.typography,
              company: res.data.company,
            });
          }
        } catch (error) {
          console.error("Failed to fetch global settings:", error);
        }
      },

      saveGlobalSettings: async () => {
        const state = get();
        try {
          await api.put('/settings/global', {
            theme: state.adminTheme,
            typography: state.adminTypographyVibe,
            company: state.company,
          });
        } catch (error) {
          console.error("Failed to save global settings:", error);
        }
      },
    }),
    {
      name: 'etransport-settings-storage',
    }
  )
);
