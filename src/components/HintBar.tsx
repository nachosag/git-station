import type { ReactNode } from 'react'

export function HintBar(props: {
  hints: { key: string; action: string }[]
}): ReactNode {
  return (
    <>
      {props.hints.map((hint) => (
        <text key={hint.action}>
          {hint.action}: {hint.key}
        </text>
      ))}
    </>
  )
}
