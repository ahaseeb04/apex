export interface ThemeColors {
    surface: string
    surfaceSecondary: string
    surfaceTertiary: string
    label: string
    labelSecondary: string
    labelTertiary: string
    accent: string
    border: string
    tabBar: string
    tabBarBorder: string
}

export interface Theme {
    id: string
    name: string
    colors: ThemeColors
}

export const themes: Theme[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        colors: {
            surface: '#000000',
            surfaceSecondary: '#1C1C1E',
            surfaceTertiary: '#2C2C2E',
            label: '#FFFFFF',
            labelSecondary: '#8E8E93',
            labelTertiary: '#636366',
            accent: '#0A84FF',
            border: '#38383A',
            tabBar: '#0D0D0D',
            tabBarBorder: '#2C2C2E',
        },
    },
    {
        id: 'midnight-rose',
        name: 'Midnight Rose',
        colors: {
            surface: '#000000',
            surfaceSecondary: '#1C1C1E',
            surfaceTertiary: '#2C2C2E',
            label: '#FFFFFF',
            labelSecondary: '#8E8E93',
            labelTertiary: '#636366',
            accent: '#FF375F',
            border: '#38383A',
            tabBar: '#0D0D0D',
            tabBarBorder: '#2C2C2E',
        },
    },
    {
        id: 'ocean',
        name: 'Ocean',
        colors: {
            surface: '#0A1628',
            surfaceSecondary: '#112240',
            surfaceTertiary: '#1A3356',
            label: '#E6F0FF',
            labelSecondary: '#8899B4',
            labelTertiary: '#5C6E8A',
            accent: '#0096FF',
            border: '#1E3A5F',
            tabBar: '#0C1A30',
            tabBarBorder: '#1A3356',
        },
    },
    {
        id: 'slate',
        name: 'Slate',
        colors: {
            surface: '#101010',
            surfaceSecondary: '#1E1E20',
            surfaceTertiary: '#2E2E30',
            label: '#F0F0F0',
            labelSecondary: '#98989D',
            labelTertiary: '#6C6C70',
            accent: '#98989D',
            border: '#38383A',
            tabBar: '#141416',
            tabBarBorder: '#2E2E30',
        },
    },
    {
        id: 'teal',
        name: 'Teal',
        colors: {
            surface: '#0A1A1A',
            surfaceSecondary: '#142828',
            surfaceTertiary: '#1E3A3A',
            label: '#E0F0F0',
            labelSecondary: '#88AAAA',
            labelTertiary: '#5C7A7A',
            accent: '#12A3E2',
            border: '#204040',
            tabBar: '#0C1F1F',
            tabBarBorder: '#1E3A3A',
        },
    },
    {
        id: 'arctic',
        name: 'Arctic',
        colors: {
            surface: '#F0F4F8',
            surfaceSecondary: '#FFFFFF',
            surfaceTertiary: '#E2EAF0',
            label: '#0D1821',
            labelSecondary: '#5A7184',
            labelTertiary: '#8FA3B1',
            accent: '#0077B6',
            border: '#C8D8E4',
            tabBar: '#E4EEF5',
            tabBarBorder: '#C8D8E4',
        },
    },
    {
        id: 'discord',
        name: 'Discord',
        colors: {
            surface: '#313338',
            surfaceSecondary: '#2B2D31',
            surfaceTertiary: '#383A40',
            label: '#F2F3F5',
            labelSecondary: '#B5BAC1',
            labelTertiary: '#949BA4',
            accent: '#5865F2',
            border: '#3F4147',
            tabBar: '#2B2D31',
            tabBarBorder: '#3F4147',
        },
    },
    {
        id: 'reddit',
        name: 'Reddit',
        colors: {
            surface: '#0E1113',
            surfaceSecondary: '#1A1C1F',
            surfaceTertiary: '#272A2E',
            label: '#EEF0F2',
            labelSecondary: '#9499A0',
            labelTertiary: '#6B7078',
            accent: '#FF4500',
            border: '#2D3035',
            tabBar: '#121518',
            tabBarBorder: '#272A2E',
        },
    },
    {
        id: 'whatsapp-light',
        name: 'WhatsApp Light',
        colors: {
            surface: '#E7F0E8',
            surfaceSecondary: '#FFFFFF',
            surfaceTertiary: '#D4E8D6',
            label: '#0B141A',
            labelSecondary: '#5B7D6E',
            labelTertiary: '#9AB5A8',
            accent: '#25D366',
            border: '#C4DCC6',
            tabBar: '#DCE8DD',
            tabBarBorder: '#C4DCC6',
        },
    },
]

export const defaultTheme = themes[0]
