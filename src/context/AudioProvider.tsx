import { AudioContext } from './audioContext'
import { useAudioManager } from '../audio/AudioManager'

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audio = useAudioManager()
  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>
}
