/**
 * レビュー投稿ページ
 */

// 現在のユーザーID（実際の実装では認証から取得）
const currentUserId = 1;

// トランザクションID（URLパラメータから取得）
const urlParams = new URLSearchParams(window.location.search);
const transactionId = urlParams.get('transaction');

// 選択された評価
let selectedRating = 0;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    if (!transactionId) {
        alert('取引IDが指定されていません');
        window.location.href = '/mypage';
        return;
    }
    
    loadTransactionInfo();
    setupForm();
});

// 取引情報を読み込み
async function loadTransactionInfo() {
    try {
        const response = await axios.get(`/api/transactions/${transactionId}`);
        
        if (response.data.success) {
            const transaction = response.data.data;
            renderTransactionInfo(transaction);
        } else {
            throw new Error(response.data.error || '取引情報の取得に失敗しました');
        }
    } catch (error) {
        console.error('Failed to load transaction:', error);
        document.getElementById('transaction-info').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
                <p>${error.message || '取引情報の読み込みに失敗しました'}</p>
            </div>
        `;
    }
}

// 取引情報を表示
function renderTransactionInfo(transaction) {
    document.getElementById('transaction-info').innerHTML = `
        <div class="flex items-center gap-4">
            <img loading="lazy" src="${transaction.product_image || '/icons/icon-192x192.png'}" 
                 alt="${transaction.product_title}" 
                 class="w-24 h-24 object-cover rounded-lg">
            <div class="flex-1">
                <h2 class="font-bold text-lg text-gray-900 mb-1">${transaction.product_title}</h2>
                <p class="text-sm text-gray-600 mb-2">
                    ${transaction.is_buyer ? '出品者' : '購入者'}: ${transaction.counterpart_name}
                </p>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span><i class="far fa-calendar mr-1"></i>${formatDate(transaction.completed_at)}</span>
                    <span class="text-red-500 font-bold">¥${formatPrice(transaction.total_amount)}</span>
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
        
        // 100文字未満は警告色
        if (count < 100) {
            document.getElementById('char-count').classList.add('text-red-500', 'font-bold');
        } else {
            document.getElementById('char-count').classList.remove('text-red-500', 'font-bold');
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
    
    if (comment.length < 100) {
        alert('コメントは100文字以上入力してください');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // ボタンを無効化
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>投稿中...';
    
    try {
        const reviewData = {
            transaction_id: transactionId,
            reviewer_id: currentUserId,
            rating: selectedRating,
            comment: comment,
            product_condition_rating: document.getElementById('product-condition-rating').value || null,
            communication_rating: document.getElementById('communication-rating').value || null,
            shipping_rating: document.getElementById('shipping-rating').value || null
        };
        
        const response = await axios.post('/api/reviews', reviewData);
        
        if (response.data.success) {
            alert('レビューを投稿しました');
            window.location.href = '/mypage';
        } else {
            throw new Error(response.data.error || 'レビューの投稿に失敗しました');
        }
    } catch (error) {
        console.error('Failed to submit review:', error);
        alert(error.message || 'レビューの投稿に失敗しました');
        
        // ボタンを元に戻す
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ユーティリティ関数
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
