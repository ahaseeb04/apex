
export type HomeStackParamList = {
    HomeList: undefined
    Program: { programId: string }
    Fatigue: { weekId: string; existing: Record<string, number> | null }
    Checkin: { weekId: string; existing: Record<string, number> | null }
}

export type MainTabParamList = {
    Home: undefined
    ExerciseLibrary: undefined
    Settings: undefined
}

export type SettingsStackParamList = {
    SettingsList: undefined
    Appearance: undefined
    ChangePassword: undefined
}

export type RootStackParamList = {
    SignIn: undefined
    SignUp: undefined
    VerifyEmail: { userId: string; email: string }
    Main: undefined
}
