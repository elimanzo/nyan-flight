import { useMemo } from 'react'
import { useGame } from '../context/useGameContext'

export const DebugStats = () => {
  const state = useGame()
  const summary = useMemo(
    () => `status=${state.status} score=${state.score} best=${state.bestScore}`,
    [state.bestScore, state.score, state.status],
  )
  return <div className="hidden">{summary}</div>
}
