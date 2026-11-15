import type { File, RepoStatus } from './status.ts'

export type RowView = {
  name: string
  dirty: string
  branch: string
  ahead: string
  behind: string
}

export type DetailView = {
  info: string[]
  staged: string[]
  unstaged: string[]
  untracked: string[]
}

const DASH = '—'
const AHEAD_PAD = ' '.repeat(Math.floor('ahead'.length / 2))
const BEHIND_PAD = ' '.repeat(Math.floor('behind'.length / 2))

export function toRowViews(
  repos: string[],
  statuses: Map<string, RepoStatus>,
  errors: Map<string, string>,
): RowView[] {
  return repos.map((repo) => {
    const status = statuses.get(repo)
    const name = repo.split('/').at(-1) ?? repo

    if (!status) {
      return {
        name,
        dirty: '',
        branch: `⚠ ${errors.get(repo) ?? 'unreadable'}`,
        ahead: `${AHEAD_PAD}${DASH}`,
        behind: `${BEHIND_PAD}${DASH}`,
      }
    }

    return {
      name,
      dirty: status.dirty ? ' (*)' : '',
      branch: status.branch,
      ahead: status.ahead ? `↑ ${status.ahead}` : `${AHEAD_PAD}${DASH}`,
      behind: status.behind ? `↓ ${status.behind}` : `${BEHIND_PAD}${DASH}`,
    }
  })
}

export function toDetailView(
  repo: string,
  statuses: Map<string, RepoStatus>,
  errors: Map<string, string>,
): DetailView {
  const status = statuses.get(repo)

  if (!status) {
    return {
      info: [`⚠ ${errors.get(repo) ?? 'unreadable'}`],
      staged: [],
      unstaged: [],
      untracked: [],
    }
  }

  return {
    info: [
      `branch: ${status.branch}`,
      `upstream: ${status.upstream ?? DASH}`,
      `ahead: ↑ ${status.ahead ?? DASH}`,
      `behind: ↓ ${status.behind ?? DASH}`,
    ],
    staged: fileLines(status, 'staged'),
    unstaged: fileLines(status, 'unstaged'),
    untracked: fileLines(status, 'untracked'),
  }
}

function fileLines(status: RepoStatus, group: File['status']): string[] {
  const marker = group === 'untracked' ? '?' : 'M'

  return status.files
    .filter((file) => file.status === group)
    .map((file) => `\t ${marker} ${file.path}`)
}
