import type { ReactNode } from 'react'

export function SearchField(props: {
  query: string
  isSearching: boolean
  onInput: (value: string) => void
}): ReactNode {
  return (
    <input
      value={props.query}
      onInput={props.onInput}
      focused={props.isSearching}></input>
  )
}
