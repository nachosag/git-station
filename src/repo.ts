import fs from 'fs/promises'
import path from 'path'

import { type ScanOptions } from './config'

async function hasRepo(dir: string): Promise<boolean> {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).some(
      (e) => e.name === '.git',
    )
  } catch {
    return false
  }
}

export async function walk(
  dir: string,
  ignores: Set<string>,
  onFound?: (directory: string) => void,
): Promise<string[]> {
  const repos: Promise<string[]>[] = []

  if (await hasRepo(dir)) {
    repos.push(Promise.resolve([dir]))
    onFound?.(dir)
  }
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (ignores.has(entry.name) || !entry.isDirectory()) continue

      const subDir = path.join(dir, entry.name)
      repos.push(walk(subDir, ignores, onFound))
    }
  } catch {
    return []
  }

  return (await Promise.all(repos)).flat()
}

export async function findRepos(
  options: ScanOptions,
  onFound?: (directory: string) => void,
): Promise<string[]> {
  const { roots, ignores } = options
  const repos: Promise<string[]>[] = []

  for (const dir of roots) repos.push(walk(dir, ignores, onFound))

  return (await Promise.all(repos)).flat()
}
