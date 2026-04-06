// コメント・質問機能（認証ベース）
let currentProductId = null
let commentUserId = null

function getCommentAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { headers: { 'Authorization': 'Bearer ' + token } } : null
}

// ページ読み込み時にコメントをロード
document.addEventListener('DOMContentLoaded', async () => {
  const pathParts = window.location.pathname.split('/')
  currentProductId = pathParts[pathParts.length - 1]

  // ログイン中のユーザーIDを取得
  const auth = getCommentAuthHeaders()
  if (auth) {
    try {
      const res = await axios.get('/api/auth/me', auth)
      if (res.data.success) {
        const u = res.data.user || res.data.data
        commentUserId = u.id
      }
    } catch (e) {
      // 未ログインでもコメント閲覧は可能
    }
  }

  loadComments()
})

// コメント一覧をロード
async function loadComments() {
  try {
    const response = await axios.get(`/api/comments/${currentProductId}`)
    if (response.data.success) {
      renderComments(response.data.data)
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
  }
}

// コメントを描画
function renderComments(comments) {
  const container = document.getElementById('comments-list')

  if (comments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-comment-slash text-4xl mb-3"></i>
        <p>まだコメントがありません</p>
      </div>
    `
    return
  }

  container.innerHTML = comments.map(comment => `
    <div class="border border-gray-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-gray-600"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900">${escapeCommentHtml(comment.user_name)}</span>
            ${comment.is_verified ? '<i class="fas fa-check-circle text-blue-500 text-sm"></i>' : ''}
            ${comment.is_question ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded">質問</span>' : ''}
            ${comment.is_answered ? '<span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">回答済み</span>' : ''}
          </div>
          <p class="text-sm text-gray-500 mb-2">${new Date(comment.created_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}</p>
          <p class="text-gray-800 whitespace-pre-wrap">${escapeCommentHtml(comment.comment_text)}</p>

          ${comment.reply_count > 0 ? `
            <button onclick="loadReplies(${comment.id})" class="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold">
              <i class="fas fa-comments mr-1"></i>${comment.reply_count}件の返信を表示
            </button>
          ` : ''}

          ${commentUserId ? `
          <button onclick="replyToComment(${comment.id})" class="mt-3 text-sm text-gray-600 hover:text-gray-800">
            <i class="fas fa-reply mr-1"></i>返信
          </button>
          ` : ''}

          <div id="replies-${comment.id}" class="mt-4 space-y-3 hidden"></div>
          <div id="reply-form-${comment.id}" class="mt-4 hidden">
            <textarea id="reply-text-${comment.id}" rows="2"
                      class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none text-sm"
                      placeholder="返信を入力..."></textarea>
            <div class="flex gap-2 mt-2">
              <button onclick="submitReply(${comment.id})"
                      class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-semibold">
                返信する
              </button>
              <button onclick="cancelReply(${comment.id})"
                      class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('')
}

// 返信をロード
async function loadReplies(commentId) {
  try {
    const response = await axios.get(`/api/comments/${currentProductId}/${commentId}/replies`)
    if (response.data.success) {
      const container = document.getElementById(`replies-${commentId}`)
      container.innerHTML = response.data.data.map(reply => `
        <div class="border-l-2 border-gray-300 pl-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <i class="fas fa-user text-gray-600 text-sm"></i>
              </div>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-gray-900 text-sm">${escapeCommentHtml(reply.user_name)}</span>
                ${reply.is_verified ? '<i class="fas fa-check-circle text-blue-500 text-xs"></i>' : ''}
              </div>
              <p class="text-xs text-gray-500 mb-2">${new Date(reply.created_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}</p>
              <p class="text-sm text-gray-800 whitespace-pre-wrap">${escapeCommentHtml(reply.comment_text)}</p>
            </div>
          </div>
        </div>
      `).join('')
      container.classList.remove('hidden')
    }
  } catch (error) {
    console.error('Failed to load replies:', error)
  }
}

// 返信フォームを表示
function replyToComment(commentId) {
  document.getElementById(`reply-form-${commentId}`).classList.toggle('hidden')
}

// 返信をキャンセル
function cancelReply(commentId) {
  document.getElementById(`reply-form-${commentId}`).classList.add('hidden')
  document.getElementById(`reply-text-${commentId}`).value = ''
}

// 返信を投稿
async function submitReply(parentCommentId) {
  const auth = getCommentAuthHeaders()
  if (!auth || !commentUserId) {
    alert('返信するにはログインが必要です')
    return
  }
  const textarea = document.getElementById(`reply-text-${parentCommentId}`)
  const text = textarea.value.trim()
  if (!text) { alert('返信内容を入力してください'); return }

  try {
    const response = await axios.post(`/api/comments/${currentProductId}`, {
      comment_text: text,
      is_question: false,
      parent_comment_id: parentCommentId
    }, auth)
    if (response.data.success) {
      textarea.value = ''
      cancelReply(parentCommentId)
      loadComments()
    }
  } catch (error) {
    console.error('Failed to submit reply:', error)
    alert(error?.response?.data?.error || '返信の投稿に失敗しました')
  }
}

// コメントを投稿
async function postComment() {
  const auth = getCommentAuthHeaders()
  if (!auth || !commentUserId) {
    if (confirm('コメントするにはログインが必要です。ログインページに移動しますか？')) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    }
    return
  }
  const textarea = document.getElementById('comment-input')
  const text = textarea.value.trim()
  const isQuestion = document.getElementById('is-question').checked
  if (!text) { alert('コメント内容を入力してください'); return }

  try {
    const response = await axios.post(`/api/comments/${currentProductId}`, {
      comment_text: text,
      is_question: isQuestion
    }, auth)
    if (response.data.success) {
      textarea.value = ''
      document.getElementById('is-question').checked = false
      loadComments()
      alert('コメントを投稿しました')
    }
  } catch (error) {
    console.error('Failed to post comment:', error)
    alert(error?.response?.data?.error || 'コメントの投稿に失敗しました')
  }
}

// 値下げ交渉モーダルを開く
function openPriceOfferModal() {
  if (typeof product !== 'undefined' && product && product.status === 'sold') {
    alert('この商品は売り切れのため、値下げ交渉はできません。')
    return
  }
  if (!commentUserId) {
    if (confirm('値下げ交渉にはログインが必要です。ログインページに移動しますか？')) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    }
    return
  }
  const price = document.getElementById('product-price').textContent.replace(/[¥,]/g, '')
  document.getElementById('modal-current-price').textContent = `¥${parseInt(price).toLocaleString()}`
  document.getElementById('price-offer-modal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

// 値下げ交渉モーダルを閉じる
function closePriceOfferModal() {
  document.getElementById('price-offer-modal').classList.add('hidden')
  document.body.style.overflow = 'auto'
  document.getElementById('offer-price').value = ''
  document.getElementById('offer-message').value = ''
}

// 値下げリクエストを送信
async function submitPriceOffer() {
  const auth = getCommentAuthHeaders()
  if (!auth || !commentUserId) {
    alert('ログインが必要です')
    return
  }
  const offerPrice = parseInt(document.getElementById('offer-price').value)
  const message = document.getElementById('offer-message').value.trim()
  const currentPrice = parseInt(document.getElementById('product-price').textContent.replace(/[¥,]/g, ''))

  if (!offerPrice || offerPrice <= 0) { alert('希望価格を入力してください'); return }
  if (offerPrice >= currentPrice) { alert('希望価格は現在の価格より低く設定してください'); return }

  try {
    const response = await axios.post('/api/negotiations', {
      product_id: currentProductId,
      requested_price: offerPrice,
      message: message
    }, auth)
    if (response.data.success) {
      closePriceOfferModal()
      alert('値下げリクエストを送信しました。出品者からの返信をお待ちください。')
    }
  } catch (error) {
    console.error('Failed to submit price offer:', error)
    alert(error.response?.data?.error || '値下げリクエストの送信に失敗しました')
  }
}

// モーダル外クリックで閉じる
document.getElementById('price-offer-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closePriceOfferModal()
})

// XSSエスケープ
function escapeCommentHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
