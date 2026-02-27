import { Settings, Volume2 } from 'lucide-react'
import { ScorePanel } from './ScorePanel'
import { useAudio } from '../context/useAudioContext'

type Props = {
  onOpenSettings: () => void
}

export const HUD = ({ onOpenSettings }: Props) => {
  const { isReady } = useAudio()
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col items-center gap-4 px-4 pt-6">
      <ScorePanel />
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-5 py-2 text-xs text-white/70 backdrop-blur">
        <Volume2 className="h-4 w-4 text-cosmic-300" />
        {isReady ? 'Cosmic soundtrack active' : 'Tap or press space to start the music'}
        <button
          className="ml-2 flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm font-semibold text-white"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  )
}
