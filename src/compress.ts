import zlib from 'zlib'
import type { ZlibOptions, BrotliOptions } from 'zlib'
import type { Algorithm, CompressionOptions, AlgorithmFunction } from './interface'

export const ensureAlgorithm = (algorithm: Algorithm) => {
  if (algorithm in zlib) {
    return {
      algorithm: zlib[algorithm]
    }
  }
  throw new Error('Invalid algorithm in "zlib"')
}

export const transfer = <T>(
  buf: Buffer,
  compress: AlgorithmFunction<T>,
  options: CompressionOptions<T>
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    compress(buf, options, (err, bf) => {
      if (err) {
        reject(err)
        return
      }

      if (!Buffer.isBuffer(bf)) {
        resolve(Buffer.from(bf))
      } else {
        resolve(bf)
      }
    })
  })
}

export const defaultCompressionOptions: {
  [algorithm in Algorithm]: algorithm extends 'brotliCompress' ? BrotliOptions : ZlibOptions
} = {
  gzip: {
    level: zlib.constants.Z_BEST_COMPRESSION
  },
  brotliCompress: {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
    }
  },
  deflate: {
    level: zlib.constants.Z_BEST_COMPRESSION
  },
  deflateRaw: {
    level: zlib.constants.Z_BEST_COMPRESSION
  }
}
