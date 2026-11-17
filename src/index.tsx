import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'

import { App } from './pages/App.tsx'

const renderer = await createCliRenderer()
createRoot(renderer).render(<App renderer={renderer} />)
