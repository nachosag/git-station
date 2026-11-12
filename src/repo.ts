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
  found: string[],
  ignores: Set<string>,
  onFound?: (directory: string) => void,
): Promise<void> {
  const repos: Promise<void>[] = []

  if (await hasRepo(dir)) {
    found.push(dir)
    onFound?.(dir)
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (ignores.has(entry.name) || !entry.isDirectory()) continue

      const subDir = path.join(dir, entry.name)
      repos.push(walk(subDir, found, ignores, onFound))
    }
  } catch {}

  await Promise.all(repos)
}

export async function findRepos(
  options: ScanOptions,
  onFound?: (directory: string) => void,
): Promise<string[]> {
  const found: string[] = []
  const { roots, ignores } = options
  const repos: Promise<void>[] = []

  for (const dir of roots) repos.push(walk(dir, found, ignores, onFound))

  await Promise.all(repos)
  return found
}
