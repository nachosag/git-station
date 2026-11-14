type Count = number | null

export type RepoStatus = {
  branch: string
  upstream: string | null
  ahead: Count
  behind: Count
  dirty: boolean
}

export async function readStatus(repoPath: string): Promise<RepoStatus> {
  const proc = Bun.spawn([
    'git',
    '-C',
    repoPath,
    'status',
    '--porcelain=v2',
    '--branch',
  ])
  const status = await new Response(proc.stdout).text()

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
  }
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

export function readStatuses(paths: string[]): Promise<RepoStatus[]> {
  return Promise.all(paths.map((p) => readStatus(p)))
}
