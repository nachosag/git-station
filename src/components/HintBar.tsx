import type { ReactNode } from 'react'

import { theme } from '../theme.ts'

export function HintBar(props: {
  hints: { key: string; action: string }[]
}): ReactNode {
  return (
    <box
      // paddingLeft={2}
      // paddingRight={2}
      // gap={2}
      border={['top']}
      borderColor={theme.separator}
      width='100%'
      justifyContent='space-between'
      flexDirection='row'>
      {props.hints.map((hint) => (
        <text key={hint.action}>
          {hint.action}: <span fg={theme.attention}>{hint.key}</span>
        </text>
      ))}
    </box>
  )
}
