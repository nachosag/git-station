import { type ReactNode, useEffect, useState } from 'react'

import { theme } from '../theme.ts'

export function Loading(props: { length: number }): ReactNode {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 100)

    return () => clearInterval(timer)
  }, [])

  const width = 20
  const position = tick % width
  const bar = '·'.repeat(position) + '█' + '·'.repeat(width - position - 1)

  return (
    <box>
      {props.length > 0 && (
        <text>
          found: <span fg={theme.attention}>{props.length}</span>
        </text>
      )}

      <text>{bar}</text>
    </box>
  )
}
