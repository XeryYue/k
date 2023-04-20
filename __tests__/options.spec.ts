import test from 'ava'
import path from 'path'
import fsp from 'fs/promises'
import { build } from 'vite'
import { compression } from '../src'
import { readAll } from '../src/utils'
import type { Algorithm } from '../src'
import type { ViteCompressionPluginConfigAlgorithm } from 'src/interface'

const getId = () => Math.random().toString(32).slice(2, 10)
const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

async function mockBuild<T extends Algorithm = never>(
  conf: ViteCompressionPluginConfigAlgorithm<T>,
  dir: string,
  single = false
) {
  const id = getId()
  await build({
    build: {
      rollupOptions: {
        output: !single
          ? [
              {
                dir: path.join(__dirname, 'temp', id)
              },
              {
                dir: path.join(__dirname, '.tmpl', id)
              }
            ]
          : {
              dir: path.join(__dirname, '.tmpl', id)
            }
      }
    },
    root: path.join(__dirname, 'fixtures', dir),
    plugins: [compression(conf)],
    logLevel: 'silent'
  })
  return id
}

const tempPath = path.join(__dirname, 'temp')
const tmplPath = path.join(__dirname, '.tmpl')

test.after(async () => {
  await fsp.rm(tempPath, { recursive: true })
  await fsp.rm(tmplPath, { recursive: true })
})

test('rollupOptions First', async (t) => {
  const id = await mockBuild({ deleteOriginalAssets: true, include: /\.(html)$/ }, 'dynamic')
  await sleep(3000)
  const r = await Promise.all([readAll(path.join(tempPath, id)), readAll(path.join(tmplPath, id))])
  const gz = r.map((v) => v.filter((s) => s.endsWith('.gz')))
  t.is(gz[0].length, 1)
  t.is(gz[1].length, 1)
})

test('rollupOptions with single output', async (t) => {
  const id = await mockBuild({ deleteOriginalAssets: true, include: /\.(html)$/ }, 'dynamic', true)
  await sleep(3000)
  const r = readAll(path.join(tmplPath, id))
  const gz = (await r).filter((v) => v.endsWith('.gz'))
  t.is(gz.length, 1)
})
