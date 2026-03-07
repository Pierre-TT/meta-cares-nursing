import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('mc-theme')) as
  | 'light'
  | 'dark'
  | 'system'
  | null;
const initialTheme = stored || 'light';
if (typeof window !== 'undefined') applyTheme(initialTheme);

export const useUIStore = create<UIState>((set) => ({
  theme: initialTheme,
  sidebarOpen: true,
  setTheme: (theme) => {
    localStorage.setItem('mc-theme', theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
