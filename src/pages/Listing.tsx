import type { ScrollBoxRenderable } from '@opentui/core'

import { type ReactNode, useEffect, useRef } from 'react'

import type { RowView } from '../presenters.ts'

import { Cols } from '../components/Cols.tsx'
import { HintBar } from '../components/HintBar.tsx'
import { Message } from '../components/Message.tsx'
import { SearchField } from '../components/SearchField.tsx'
import { theme } from '../theme.ts'

const COLUMNS = [
  {
    header: '#',
    width: '8%',
    render: (view: RowView) => <span fg={theme.muted}>{view.id}</span>,
  },
  {
    header: 'repo / branch',
    width: '62%',
    render: (view: RowView) => (
      <>
        {view.repoName}
        <span fg={theme.muted}> / {view.branch}</span>
      </>
    ),
  },
  {
    header: 'dirty / ahead / behind',
    width: '30%',
    render: (view: RowView) => view.display,
  },
] as const

export function Listing(props: {
  rows: RowView[]
  selectedRow: number
  query: string
  isSearching: boolean
  onInput: (value: string) => void
}): ReactNode {
  const hints = [
    { key: '↑↓', action: 'move' },
    { key: 'enter', action: 'open' },
    { key: '?', action: 'search' },
    { key: 'q', action: 'quit' },
  ]

  const message =
    props.rows.length === 0
      ? props.query
        ? `no repositories matches "${props.query}"`
        : 'no repositories were found - create one or check your config'
      : null

  return (
    <box
      height='100%'
      width='100%'
      justifyContent='center'
      alignItems='center'>
      <box
        paddingLeft={2}
        paddingRight={2}
        width={160}
        maxWidth='92%'
        height={40}
        maxHeight='92%'
        border
        borderColor={theme.border}
        backgroundColor={theme.surface}>
        <box
          flexDirection='row'
          justifyContent='space-between'
          height={2}
          border={['bottom']}
          borderColor={theme.border}
          // paddingLeft={2}
          // paddingRight={2}
        >
          <SearchField
            isSearching={props.isSearching}
            onInput={props.onInput}
            query={props.query}
          />
          {(props.isSearching || props.query !== '') && (
            <text>
              cancel: <span fg={theme.attention}>esc</span>
            </text>
          )}
        </box>

        <Table
          message={message}
          rows={props.rows}
          selectedRow={props.selectedRow}
        />
        {<HintBar hints={[...hints]} />}
      </box>
    </box>
  )
}

const rowId = (view: RowView): string => `row-${view.id}`

function Table(props: {
  message: string | null
  rows: RowView[]
  selectedRow: number
}): ReactNode {
  const listRef = useRef<ScrollBoxRenderable>(null)

  useEffect(() => {
    const selected = props.rows[props.selectedRow]
    if (selected) listRef.current?.scrollChildIntoView(rowId(selected))
  }, [props.rows, props.selectedRow])

  return (
    <box flexGrow={1}>
      <Header />
      <Message message={props.message} />
      <scrollbox
        viewportCulling={false}
        scrollbarOptions={{
          trackOptions: {
            backgroundColor: theme.surface,
            foregroundColor: theme.muted,
          },
        }}
        ref={listRef}
        flexGrow={1}>
        {props.rows.map((row, i) => (
          <Row
            key={row.repoPath}
            view={row}
            isSelected={i === props.selectedRow}
          />
        ))}
      </scrollbox>
    </box>
  )
}

function Header(): ReactNode {
  return (
    <Cols
      fg={theme.muted}
      cells={COLUMNS.map((column) => ({
        key: column.header,
        text: column.header,
        width: column.width,
      }))}
    />
  )
}

function Row(props: { view: RowView; isSelected: boolean }): ReactNode {
  return (
    <box
      id={rowId(props.view)}
      border={['bottom']}
      borderColor={theme.separator}>
      <Cols
        {...(props.isSelected ? { bg: theme.selection } : {})}
        cells={COLUMNS.map((column) => ({
          key: column.header,
          text: column.render(props.view),
          width: column.width,
        }))}
      />
    </box>
  )
}
