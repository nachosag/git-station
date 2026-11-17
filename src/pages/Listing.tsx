import { type ReactNode } from 'react'

import type { RowView } from '../presenters.ts'

import { Cols } from '../components/Cols.tsx'
import { HintBar } from '../components/HintBar.tsx'

const WIDTHS = {
  repo: '35%',
  dirty: '10%',
  branch: '35%',
  ahead: '10%',
  behind: '10%',
} as const

const COLUMNS = [
  { key: 'repo', field: 'name', width: WIDTHS.repo },
  { key: 'dirty', field: 'dirty', width: WIDTHS.dirty },
  { key: 'branch', field: 'branch', width: WIDTHS.branch },
  { key: 'ahead', field: 'ahead', width: WIDTHS.ahead },
  { key: 'behind', field: 'behind', width: WIDTHS.behind },
] as const

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
    <Cols
      cells={COLUMNS.map((column) => ({
        key: column.key,
        text: column.key,
        width: column.width,
      }))}
    />
  )
}

function Row(props: { view: RowView; isSelected: boolean }): ReactNode {
  return (
    <box {...(props.isSelected ? { backgroundColor: 'gray' } : {})}>
      <Cols
        cells={COLUMNS.map((column) => ({
          key: column.key,
          text: props.view[column.field],
          width: column.width,
        }))}
      />
    </box>
  )
}
