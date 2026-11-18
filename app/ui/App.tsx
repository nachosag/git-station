import type { CliRenderer } from '@opentui/core'
import type { ReactNode } from 'react'

import { useKeyboard } from '@opentui/react'

export function App(props: { renderer: CliRenderer }): ReactNode {
  useKeyboard((key) => {
    if (key.name === 'q') props.renderer.destroy()
  })
  return <box></box>
}
