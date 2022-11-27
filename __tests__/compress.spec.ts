import test from 'ava'
import { Buffer } from 'buffer'
import { ensureAlgorithm, transfer } from '../src/compress'
import type { Algorithm } from '../src/interface'

const mockTransfer = async (userAlgorithm: Algorithm, buf: Buffer) => {
  const { algorithm } = ensureAlgorithm(userAlgorithm)
  return transfer(buf, algorithm, {})
}

test('transer', async (t) => {
  const fake = Buffer.alloc(4, 'test')
  await mockTransfer('gzip', fake)
  t.pass()
})

test('transfer with error', async (t) => {
  const msg = await t.throwsAsync(mockTransfer('gzip', 123 as any))
  t.is(
    msg.message,
    'The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received type number (123)'
  )
})
