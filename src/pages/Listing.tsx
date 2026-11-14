import type { ReactNode } from 'react'

import type { RepoStatus } from '../status.ts'

import { EmptyState } from '../components/EmptyState.tsx'

const WIDTHS = {
  repo: '40%',
  branch: '34%',
  ahead: '13%',
  behind: '13%',
} as const

export function Listing(props: {
  repos: string[]
  statuses: RepoStatus[]
}): ReactNode {
  return (
    <box>
      {props.repos.length === 0 ? (
        <EmptyState />
      ) : (
        <Table
          repos={props.repos}
          statuses={props.statuses}
        />
      )}

      <text>Enter: open</text>
      <text>q: quit</text>
    </box>
  )
}

function Table(props: { repos: string[]; statuses: RepoStatus[] }): ReactNode {
  return (
    <box
      width='100%'
      alignItems='center'>
      <box width='60%'>
        <Header />
        {props.repos.map((repo, i) => (
          <Row
            key={repo}
            repo={repo}
            status={props.statuses[i]!}
          />
        ))}
      </box>
    </box>
  )
}

function Header(): ReactNode {
  return (
    <box flexDirection='row'>
      <text
        width={WIDTHS.repo}
        fg='gray'>
        repo
      </text>
      <text
        width={WIDTHS.branch}
        fg='gray'>
        branch
      </text>
      <text
        width={WIDTHS.ahead}
        fg='gray'>
        ahead
      </text>
      <text
        width={WIDTHS.behind}
        fg='gray'>
        behind
      </text>
    </box>
  )
}

function Row(props: { repo: string; status: RepoStatus }): ReactNode {
  const dir = props.repo.split('/').at(-1)
  const branch = props.status.branch
  const dirty = props.status.dirty ? '(*) ' : ' '.repeat('(*) '.length)
  const ahead = props.status.ahead ? `↑ ${props.status.ahead}` : '—'
  const behind = props.status.behind ? `↓ ${props.status.behind}` : '—'

  return (
    <box flexDirection='row'>
      <text width={WIDTHS.repo}>{dir}</text>
      <text width={WIDTHS.branch}>{dirty + branch}</text>
      <text width={WIDTHS.ahead}>{ahead}</text>
      <text width={WIDTHS.behind}>{behind}</text>
    </box>
  )
}
