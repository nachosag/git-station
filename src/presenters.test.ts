import { describe, expect, test } from 'bun:test'

import type { RepoStatus } from './status.ts'

import {
  type RowView,
  filterRows,
  toDetailView,
  toRowViews,
} from './presenters.ts'

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
      isClean: false,
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
      isClean: false,
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

  test('shows a rename as old -> new', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: null,
      ahead: null,
      behind: null,
      dirty: true,
      files: [{ path: 'nuevo.txt', status: 'staged', oldPath: 'viejo.txt' }],
    }
    const readable = new Map<string, RepoStatus>().set('/home/me/demo', status)

    expect(
      toDetailView('/home/me/demo', readable, new Map<string, string>()).staged,
    ).toStrictEqual(['\t M viejo.txt -> nuevo.txt'])
  })

  test('a clean repository reports no pending files', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: 'origin/main',
      dirty: false,
      files: [],
      ahead: 0,
      behind: 0,
    }
    const readable = new Map<string, RepoStatus>().set('/home/me/demo', status)
    expect(
      toDetailView('/home/me/demo', readable, new Map<string, string>()),
    ).toStrictEqual({
      info: [
        'branch: main',
        'upstream: origin/main',
        'ahead: ↑ 0',
        'behind: ↓ 0',
      ],
      isClean: true,
      path: '/home/me/demo',
      staged: [],
      unstaged: [],
      untracked: [],
    })
  })
})

describe('filterRows', () => {
  test('ignores case and matches any part of the name', () => {
    const rows: RowView[] = [
      {
        ahead: '',
        behind: '',
        branch: '',
        dirty: '',
        name: 'college',
        path: '',
      },
      {
        ahead: '',
        behind: '',
        branch: '',
        dirty: '',
        name: 'something-else',
        path: '',
      },
    ]

    expect(filterRows('COLL', rows)).toStrictEqual(rows.slice(0, 1))
  })
  test('returns every row then the query is empty', () => {
    const rows: RowView[] = [
      {
        ahead: '',
        behind: '',
        branch: '',
        dirty: '',
        name: 'college',
        path: '',
      },
      {
        ahead: '',
        behind: '',
        branch: '',
        dirty: '',
        name: 'something-else',
        path: '',
      },
    ]

    expect(filterRows('', rows)).toStrictEqual(rows)
  })
})
