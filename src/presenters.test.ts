import { describe, expect, test } from 'bun:test'

import type { RepoStatus } from './status.ts'

import { toDetailView, toRowViews } from './presenters.ts'

const ERROR =
  'fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git'

describe('presenters', () => {
  test('marks a broken repository with the git error', () => {
    const repos = ['/tmp']
    const readable = new Map<string, RepoStatus>()
    const unreadable = new Map<string, string>().set('/tmp', ERROR)

    expect(toRowViews(repos, readable, unreadable)).toStrictEqual([
      {
        path: '/tmp',
        name: 'tmp',
        dirty: '',
        branch: `⚠ ${ERROR}`,
        ahead: '  —',
        behind: '   —',
      },
    ])

    expect(toDetailView('/tmp', readable, unreadable)).toStrictEqual({
      path: '/tmp',
      info: [`⚠ ${ERROR}`],
      staged: [],
      unstaged: [],
      untracked: [],
    })
  })

  test('flattens a readable repository into info and three groups', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: 'origin/main',
      ahead: 2,
      behind: null,
      dirty: true,
      files: [
        { path: 'src/a.ts', status: 'staged' },
        { path: 'src/b.ts', status: 'unstaged' },
        { path: 'notes.md', status: 'untracked' },
      ],
    }
    const repos = ['/home/me/git-station']
    const readable = new Map<string, RepoStatus>().set(
      '/home/me/git-station',
      status,
    )

    expect(
      toRowViews(repos, readable, new Map<string, string>()),
    ).toStrictEqual([
      {
        path: '/home/me/git-station',
        name: 'git-station',
        dirty: ' (*)',
        branch: 'main',
        ahead: '↑ 2',
        behind: '   —',
      },
    ])

    expect(
      toDetailView('/home/me/git-station', readable, new Map<string, string>()),
    ).toStrictEqual({
      path: '/home/me/git-station',
      info: [
        'branch: main',
        'upstream: origin/main',
        'ahead: ↑ 2',
        'behind: ↓ —',
      ],
      staged: ['\t M src/a.ts'],
      unstaged: ['\t M src/b.ts'],
      untracked: ['\t ? notes.md'],
    })
  })
})
