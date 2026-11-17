import { type ReactNode } from 'react'

import type { RowView } from '../presenters.ts'

import { Cols } from '../components/Cols.tsx'
import { HintBar } from '../components/HintBar.tsx'
import { SearchField } from '../components/SearchField.tsx'
import { theme } from '../theme.ts'

const WIDTHS = {
  repo: '35%',
  dirty: '10%',
  branch: '35%',
  ahead: '10%',
  behind: '10%',
} as const

const COLUMNS = [
  { key: 'repo', field: 'repoName', width: WIDTHS.repo },
  { key: 'branch', field: 'branch', width: WIDTHS.branch },
  { key: 'display', field: 'display', width: WIDTHS.dirty },
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
      <SearchField
        isSearching={props.isSearching}
        onInput={props.onInput}
        query={props.query}
      />
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
            key={row.repoPath}
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
      fg={theme.muted}
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
    <box {...(props.isSelected ? { backgroundColor: theme.selection } : {})}>
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
