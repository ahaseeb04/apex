import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { defaultTheme, themes, type Theme } from '../lib/themes'

interface ThemeState {
    activeThemeId: string
    setTheme: (id: string) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            activeThemeId: defaultTheme.id,
            setTheme: (id: string) => set({ activeThemeId: id }),
        }),
        {
            name: 'theme-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ activeThemeId: state.activeThemeId }),
        },
    ),
)

export function useActiveTheme(): Theme {
    const activeThemeId = useThemeStore((s) => s.activeThemeId)
    return themes.find((t) => t.id === activeThemeId) ?? defaultTheme
}
