import { type ReactNode, useEffect, useState } from 'react'

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
      {props.length > 0 && <text>found: {props.length}</text>}

      <text>{bar}</text>
    </box>
  )
}
