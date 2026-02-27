import { createContext } from 'react'
import type { AudioValue } from './audioTypes'

export const AudioContext = createContext<AudioValue | null>(null)
