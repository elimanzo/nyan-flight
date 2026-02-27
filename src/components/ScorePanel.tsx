import { Trophy, Zap } from 'lucide-react'
import { useGame } from '../context/useGameContext'

export const ScorePanel = () => {
  const { score, bestScore } = useGame()
  return (
    <div className="flex gap-4 rounded-full border border-white/10 bg-[#120627]/70 px-6 py-3 text-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-cosmic-300" />
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Score</p>
          <p className="text-lg font-semibold text-white">{score}</p>
        </div>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-300" />
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Best</p>
          <p className="text-lg font-semibold text-white">{bestScore}</p>
        </div>
      </div>
    </div>
  )
}
