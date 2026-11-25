import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import { ZIM_UPLOAD_MULTIPART_LIMIT } from '../../constants/zim_upload.js'

/**
 * Mirror of the Adonis/bodyparser `bytes` parser for the subset of suffixes we
 * use in upload limits. Kept local so this regression test does not depend on
 * a transitive package remaining hoisted into node_modules.
 */
function parseByteLimit(value: string): number {
  const match = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)$/)
  assert.ok(match, `unparseable size string: ${value}`)
  const amount = Number(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  }
  return amount * multipliers[unit]
}

// The Content Manager ZimUploader advertises "up to 20 GB". The controller must
// override Adonis's global 110mb multipart ceiling with a limit at least that
// large, or every real ZIM sideload fails with E_REQUEST_ENTITY_TOO_LARGE after
// the transfer (or mid-stream).

test('ZIM_UPLOAD_MULTIPART_LIMIT parses to a finite byte count', () => {
  const parsed = parseByteLimit(ZIM_UPLOAD_MULTIPART_LIMIT)
  assert.ok(Number.isFinite(parsed) && parsed > 0)
})

test('ZIM_UPLOAD_MULTIPART_LIMIT is at least the 20 GB UI claim', () => {
  const parsed = parseByteLimit(ZIM_UPLOAD_MULTIPART_LIMIT)
  const twentyGb = parseByteLimit('20gb')
  assert.ok(
    parsed >= twentyGb,
    `expected ${ZIM_UPLOAD_MULTIPART_LIMIT} (${parsed}) >= 20gb (${twentyGb})`
  )
})

test('ZIM_UPLOAD_MULTIPART_LIMIT exceeds the global bodyparser 110mb ceiling', () => {
  const parsed = parseByteLimit(ZIM_UPLOAD_MULTIPART_LIMIT)
  const globalCeiling = parseByteLimit('110mb')
  assert.ok(parsed > globalCeiling)
})
