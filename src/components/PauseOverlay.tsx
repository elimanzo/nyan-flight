import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useGame } from '../context/useGameContext'

export const PauseOverlay = () => {
  const { status, resume } = useGame()
  const open = status === 'paused'

  useEffect(() => {
    if (!open) return () => {}
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resume()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, resume])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="rounded-3xl border border-white/10 bg-[#090221]/80 px-8 py-10 text-center text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Paused</p>
            <h2 className="mt-4 text-3xl font-semibold">Stretch break</h2>
            <button
              onClick={resume}
              className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#090221]"
            >
              Resume flight
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
