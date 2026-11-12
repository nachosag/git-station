import { describe, expect, test } from 'bun:test'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { findRepos } from './repo'

describe('findRepos', () => {
  test('reports the scanned directory itself when it contains .git', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dir, '.git'))
    const repos = await findRepos({ roots: [dir], ignores: new Set() })
    expect(repos).toStrictEqual([dir])
    await fs.rm(dir, { recursive: true, force: true })
  })

  test('reports a repo nested two levels deep', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dir, 'a/b/repo/.git'), { recursive: true })
    const repos = await findRepos({ roots: [dir], ignores: new Set() })

    expect(repos).toStrictEqual([path.join(dir, 'a', 'b', 'repo')])

    await fs.rm(dir, { recursive: true, force: true })
  })

  test('reports an umbrella repo and the repos nested inside it', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dir, '.git'), { recursive: true })
    await fs.mkdir(path.join(dir, 'inner/.git'), { recursive: true })
    await fs.mkdir(path.join(dir, 'deep/innermost/.git'), { recursive: true })
    const repos = await findRepos({ roots: [dir], ignores: new Set() })

    expect(repos.toSorted()).toStrictEqual(
      [
        dir,
        path.join(dir, 'inner'),
        path.join(dir, 'deep', 'innermost'),
      ].toSorted(),
    )

    await fs.rm(dir, { recursive: true, force: true })
  })

  test('reports a worktree (.git as a file) as a repo', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.writeFile(
      path.join(dir, '.git'),
      'gitdir: /somewhere/repo/.git/worktrees/gs-1',
    )
    const repos = await findRepos({ roots: [dir], ignores: new Set() })
    expect(repos).toStrictEqual([dir])
    await fs.rm(dir, { recursive: true, force: true })
  })

  test('walks every root in the options', async () => {
    const dirA = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    const dirB = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dirA, 'repo/.git'), { recursive: true })
    await fs.mkdir(path.join(dirB, 'repo/.git'), { recursive: true })
    const repos = await findRepos({
      roots: [dirA, dirB],
      ignores: new Set(),
    })

    expect(repos.toSorted()).toStrictEqual(
      [path.join(dirA, 'repo'), path.join(dirB, 'repo')].toSorted(),
    )

    await fs.rm(dirA, { recursive: true, force: true })
    await fs.rm(dirB, { recursive: true, force: true })
  })

  test('skips ignored names', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dir, 'skipme/repo/.git'), { recursive: true })
    const repos = await findRepos({
      roots: [dir],
      ignores: new Set(['skipme']),
    })

    expect(repos).toStrictEqual([])

    await fs.rm(dir, { recursive: true, force: true })
  })

  test('still returns repos from readable directories when one subdirectory cannot be read', async () => {
    const dirA = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    const dirB = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    const dirC = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    const dirD = await fs.mkdtemp(path.join(dirC, 'gs-'))

    await fs.mkdir(path.join(dirA, 'repo/.git'), { recursive: true })
    await fs.mkdir(path.join(dirB, 'repo/.git'), { recursive: true })
    await fs.mkdir(path.join(dirD, 'repo/.git'), { recursive: true })

    await fs.chmod(dirC, 0o000)

    const repos = await findRepos({
      roots: [dirA, dirB, dirC],
      ignores: new Set('skipme'),
    })

    expect(repos.toSorted()).toStrictEqual(
      [dirA + '/repo', dirB + '/repo'].toSorted(),
    )

    await fs.chmod(dirC, 0o755)

    await fs.rm(dirA, { recursive: true, force: true })
    await fs.rm(dirB, { recursive: true, force: true })
    await fs.rm(dirC, { recursive: true, force: true })
  })
})
