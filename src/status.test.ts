import { describe, expect, test } from 'bun:test'
import fs from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { parseStatus, readStatus, scan } from './status.ts'

describe('parseStatus', () => {
  test('reports the branch and ahead/behind from the status header', () => {
    const input = [
      '# branch.oid 32dc0d0',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +1 -0',
      '1 .M N... 100644 100644 100644 d655836 d655836 docs/v1/BACKLOG.md',
    ].join('\n')

    expect(parseStatus(input)).toStrictEqual({
      branch: 'main',
      upstream: 'origin/main',
      ahead: 1,
      behind: 0,
      dirty: true,
      files: [{ path: 'docs/v1/BACKLOG.md', status: 'unstaged' }],
    })
  })

  test('reports detached and no upstream with no ahead/behind', () => {
    const detached = ['# branch.oid d18a6f0d', '# branch.head (detached)'].join(
      '\n',
    )
    const noUpstream = ['# branch.oid d18a6f0d', '# branch.head main'].join(
      '\n',
    )

    expect(parseStatus(detached)).toStrictEqual({
      branch: 'detached',
      upstream: null,
      ahead: null,
      behind: null,
      dirty: false,
      files: [],
    })
    expect(parseStatus(noUpstream)).toStrictEqual({
      branch: 'main',
      upstream: null,
      ahead: null,
      behind: null,
      dirty: false,
      files: [],
    })
  })

  test('counts one file per group: staged, unstaged and untracked', () => {
    const input = [
      '# branch.oid 32dc0d0',
      '# branch.head main',
      '1 M. N... 100644 100644 100644 d655836 d655836 src/staged.ts',
      '1 .M N... 100644 100644 100644 d655836 d655836 src/unstaged.ts',
      '? src/new.ts',
    ].join('\n')

    expect(parseStatus(input).files).toStrictEqual([
      { path: 'src/staged.ts', status: 'staged' },
      { path: 'src/unstaged.ts', status: 'unstaged' },
      { path: 'src/new.ts', status: 'untracked' },
    ])
  })

  test('counts a file staged and modified in both groups', () => {
    const input = [
      '# branch.oid 32dc0d0',
      '# branch.head main',
      '1 MM N... 100644 100644 100644 d655836 d655836 src/both.ts',
    ].join('\n')

    expect(parseStatus(input).files).toStrictEqual([
      { path: 'src/both.ts', status: 'staged' },
      { path: 'src/both.ts', status: 'unstaged' },
    ])
  })
})

describe('readStatus', () => {
  test('throws the git error message when git fails', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    try {
      await expect(readStatus(dir)).rejects.toThrow(/repositorio|repository/iu)
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
})

describe('scan', () => {
  test('an unreadable directory does not break the listing', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    try {
      const good = path.join(root, 'good')
      const broken = path.join(root, 'broken')
      await fs.mkdir(good, { recursive: true })
      await fs.mkdir(path.join(broken, '.git'), { recursive: true })
      await Bun.spawn(['git', 'init', good], {
        stdout: 'ignore',
        stderr: 'ignore',
      }).exited

      const result = await scan({ roots: [root], ignores: new Set() })

      expect(result.repos.toSorted()).toStrictEqual([good, broken].toSorted())
      expect(result.statuses.get(good)).toBeDefined()
      expect(result.errors.get(broken) ?? '').toMatch(
        /repositorio|repository/iu,
      )
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
