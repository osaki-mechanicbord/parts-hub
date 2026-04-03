/**
 * パンくずリスト ユーティリティ
 * 全ページで統一した視覚的パンくず + JSON-LD を生成
 */

const BASE_URL = 'https://parts-hub-tci.com'

export interface BreadcrumbItem {
  name: string
  url?: string  // 最後のアイテムはURL不要（現在のページ）
}

/**
 * パンくずリストのJSON-LDスクリプトタグを生成
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const listItems = items.map((item, i) => {
    const entry: Record<string, unknown> = {
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name
    }
    if (item.url) {
      entry['item'] = item.url.startsWith('http') ? item.url : BASE_URL + item.url
    }
    return entry
  })
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': listItems
  })}</script>`
}

/**
 * 視覚的パンくずナビゲーションHTML + JSON-LDを同時に生成
 */
export function breadcrumbHtml(items: BreadcrumbItem[]): string {
  const navItems = items.map((item, i) => {
    const isLast = i === items.length - 1
    if (isLast) {
      return `<span class="bc-current">${escapeHtml(item.name)}</span>`
    }
    const href = item.url || '/'
    return `<a href="${escapeHtml(href)}" class="bc-link">${escapeHtml(item.name)}</a><span class="bc-sep"><i class="fas fa-chevron-right"></i></span>`
  }).join('')

  return `<nav aria-label="パンくずリスト" class="bc-nav"><div class="bc-wrap">${navItems}</div></nav>${breadcrumbJsonLd(items)}`
}

/**
 * パンくずCSS（共通スタイル） - <style>タグ内に含める用
 */
export const BREADCRUMB_CSS = `
.bc-nav{background:#f9fafb;border-bottom:1px solid #f3f4f6;padding:8px 0;font-size:12px}
.bc-wrap{max-width:72rem;margin:0 auto;padding:0 16px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;overflow:hidden}
.bc-link{color:#6b7280;text-decoration:none;white-space:nowrap;transition:color .15s}
.bc-link:hover{color:#dc2626}
.bc-sep{color:#d1d5db;font-size:8px;display:inline-flex;align-items:center}
.bc-current{color:#1f2937;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
@media(min-width:640px){.bc-current{max-width:400px}}
`

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
