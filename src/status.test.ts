import { describe, expect, test } from 'bun:test'

import { parseStatus } from './status.ts'

describe('parseStatus', () => {
  test('reports the branch and ahead/behind from the status header', () => {
    const input = [
      '# branch.oid 32dc0d0',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +1 -0',
      '1 .M N... 100644 100644 100644 d655836 d655836 docs/v1/BACKLOG.md',
    ].join('\n')
    const { branch, ahead, behind } = parseStatus(input)

    expect(branch).toStrictEqual('main')
    expect(ahead).toStrictEqual(1)
    expect(behind).toStrictEqual(0)
  })

  test('reports detached and no upstream with no ahead/behind', () => {
    const detached = ['# branch.oid d18a6f0d', '# branch.head (detached)'].join(
      '\n',
    )
    const noUpstream = ['# branch.oid d18a6f0d', '# branch.head main'].join(
      '\n',
    )

    expect(parseStatus(detached)).toStrictEqual({
      branch: 'detached',
      ahead: null,
      behind: null,
    })
    expect(parseStatus(noUpstream)).toStrictEqual({
      branch: 'main',
      ahead: null,
      behind: null,
    })
  })
})
