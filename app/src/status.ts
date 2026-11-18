import type { ScanOptions } from './config.ts'

import { findRepos } from './repo.ts'

type Count = number | null

export type File = {
  path: string
  status: 'staged' | 'unstaged' | 'untracked'
  oldPath?: string
}

export type RepoStatus = {
  branch: string
  upstream: string | null
  ahead: Count
  behind: Count
  dirty: boolean
  files: File[]
}

export type ScanResult = {
  repos: string[]
  readable: Map<string, RepoStatus>
  unreadable: Map<string, string>
}

export async function scan(
  options: ScanOptions,
  onFound?: (directory: string) => void,
): Promise<ScanResult> {
  const pending: Promise<PromiseSettledResult<RepoStatus>>[] = []

  const repos = await findRepos(options, (directory) => {
    pending.push(settle(readStatus(directory)))
    onFound?.(directory)
  })

  const settled = await Promise.all(pending)

  const readable = new Map<string, RepoStatus>()
  const unreadable = new Map<string, string>()

  for (const [index, result] of settled.entries()) {
    const repo = repos[index]!

    if (result.status === 'fulfilled') {
      readable.set(repo, result.value)
    } else {
      const reason = result.reason
      unreadable.set(
        repo,
        reason instanceof Error ? reason.message : String(reason),
      )
    }
  }

  return { repos, readable, unreadable }
}

// Attach the rejection handler while the walk runs: a git status that fails
// early would otherwise sit as an unhandled rejection until Promise.all settles.
function settle(
  promise: Promise<RepoStatus>,
): Promise<PromiseSettledResult<RepoStatus>> {
  return promise.then(
    (value) => ({ status: 'fulfilled', value }),
    (reason: unknown) => ({ status: 'rejected', reason }),
  )
}

export async function readStatus(repoPath: string): Promise<RepoStatus> {
  const process = Bun.spawn(
    ['git', '-C', repoPath, 'status', '--porcelain=v2', '--branch'],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const [status, stderr] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])
  await process.exited

  if (process.exitCode !== 0) {
    throw new Error(
      stderr.trim() || `git status exited with code ${process.exitCode}`,
    )
  }

  return parseStatus(status)
}

export function parseStatus(status: string): RepoStatus {
  const input = status.split('\n')
  const [ahead, behind] = parseAheadAndBehind(input)

  return {
    branch: parseBranch(input),
    upstream: parseUpstream(input),
    ahead,
    behind,
    dirty: parseDirtyStatus(input),
    files: parseFiles(input),
  }
}

function parseFiles(input: string[]): File[] {
  const entries = input.filter(
    (line) => line.trim() !== '' && !line.startsWith('#'),
  )
  const files: File[] = []
  const SKIP: Record<string, number> = {
    '1': 8,
    '2': 9,
    u: 10,
  }

  for (const entry of entries) {
    if (entry.startsWith('? ')) {
      files.push({ path: entry.slice(2), status: 'untracked' })
      continue
    }

    const fields = entry.split(' ')
    const [x, y] = fields[1] ?? ''
    const skip = SKIP[fields[0] ?? ''] ?? 8
    const paths = fields.slice(skip).join(' ').split('\t')
    const path = paths[0] ?? ''
    const oldPath = paths[1] ? { oldPath: paths[1] } : {}

    if (x !== '.') files.push({ path, status: 'staged', ...oldPath })
    if (y !== '.') files.push({ path, status: 'unstaged', ...oldPath })
  }

  return files
}

function parseUpstream(input: string[]): string | null {
  const prefix = '# branch.upstream '
  const upstream = input.find((value) => value.startsWith(prefix))

  if (!upstream) return null

  return upstream.slice(prefix.length)
}

function parseDirtyStatus(input: string[]): boolean {
  const entries = input.filter(
    (line) => line.trim() !== '' && !line.startsWith('#'),
  )

  return entries.length > 0
}

function parseBranch(lines: string[]): string {
  const prefix = '# branch.head '
  const branch = lines
    .find((sentence) => sentence.startsWith(prefix))
    ?.slice(prefix.length)

  if (!branch) return 'unknown'

  return branch === '(detached)' ? 'detached' : branch
}

function parseAheadAndBehind(lines: string[]): [Count, Count] {
  const prefix = '# branch.ab '
  const numbers = lines
    .find((sentence) => sentence.startsWith(prefix))
    ?.slice(prefix.length)
    .split(' ')

  if (!numbers) return [null, null]

  return [convert(numbers[0]), convert(numbers[1])]
}

function convert(value: string | undefined): Count {
  return value ? Number(value.slice(1)) : null
}
