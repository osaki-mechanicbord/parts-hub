import { Hono } from 'hono'
import type { Bindings } from '../types'

const vehicleDemo = new Hono<{ Bindings: Bindings }>()

// メーカー一覧
vehicleDemo.get('/makers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, name_en, country, display_order
      FROM car_makers
      WHERE is_active = 1
      ORDER BY display_order ASC
    `).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle makers fetch error:', error)
    return c.json({ success: false, error: 'メーカー取得に失敗しました' }, 500)
  }
})

// 車種一覧（メーカーID指定）
vehicleDemo.get('/makers/:makerId/models', async (c) => {
  try {
    const makerId = c.req.param('makerId')
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order
      FROM car_models
      WHERE maker_id = ? AND is_active = 1
      ORDER BY display_order ASC, name ASC
    `).bind(makerId).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle models fetch error:', error)
    return c.json({ success: false, error: '車種取得に失敗しました' }, 500)
  }
})

// グレード一覧（車種ID指定）
vehicleDemo.get('/models/:modelId/grades', async (c) => {
  try {
    const modelId = c.req.param('modelId')
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order
      FROM car_grades
      WHERE model_id = ? AND is_active = 1
      ORDER BY display_order ASC
    `).bind(modelId).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle grades fetch error:', error)
    return c.json({ success: false, error: 'グレード取得に失敗しました' }, 500)
  }
})

// 年式候補（車種ID指定）→ year_from〜year_toの範囲を返す
vehicleDemo.get('/models/:modelId/years', async (c) => {
  try {
    const modelId = c.req.param('modelId')
    const model = await c.env.DB.prepare(`
      SELECT year_from, year_to FROM car_models WHERE id = ? AND is_active = 1
    `).bind(modelId).first()

    if (!model) {
      return c.json({ success: false, error: '車種が見つかりません' }, 404)
    }

    const years: number[] = []
    const from = (model as any).year_from || 2000
    const to = (model as any).year_to || new Date().getFullYear()
    for (let y = to; y >= from; y--) {
      years.push(y)
    }
    return c.json({ success: true, data: years })
  } catch (error) {
    console.error('Vehicle years fetch error:', error)
    return c.json({ success: false, error: '年式取得に失敗しました' }, 500)
  }
})

export default vehicleDemo
