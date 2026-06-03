
export type HomeStackParamList = {
    HomeList: undefined
    Program: { programId: string }
    Fatigue: { weekId: string; existing: Record<string, number> | null }
    Checkin: { weekId: string; existing: Record<string, number> | null }
}

export type MainTabParamList = {
    Home: undefined
    ExerciseLibrary: undefined
}

export type RootStackParamList = {
    SignIn: undefined
    SignUp: undefined
    Main: undefined
}
