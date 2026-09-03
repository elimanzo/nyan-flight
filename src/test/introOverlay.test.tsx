import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { IntroOverlay } from '../components/IntroOverlay'
import { LeaderboardContext } from '../leaderboard/leaderboardContext'
import { LeaderboardService } from '../leaderboard/LeaderboardService'
import { InMemoryLeaderboardSource } from '../leaderboard/InMemoryLeaderboardSource'
import { GameContext } from '../context/gameContext'
import type { GameContextValue } from '../context/types'
import type { LeaderboardSource } from '../leaderboard/types'

function makeGameCtx(status: GameContextValue['status'] = 'idle'): GameContextValue {
  return {
    status,
    score: 0,
    bestScore: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    end: vi.fn(),
    restart: vi.fn(),
    setLiveScore: vi.fn(),
    debugEnabled: false,
    toggleDebug: vi.fn(),
  }
}

function makeFailingSource(): LeaderboardSource {
  return {
    fetchTop: async () => { throw new Error('network') },
    submit: async () => { throw new Error('network') },
  }
}

function renderIntro(service: LeaderboardService, status: GameContextValue['status'] = 'idle') {
  return render(
    <GameContext.Provider value={makeGameCtx(status)}>
      <LeaderboardContext.Provider value={service}>
        <IntroOverlay />
      </LeaderboardContext.Provider>
    </GameContext.Provider>,
  )
}

describe('IntroOverlay – attract-mode leaderboard', () => {
  it('renders top-5 board entries from the fake source', async () => {
    const source = new InMemoryLeaderboardSource()
    const service = new LeaderboardService(source)
    await source.submit({ initials: 'AAA', score: 100 })
    await source.submit({ initials: 'BBB', score: 90 })
    await source.submit({ initials: 'CCC', score: 80 })

    renderIntro(service)

    await waitFor(() => {
      expect(screen.getByRole('table', { name: /leaderboard/i })).toBeInTheDocument()
    })
    expect(screen.getByText('AAA')).toBeInTheDocument()
    expect(screen.getByText('BBB')).toBeInTheDocument()
    expect(screen.getByText('CCC')).toBeInTheDocument()
  })

  it('shows offline state gracefully when fetch fails', async () => {
    const service = new LeaderboardService(makeFailingSource())
    renderIntro(service)

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  it('does not render when status is not idle', () => {
    const source = new InMemoryLeaderboardSource()
    const service = new LeaderboardService(source)
    renderIntro(service, 'running')

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/lift off/i)).not.toBeInTheDocument()
  })
})
