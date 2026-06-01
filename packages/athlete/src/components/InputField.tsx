import { type KeyboardTypeOptions, Text, TextInput, View } from 'react-native'

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
    return (
        <View>
            <Text className="text-label-secondary text-[13px] font-medium mb-2 ml-1 tracking-wide uppercase">
                {label}
            </Text>
            <TextInput
                className="bg-surface-tertiary text-label text-[17px] rounded-[12px] px-4 py-[14px] leading-[22px]"
                placeholder={placeholder}
                placeholderTextColor="#636366"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'none'}
                autoCorrect={autoCorrect ?? false}
                cursorColor="#0A84FF"
                selectionColor="#0A84FF"
                accessibilityLabel={label}
            />
        </View>
    )
}
