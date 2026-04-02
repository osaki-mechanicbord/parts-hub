import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const guideRoutes = new Hono<{ Bindings: Bindings }>()

// ===== ガイド記事テンプレート定義 =====
interface GuideTemplate {
  name: string
  label: string
  description: string
  defaultCategory: string
  generateSections: (params: Record<string, string>) => { heading: string; body: string }[]
  generateComparison?: (params: Record<string, string>) => { item: string; dealer: string; parts_hub: string; savings: string }[]
}

const TEMPLATES: Record<string, GuideTemplate> = {
  'cost-comparison': {
    name: 'cost-comparison',
    label: '費用比較ガイド',
    description: 'パーツの費用をディーラーとPARTS HUBで比較するガイド記事',
    defaultCategory: '費用比較',
    generateSections: (p) => [
      { heading: `${p.part_name}の一般的な費用`, body: `${p.part_name}の交換・修理は、安全性と車両性能に直結する重要な整備項目です。一般的に${p.price_range || '数千円〜数万円'}が相場ですが、ディーラーと一般整備工場では価格に大きな差があります。${p.additional_context || ''}` },
      { heading: 'なぜ仕入れコストの削減が重要なのか', body: `${p.part_name}を定期的に交換する整備工場にとって、仕入れコストの削減は利益率に直結します。部品商からの仕入れ価格は固定されがちですが、PARTS HUBでは全国の整備工場が余剰在庫を出品しているため、市価より安く入手できる可能性があります。特に${p.target_vehicle || '幅広い車種'}で需要が高いパーツです。` },
      { heading: 'PARTS HUBで賢く調達する方法', body: `PARTS HUBでは「${p.search_keyword || p.part_name}」で検索すれば、対応するパーツが一覧表示されます。品番検索にも対応しているため、適合を確認した上で購入できます。出品者とのチャット機能で状態の詳細を事前に確認でき、${p.quality_note || '品質に納得した上で購入'}可能です。中古パーツやリビルトパーツを活用して、仕入れコストを削減しましょう。` }
    ],
    generateComparison: (p) => {
      if (!p.comparison_items) return []
      try {
        return JSON.parse(p.comparison_items)
      } catch { return [] }
    }
  },
  'how-to': {
    name: 'how-to',
    label: '実践ハウツーガイド',
    description: '整備工場の実践的なノウハウを解説するガイド記事',
    defaultCategory: '実践ガイド',
    generateSections: (p) => [
      { heading: `${p.topic}とは`, body: p.intro || `${p.topic}について、整備工場の現場で役立つ実践的な情報をまとめました。${p.background || ''}` },
      { heading: '具体的な方法と手順', body: p.method || `${p.topic}を実践するための具体的な手順を解説します。${p.steps || ''}` },
      { heading: 'PARTS HUBを活用した改善策', body: p.parts_hub_tie_in || `PARTS HUBを活用することで、${p.topic}に関連するコスト削減や効率化が可能です。全国の整備工場ネットワークを通じて、必要なパーツや工具を最適な価格で調達できます。` }
    ]
  },
  'business-improvement': {
    name: 'business-improvement',
    label: '経営改善ガイド',
    description: '整備工場の経営改善に焦点を当てたガイド記事',
    defaultCategory: '経営改善',
    generateSections: (p) => [
      { heading: `${p.challenge}の現状と課題`, body: p.current_situation || `整備業界において${p.challenge}は多くの事業者が直面している課題です。${p.statistics || ''}` },
      { heading: '改善のための具体的なアプローチ', body: p.solution || `${p.challenge}を改善するために、以下のアプローチが効果的です。${p.approach_detail || ''}` },
      { heading: '成功事例と期待効果', body: p.expected_results || `これらの施策を実践した整備工場では、${p.success_metric || 'コスト削減や売上向上'}の成果が報告されています。PARTS HUBの活用はこの取り組みをさらに加速させます。` }
    ]
  },
  'web-marketing': {
    name: 'web-marketing',
    label: 'Web集客ガイド',
    description: '整備工場のデジタルマーケティングに関するガイド記事',
    defaultCategory: 'Web集客',
    generateSections: (p) => [
      { heading: `なぜ${p.channel}が整備工場に重要なのか`, body: p.importance || `${p.channel}は整備工場の新規顧客獲得において非常に効果的なチャネルです。${p.market_data || ''}` },
      { heading: '具体的な始め方と設定手順', body: p.setup_guide || `${p.channel}を効果的に活用するための具体的な設定手順と、最初に行うべきことを解説します。${p.initial_steps || ''}` },
      { heading: '効果測定と改善サイクル', body: p.measurement || `${p.channel}の効果を測定し、継続的に改善していく方法を解説します。${p.kpi_info || ''}` },
      { heading: 'PARTS HUBとの連携で効果を最大化', body: p.synergy || `${p.channel}とPARTS HUBを組み合わせることで、集客力とコスト競争力の両面から整備工場の経営を強化できます。` }
    ]
  }
}

