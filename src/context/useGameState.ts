import { useCallback, useMemo, useState } from 'react'

import type { GameContextValue, GameStatus } from './types'

export const useGameState = (): GameContextValue => {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === 'undefined') return 0
    const stored = window.localStorage.getItem('nyan-best-score')
    return stored ? Number.parseInt(stored, 10) || 0 : 0
  })
  const [answered, setAnswered] = useState<string[]>([])
  const [lastQuestion, setLastQuestion] = useState<string | undefined>()

  const start = useCallback(() => {
    setScore(0)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    setStatus((prev) => (prev === 'running' ? 'paused' : prev))
  }, [])

  const resume = useCallback(() => {
    setStatus((prev) => (prev === 'paused' ? 'running' : prev))
  }, [])

  const end = useCallback((finalScore: number, question: string) => {
    setScore(finalScore)
    setBestScore((prev) => {
      const next = Math.max(prev, finalScore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('nyan-best-score', String(next))
      }
      return next
    })
    setLastQuestion(question)
    setAnswered((prev) => [...prev, question])
    setStatus('over')
  }, [])

  const restart = useCallback(() => {
    setScore(0)
    setStatus('running')
  }, [])

  const setLiveScore = useCallback((value: number) => {
    setScore(value)
  }, [])

  return useMemo(
    () => ({
      status,
      score,
      bestScore,
      lastQuestion,
      answered,
      start,
      pause,
      resume,
      end,
      restart,
      setLiveScore,
    }),
    [status, score, bestScore, lastQuestion, answered, start, pause, resume, end, restart, setLiveScore],
  )
}
