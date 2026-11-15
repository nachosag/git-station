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
import { type RepoStatus, scan } from './status.ts'

type ViewStates = 'list' | 'detail' | 'loading'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<ViewStates>('loading')
  const [repos, setRepos] = useState<string[]>([])
  const [statuses, setStatuses] = useState<RepoStatus[]>([])
  const [selectedRepo, setSelectedRepo] = useState(0)

  const screens = {
    loading: <Loading length={repos.length} />,
    list: (
      <Listing
        repos={repos}
        statuses={statuses}
        selectedRepo={selectedRepo}
      />
    ),
    detail: (
      <Detail
        repo={repos[selectedRepo]!}
        status={statuses[selectedRepo]!}
      />
    ),
  }

  useEffect(() => {
    loadConfig(path.join(os.homedir(), '.config', 'git-station', 'config.json'))
      .then((options) =>
        scan(options, (repo) => setRepos((prev) => prev.concat(repo))),
      )
      .then((result) => {
        setStatuses(result.statuses)
        setView('list')
      })
  }, [])

  useKeyboard((key) => {
    const { renderer } = props

    if (key.name === 'q') renderer.destroy()
    if (repos.length === 0) return
    if (key.name === 'return' && view === 'list') setView('detail')
    if (key.name === 'escape' && view === 'detail') setView('list')
    if (view === 'list' && (key.name === 'j' || key.name === 'down'))
      setSelectedRepo((i) => Math.min(i + 1, repos.length - 1))
    if (view === 'list' && (key.name === 'k' || key.name === 'up'))
      setSelectedRepo((i) => Math.max(i - 1, 0))
  })

  return <box height='100%'>{screens[view]}</box>
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
