import { useEffect, useRef, useState } from 'react'
import { CanvasView } from './CanvasView'
import { HUD } from './HUD'
import { IntroOverlay } from './IntroOverlay'
import { GameOverOverlay } from './GameOverOverlay'
import { SettingsModal } from './SettingsModal'
import { PauseOverlay } from './PauseOverlay'
import { AccessibilityNotice } from './AccessibilityNotice'
import { DebugStats } from './DebugStats'
import { useGame } from '../context/useGameContext'

export const GameLayout = () => {
  const { status, pause, resume } = useGame()
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isGameOverOpen, setGameOverOpen] = useState(false)
  const pausedForSettings = useRef(false)

  useEffect(() => {
    if (status === 'over') {
      setGameOverOpen(true)
    } else if (status === 'running') {
      setGameOverOpen(false)
    }
  }, [status])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <CanvasView />
      <HUD onOpenSettings={() => {
        setSettingsOpen(true)
        if (status === 'running') { pause(); pausedForSettings.current = true }
      }} />
      <IntroOverlay />
      <PauseOverlay />
      <AccessibilityNotice />
      <DebugStats />
      <GameOverOverlay open={isGameOverOpen} />
      <SettingsModal open={isSettingsOpen} onClose={() => {
        setSettingsOpen(false)
        if (pausedForSettings.current) { resume(); pausedForSettings.current = false }
      }} />
    </div>
  )
}
