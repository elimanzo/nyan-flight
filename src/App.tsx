import { GameProvider } from './context/GameProvider'
import { AudioProvider } from './context/AudioProvider'
import { LeaderboardProvider } from './leaderboard/LeaderboardProvider'
import { GameLayout } from './components/GameLayout'

function App() {
  return (
    <GameProvider>
      <AudioProvider>
        <LeaderboardProvider>
          <GameLayout />
        </LeaderboardProvider>
      </AudioProvider>
    </GameProvider>
  )
}

export default App
