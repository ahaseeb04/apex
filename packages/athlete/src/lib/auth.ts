import * as SecureStore from 'expo-secure-store'

import { apiPost } from './api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export interface AuthUser {
    id: string
    email: string
    username: string
}

export async function signIn(email: string, password: string) {
    const data = await apiPost('/api/auth/signin', { email, password })
    await SecureStore.setItemAsync(TOKEN_KEY, data.token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
    return data
}

export async function signUp(email: string, password: string, username: string) {
    const data = await apiPost('/api/auth/signup', { email, password, username })
    await SecureStore.setItemAsync(TOKEN_KEY, data.token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
    return data
}

export async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
}

export async function getStoredAuth() {
    const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
    ])

    if (!token || !userJson) return null

    return { token, user: JSON.parse(userJson) as AuthUser }
}
