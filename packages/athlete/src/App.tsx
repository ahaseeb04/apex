import './global.css'

import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { DarkTheme, getFocusedRouteNameFromRoute, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen'
import HomeScreen from './screens/HomeScreen'
import ProgramScreen from './screens/ProgramScreen'
import SignInScreen from './screens/SignInScreen'
import SignUpScreen from './screens/SignUpScreen'
import type {
    HomeStackParamList,
    MainTabParamList,
    RootStackParamList,
} from './screens/types'
import { useAuthStore } from './stores/authStore'

const RootStack = createNativeStackNavigator<RootStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

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
        <RootStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#000000' },
            }}
        >
            <RootStack.Screen name="SignIn" component={SignInScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
        </RootStack.Navigator>
    )
}

function HomeStackScreen() {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#000000' },
            }}
        >
            <HomeStack.Screen name="HomeList" component={HomeScreen} />
            <HomeStack.Screen name="Program" component={ProgramScreen} />
        </HomeStack.Navigator>
    )
}

const tabBarBaseStyle = {
    backgroundColor: '#0D0D0D',
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: tabBarBaseStyle,
                tabBarActiveTintColor: '#0A84FF',
                tabBarInactiveTintColor: '#636366',
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

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        )
    }

    return isAuthenticated ? <MainTabs /> : <AuthStack />
}

export default function App() {
    return (
        <NavigationContainer theme={theme}>
            <RootNavigator />
            <StatusBar style="light" />
        </NavigationContainer>
    )
}
