// メール送信設定（Resend API を fetch で直接呼び出し）

export const FROM_EMAIL = 'noreply@parts-hub-tci.com'
export const FROM_NAME = 'PARTS HUB'
export const SUPPORT_EMAIL = 'osaki.mf@gmail.com'
export const SITE_URL = 'https://parts-hub-tci.com'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

// Resend API を fetch で直接呼び出すメール送信関数
export async function sendEmail(apiKey: string, params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'RESEND_API_KEY is not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    const data = await res.json() as any

    if (!res.ok) {
      console.error('Resend API error:', data)
      return { success: false, error: data?.message || `HTTP ${res.status}` }
    }

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}
