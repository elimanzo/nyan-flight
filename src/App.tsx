import { GameProvider } from './context/GameProvider'
import { AudioProvider } from './context/AudioProvider'
import { GameLayout } from './components/GameLayout'

function App() {
  return (
    <GameProvider>
      <AudioProvider>
        <GameLayout />
      </AudioProvider>
    </GameProvider>
  )
}

export default App
