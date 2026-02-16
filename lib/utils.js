// lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwindのクラス名をマージするユーティリティ
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
