import { describe } from 'vitest'
import { runTest } from '../e2e'
import { name } from './package.json'

describe('vite6', async () => {
  const vite = await import('vite')

  await runTest(name, {
    vite,
    compressOption: {
      deleteOriginalAssets: true
    }
  })
})
