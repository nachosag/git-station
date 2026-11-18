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

describe('toRowViews', () => {
  test('broken repository: shows the git error in branch and empty display', () => {
    const repos = ['/tmp']
    const readable = new Map<string, RepoStatus>()
    const unreadable = new Map<string, string>().set('/tmp', ERROR)

    expect(toRowViews(repos, readable, unreadable)).toStrictEqual([
      {
        id: '01',
        repoPath: '/tmp',
        repoName: 'tmp',
        branch: `⚠ ${ERROR}`,
        display: '',
      },
    ])
  })
  test('readable repository: merges dirty, ahead and behind into one display string', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: 'origin/main',
      dirty: true,
      files: [],
      ahead: 2,
      behind: null,
    }
    const repos = ['/home/me/git-station']
    const readable = new Map<string, RepoStatus>().set(
      '/home/me/git-station',
      status,
    )
    const unreadable = new Map<string, string>()

    expect(toRowViews(repos, readable, unreadable)).toStrictEqual([
      {
        id: '01',
        repoPath: '/home/me/git-station',
        repoName: 'git-station',
        branch: 'main',
        display: '✱ / ↑ 2 / —',
      },
    ])
  })
  test('idle repository: leaves the display cell empty', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: 'origin/main',
      dirty: false,
      files: [],
      ahead: 0,
      behind: null,
    }
    const repos = ['/home/me/idle']
    const readable = new Map<string, RepoStatus>().set('/home/me/idle', status)
    const unreadable = new Map<string, string>()

    expect(toRowViews(repos, readable, unreadable)).toStrictEqual([
      {
        id: '01',
        repoPath: '/home/me/idle',
        repoName: 'idle',
        branch: 'main',
        display: '',
      },
    ])
  })
})

describe('toDetailView', () => {
  test('broken repository: error message and no files', () => {
    const readable = new Map<string, RepoStatus>()
    const unreadable = new Map<string, string>().set('/tmp', ERROR)

    expect(toDetailView('/tmp', readable, unreadable)).toStrictEqual({
      isClean: false,
      repoPath: '/tmp',
      info: [`⚠ ${ERROR}`],
      staged: [],
      unstaged: [],
      untracked: [],
    })
  })
  test('readable repository: header has three values and three file groups', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: 'origin/main',
      dirty: true,
      files: [
        { path: 'src/a.ts', status: 'staged' },
        { path: 'src/b.ts', status: 'unstaged' },
        { path: 'notes.md', status: 'untracked' },
      ],
      ahead: 2,
      behind: null,
    }
    const readable = new Map<string, RepoStatus>().set(
      '/home/me/git-station',
      status,
    )
    const unreadable = new Map<string, string>()

    expect(
      toDetailView('/home/me/git-station', readable, unreadable),
    ).toStrictEqual({
      isClean: false,
      repoPath: '/home/me/git-station',
      info: ['main -> origin/main', '/home/me/git-station', '↑ 2 / —'],
      staged: [{ marker: 'M', name: 'src/a.ts' }],
      unstaged: [{ marker: 'M', name: 'src/b.ts' }],
      untracked: [{ marker: '?', name: 'notes.md' }],
    })
  })
  test('rename: displays old -> new', () => {
    const status: RepoStatus = {
      branch: 'main',
      upstream: null,
      dirty: true,
      files: [{ path: 'nuevo.txt', status: 'staged', oldPath: 'viejo.txt' }],
      ahead: null,
      behind: null,
    }
    const readable = new Map<string, RepoStatus>().set('/home/me/demo', status)

    expect(
      toDetailView('/home/me/demo', readable, new Map<string, string>()).staged,
    ).toStrictEqual([{ marker: 'M', name: 'viejo.txt -> nuevo.txt' }])
  })
  test('clean repository: no pending files', () => {
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
      isClean: true,
      repoPath: '/home/me/demo',
      info: ['main -> origin/main', '/home/me/demo', '— / —'],
      staged: [],
      unstaged: [],
      untracked: [],
    })
  })
})

describe('filterRows', () => {
  test('ignores case and matches any part of the name', () => {
    const rows: RowView[] = [
      { id: '01', repoPath: '', repoName: 'college', branch: '', display: '' },
      {
        id: '01',
        repoPath: '',
        repoName: 'something-else',
        branch: '',
        display: '',
      },
    ]

    expect(filterRows('COLL', rows)).toStrictEqual(rows.slice(0, 1))
  })

  test('returns every row when the query is empty', () => {
    const rows: RowView[] = [
      { id: '01', repoPath: '', repoName: 'college', branch: '', display: '' },
      {
        id: '01',
        repoPath: '',
        repoName: 'something-else',
        branch: '',
        display: '',
      },
    ]

    expect(filterRows('', rows)).toStrictEqual(rows)
  })
})
