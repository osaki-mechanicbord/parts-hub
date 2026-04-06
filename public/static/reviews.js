/**
 * レビュー投稿ページ（認証ベース）
 */

// ユーザーID（認証から動的取得）
let currentUserId = null;
let token = null;

// トランザクションID（URLパラメータから取得）
const urlParams = new URLSearchParams(window.location.search);
const transactionId = urlParams.get('transaction');

// 選択された評価
let selectedRating = 0;

function getAuthHeaders() {
    return { headers: { 'Authorization': 'Bearer ' + token } };
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    if (!transactionId) {
        alert('取引IDが指定されていません');
        window.location.href = '/mypage';
        return;
    }

    // ユーザー情報取得
    try {
        const res = await axios.get('/api/auth/me', getAuthHeaders());
        if (res.data.success) {
            const user = res.data.user || res.data.data;
            currentUserId = user.id;
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            throw new Error('auth failed');
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        if (e?.response?.status === 401) {
            localStorage.removeItem('token');
        }
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    loadTransactionInfo();
    setupForm();
});

// 取引情報を読み込み
async function loadTransactionInfo() {
    try {
        const response = await axios.get(`/api/transactions/${transactionId}`, getAuthHeaders());
        
        if (response.data.success) {
            const transaction = response.data.data;

            // 既にレビュー済みの場合はフォームを非表示にして案内を表示
            if (transaction.has_my_review) {
                renderTransactionInfo(transaction);
                const form = document.getElementById('review-form');
                if (form) {
                    form.innerHTML = `
                        <div class="text-center py-10">
                            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                            <p class="text-lg font-bold text-gray-800 mb-2">レビューは投稿済みです</p>
                            <p class="text-sm text-gray-500 mb-6">この取引へのレビューは既に完了しています。ありがとうございました。</p>
                            <a href="/mypage" class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                                <i class="fas fa-arrow-left mr-2"></i>マイページへ戻る
                            </a>
                        </div>
                    `;
                }
                return;
            }

            // 取引が完了していない場合はレビュー不可
            if (transaction.status !== 'completed') {
                renderTransactionInfo(transaction);
                const form = document.getElementById('review-form');
                if (form) {
                    form.innerHTML = `
                        <div class="text-center py-10">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
                            <p class="text-lg font-bold text-gray-800 mb-2">まだレビューを書けません</p>
                            <p class="text-sm text-gray-500 mb-6">取引が完了した後にレビューを投稿できます。</p>
                            <a href="/transactions/${transactionId}" class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                                <i class="fas fa-arrow-left mr-2"></i>取引詳細に戻る
                            </a>
                        </div>
                    `;
                }
                return;
            }

            renderTransactionInfo(transaction);
        } else {
            throw new Error(response.data.error || '取引情報の取得に失敗しました');
        }
    } catch (error) {
        console.error('Failed to load transaction:', error);
        const msg = error?.response?.status === 401 
            ? 'Request failed with status code 401' 
            : (error?.response?.data?.error || error.message || '取引情報の読み込みに失敗しました');
        document.getElementById('transaction-info').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
                <p>${escapeHtml(msg)}</p>
            </div>
        `;
    }
}

// 取引情報を表示
function renderTransactionInfo(transaction) {
    const isBuyer = transaction.buyer_id === currentUserId;
    const counterpartName = isBuyer ? transaction.seller_name : transaction.buyer_name;
    const reviewTargetLabel = isBuyer ? '出品者' : '購入者';
    const productImage = transaction.product_image 
        ? (transaction.product_image.startsWith('http') || transaction.product_image.startsWith('/') 
            ? transaction.product_image 
            : '/r2/' + transaction.product_image)
        : '/icons/icon-192x192.png';

    document.getElementById('transaction-info').innerHTML = `
        <div class="flex items-center gap-4">
            <img loading="lazy" src="${productImage}" 
                 alt="${escapeHtml(transaction.product_title)}" 
                 class="w-24 h-24 object-cover rounded-lg"
                 onerror="this.src='/icons/icon-192x192.png'">
            <div class="flex-1">
                <h2 class="font-bold text-lg text-gray-900 mb-1">${escapeHtml(transaction.product_title)}</h2>
                <p class="text-sm text-gray-600 mb-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        <i class="fas fa-pen mr-1"></i>${reviewTargetLabel}のレビュー
                    </span>
                </p>
                <p class="text-sm text-gray-600 mb-2">
                    ${reviewTargetLabel}: ${escapeHtml(counterpartName || '不明')}
                </p>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span><i class="far fa-calendar mr-1"></i>${formatDate(transaction.completed_at || transaction.created_at)}</span>
                    <span class="text-red-500 font-bold">¥${formatPrice(transaction.amount || transaction.product_price || 0)}</span>
                </div>
            </div>
        </div>
    `;
}

// フォームのセットアップ
function setupForm() {
    // コメント文字数カウント
    const commentTextarea = document.getElementById('comment');
    commentTextarea.addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('char-count').textContent = count;
        
        // 5文字未満は警告色
        if (count < 5) {
            document.getElementById('char-count').classList.add('text-red-500', 'font-bold');
            document.getElementById('char-count').classList.remove('text-green-600');
        } else {
            document.getElementById('char-count').classList.remove('text-red-500');
            document.getElementById('char-count').classList.add('text-green-600', 'font-bold');
        }
    });
    
    // フォーム送信
    document.getElementById('review-form').addEventListener('submit', handleSubmit);
}

// 評価を設定
function setRating(rating) {
    selectedRating = rating;
    document.getElementById('rating').value = rating;
    
    // 星を更新
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

// フォーム送信処理
async function handleSubmit(event) {
    event.preventDefault();
    
    const comment = document.getElementById('comment').value.trim();
    
    // バリデーション
    if (selectedRating === 0) {
        alert('評価を選択してください');
        return;
    }
    
    if (comment.length < 5) {
        alert('コメントは5文字以上入力してください');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // ボタンを無効化
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>投稿中...';
    
    try {
        const reviewData = {
            transaction_id: parseInt(transactionId),
            reviewer_id: currentUserId,
            rating: selectedRating,
            comment: comment,
            product_condition_rating: document.getElementById('product-condition-rating')?.value || null,
            communication_rating: document.getElementById('communication-rating')?.value || null,
            shipping_rating: document.getElementById('shipping-rating')?.value || null
        };
        
        const response = await axios.post('/api/reviews', reviewData, getAuthHeaders());
        
        if (response.data.success) {
            alert('レビューを投稿しました！ありがとうございます。');
            window.location.href = '/mypage';
        } else {
            throw new Error(response.data.error || 'レビューの投稿に失敗しました');
        }
    } catch (error) {
        console.error('Failed to submit review:', error);
        alert(error?.response?.data?.error || error.message || 'レビューの投稿に失敗しました');
        
        // ボタンを元に戻す
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// XSS対策
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ユーティリティ関数
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
}
