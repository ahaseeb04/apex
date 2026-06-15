import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const pluralize = (count: number, [one, many = `${one}s`]: readonly [string, string?]) => {
    return `${count} ${count === 1 ? one : many}`
}
