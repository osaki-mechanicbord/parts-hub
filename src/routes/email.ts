import { Hono } from 'hono'
import { sendEmail } from '../email-config'
import * as tpl from '../email-templates'

type Bindings = {
  DB: D1Database
  RESEND_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ---- テスト用エンドポイント ----
app.post('/test', async (c) => {
  try {
    const { to } = await c.req.json()
    if (!to) return c.json({ success: false, error: 'to is required' }, 400)

    const email = tpl.registrationComplete({ userName: 'テストユーザー' })
    const result = await sendEmail(c.env.RESEND_API_KEY, { to, ...email })
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
