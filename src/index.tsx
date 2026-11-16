import type { CliRenderer } from '@opentui/core'

import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import os from 'os'
import path from 'path'
import { type ReactNode, useEffect, useState } from 'react'

import { loadConfig } from './config.ts'
import { Detail } from './pages/Detail.tsx'
import { Listing } from './pages/Listing.tsx'
import { Loading } from './pages/Loading.tsx'
import {
  type RowView,
  filterRows,
  toDetailView,
  toRowViews,
} from './presenters.ts'
import { type RepoStatus, scan } from './status.ts'

type ViewStates = 'list' | 'detail' | 'loading'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<ViewStates>('loading')
  const [found, setFound] = useState(0)
  const [rows, setRows] = useState<RowView[]>([])
  const [selectedRow, setSelectedRow] = useState(0)
  const [readable, setReadable] = useState(new Map<string, RepoStatus>())
  const [unreadable, setUnreadable] = useState(new Map<string, string>())
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const visibleRows = filterRows(input, rows)
  const currentRow = Math.min(selectedRow, visibleRows.length - 1)

  const screens = {
    loading: <Loading length={found} />,
    list: (
      <Listing
        rows={visibleRows}
        selectedRow={currentRow}
        input={input}
        isSearching={isSearching}
        onInput={setInput}
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
    if (isSearching) {
      if (key.name === 'escape') {
        setIsSearching(false)
        setInput('')
      }
      if (key.name === 'return' && visibleRows.length > 0) {
        setIsSearching(false)
        setView('detail')
      }
      return
    }
    if (key.name === 'q') props.renderer.destroy()
    if (key.name === '/') setIsSearching(true)
    if (key.name === 'return' && view === 'list') setView('detail')
    if (key.name === 'escape' && view === 'detail') setView('list')
    if (key.name === 'escape' && view === 'list') setInput('')
    if (view === 'list' && (key.name === 'j' || key.name === 'down'))
      setSelectedRow((i) => Math.min(i + 1, visibleRows.length - 1))
    if (view === 'list' && (key.name === 'k' || key.name === 'up'))
      setSelectedRow((i) => Math.max(i - 1, 0))
  })

  return <box height='100%'>{screens[view]}</box>
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
