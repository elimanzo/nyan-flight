import { Howl } from 'howler'
import { useEffect, useMemo, useRef, useState } from 'react'
import backgroundMusic from './background-music.mp3'

const MUSIC_KEY = 'nyan-music-volume'
const DEFAULT_VOLUME = 0.08
const KEY_STARTERS = new Set(['Space', 'Enter'])

let musicInstance: Howl | null = null

const ensureMusic = () => {
  if (musicInstance) return musicInstance
  musicInstance = new Howl({
    src: [backgroundMusic, '/audio/nyan-theme.wav'],
    loop: true,
    volume: DEFAULT_VOLUME,
    html5: true,
  })
  return musicInstance
}

export const useAudioManager = () => {
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_VOLUME
    const stored = window.localStorage.getItem(MUSIC_KEY)
    return stored ? Number.parseFloat(stored) : DEFAULT_VOLUME
  })
  const [isReady, setReady] = useState(false)
  const handlersRef = useRef<{ listener: () => void } | null>(null)
  const initialVolumeRef = useRef(volume)

  useEffect(() => {
    const howl = ensureMusic()
    howl.volume(initialVolumeRef.current)
    if (!howl.playing()) {
      const detach = () => {
        handlersRef.current?.listener?.()
        handlersRef.current = null
      }
      const play = () => {
        try {
          if (!howl.playing()) {
            howl.play()
          }
          setReady(true)
          detach()
        } catch (err) {
          console.error('Audio playback error', err)
        }
      }
      const pointerHandler = (event: PointerEvent) => {
        if (event.isPrimary) {
          play()
        }
      }
      const keyHandler = (event: KeyboardEvent) => {
        if (KEY_STARTERS.has(event.code)) {
          play()
        }
      }
      window.addEventListener('pointerdown', pointerHandler)
      window.addEventListener('keydown', keyHandler)
      handlersRef.current = {
        listener: () => {
          window.removeEventListener('pointerdown', pointerHandler)
          window.removeEventListener('keydown', keyHandler)
        },
      }
    }
    return () => {
      handlersRef.current?.listener?.()
      handlersRef.current = null
    }
  }, [])

  useEffect(() => {
    const howl = ensureMusic()
    howl.volume(volume)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MUSIC_KEY, volume.toString())
    }
  }, [volume])

  const api = useMemo(
    () => ({
      volume,
      isReady,
      setVolume: (value: number) => setVolume(Math.min(1, Math.max(0, value))),
      toggleMute: () => setVolume((prev) => (prev > 0 ? 0 : DEFAULT_VOLUME)),
    }),
    [isReady, volume],
  )

  return api
}
