import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dusk' | 'sage' | 'ocean' | 'sunset' | 'lavender' | 'mustard' | 'teal-gray' | 'berry' | 'arctic' | 'modern-purple' | 'ocean-breeze' | 'nature-green' | 'sunset-vibes' | 'blush-pink' | 'deep-blue' | 'bright-yellow' | 'teal-harmony' | 'royal-dark' | 'minimal-neutral';
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
    id: 'dusk',
    name: 'Dusk',
    vibe: 'Calm • Warm • Sophisticated',
    colors: { primary: '#6D5BA6', secondary: '#F08A8A', bg: '#1A1B2E' },
  },
  {
    id: 'sage',
    name: 'Sage',
    vibe: 'Fresh • Natural • Balanced',
    colors: { primary: '#A3C9A8', secondary: '#DCEAD9', bg: '#2E4D3D' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    vibe: 'Cool • Clean • Refreshing',
    colors: { primary: '#29ADB2', secondary: '#A8DADC', bg: '#0D1B2A' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    vibe: 'Vibrant • Energetic • Friendly',
    colors: { primary: '#F9C74F', secondary: '#FDD9B5', bg: '#E94F37' },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    vibe: 'Soft • Dreamy • Elegant',
    colors: { primary: '#B9A7E0', secondary: '#E7D6F7', bg: '#5E4B8B' },
  },
  {
    id: 'mustard',
    name: 'Mustard',
    vibe: 'Bold • Modern • Playful',
    colors: { primary: '#F0C94C', secondary: '#F7E7B5', bg: '#2B2B2B' },
  },
  {
    id: 'teal-gray',
    name: 'Teal Gray',
    vibe: 'Minimal • Calm • Professional',
    colors: { primary: '#80CBC4', secondary: '#CFD8DC', bg: '#263238' },
  },
  {
    id: 'berry',
    name: 'Berry',
    vibe: 'Rich • Bold • Luxurious',
    colors: { primary: '#E3356A', secondary: '#F7A1B3', bg: '#6B0F3C' },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    vibe: 'Crisp • Cool • Modern',
    colors: { primary: '#64B5F6', secondary: '#BBDEFB', bg: '#102A43' },
  },
  {
    id: 'modern-purple',
    name: 'Modern Purple',
    vibe: 'Creative • Modern • Premium',
    colors: { primary: '#6D28D9', secondary: '#8B5CF6', bg: '#1F2937' },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    vibe: 'Calm • Fresh • Trustworthy',
    colors: { primary: '#0EA5E9', secondary: '#38BDF8', bg: '#0F172A' },
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    vibe: 'Natural • Balanced • Calm',
    colors: { primary: '#16A34A', secondary: '#4ADE80', bg: '#14532D' },
  },
  {
    id: 'sunset-vibes',
    name: 'Sunset Vibes',
    vibe: 'Warm • Energetic • Friendly',
    colors: { primary: '#F97316', secondary: '#FB923C', bg: '#7C2D12' },
  },
  {
    id: 'blush-pink',
    name: 'Blush Pink',
    vibe: 'Soft • Feminine • Elegant',
    colors: { primary: '#EC4899', secondary: '#F472B6', bg: '#831843' },
  },
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    vibe: 'Professional • Strong • Reliable',
    colors: { primary: '#1E3A8A', secondary: '#2563EB', bg: '#0B1220' },
  },
  {
    id: 'bright-yellow',
    name: 'Bright Yellow',
    vibe: 'Cheerful • Optimistic • Bold',
    colors: { primary: '#EAB308', secondary: '#FACC15', bg: '#713F12' },
  },
  {
    id: 'teal-harmony',
    name: 'Teal Harmony',
    vibe: 'Modern • Clean • Balanced',
    colors: { primary: '#14B8A6', secondary: '#2DD4BF', bg: '#134E4A' },
  },
  {
    id: 'royal-dark',
    name: 'Royal Dark',
    vibe: 'Luxury • Elegant • Sophisticated',
    colors: { primary: '#4C1D95', secondary: '#6D28D9', bg: '#111827' },
  },
  {
    id: 'minimal-neutral',
    name: 'Minimal Neutral',
    vibe: 'Clean • Simple • Timeless',
    colors: { primary: '#374151', secondary: '#6B7280', bg: '#111827' },
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
  saveGlobalSettings: (newCompany?: CompanySettings) => Promise<void>;
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

      adminTheme: 'dusk',
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

      saveGlobalSettings: async (newCompany?: CompanySettings) => {
        const state = get();
        try {
          await api.put('/settings/global', {
            theme: state.adminTheme,
            typography: state.adminTypographyVibe,
            company: newCompany || state.company,
          });
        } catch (error: any) {
          console.error("Failed to save global settings:", error);
          throw error;
        }
      },
    }),
    {
      name: 'etransport-settings-storage',
    }
  )
);
