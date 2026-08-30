import type { FastifyInstance } from 'fastify'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { db } from '../db.ts'

// 只允许字母、连字符、撇号，最长 100 字符（防注入/路径遍历）
const WORD_RE = /^[a-zA-Z'-]{1,100}$/

const stmtGetCache = db.prepare(
  'SELECT audio_data, mime_type FROM tts_cache WHERE word = ?'
)

const stmtSetCache = db.prepare(
  'INSERT OR REPLACE INTO tts_cache (word, audio_data, mime_type, created_at) VALUES (?, ?, ?, ?)'
)

/** 调用 msedge-tts，返回 MP3 Buffer */
async function synthesize(word: string): Promise<Buffer> {
  const tts = new MsEdgeTTS()
  await tts.setMetadata('en-US-AriaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

  const { audioStream } = tts.toStream(word)

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk))
    audioStream.on('end', () => resolve(Buffer.concat(chunks)))
    audioStream.on('error', reject)
  })
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
