import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ProgramState {
    selectedBlockId: Record<string, string>
    selectedWeekId: Record<string, string>
    selectedDayId: Record<string, string>
    selectBlock: (programId: string, blockId: string) => void
    selectWeek: (programId: string, weekId: string) => void
    selectDay: (programId: string, dayId: string) => void
}

export const useProgramStore = create<ProgramState>()(
    persist(
        (set) => ({
            selectedBlockId: {},
            selectedWeekId: {},
            selectedDayId: {},
            selectBlock: (programId, blockId) =>
                set((state) => ({
                    selectedBlockId: { ...state.selectedBlockId, [programId]: blockId },
                })),
            selectWeek: (programId, weekId) =>
                set((state) => ({
                    selectedWeekId: { ...state.selectedWeekId, [programId]: weekId },
                })),
            selectDay: (programId, dayId) =>
                set((state) => ({
                    selectedDayId: { ...state.selectedDayId, [programId]: dayId },
                })),
        }),
        {
            name: 'program-store',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
)
