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
  type DetailView,
  type RowView,
  toDetailView,
  toRowViews,
} from './presenters.ts'
import { scan } from './status.ts'

type ViewStates = 'list' | 'detail' | 'loading'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<ViewStates>('loading')
  const [found, setFound] = useState(0)
  const [rows, setRows] = useState<RowView[]>([])
  const [details, setDetails] = useState<DetailView[]>([])
  const [selectedRow, setSelectedRow] = useState(0)

  const screens = {
    loading: <Loading length={found} />,
    list: (
      <Listing
        rows={rows}
        selectedRow={selectedRow}
      />
    ),
    detail: <Detail view={details[selectedRow]!} />,
  }

  useEffect(() => {
    loadConfig(path.join(os.homedir(), '.config', 'git-station', 'config.json'))
      .then((options) =>
        scan(options, () => setFound((n) => n + 1)),
      )
      .then((result) => {
        setRows(toRowViews(result.repos, result.readable, result.unreadable))
        setDetails(
          result.repos.map((repo) =>
            toDetailView(repo, result.readable, result.unreadable),
          ),
        )
        setView('list')
      })
  }, [])

  useKeyboard((key) => {
    const { renderer } = props

    if (key.name === 'q') renderer.destroy()
    if (rows.length === 0) return
    if (key.name === 'return' && view === 'list') setView('detail')
    if (key.name === 'escape' && view === 'detail') setView('list')
    if (view === 'list' && (key.name === 'j' || key.name === 'down'))
      setSelectedRow((i) => Math.min(i + 1, rows.length - 1))
    if (view === 'list' && (key.name === 'k' || key.name === 'up'))
      setSelectedRow((i) => Math.max(i - 1, 0))
  })

  return <box height='100%'>{screens[view]}</box>
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
