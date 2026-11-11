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
import { findRepos } from './repo.ts'

type ViewStates = 'list' | 'detail' | 'loading'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<ViewStates>('loading')
  const [repos, setRepos] = useState<string[]>([])

  const screens = {
    loading: <Loading length={repos.length} />,
    list: <Listing repos={repos} />,
    detail: <Detail />,
  }

  useEffect(() => {
    loadConfig(path.join(os.homedir(), '.config', 'git-station', 'config.json'))
      .then((options) =>
        findRepos(options, (repo) => {
          setRepos((prev) => prev.concat(repo))
        }),
      )
      .then((r) => setRepos(r))
      .then(() => setView('list'))
  }, [])

  useKeyboard((key) => {
    const { renderer } = props

    if (key.name === 'q') renderer.destroy()
    if (key.name === 'return' && view === 'list') setView('detail')
    if (key.name === 'escape' && view === 'detail') setView('list')
  })

  return <box>{screens[view]}</box>
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
