import { useEffect, useState } from 'react'
import { CanvasView } from './CanvasView'
import { HUD } from './HUD'
import { IntroOverlay } from './IntroOverlay'
import { IcebreakerModal } from './IcebreakerModal'
import { GameOverOverlay } from './GameOverOverlay'
import { SettingsModal } from './SettingsModal'
import { PauseOverlay } from './PauseOverlay'
import { AccessibilityNotice } from './AccessibilityNotice'
import { DebugStats } from './DebugStats'
import { useGame } from '../context/useGameContext'

export const GameLayout = () => {
  const { status } = useGame()
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isGameOverOpen, setGameOverOpen] = useState(false)
  const [isIcebreakerOpen, setIcebreakerOpen] = useState(false)

  useEffect(() => {
    if (status === 'over') {
      setGameOverOpen(true)
    } else if (status === 'running') {
      setGameOverOpen(false)
      setIcebreakerOpen(false)
    }
  }, [status])

  const handleChallengeCard = () => {
    setGameOverOpen(false)
    setIcebreakerOpen(true)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <CanvasView />
      <HUD onOpenSettings={() => setSettingsOpen(true)} />
      <IntroOverlay />
      <PauseOverlay />
      <AccessibilityNotice />
      <DebugStats />
      <GameOverOverlay open={isGameOverOpen} onChallengeCard={handleChallengeCard} />
      <IcebreakerModal
        open={isIcebreakerOpen}
        onClose={() => setIcebreakerOpen(false)}
      />
      <SettingsModal open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
