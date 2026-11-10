import { describe, expect, test } from 'bun:test'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { findRepos } from './repo'

describe('findRepos', () => {
  test('reports the scanned directory itself when it contains .git', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(dir, '.git'))
    const repos = await findRepos(dir)
    expect(repos).toStrictEqual([dir])
    await fs.rm(dir, { recursive: true, force: true })
  })

  test('reports a repo nested two levels deep', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(root, 'a/b/repo/.git'), { recursive: true })
    const repos = await findRepos(root)

    expect(repos).toStrictEqual([path.join(root, 'a', 'b', 'repo')])

    await fs.rm(root, { recursive: true, force: true })
  })

  test('reports an umbrella repo and the repos nested inside it', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.mkdir(path.join(root, '.git'), { recursive: true })
    await fs.mkdir(path.join(root, 'inner/.git'), { recursive: true })
    await fs.mkdir(path.join(root, 'deep/innermost/.git'), { recursive: true })
    const repos = await findRepos(root)

    expect(repos.toSorted()).toStrictEqual(
      [
        root,
        path.join(root, 'inner'),
        path.join(root, 'deep', 'innermost'),
      ].toSorted(),
    )

    await fs.rm(root, { recursive: true, force: true })
  })

  test('reports a worktree (.git as a file) as a repo', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'gs-'))
    await fs.writeFile(
      path.join(dir, '.git'),
      'gitdir: /somewhere/repo/.git/worktrees/gs-1',
    )
    const repos = await findRepos(dir)
    expect(repos).toStrictEqual([dir])
    await fs.rm(dir, { recursive: true, force: true })
  })
})
