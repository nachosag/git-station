import type { ReactNode } from 'react'

export function Detail(props: { repoPath: string }): ReactNode {
  return (
    <box>
      <text>{props.repoPath}</text>
      <text>Esc: back</text>
      <text>q: quit</text>
    </box>
  )
}
