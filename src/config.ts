import fs from 'fs/promises'
import os from 'os'

export const pruneList = new Set([
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

export type ScanOptions = {
  roots: string[]
  ignores: Set<string>
}

export async function loadConfig(configPath: string): Promise<ScanOptions> {
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    const json = JSON.parse(content)
    const roots = json.roots ? [os.homedir(), ...json.roots] : [os.homedir()]
    const ignores = json.ignores
      ? new Set([...pruneList, ...json.ignores])
      : new Set(pruneList)

    return {
      roots,
      ignores,
    }
  } catch {
    return {
      roots: [os.homedir()],
      ignores: new Set(pruneList),
    }
  }
}
