import test from 'ava'
import path from 'path'
import zlib, { BrotliOptions } from 'zlib'
import fsp from 'fs/promises'
import { build } from 'vite'
import { compression } from '../src'
import { len } from '../src/utils'
import type { ViteCompressionPluginConfig } from '../src'
import type { ZlibOptions } from 'zlib'

const getId = () => Math.random().toString(32).slice(2, 10)

const dist = path.join(__dirname, 'dist')

interface MockBuild<T, Q> {
  (config: ViteCompressionPluginConfig<T>): string
  (config: [ViteCompressionPluginConfig<T>, ViteCompressionPluginConfig<Q>]): string
}

async function mockBuild<T>(config?: ViteCompressionPluginConfig<T>): Promise<string>
async function mockBuild<T, K>(
  config: [ViteCompressionPluginConfig<T>, ViteCompressionPluginConfig<K>]
): Promise<string>
async function mockBuild(config: any = {}) {
  const id = getId()
  const plugins = Array.isArray(config) ? config.map((conf) => compression(conf)) : [compression(config)]
  await build({
    root: path.join(__dirname, 'fixture'),
    plugins,
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir: path.join(__dirname, 'dist', id)
    }
  })
  return id
}

test.after(async () => {
  await fsp.rm(dist, { recursive: true })
})

const readAll = async (entry: string) => {
  const final = []
  const readAllImpl = async (entry: string) =>
    Promise.all(
      (await fsp.readdir(entry)).map(async (dir) => {
        const p = path.join(entry, dir)
        if ((await fsp.stat(p)).isDirectory()) return readAllImpl(p)
        final.push(p)
        return p
      })
    )
  await readAllImpl(entry)
  return final as string[]
}

test('vite-plugin-compression2', async (t) => {
  const id = await mockBuild()
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 3)
})

test('include js only', async (t) => {
  const id = await mockBuild({
    include: /\.(js)$/
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 1)
})

test('include css and js', async (t) => {
  const id = await mockBuild({
    include: [/\.(js)$/, /\.(css)$/]
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 2)
})

test('exlucde html', async (t) => {
  const id = await mockBuild({
    exclude: /\.(html)$/
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 2)
})

test('threshold', async (t) => {
  const id = await mockBuild({
    threshold: 100
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 2)
})

test('algorithm', async (t) => {
  const id = await mockBuild({
    algorithm: 'gzip'
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 3)
})

test('custom alorithm', async (t) => {
  const id = await mockBuild<ZlibOptions>({
    algorithm(buf, opt, invork) {
      return zlib.gzip(buf, opt, invork)
    },
    compressionOptions: {
      level: 9
    }
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 3)
})

test('deleteOriginalAssets', async (t) => {
  const id = await mockBuild({
    deleteOriginalAssets: true
  })
  const r = await readAll(path.join(dist, id))
  t.is(len(r), 3)
})

test('brotliCompress', async (t) => {
  const id = await mockBuild({
    algorithm: 'brotliCompress'
  })
  const r = await readAll(path.join(dist, id))
  const compressed = len(r.filter((s) => s.endsWith('.br')))
  t.is(compressed, 3)
})

test('filename', async (t) => {
  const id = await mockBuild({
    filename: 'fake/[base].gz'
  })
  const r = await readAll(path.join(dist, id, 'fake'))
  const compressed = len(r.filter((s) => s.endsWith('.gz')))
  t.is(compressed, 3)
})

test('multiple', async (t) => {
  const id = await mockBuild<ZlibOptions, BrotliOptions>([
    {
      algorithm: 'gzip',
      include: /\.(js)$/
    },
    {
      algorithm: 'brotliCompress',
      include: /\.(css)$/
    }
  ])

  const r = await readAll(path.join(dist, id))
  const gz = len(r.filter((s) => s.endsWith('.gz')))
  const br = len(r.filter((s) => s.endsWith('.br')))
  t.is(gz, 1)
  t.is(br, 1)
})
