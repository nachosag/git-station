import fs from 'fs/promises'
import path from 'path'

const pruneList = new Set([
  'node_modules',
  '.git',
  '.cache',
  '.npm',
  '.bun',
  '.venv',
  'venv',
  '.cargo',
  '.rustup',
  '.m2',
  '.gradle',
  '.local',
  'target',
  'dist',
  'build',
  'Library',
  'AppData',
])

async function hasRepo(dir: string): Promise<boolean> {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).some(
      (e) => e.name === '.git',
    )
  } catch {
    return false
  }
}

export async function findRepos(dir: string): Promise<string[]> {
  const repos: Promise<string[]>[] = []

  if (await hasRepo(dir)) repos.push(Promise.resolve([dir]))
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (pruneList.has(entry.name) || !entry.isDirectory()) continue

      const subDir = path.join(dir, entry.name)
      repos.push(findRepos(subDir))
    }
  } catch {
    return []
  }

  return (await Promise.all(repos)).flat()
}
