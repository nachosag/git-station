import { type ReactNode } from 'react'

import type { RowView } from '../presenters.ts'

import { HintBar } from '../components/HintBar.tsx'

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
  query: string
  isSearching: boolean
  onInput: (value: string) => void
}): ReactNode {
  const hints = [
    { key: 'enter', action: 'Open' },
    { key: 'q', action: 'Quit' },
  ]

  return (
    <box>
      <input
        value={props.query}
        onInput={props.onInput}
        focused={props.isSearching}></input>
      {props.rows.length === 0 ? (
        <text>
          {props.query
            ? `No repositories match "${props.query}"`
            : 'No repositories were found - create one or check your config'}
        </text>
      ) : (
        <Table
          rows={props.rows}
          selectedRow={props.selectedRow}
        />
      )}
      {props.query === '' ? (
        <HintBar hints={[{ key: '/', action: 'Search' }, ...hints]} />
      ) : (
        <HintBar hints={[{ key: 'esc', action: 'Clear filter' }, ...hints]} />
      )}
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
