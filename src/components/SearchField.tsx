import type { ReactNode } from 'react'

import { theme } from '../theme.ts'

export function SearchField(props: {
  query: string
  isSearching: boolean
  onInput: (value: string) => void
}): ReactNode {
  return (
    <input
      value={props.query}
      onInput={props.onInput}
      focused={props.isSearching}
      placeholderColor={theme.muted}
      textColor={theme.attention}></input>
  )
}
