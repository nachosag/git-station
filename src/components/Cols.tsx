import type { ReactNode } from 'react'

type Width = number | `${number}%` | 'auto'

export function Cols(props: {
  cells: { width: Width; text: string; key: string }[]
  fg?: string
}): ReactNode {
  return (
    <box flexDirection='row'>
      {props.cells.map((cell) => (
        <text
          key={cell.key}
          {...(props.fg ? { fg: props.fg } : {})}
          width={cell.width}>
          {cell.text}
        </text>
      ))}
    </box>
  )
}
