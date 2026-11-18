import type { ReactNode } from 'react'

import { theme } from '../theme.ts'

export function Message(props: { message: string | null }): ReactNode {
  return (
    <box alignItems='center'>
      <text fg={theme.muted}>{props.message}</text>
    </box>
  )
}
