import type { FastifyInstance } from 'fastify'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { db } from '../db.ts'

// 只允许字母、连字符、撇号，最长 100 字符（防注入/路径遍历）
const WORD_RE = /^[a-zA-Z'-]{1,100}$/

const stmtGetCache = db.prepare(
  'SELECT audio_data, mime_type FROM tts_cache WHERE word = ?'
)

const stmtSetCache = db.prepare(
  'INSERT OR REPLACE INTO tts_cache (word, audio_data, mime_type, created_at) VALUES (?, ?, ?, ?)'
)

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err) => err ? reject(err) : resolve())
  })
}

/** 用 macOS say + ffmpeg 生成 MP3 Buffer，不依赖网络 */
async function synthesize(word: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'tts-'))
  const aiff = join(dir, 'out.aiff')
  const mp3  = join(dir, 'out.mp3')

  try {
    // say -v Alex 音质较好；-r 160 语速正常
    await run('/usr/bin/say', ['-v', 'Alex', '-r', '160', '-o', aiff, word])
    await run('/opt/homebrew/bin/ffmpeg', [
      '-y', '-i', aiff,
      '-codec:a', 'libmp3lame', '-qscale:a', '4',
      mp3
    ])
    return await readFile(mp3)
  } finally {
    // 清理临时文件
    await unlink(aiff).catch(() => {})
    await unlink(mp3).catch(() => {})
    await rmdir(dir).catch(() => {})
  }
}

export async function ttsRoutes(app: FastifyInstance) {

  // GET /tts/:word
  app.get<{ Params: { word: string } }>('/tts/:word', async (req, reply) => {
    const word = req.params.word.trim()

    if (!WORD_RE.test(word)) {
      return reply.status(400).send({ ok: false, error: 'invalid word' })
    }

    // 查缓存
    const cached = stmtGetCache.get(word) as { audio_data: Buffer; mime_type: string } | undefined
    if (cached) {
      return reply
        .header('Content-Type', cached.mime_type)
        .header('Cache-Control', 'public, max-age=86400')
        .send(cached.audio_data)
    }

    // 生成音频
    try {
      const audio = await synthesize(word)
      stmtSetCache.run(word, audio, 'audio/mpeg', Date.now())

      return reply
        .header('Content-Type', 'audio/mpeg')
        .header('Cache-Control', 'public, max-age=86400')
        .send(audio)
    } catch (err) {
      app.log.error({ err, word }, 'TTS synthesis failed')
      return reply.status(503).send({ ok: false, error: 'TTS service unavailable' })
    }
  })
}
