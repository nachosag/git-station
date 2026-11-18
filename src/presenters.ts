import path from 'path'

import type { File, RepoStatus } from './status.ts'

export type RowView = {
  id: string
  repoPath: string
  repoName: string
  branch: string
  display: string
}

export type DetailView = {
  isClean: boolean
  repoPath: string
  info: string[]
  staged: FileCell[]
  unstaged: FileCell[]
  untracked: FileCell[]
}

export type FileCell = {
  marker: string
  name: string
}

const DASH = '—'

export function toRowViews(
  repos: string[],
  readable: Map<string, RepoStatus>,
  unreadable: Map<string, string>,
): RowView[] {
  return repos.map((repoPath, i) => {
    const status = readable.get(repoPath)
    const repoName = path.basename(repoPath)
    const id = String(i + 1).padStart(2, '0')

    if (!status) {
      return {
        id,
        repoPath,
        repoName,
        branch: `⚠ ${unreadable.get(repoPath) ?? 'unreadable'}`,
        display: '',
      }
    }

    const dirtySeg = status.dirty ? '✱' : '—'
    const aheadSeg = status.ahead ? `↑ ${status.ahead}` : '—'
    const behindSeg = status.behind ? `↓ ${status.behind}` : '—'
    const isIdle = !status.dirty && !status.ahead && !status.behind

    return {
      id,
      repoPath,
      repoName,
      branch: status.branch,
      display: isIdle ? '' : `${dirtySeg} / ${aheadSeg} / ${behindSeg}`,
    }
  })
}

export function toDetailView(
  repoPath: string,
  readable: Map<string, RepoStatus>,
  unreadable: Map<string, string>,
): DetailView {
  const status = readable.get(repoPath)

  if (!status) {
    return {
      isClean: false,
      repoPath: repoPath,
      info: [`⚠ ${unreadable.get(repoPath) ?? 'unreadable'}`],
      staged: [],
      unstaged: [],
      untracked: [],
    }
  }

  return {
    isClean: status.files.length === 0,
    repoPath,
    info: [
      `${status.branch} -> ${status.upstream ?? DASH}`,
      repoPath,
      `${status.ahead ? `↑ ${status.ahead}` : '—'} / ${status.behind ? `↓ ${status.behind}` : '—'}`,
    ],
    staged: fileLines(status, 'staged'),
    unstaged: fileLines(status, 'unstaged'),
    untracked: fileLines(status, 'untracked'),
  }
}

function fileLines(status: RepoStatus, group: File['status']): FileCell[] {
  const marker = group === 'untracked' ? '?' : 'M'

  return status.files
    .filter((file) => file.status === group)
    .map((file) => {
      const name = file.oldPath ? `${file.oldPath} -> ${file.path}` : file.path
      return { marker, name }
    })
}

export function filterRows(query: string, rows: RowView[]): RowView[] {
  return query
    ? rows.filter((row) =>
        row.repoName.toLowerCase().includes(query.toLowerCase()),
      )
    : rows
}
