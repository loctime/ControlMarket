import express from 'express'
import cors from 'cors'
import registerRoute from './routes/register.js'
import teamRoute from './routes/team.js'

const app = express()

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin, credentials: false }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', registerRoute)
app.use('/api', teamRoute)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno' })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`ControlMarket backend escuchando en :${port}`)
})

export default app
