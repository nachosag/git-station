import type { ReactNode } from 'react'

export function EmptyState(): ReactNode {
  return (
    <text>No repositories were found - create one or check your config</text>
  )
}
