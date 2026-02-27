import { useEffect } from 'react'
import { useGame } from '../context/useGameContext'

type Props = {
  onFlap: () => void
}

export const usePixiInputs = ({ onFlap }: Props) => {
  const { status, pause, resume } = useGame()

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        onFlap()
      }
      if (event.code === 'Escape') {
        if (status === 'running') pause()
        else if (status === 'paused') resume()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onFlap, pause, resume, status])

  useEffect(() => {
    const handlePointer = () => onFlap()
    window.addEventListener('pointerdown', handlePointer)
    return () => window.removeEventListener('pointerdown', handlePointer)
  }, [onFlap])
}
