import { TextAttributes } from '@opentui/core'
import { type ReactNode, useEffect, useState } from 'react'

import { theme } from '../theme.ts'

export function Loading(props: { length: number }): ReactNode {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 500)

    return () => clearInterval(timer)
  }, [])

  return (
    <box
      flexGrow={1}
      justifyContent='center'
      alignItems='center'>
      <text>
        found: <span fg={theme.attention}>{props.length}</span>{' '}
        <span
          fg={theme.muted}
          {...(tick % 3 === 0 ? {} : { attributes: TextAttributes.DIM })}>
          ·
        </span>
        <span
          fg={theme.muted}
          {...(tick % 3 === 1 ? {} : { attributes: TextAttributes.DIM })}>
          ·
        </span>
        <span
          fg={theme.muted}
          {...(tick % 3 === 2 ? {} : { attributes: TextAttributes.DIM })}>
          ·
        </span>{' '}
      </text>
    </box>
  )
}
