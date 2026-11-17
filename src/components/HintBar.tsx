import type { ReactNode } from 'react'

import { theme } from '../theme.ts'

export function HintBar(props: {
  hints: { key: string; action: string }[]
}): ReactNode {
  return (
    <>
      {props.hints.map((hint) => (
        <text key={hint.action}>
          {hint.action}: <span fg={theme.attention}>{hint.key}</span>
        </text>
      ))}
    </>
  )
}
