import './global.css'

import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { DarkTheme, getFocusedRouteNameFromRoute, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import CheckinScreen from './screens/CheckinScreen'
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen'
import FatigueScreen from './screens/FatigueScreen'
import HomeScreen from './screens/HomeScreen'
import ProgramScreen from './screens/ProgramScreen'
import SettingsScreen from './screens/SettingsScreen'
import AppearanceScreen from './screens/AppearanceScreen'
import SignInScreen from './screens/SignInScreen'
import SignUpScreen from './screens/SignUpScreen'
import type {
    HomeStackParamList,
    MainTabParamList,
    RootStackParamList,
    SettingsStackParamList,
} from './screens/types'
import { useAuthStore } from './stores/authStore'
import { useActiveTheme } from './stores/themeStore'

const RootStack = createNativeStackNavigator<RootStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function AuthStack() {
    const theme = useActiveTheme()

    return (
        <RootStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <RootStack.Screen name="SignIn" component={SignInScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
        </RootStack.Navigator>
    )
}

function HomeStackScreen() {
    const theme = useActiveTheme()

    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <HomeStack.Screen name="HomeList" component={HomeScreen} />
            <HomeStack.Screen name="Program" component={ProgramScreen} />
            <HomeStack.Screen name="Fatigue" component={FatigueScreen} />
            <HomeStack.Screen name="Checkin" component={CheckinScreen} />
        </HomeStack.Navigator>
    )
}

function SettingsStackScreen() {
    const theme = useActiveTheme()

    return (
        <SettingsStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <SettingsStack.Screen name="SettingsList" component={SettingsScreen} />
            <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
        </SettingsStack.Navigator>
    )
}

function MainTabs() {
    const theme = useActiveTheme()
    const c = theme.colors

    const tabBarBaseStyle = {
        backgroundColor: c.tabBar,
        borderTopColor: c.tabBarBorder,
        borderTopWidth: 1,
        paddingTop: 4,
        paddingBottom: 4,
    }

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: tabBarBaseStyle,
                tabBarActiveTintColor: c.accent,
                tabBarInactiveTintColor: c.labelTertiary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route)
                    return {
                        tabBarLabel: 'Programs',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="calendar-outline" size={size} color={color} />
                        ),
                        tabBarStyle: {
                            ...tabBarBaseStyle,
                            display: routeName === 'Program' ? 'none' : 'flex',
                        },
                    }
                }}
            />
            <Tab.Screen
                name="ExerciseLibrary"
                component={ExerciseLibraryScreen}
                options={{
                    tabBarLabel: 'Library',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="play-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsStackScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

function RootNavigator() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const initialize = useAuthStore((s) => s.initialize)

    useEffect(() => {
        initialize()
    }, [initialize])

    const theme = useActiveTheme()

    if (isLoading) {
        return (
            <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: theme.colors.surface }}
            >
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        )
    }

    return isAuthenticated ? <MainTabs /> : <AuthStack />
}

export default function App() {
    const theme = useActiveTheme()
    const c = theme.colors

    const navigationTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: c.surface,
            card: c.surfaceSecondary,
            primary: c.accent,
            text: c.label,
            border: c.border,
            notification: c.accent,
        },
    }

    const r = parseInt(c.label.slice(1, 3), 16)
    const g = parseInt(c.label.slice(3, 5), 16)
    const b = parseInt(c.label.slice(5, 7), 16)
    const labelIsLight = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
    const statusBarStyle = labelIsLight ? 'light' as const : 'dark' as const

    return (
        <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
            <StatusBar style={statusBarStyle} />
        </NavigationContainer>
    )
}
