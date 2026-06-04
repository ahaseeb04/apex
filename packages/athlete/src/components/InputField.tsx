import { type KeyboardTypeOptions, Text, TextInput, View } from 'react-native'

import { useActiveTheme } from '../stores/themeStore'

interface InputFieldProps {
    label: string
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    secureTextEntry?: boolean
    keyboardType?: KeyboardTypeOptions
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    autoCorrect?: boolean
}

export default function InputField({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    autoCorrect,
}: InputFieldProps) {
    const c = useActiveTheme().colors

    return (
        <View>
            <Text className="text-[13px] font-medium mb-2 ml-1 tracking-wide uppercase" style={{ color: c.labelSecondary }}>
                {label}
            </Text>
            <TextInput
                className="text-[17px] rounded-[12px] px-4 py-[14px] leading-[22px]"
                style={{ backgroundColor: c.surfaceTertiary, color: c.label }}
                placeholder={placeholder}
                placeholderTextColor={c.labelTertiary}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'none'}
                autoCorrect={autoCorrect ?? false}
                cursorColor={c.accent}
                selectionColor={c.accent}
                accessibilityLabel={label}
            />
        </View>
    )
}
