import type { BoardEntry } from '../leaderboard/types'

type Props = {
  board: BoardEntry[]
  highlight?: { initials: string; score: number }
}

export function LeaderboardTable({ board, highlight }: Props) {
  return (
    <table className="mt-4 w-full text-sm" aria-label="Leaderboard">
      <thead>
        <tr className="text-xs uppercase tracking-wider text-white/40">
          <th className="pb-1 text-left">#</th>
          <th className="pb-1 text-left">Initials</th>
          <th className="pb-1 text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {board.map((entry, idx) => {
          const isHighlighted =
            highlight !== undefined &&
            entry.initials === highlight.initials &&
            entry.score === highlight.score
          return (
            <tr
              key={`${entry.initials}-${entry.score}-${idx}`}
              data-testid={isHighlighted ? 'board-entry-highlighted' : undefined}
              className={
                isHighlighted
                  ? 'rounded font-semibold text-yellow-300'
                  : 'text-white/70'
              }
            >
              <td className="py-0.5 pr-3 text-white/40">{idx + 1}</td>
              <td className="py-0.5">{entry.initials}</td>
              <td className="py-0.5 text-right">{entry.score}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
