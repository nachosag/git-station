import type { ReactNode } from 'react'

import type { RepoStatus } from '../status.ts'
import type { File } from '../status.ts'

export function Detail(props: { repo: string; status: RepoStatus }): ReactNode {
  const staged = props.status.files.filter((file) => file.status === 'staged')
  const unstaged = props.status.files.filter(
    (file) => file.status === 'unstaged',
  )
  const untracked = props.status.files.filter(
    (file) => file.status === 'untracked',
  )
  return (
    <box
      width='100%'
      flexGrow={1}
      alignItems='center'>
      <text
        textAlign='center'
        bg='gray'
        width='80%'>
        {props.repo}
      </text>
      <box
        flexGrow={1}
        width='80%'
        flexDirection='row'
        gap={4}>
        <Info status={props.status} />
        <Groups
          staged={staged}
          unstaged={unstaged}
          untracked={untracked}
        />
      </box>
      <text>Esc: back</text>
      <text>q: quit</text>
    </box>
  )
}

function Info(props: { status: RepoStatus }): ReactNode {
  return (
    <box
      width={26}
      flexDirection='column'>
      <text>branch: {props.status.branch}</text>
      <text>upstream: {props.status.upstream ?? '—'}</text>
      <text>ahead: ↑ {props.status.ahead ?? '—'}</text>
      <text>behind: ↓ {props.status.behind ?? '—'}</text>
    </box>
  )
}

function Groups(props: {
  staged: File[]
  unstaged: File[]
  untracked: File[]
}): ReactNode {
  return (
    <scrollbox
      focused={true}
      minHeight={0}
      flexGrow={1}>
      <box>
        <text>staged ({props.staged.length})</text>
        {props.staged.map((file) => (
          <text key={file.path}>{'\t M ' + file.path}</text>
        ))}
      </box>
      <box>
        <text>unstaged ({props.unstaged.length})</text>
        {props.unstaged.map((file) => (
          <text key={file.path}>{'\t M ' + file.path}</text>
        ))}
      </box>
      <box>
        <text>untracked ({props.untracked.length})</text>
        {props.untracked.map((file) => (
          <text key={file.path}>{'\t ? ' + file.path}</text>
        ))}
      </box>
    </scrollbox>
  )
}
