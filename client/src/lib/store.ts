import { create } from 'zustand';

export type CareerPhase = 'student' | 'entry-level' | 'career-switcher' | 'experienced' | 'unsure' | null;

interface UserState {
  // Current step in the application flow
  currentStep: 'welcome' | 'questions' | 'results' | 'resume' | 'cover-letter';
  // Selected career phase
  careerPhase: CareerPhase;
  // Dark mode state
  isDarkMode: boolean;
  // Actions
  setCurrentStep: (step: 'welcome' | 'questions' | 'results' | 'resume' | 'cover-letter') => void;
  setCareerPhase: (phase: CareerPhase) => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

// Check for saved theme preference or respect OS preference
const getSavedTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
};

export const useStore = create<UserState>((set) => ({
  currentStep: 'welcome',
  careerPhase: null,
  isDarkMode: getSavedTheme(),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setCareerPhase: (phase) => set({ 
    careerPhase: phase,
    currentStep: 'questions'
  }),
  
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { isDarkMode: newDarkMode };
  }),
  
  setDarkMode: (isDark) => set((state) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { isDarkMode: isDark };
  }),
}));
