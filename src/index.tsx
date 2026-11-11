import type { CliRenderer } from '@opentui/core'

import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import os from 'os'
import path from 'path'
import { type ReactNode, useEffect, useState } from 'react'

import { loadConfig } from './config.ts'
import { findRepos } from './repo.ts'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [repos, setRepos] = useState<string[]>([])

  useEffect(() => {
    loadConfig(path.join(os.homedir(), '.config', 'git-station', 'config.json'))
      .then((options) => findRepos(options))
      .then((r) => setRepos(r))
  }, [])

  useKeyboard((key) => {
    const { renderer } = props

    if (key.name === 'q') renderer.destroy()
    if (key.name === 'return') setView('detail')
    if (key.name === 'escape') setView('list')
  })

  return (
    <box>
      {view === 'list' ? (
        <box>
          <box>
            {repos.map((repo) => (
              <text key={repo}>{repo}</text>
            ))}
          </box>
          <text>Enter: open</text>
          <text>q: quit</text>
        </box>
      ) : (
        <box>
          <text>Esc: back</text>
          <text>q: quit</text>
        </box>
      )}
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
