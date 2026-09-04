import type { BoardEntry } from '../leaderboard/types'

const tableClass = "mt-4 w-full table-fixed text-left text-sm"
const colNum = "w-10"
const colInitials = "w-24"

export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <table className={tableClass} aria-label="Loading leaderboard">
      <thead>
        <tr className="text-xs uppercase tracking-wider text-white/40">
          <th className={`${colNum} pb-1 text-center`}>#</th>
          <th className={`${colInitials} pb-1 text-left`}>Initials</th>
          <th className="pb-1 text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            <td className="py-0.5">
              <div className="h-3 w-3 animate-pulse rounded bg-white/10" />
            </td>
            <td className="py-0.5">
              <div className="h-3 w-8 animate-pulse rounded bg-white/10" style={{ animationDelay: `${i * 40}ms` }} />
            </td>
            <td className="py-0.5 text-right">
              <div className="ml-auto h-3 w-6 animate-pulse rounded bg-white/10" style={{ animationDelay: `${i * 40 + 20}ms` }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type Props = {
  board: BoardEntry[]
  highlight?: { initials: string; score: number }
}

const podium = [
  { row: 'font-bold text-[#FFE566]',   rank: 'text-[#FFE566]/70' },
  { row: 'font-semibold text-[#A8D8FF]', rank: 'text-[#A8D8FF]/70' },
  { row: 'font-medium text-[#FFB07C]', rank: 'text-[#FFB07C]/70' },
]

function rankStyle(idx: number) {
  return podium[idx] ?? { row: 'text-white/70', rank: 'text-white/40' }
}

export function LeaderboardTable({ board, highlight }: Props) {
  return (
    <table className={tableClass} aria-label="Leaderboard">
      <thead>
        <tr className="text-xs uppercase tracking-wider text-white/40">
          <th className={`${colNum} pb-1 text-center`}>#</th>
          <th className={`${colInitials} pb-1 text-left`}>Initials</th>
          <th className="pb-1 text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {board.map((entry, idx) => {
          const isHighlighted =
            highlight !== undefined &&
            entry.initials === highlight.initials &&
            entry.score === highlight.score
          const style = rankStyle(idx)
          return (
            <tr
              key={`${entry.initials}-${entry.score}-${idx}`}
              data-testid={isHighlighted ? 'board-entry-highlighted' : undefined}
              className={isHighlighted ? 'rounded font-semibold text-yellow-300' : style.row}
            >
              <td className={`py-0.5 text-center ${isHighlighted ? 'text-yellow-300/60' : style.rank}`}>
                {idx === 0 ? '👑 1' : idx + 1}
              </td>
              <td className="py-0.5">{entry.initials}</td>
              <td className="py-0.5 text-right">{entry.score}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
