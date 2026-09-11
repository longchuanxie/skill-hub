import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh' | 'auto';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'auto',
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'language-storage' }
  )
);
