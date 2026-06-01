import './global.css'

import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import HomeScreen from './screens/HomeScreen'
import SignInScreen from './screens/SignInScreen'
import SignUpScreen from './screens/SignUpScreen'
import type { RootStackParamList } from './screens/types'
import { useAuthStore } from './stores/authStore'

const Stack = createNativeStackNavigator<RootStackParamList>()

const theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: '#000000',
        card: '#1C1C1E',
        primary: '#0A84FF',
        text: '#FFFFFF',
        border: '#38383A',
        notification: '#FF453A',
    },
}

function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#000000' },
            }}
        >
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
    )
}

function MainStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#000000' },
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    )
}

function RootNavigator() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const initialize = useAuthStore((s) => s.initialize)

    useEffect(() => {
        initialize()
    }, [initialize])

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        )
    }

    return isAuthenticated ? <MainStack /> : <AuthStack />
}

export default function App() {
    return (
        <NavigationContainer theme={theme}>
            <RootNavigator />
            <StatusBar style="light" />
        </NavigationContainer>
    )
}
