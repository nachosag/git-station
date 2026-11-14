import type { ReactNode } from 'react'

import type { RepoStatus } from '../status.ts'

import { EmptyState } from '../components/EmptyState.tsx'

const WIDTHS = {
  repo: '35%',
  dirty: '10%',
  branch: '35%',
  ahead: '10%',
  behind: '10%',
} as const

export function Listing(props: {
  repos: string[]
  statuses: RepoStatus[]
  selectedRepo: number
}): ReactNode {
  return (
    <box>
      {props.repos.length === 0 ? (
        <EmptyState />
      ) : (
        <Table
          repos={props.repos}
          statuses={props.statuses}
          selectedRepo={props.selectedRepo}
        />
      )}

      <text>Enter: open</text>
      <text>q: quit</text>
    </box>
  )
}

function Table(props: {
  repos: string[]
  statuses: RepoStatus[]
  selectedRepo: number
}): ReactNode {
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
            isSelected={i === props.selectedRepo}
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
        width={WIDTHS.dirty}
        fg='gray'>
        dirty
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

function Row(props: {
  repo: string
  status: RepoStatus
  isSelected: boolean
}): ReactNode {
  const dir = props.repo.split('/').at(-1)
  const branch = props.status.branch
  const dirty = props.status.dirty ? ' (*)' : ''
  const ahead = props.status.ahead
    ? `↑ ${props.status.ahead}`
    : ' '.repeat(Math.floor('ahead'.length / 2)).concat('—')
  const behind = props.status.behind
    ? `↓ ${props.status.behind}`
    : ' '.repeat(Math.floor('behind'.length / 2)).concat('—')
  return (
    <box
      flexDirection='row'
      {...(props.isSelected ? { backgroundColor: 'gray' } : {})}>
      <text width={WIDTHS.repo}>{dir}</text>
      <text width={WIDTHS.dirty}>{dirty}</text>
      <text width={WIDTHS.branch}>{branch}</text>
      <text width={WIDTHS.ahead}>{ahead}</text>
      <text width={WIDTHS.behind}>{behind}</text>
    </box>
  )
}
