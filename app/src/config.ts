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

    if (typeof json !== 'object' || json === null) {
      throw new Error('invalid config')
    }

    const roots =
      'roots' in json && Array.isArray(json.roots)
        ? [
            os.homedir(),
            ...json.roots.filter((item) => typeof item === 'string'),
          ]
        : [os.homedir()]

    const ignores =
      'ignores' in json && Array.isArray(json.ignores)
        ? new Set([
            ...pruneList,
            ...json.ignores.filter((item) => typeof item === 'string'),
          ])
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
