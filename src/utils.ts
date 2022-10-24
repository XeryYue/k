import path from 'path'
import { normalizePath } from 'vite'
import fg from 'fast-glob'

import type { Regular } from './interface'

const isAbsolutePath = (entry: string) => (path.isAbsolute(entry) ? true : false)

const generatorPath = (entry: string, root = process.cwd()) => (isAbsolutePath(entry) ? entry : path.join(root, entry))

export const resolvePath = (entry: string, root = process.cwd()) => generatorPath(entry, root)

export const readGlobalFiles = async (entry: string, regular: Regular) => {
  entry = normalizePath(path.join(entry, '**', '*'))
  const files = await fg(entry, { dot: true, ignore: regular })
  return files
}

export const len = <T>(source?: T[] | string) => source.length

export const printf = {
  error: (message: string) => console.log('\x1b[31m%s\x1b[0m', message),
  warn: (message: string) => console.log('\x1b[93m%s\x1b[0m', message),
  info: (message: string) => console.log('\x1b[32m%s\x1b[0m', message),
  dim: (message: string) => console.log('\x1b[37m%s\x1b[0m', message)
}
