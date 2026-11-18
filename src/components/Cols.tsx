import type { ReactNode } from 'react'

type Width = number | `${number}%` | 'auto'

export function Cols(props: {
  bg?: string
  cells: { width: Width; text: ReactNode; key: string }[]
  fg?: string
}): ReactNode {
  return (
    <box
      paddingTop={1}
      paddingBottom={1}
      width='100%'
      flexDirection='row'
      {...(props.bg ? { backgroundColor: props.bg } : {})}>
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
