import { X } from 'lucide-react'
import { useAudio } from '../context/useAudioContext'

type Props = {
  open: boolean
  onClose: () => void
}

export const SettingsModal = ({ open, onClose }: Props) => {
  const { volume, setVolume, toggleMute } = useAudio()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#090221]/90 p-8 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Mission Control</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:bg-white/10"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Starwave Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              className="mt-2 w-full accent-cosmic-400"
            />
            <button
              className="mt-3 w-full rounded-full border border-cosmic-400/60 px-4 py-2 text-sm font-semibold text-cosmic-100 transition hover:bg-cosmic-400/10"
              onClick={toggleMute}
            >
              {volume === 0 ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <p className="text-xs text-white/60">
            Hint: music starts once you tap or press any key so browsers know you actually want cosmic vibes.
          </p>
        </div>
      </div>
    </div>
  )
}
