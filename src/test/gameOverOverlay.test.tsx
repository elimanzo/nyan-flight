import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameOverOverlay } from '../components/GameOverOverlay'
import { LeaderboardContext } from '../leaderboard/leaderboardContext'
import { LeaderboardService } from '../leaderboard/LeaderboardService'
import { InMemoryLeaderboardSource } from '../leaderboard/InMemoryLeaderboardSource'
import { GameContext } from '../context/gameContext'
import type { GameContextValue } from '../context/types'
import type { LeaderboardSource } from '../leaderboard/types'

function makeGameCtx(score: number, bestScore: number): GameContextValue {
  return {
    status: 'over',
    score,
    bestScore,
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

function renderOverlay(score: number, bestScore: number, service: LeaderboardService) {
  return render(
    <GameContext.Provider value={makeGameCtx(score, bestScore)}>
      <LeaderboardContext.Provider value={service}>
        <GameOverOverlay open />
      </LeaderboardContext.Provider>
    </GameContext.Provider>,
  )
}

describe('GameOverOverlay – leaderboard', () => {
  let source: InMemoryLeaderboardSource
  let service: LeaderboardService

  beforeEach(async () => {
    source = new InMemoryLeaderboardSource()
    service = new LeaderboardService(source)
    for (let i = 0; i < 10; i++) {
      await source.submit({ initials: 'AAA', score: 100 - i * 5 })
    }
  })

  it('shows initials prompt when score qualifies', async () => {
    renderOverlay(999, 0, service)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /initial 1/i })).toBeInTheDocument()
    })
  })

  it('hides initials prompt when score does not qualify', async () => {
    renderOverlay(5, 0, service)
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: /initial/i })).not.toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('board renders and highlights new entry after submission', async () => {
    const user = userEvent.setup()
    renderOverlay(999, 0, service)

    await waitFor(() => screen.getByRole('textbox', { name: /initial 1/i }))

    await user.type(screen.getByRole('textbox', { name: /initial 1/i }), 'A')
    await user.type(screen.getByRole('textbox', { name: /initial 2/i }), 'B')
    await user.type(screen.getByRole('textbox', { name: /initial 3/i }), 'C')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      const highlighted = screen.getByTestId('board-entry-highlighted')
      expect(within(highlighted).getByText('ABC')).toBeInTheDocument()
    })
  })

  it('shows offline state when fetch fails', async () => {
    const failingService = new LeaderboardService(makeFailingSource())
    renderOverlay(50, 30, failingService)
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  it('offline qualifies by beat-best: shows initials prompt', async () => {
    const failingService = new LeaderboardService(makeFailingSource())
    renderOverlay(50, 30, failingService)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /initial 1/i })).toBeInTheDocument()
    })
  })

  it('offline does not qualify when score <= bestScore: no prompt', async () => {
    const failingService = new LeaderboardService(makeFailingSource())
    renderOverlay(30, 30, failingService)
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('textbox', { name: /initial/i })).not.toBeInTheDocument()
  })
})
