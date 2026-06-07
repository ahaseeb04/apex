import { create } from 'zustand'

import { ApiError } from '../lib/api'
import {
    deleteAccount as apiDeleteAccount,
    getStoredAuth,
    signIn as apiSignIn,
    signOut as apiSignOut,
    signUp as apiSignUp,
} from '../lib/auth'
import type { AuthUser } from '../lib/auth'

interface AuthState {
    user: AuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username: string) => Promise<void>
    signOut: () => Promise<void>
    deleteAccount: (password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: async () => {
        try {
            const stored = await getStoredAuth()
            if (stored) {
                set({ user: stored.user, isAuthenticated: true })
            }
        } finally {
            set({ isLoading: false })
        }
    },

    signIn: async (email, password) => {
        const data = await apiSignIn(email, password)
        set({ user: data.user, isAuthenticated: true })
    },

    signUp: async (email, password, username) => {
        const data = await apiSignUp(email, password, username)
        set({ user: data.user, isAuthenticated: true })
    },

    signOut: async () => {
        await apiSignOut()
        set({ user: null, isAuthenticated: false })
    },

    deleteAccount: async (password) => {
        await apiDeleteAccount(password)
        await apiSignOut()
        set({ user: null, isAuthenticated: false })
    },
}))

export { ApiError }
