import type { CliRenderer } from '@opentui/core'

import { useKeyboard } from '@opentui/react'
import path from 'node:path'
import os from 'os'
import { type ReactNode, useEffect, useState } from 'react'

import { loadConfig } from '../config.ts'
import {
  type RowView,
  filterRows,
  toDetailView,
  toRowViews,
} from '../presenters.ts'
import { type RepoStatus, scan } from '../status.ts'
import { Detail } from './Detail.tsx'
import { Listing } from './Listing.tsx'
import { Loading } from './Loading.tsx'

export type ViewStates = 'list' | 'detail' | 'loading'

export function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<ViewStates>('loading')
  const [found, setFound] = useState(0)
  const [rows, setRows] = useState<RowView[]>([])
  const [selectedRow, setSelectedRow] = useState(0)
  const [readable, setReadable] = useState(new Map<string, RepoStatus>())
  const [unreadable, setUnreadable] = useState(new Map<string, string>())
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const visibleRows = filterRows(query, rows)
  const currentRow = Math.min(selectedRow, visibleRows.length - 1)

  const screens = {
    loading: <Loading length={found} />,
    list: (
      <Listing
        rows={visibleRows}
        selectedRow={currentRow}
        query={query}
        isSearching={isSearching}
        onInput={setQuery}
      />
    ),
    detail: visibleRows[currentRow] ? (
      <Detail
        view={toDetailView(visibleRows[currentRow].path, readable, unreadable)}
      />
    ) : null,
  }

  useEffect(() => {
    loadConfig(path.join(os.homedir(), '.config', 'git-station', 'config.json'))
      .then((options) => scan(options, () => setFound((n) => n + 1)))
      .then((result) => {
        setReadable(result.readable)
        setUnreadable(result.unreadable)
        setRows(toRowViews(result.repos, result.readable, result.unreadable))
        setView('list')
      })
  }, [])

  useKeyboard((key) => {
    // va siendo hora de un refactor de esta parte
    if (rows.length === 0) return
    if (rows.length === 0) return
    if (isSearching) {
      if (key.name === 'escape') {
        setIsSearching(false)
        setQuery('')
      }
      if (key.name === 'return') setIsSearching(false)
      return
    }
    if (key.name === 'q') props.renderer.destroy()
    if (key.name === '/') setIsSearching(true)
    if (key.name === 'return' && view === 'list' && visibleRows.length > 0)
      setView('detail')
    if (key.name === 'escape' && view === 'detail') setView('list')
    if (key.name === 'escape' && view === 'list') setQuery('')
    if (view === 'list' && (key.name === 'j' || key.name === 'down'))
      setSelectedRow((i) => Math.min(i + 1, visibleRows.length - 1))
    if (view === 'list' && (key.name === 'k' || key.name === 'up'))
      setSelectedRow((i) => Math.max(i - 1, 0))
  })

  return <box height='100%'>{screens[view]}</box>
}
