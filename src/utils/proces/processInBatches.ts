import { sleep } from './../helper/helpers.js'
import { logger } from '../logger/logger.js'

export async function processInBatches<T, R>(
  items: readonly T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delayBetween = 1000
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`)

    const settled = await Promise.allSettled(batch.map(processor))
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(r.value)
      else logger.error('Batch item failed', { reason: (r as PromiseRejectedResult).reason })
    }

    if (i + batchSize < items.length) await sleep(delayBetween)
  }

  return results
}
