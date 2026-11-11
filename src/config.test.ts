import { describe, expect, test } from 'bun:test'
import fs from 'fs/promises'
import os from 'node:os'
import path from 'node:path'

import { loadConfig, pruneList } from './config'

describe('loadConfig', () => {
  test('returns defaults when the config file is missing', async () => {
    const missing = path.join(os.tmpdir(), `gs-${crypto.randomUUID()}.json`)

    const { roots, ignores } = await loadConfig(missing)

    expect(roots).toStrictEqual([os.homedir()])
    expect([...ignores].toSorted()).toStrictEqual([...pruneList].toSorted())
  })

  test('adds the file roots and ignores to the defaults', async () => {
    const declaredRoot = path.join(os.tmpdir(), `gs-${crypto.randomUUID()}`)
    const subdir = path.join(declaredRoot, 'test')
    const { tmpDir, file } = await createConfig(
      JSON.stringify({ roots: [declaredRoot], ignores: [subdir] }),
    )

    const { roots, ignores } = await loadConfig(file)

    expect(roots).toStrictEqual([os.homedir(), declaredRoot])
    expect([...ignores].toSorted()).toStrictEqual(
      [...pruneList, subdir].toSorted(),
    )

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  test('falls back to defaults when the JSON is invalid', async () => {
    const { tmpDir, file } = await createConfig('{')

    const { roots, ignores } = await loadConfig(file)

    expect(roots).toStrictEqual([os.homedir()])
    expect([...ignores].toSorted()).toStrictEqual([...pruneList].toSorted())

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  test('treats a partial config as defaults plus what it declares', async () => {
    const declaredRoot = path.join(os.tmpdir(), `gs-${crypto.randomUUID()}`)
    const { tmpDir, file } = await createConfig(
      JSON.stringify({ roots: [declaredRoot] }),
    )

    const { roots, ignores } = await loadConfig(file)

    expect(roots).toStrictEqual([os.homedir(), declaredRoot])
    expect([...ignores].toSorted()).toStrictEqual([...pruneList].toSorted())

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})

type ConfigFile = {
  tmpDir: string
  file: string
}

async function createConfig(content: string): Promise<ConfigFile> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gs-'))
  const file = path.join(tmpDir, 'config.json')
  await fs.writeFile(file, content)

  return {
    tmpDir,
    file,
  }
}
