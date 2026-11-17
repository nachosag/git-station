import type { ReactNode } from 'react'

import type { DetailView } from '../presenters.ts'

import { Cols } from '../components/Cols.tsx'
import { HintBar } from '../components/HintBar.tsx'
import { theme } from '../theme.ts'

export function Detail(props: { view: DetailView }): ReactNode {
  return (
    <box
      width='100%'
      flexGrow={1}
      alignItems='center'>
      <text
        textAlign='center'
        bg={theme.selection}
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
      <HintBar
        hints={[
          { key: 'esc', action: 'Back' },
          { key: 'q', action: 'Quit' },
        ]}
      />
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
  const FILE_WIDTHS = { marker: 4, name: 'auto' } as const
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
              <Cols
                key={file.name}
                cells={[
                  {
                    key: 'marker',
                    text: file.marker,
                    width: FILE_WIDTHS['marker'],
                  },
                  { key: 'name', text: file.name, width: FILE_WIDTHS['name'] },
                ]}
              />
            ))}
          </box>
          <box>
            <text>unstaged ({props.view.unstaged.length})</text>
            {props.view.unstaged.map((file) => (
              <Cols
                key={file.name}
                cells={[
                  {
                    key: 'marker',
                    text: file.marker,
                    width: FILE_WIDTHS['marker'],
                  },
                  { key: 'name', text: file.name, width: FILE_WIDTHS['name'] },
                ]}
              />
            ))}
          </box>
          <box>
            <text>untracked ({props.view.untracked.length})</text>
            {props.view.untracked.map((file) => (
              <Cols
                key={file.name}
                cells={[
                  {
                    key: 'marker',
                    text: file.marker,
                    width: FILE_WIDTHS['marker'],
                  },
                  { key: 'name', text: file.name, width: FILE_WIDTHS['name'] },
                ]}
              />
            ))}
          </box>
        </>
      )}
    </scrollbox>
  )
}
