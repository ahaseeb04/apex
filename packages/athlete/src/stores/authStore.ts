import { create } from 'zustand'

import { ApiError } from '../lib/api'
import {
    deleteAccount as apiDeleteAccount,
    getStoredAuth,
    resendVerification as apiResendVerification,
    signIn as apiSignIn,
    signOut as apiSignOut,
    signUp as apiSignUp,
    verifyEmail as apiVerifyEmail,
} from '../lib/auth'
import type { AuthUser } from '../lib/auth'

export { ApiError }

interface AuthState {
    user: AuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    initialize: () => Promise<void>
    signUp: (email: string, password: string, username: string) => Promise<{ userId: string; email: string }>
    verifyEmail: (userId: string, code: string) => Promise<void>
    resendVerification: (userId: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
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

    signUp: async (email, password, username) => {
        return await apiSignUp(email, password, username)
    },

    verifyEmail: async (userId, code) => {
        const data = await apiVerifyEmail(userId, code)
        set({ user: data.user, isAuthenticated: true })
    },

    resendVerification: async (userId) => {
        await apiResendVerification(userId)
    },

    signIn: async (email, password) => {
        const data = await apiSignIn(email, password)
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
