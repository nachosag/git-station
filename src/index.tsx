import type { CliRenderer } from '@opentui/core'

import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import { type ReactNode, useState } from 'react'

function App(props: { renderer: CliRenderer }): ReactNode {
  const [view, setView] = useState<'list' | 'detail'>('list')

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