// ===== API: テンプレート一覧取得 =====
guideRoutes.get('/templates', (c) => {
  const templates = Object.values(TEMPLATES).map(t => ({
    name: t.name,
    label: t.label,
    description: t.description,
    defaultCategory: t.defaultCategory
  }))
  return c.json({ success: true, data: templates })
})

// ===== API: テンプレートからプレビュー生成 =====
guideRoutes.post('/preview', async (c) => {
  try {
    const body = await c.req.json()
    const { template_type, params } = body

    const template = TEMPLATES[template_type]
    if (!template) {
      return c.json({ success: false, error: 'テンプレートが見つかりません' }, 400)
    }

    const sections = template.generateSections(params)
    const comparison = template.generateComparison ? template.generateComparison(params) : undefined

    return c.json({
      success: true,
      data: {
        title: params.title || `${params.part_name || params.topic || params.challenge || params.channel}ガイド`,
        description: params.description || sections[0]?.body.slice(0, 120) + '...',
        category: params.category || template.defaultCategory,
        sections,
        comparison: comparison && comparison.length > 0 ? comparison : undefined
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'プレビュー生成に失敗しました' }, 500)
  }
})

// ===== API: ガイド記事の保存（新規/更新） =====
guideRoutes.post('/save', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { slug, title, description, category, sections, comparison, status, template_type, target_keyword } = body

    if (!slug || !title || !sections || sections.length === 0) {
      return c.json({ success: false, error: 'slug, title, sectionsは必須です' }, 400)
    }

    // slugの検証（英数字とハイフンのみ）
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return c.json({ success: false, error: 'slugは英小文字、数字、ハイフンのみ使用できます' }, 400)
    }

    const sectionsJson = JSON.stringify(sections)
    const comparisonJson = comparison ? JSON.stringify(comparison) : null
    const publishedAt = status === 'published' ? new Date().toISOString() : null

    // 既存チェック
    const existing = await DB.prepare('SELECT id FROM guide_articles WHERE slug = ?').bind(slug).first()

    if (existing) {
      // 更新
      await DB.prepare(`
        UPDATE guide_articles SET
          title = ?, description = ?, category = ?, sections_json = ?, comparison_json = ?,
          status = ?, template_type = ?, target_keyword = ?,
          meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP,
          published_at = COALESCE(published_at, ?)
        WHERE slug = ?
      `).bind(
        title, description || '', category || '実践ガイド', sectionsJson, comparisonJson,
        status || 'draft', template_type || null, target_keyword || null,
        title + ' - PARTS HUB', (description || '').slice(0, 160), publishedAt,
        slug
      ).run()
    } else {
      // 新規作成
      await DB.prepare(`
        INSERT INTO guide_articles (slug, title, description, category, sections_json, comparison_json, status, template_type, target_keyword, meta_title, meta_description, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        slug, title, description || '', category || '実践ガイド', sectionsJson, comparisonJson,
        status || 'draft', template_type || null, target_keyword || null,
        title + ' - PARTS HUB', (description || '').slice(0, 160), publishedAt
      ).run()
    }

    return c.json({ success: true, message: existing ? '更新しました' : '作成しました', slug })
  } catch (error) {
    console.error('Save guide error:', error)
    return c.json({ success: false, error: 'ガイド記事の保存に失敗しました' }, 500)
  }
})

// ===== API: ガイド記事一覧取得 =====
guideRoutes.get('/list', async (c) => {
  try {
    const { DB } = c.env
    const status = c.req.query('status')
    
    let query = 'SELECT id, slug, title, category, status, view_count, template_type, target_keyword, created_at, updated_at, published_at FROM guide_articles'
    const params: any[] = []
    
    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }
    query += ' ORDER BY updated_at DESC'

    const { results } = await DB.prepare(query).bind(...params).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: true, data: [] })
  }
})

// ===== API: ガイド記事詳細取得 =====
guideRoutes.get('/detail/:slug', async (c) => {
  try {
    const { DB } = c.env
    const slug = c.req.param('slug')

    const article = await DB.prepare('SELECT * FROM guide_articles WHERE slug = ?').bind(slug).first() as any
    if (!article) {
      return c.json({ success: false, error: '記事が見つかりません' }, 404)
    }

    // JSONパース
    article.sections = JSON.parse(article.sections_json || '[]')
    article.comparison = article.comparison_json ? JSON.parse(article.comparison_json) : null

    return c.json({ success: true, data: article })
  } catch (error) {
    return c.json({ success: false, error: '記事の取得に失敗しました' }, 500)
  }
})

// ===== API: ガイド記事削除 =====
guideRoutes.delete('/:slug', async (c) => {
  try {
    const { DB } = c.env
    const slug = c.req.param('slug')
    await DB.prepare('DELETE FROM guide_articles WHERE slug = ?').bind(slug).run()
    return c.json({ success: true, message: '削除しました' })
  } catch (error) {
    return c.json({ success: false, error: '削除に失敗しました' }, 500)
  }
})

// ===== API: 一括テンプレート生成 =====
guideRoutes.post('/bulk-generate', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { articles } = body // [{template_type, params, slug, status}]

    if (!articles || !Array.isArray(articles)) {
      return c.json({ success: false, error: 'articlesは配列で指定してください' }, 400)
    }

    const results: { slug: string; status: string }[] = []

    for (const article of articles) {
      const template = TEMPLATES[article.template_type]
      if (!template) {
        results.push({ slug: article.slug, status: 'error: template not found' })
        continue
      }

      const sections = template.generateSections(article.params)
      const comparison = template.generateComparison ? template.generateComparison(article.params) : undefined
      const title = article.params.title || `${article.params.part_name || article.params.topic || ''}ガイド`
      const description = article.params.description || sections[0]?.body.slice(0, 120) + '...'
      const category = article.params.category || template.defaultCategory
      const status = article.status || 'draft'
      const publishedAt = status === 'published' ? new Date().toISOString() : null

      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO guide_articles (slug, title, description, category, sections_json, comparison_json, status, template_type, target_keyword, meta_title, meta_description, published_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          article.slug, title, description, category,
          JSON.stringify(sections),
          comparison && comparison.length > 0 ? JSON.stringify(comparison) : null,
          status, article.template_type, article.params.target_keyword || null,
          title + ' - PARTS HUB', description.slice(0, 160), publishedAt
        ).run()
        results.push({ slug: article.slug, status: 'ok' })
      } catch (e) {
        results.push({ slug: article.slug, status: 'error' })
      }
    }

    return c.json({ success: true, data: results, total: results.length })
  } catch (error) {
    return c.json({ success: false, error: '一括生成に失敗しました' }, 500)
  }
})

export default guideRoutes
