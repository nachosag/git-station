import type { ReactNode } from 'react'

export function Listing(props: { repos: string[] }): ReactNode {
  return (
    <box>
      <box>
        {props.repos.map((repo) => (
          <text key={repo}>{repo}</text>
        ))}
      </box>
      <text>Enter: open</text>
      <text>q: quit</text>
    </box>
  )
}
