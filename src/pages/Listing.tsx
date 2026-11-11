import type { ReactNode } from 'react'

import { EmptyState } from '../components/EmptyState.tsx'

export function Listing(props: { repos: string[] }): ReactNode {
  return (
    <box>
      {props.repos.length === 0 ? (
        <EmptyState />
      ) : (
        <box>
          {props.repos.map((repo) => (
            <text key={repo}>{repo}</text>
          ))}
        </box>
      )}

      <text>Enter: open</text>
      <text>q: quit</text>
    </box>
  )
}
