import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/useGameContext'
import { getRandomQuestion } from '../data/icebreakers'

type Props = {
  open: boolean
  onClose: () => void
}

export const IcebreakerModal = ({ open, onClose }: Props) => {
  const { lastQuestion, answered, restart } = useGame()

  const question = lastQuestion ?? getRandomQuestion(answered)

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
            className="max-w-lg rounded-3xl border border-white/10 bg-[#120627]/80 p-8 text-white shadow-2xl backdrop-blur"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Challenge card</p>
            <h2 className="mt-3 text-3xl font-semibold leading-snug text-white">{question}</h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#120627] transition hover:bg-white/90"
                onClick={() => {
                  restart()
                  onClose()
                }}
              >
                Retry run
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
