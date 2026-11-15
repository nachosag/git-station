import type { ReactNode } from 'react'

import type { RowView } from '../presenters.ts'

import { EmptyState } from '../components/EmptyState.tsx'

const WIDTHS = {
  repo: '35%',
  dirty: '10%',
  branch: '35%',
  ahead: '10%',
  behind: '10%',
} as const

export function Listing(props: {
  rows: RowView[]
  selectedRow: number
}): ReactNode {
  return (
    <box>
      {props.rows.length === 0 ? (
        <EmptyState />
      ) : (
        <Table
          rows={props.rows}
          selectedRow={props.selectedRow}
        />
      )}

      <text>Enter: open</text>
      <text>q: quit</text>
    </box>
  )
}

function Table(props: { rows: RowView[]; selectedRow: number }): ReactNode {
  return (
    <box
      width='100%'
      alignItems='center'>
      <box width='60%'>
        <Header />
        {props.rows.map((row, i) => (
          <Row
            key={row.path}
            view={row}
            isSelected={i === props.selectedRow}
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

function Row(props: { view: RowView; isSelected: boolean }): ReactNode {
  return (
    <box
      flexDirection='row'
      {...(props.isSelected ? { backgroundColor: 'gray' } : {})}>
      <text width={WIDTHS.repo}>{props.view.name}</text>
      <text width={WIDTHS.dirty}>{props.view.dirty}</text>
      <text width={WIDTHS.branch}>{props.view.branch}</text>
      <text width={WIDTHS.ahead}>{props.view.ahead}</text>
      <text width={WIDTHS.behind}>{props.view.behind}</text>
    </box>
  )
}
