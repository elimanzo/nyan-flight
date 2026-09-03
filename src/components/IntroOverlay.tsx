import { useEffect, useState } from 'react'
import { useGame } from '../context/useGameContext'
import { useLeaderboardService } from '../leaderboard/useLeaderboardService'
import { LeaderboardTable } from './LeaderboardTable'
import type { BoardEntry } from '../leaderboard/types'

type LoadState =
  | { tag: 'loading' }
  | { tag: 'offline' }
  | { tag: 'ready'; board: BoardEntry[] }

export const IntroOverlay = () => {
  const { status, start } = useGame()
  const service = useLeaderboardService()
  const [loadState, setLoadState] = useState<LoadState>({ tag: 'loading' })

  useEffect(() => {
    if (status !== 'idle') return
    setLoadState({ tag: 'loading' })
    let cancelled = false
    ;(async () => {
      try {
        const board = await service.fetchTop(5)
        if (cancelled) return
        setLoadState({ tag: 'ready', board })
      } catch {
        if (cancelled) return
        setLoadState({ tag: 'offline' })
      }
    })()
    return () => { cancelled = true }
  }, [status, service])

  if (status !== 'idle') return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4">
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#090022]/95 via-[#0f052e]/90 to-[#050112]/95 px-10 py-12 text-center text-white shadow-[0_30px_120px_rgba(5,0,35,0.65)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.5em] text-white/40">
          Nyan Flight
        </p>
        <h1 className="mt-5 text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-tight">
          Fly with your cat,{" "}
          <span className="text-cosmic-200">dodge the void</span>
        </h1>

        {/* Attract-mode leaderboard */}
        <div className="mt-6 text-left">
          {loadState.tag === 'loading' && (
            <p className="text-center text-xs text-white/40">Loading board…</p>
          )}
          {loadState.tag === 'offline' && (
            <p className="text-center text-xs text-white/40">
              Leaderboard offline
            </p>
          )}
          {loadState.tag === 'ready' && loadState.board.length > 0 && (
            <>
              <p className="mb-1 text-center text-xs uppercase tracking-widest text-white/40">
                Top scores
              </p>
              <LeaderboardTable board={loadState.board} />
            </>
          )}
        </div>

        <button
          className="mt-8 inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/60 hover:bg-white/20"
          onClick={start}
        >
          Tap or press space to lift off
        </button>
      </div>
    </div>
  )
}
