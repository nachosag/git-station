import type { ReactNode } from 'react'

import type { DetailView } from '../presenters.ts'

export function Detail(props: { view: DetailView }): ReactNode {
  return (
    <box
      width='100%'
      flexGrow={1}
      alignItems='center'>
      <text
        textAlign='center'
        bg='gray'
        width='80%'>
        {props.view.path}
      </text>
      <box
        flexGrow={1}
        width='80%'
        flexDirection='row'
        gap={4}>
        <Info lines={props.view.info} />
        <Groups view={props.view} />
      </box>
      <text>Esc: back</text>
      <text>q: quit</text>
    </box>
  )
}

function Info(props: { lines: string[] }): ReactNode {
  return (
    <box
      width={26}
      flexDirection='column'>
      {props.lines.map((line) => (
        <text key={line}>{line}</text>
      ))}
    </box>
  )
}

function Groups(props: { view: DetailView }): ReactNode {
  return (
    <scrollbox
      focused={true}
      minHeight={0}
      flexGrow={1}>
      {props.view.isClean ? (
        <text>Repo is up to date</text>
      ) : (
        <>
          <box>
            <text>staged ({props.view.staged.length})</text>
            {props.view.staged.map((file) => (
              <text key={file}>{file}</text>
            ))}
          </box>
          <box>
            <text>unstaged ({props.view.unstaged.length})</text>
            {props.view.unstaged.map((file) => (
              <text key={file}>{file}</text>
            ))}
          </box>
          <box>
            <text>untracked ({props.view.untracked.length})</text>
            {props.view.untracked.map((file) => (
              <text key={file}>{file}</text>
            ))}
          </box>
        </>
      )}
    </scrollbox>
  )
}
