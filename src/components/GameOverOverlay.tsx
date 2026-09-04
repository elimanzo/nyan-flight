import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getMedal, MEDAL_DEFS } from '../utils/medals'
import { useGame } from '../context/useGameContext'
import { useLeaderboardService } from '../leaderboard/useLeaderboardService'
import { LeaderboardTable, LeaderboardSkeleton } from './LeaderboardTable'
import type { BoardEntry } from '../leaderboard/types'

type Props = { open: boolean }

type LoadState =
  | { tag: 'loading' }
  | { tag: 'offline' }
  | { tag: 'ready'; board: BoardEntry[]; qualifies: boolean }

type SubmitState =
  | { tag: 'idle' }
  | { tag: 'submitting' }
  | { tag: 'done'; initials: string; score: number; board: BoardEntry[] }

// ---------------------------------------------------------------------------
// InitialsInput
// ---------------------------------------------------------------------------

type InitialsInputProps = {
  onSubmit: (initials: string) => void
  disabled: boolean
}

function InitialsInput({ onSubmit, disabled }: InitialsInputProps) {
  const [chars, setChars] = useState<[string, string, string]>(['', '', ''])
  const ref0 = useRef<HTMLInputElement>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const refs = [ref0, ref1, ref2]

  useEffect(() => { ref0.current?.focus() }, [])

  const setChar = (i: number, raw: string) => {
    const upper = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(-1)
    setChars((prev) => {
      const next = [...prev] as [string, string, string]
      next[i] = upper
      return next
    })
    if (upper && i < 2) refs[i + 1].current?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      refs[i - 1].current?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault()
      refs[i - 1].current?.focus()
    } else if (e.key === 'ArrowRight' && i < 2) {
      e.preventDefault()
      refs[i + 1].current?.focus()
    } else if (e.key === 'Enter' && chars.every((c) => c)) {
      onSubmit(chars.join(''))
    }
  }

  const complete = chars.every((c) => c)

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-white/60">
        You made the board — enter initials
      </p>
      <div className="flex gap-2">
        {([0, 1, 2] as const).map((i) => (
          <input
            key={i}
            ref={refs[i]}
            aria-label={`Initial ${i + 1}`}
            value={chars[i]}
            maxLength={1}
            onChange={(e) => setChar(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-10 rounded-lg border border-white/20 bg-white/10 text-center text-xl font-bold uppercase text-white caret-transparent outline-none focus:border-white/60 focus:ring-1 focus:ring-white/30"
          />
        ))}
      </div>
      <button
        aria-label="Submit initials"
        disabled={!complete || disabled}
        onClick={() => onSubmit(chars.join(''))}
        className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-[#120627] transition hover:bg-white disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GameOverOverlay
// ---------------------------------------------------------------------------

export const GameOverOverlay = ({ open }: Props) => {
  const { score, bestScore, restart } = useGame()
  const service = useLeaderboardService()

  const medal = getMedal(score)
  const isNewBest = score > 0 && score > bestScore

  const [loadState, setLoadState] = useState<LoadState>({ tag: 'loading' })
  const [submitState, setSubmitState] = useState<SubmitState>({ tag: 'idle' })

  useEffect(() => {
    if (!open) return
    setLoadState({ tag: 'loading' })
    setSubmitState({ tag: 'idle' })

    let cancelled = false
    ;(async () => {
      try {
        const board = await service.fetchTop(10)
        const qualifies = board.length < 10 || score > board[board.length - 1].score
        if (cancelled) return
        setLoadState({ tag: 'ready', board, qualifies })
      } catch {
        if (cancelled) return
        setLoadState({ tag: 'offline' })
      }
    })()

    return () => { cancelled = true }
  }, [open, score, service])

  const handleSubmit = async (initials: string) => {
    setSubmitState({ tag: 'submitting' })

    let board: BoardEntry[] = []
    if (loadState.tag === 'ready') {
      try { await service.submit({ initials, score }) } catch { /* silent */ }
      try { board = await service.fetchTop(10) } catch { board = loadState.board }
    }

    setSubmitState({ tag: 'done', initials, score, board })
  }

  const isSubmitting = submitState.tag === 'submitting'
  const offlineQualifies = loadState.tag === 'offline' && score > bestScore
  const showPrompt =
    submitState.tag === 'idle' &&
    ((loadState.tag === 'ready' && loadState.qualifies) || offlineQualifies)

  const boardToShow =
    submitState.tag === 'done'
      ? submitState.board
      : loadState.tag === 'ready'
        ? loadState.board
        : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#120627]/90 p-8 text-center text-white shadow-2xl backdrop-blur"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Run over
            </p>

            {medal && (
              <motion.div
                className="mt-4 flex flex-col items-center gap-1"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
              >
                <span className="text-5xl">{MEDAL_DEFS[medal].emoji}</span>
                <span
                  className="mt-1 text-sm font-semibold uppercase tracking-widest"
                  style={{ color: MEDAL_DEFS[medal].color }}
                >
                  {MEDAL_DEFS[medal].label}
                </span>
              </motion.div>
            )}

            <div className="mt-6 flex justify-center gap-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Score</p>
                <p className="text-4xl font-bold text-white">{score}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Best</p>
                <p className="text-4xl font-bold text-yellow-300">{bestScore}</p>
                {isNewBest && (
                  <p className="mt-0.5 text-xs font-semibold text-yellow-300/80">
                    New best!
                  </p>
                )}
              </div>
            </div>

            {/* Leaderboard section */}
            <div className="mt-6">
              {loadState.tag === 'offline' && (
                <p className="text-xs text-white/40">
                  Leaderboard offline — scores unavailable
                </p>
              )}

              {showPrompt && (
                <InitialsInput
                  onSubmit={handleSubmit}
                  disabled={isSubmitting}
                />
              )}

              <div className="max-h-48 overflow-y-auto pr-5">
                {(loadState.tag === 'loading' || isSubmitting) && <LeaderboardSkeleton />}

                {boardToShow && !isSubmitting && (
                  <LeaderboardTable
                    board={boardToShow}
                    highlight={
                      submitState.tag === 'done'
                        ? { initials: submitState.initials, score: submitState.score }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>

            <div className="mt-8">
              <button
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#120627] transition hover:bg-white/90"
                onClick={restart}
              >
                Retry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
