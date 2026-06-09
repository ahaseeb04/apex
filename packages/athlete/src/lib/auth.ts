import * as SecureStore from 'expo-secure-store'

import { apiPost } from './api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export interface AuthUser {
    id: string
    email: string
    username: string
    role: string
}

export interface SignUpResult {
    userId: string
    email: string
}

export async function signUp(email: string, password: string, username: string): Promise<SignUpResult> {
    const data = await apiPost('/api/auth/signup', { email, password, username })
    return data as SignUpResult
}

export async function verifyEmail(userId: string, code: string) {
    const data = await apiPost('/api/auth/verify-email', { userId, code })
    await SecureStore.setItemAsync(TOKEN_KEY, data.token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
    return data
}

export async function resendVerification(userId: string) {
    const data = await apiPost('/api/auth/resend-verification', { userId })
    return data
}

export async function signIn(email: string, password: string) {
    const data = await apiPost('/api/auth/signin', { email, password })
    await SecureStore.setItemAsync(TOKEN_KEY, data.token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
    return data
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const token = await getStoredToken()
    if (!token) throw new Error('Not authenticated')
    await apiPost('/api/auth/change-password', { currentPassword, newPassword }, token)
}

export async function deleteAccount(password: string) {
    const token = await getStoredToken()
    if (!token) throw new Error('Not authenticated')
    await apiPost('/api/auth/delete-account', { password }, token)
}

export async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
}

export async function getStoredToken() {
    return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getStoredAuth() {
    const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
    ])

    if (!token || !userJson) return null

    return { token, user: JSON.parse(userJson) as AuthUser }
}
