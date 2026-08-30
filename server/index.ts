import Fastify from 'fastify'
import cors from '@fastify/cors'
import { syncRoutes } from './routes/sync.ts'
import { ttsRoutes } from './routes/tts.ts'

const app = Fastify({ logger: { level: 'info' } })

await app.register(cors, {
  origin: true,   // 允许所有来源（内网使用，可收紧）
  methods: ['GET', 'POST', 'OPTIONS'],
})

// 健康检查
app.get('/health', async () => ({ ok: true, time: Date.now() }))

// 同步路由
await app.register(syncRoutes)

// TTS 路由
await app.register(ttsRoutes)

const PORT = Number(process.env.PORT ?? 3002)
const HOST = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`FlashMind sync server listening on ${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
