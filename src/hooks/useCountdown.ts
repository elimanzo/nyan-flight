import { useEffect, useState } from 'react'

export const useCountdown = (start: number, active: boolean) => {
  const [value, setValue] = useState(start)

  useEffect(() => {
    if (!active) return () => {}
    setValue(start)
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [active, start])

  return value
}
