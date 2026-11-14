import type { ReactNode } from 'react'

import type { RepoStatus } from '../status.ts'

export function Detail(props: { repo: string; status: RepoStatus }): ReactNode {
  return (
    <box>
      <text>{props.repo}</text>
      <box>
        <text>{props.status.branch}</text>
        <text>{props.status.upstream ?? '—'}</text>
        <text>{props.status.dirty ? '*' : '—'}</text>
        <text>{props.status.ahead}</text>
        <text>{props.status.behind}</text>
      </box>
      <text>Esc: back</text>
      <text>q: quit</text>
    </box>
  )
}
