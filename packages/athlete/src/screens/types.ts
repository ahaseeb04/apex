import type { ProgramData } from '../lib/api'

export type HomeStackParamList = {
    HomeList: undefined
    Program: { program: ProgramData }
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
