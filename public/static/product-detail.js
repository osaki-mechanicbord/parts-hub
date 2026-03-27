// 商品詳細ページのJavaScript

let currentImageIndex = 0;
let product = null;
let currentUser = null;

// URLからIDを取得
function getIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// ログイン中のユーザー情報を取得
async function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const response = await axios.get('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
            currentUser = response.data.data;
            return currentUser;
        }
    } catch (error) {
        console.log('Not logged in');
    }
    return null;
}

// 商品データを読み込み
async function loadProduct() {
    const id = getIdFromUrl();
    
    try {
        // ユーザー情報と商品情報を並行で取得
        const [userResult, productResponse] = await Promise.all([
            getCurrentUser(),
            axios.get(`/api/products/${id}`)
        ]);
        
        if (productResponse.data.success) {
            product = productResponse.data.product || productResponse.data.data;
            // APIレスポンスのキー名を統一
            if (product) {
                product.shop_name = product.shop_name || product.seller_name;
                product.shop_type = product.shop_type || product.seller_shop_type;
                product.rating = product.rating || product.seller_rating;
                product.is_verified = product.is_verified || product.seller_verified;
                // images配列がなければ空配列
                product.images = product.images || [];
            }
            renderProduct();
            updateActionButtons();
            checkFavoriteStatus();
        } else {
            showError('商品が見つかりませんでした');
        }
    } catch (error) {
        console.error('Product load error:', error);
        showError('商品の読み込みに失敗しました');
    }
}

// アクションボタンの状態更新
function updateActionButtons() {
    const purchaseBtn = document.getElementById('purchase-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const contactBtn = document.getElementById('contact-btn');
    
    if (!product) return;
    
    // 売り切れの場合
    if (product.status === 'sold') {
        if (purchaseBtn) {
            purchaseBtn.disabled = true;
            purchaseBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>売り切れ';
            purchaseBtn.classList.remove('bg-primary', 'hover:bg-primary-dark');
            purchaseBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
        return;
    }
    
    // 自分の商品の場合
    if (currentUser && product.user_id == currentUser.id) {
        if (purchaseBtn) {
            purchaseBtn.disabled = true;
            purchaseBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>自分の出品商品';
            purchaseBtn.classList.remove('bg-primary', 'hover:bg-primary-dark');
            purchaseBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
        if (contactBtn) {
            contactBtn.style.display = 'none';
        }
    }
}

// お気に入り状態をチェック
async function checkFavoriteStatus() {
    if (!currentUser || !product) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get('/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
            const favorites = response.data.data || [];
            const isFavorited = favorites.some(f => f.product_id == product.id);
            updateFavoriteButton(isFavorited);
        }
    } catch (error) {
        console.log('Could not check favorite status');
    }
}

// お気に入りボタンの表示更新
function updateFavoriteButton(isFavorited) {
    const btn = document.getElementById('favorite-btn');
    if (!btn) return;
    
    if (isFavorited) {
        btn.innerHTML = '<i class="fas fa-heart text-red-500 mr-2"></i>お気に入り済み';
        btn.dataset.favorited = 'true';
        btn.classList.add('border-red-300', 'text-red-600');
    } else {
        btn.innerHTML = '<i class="far fa-heart mr-2"></i>お気に入り';
        btn.dataset.favorited = 'false';
        btn.classList.remove('border-red-300', 'text-red-600');
    }
}

// 商品を表示
function renderProduct() {
    if (!product) return;
    
    // ページタイトル
    document.title = `${product.title} - PARTS HUB`;
    
    // 画像ギャラリー
    renderImageGallery();
    
    // 商品タイトル
    document.getElementById('product-title').textContent = product.title;
    
    // 価格
    document.getElementById('product-price').textContent = `¥${Number(product.price).toLocaleString()}`;
    
    // 状態バッジ
    const conditionBadge = document.getElementById('product-condition-badge');
    const conditionColors = {
        'new': 'bg-blue-500',
        'like_new': 'bg-green-500',
        'excellent': 'bg-teal-500',
        'good': 'bg-gray-500',
        'acceptable': 'bg-orange-500',
        'junk': 'bg-red-500'
    };
    const conditionLabel = getConditionLabel(product.condition);
    const conditionColor = conditionColors[product.condition] || 'bg-gray-500';
    conditionBadge.innerHTML = `
        <span class="px-3 py-1 ${conditionColor} text-white text-sm font-semibold rounded-full">
            ${conditionLabel}
        </span>
    `;
    
    // 売り切れバッジ
    if (product.status === 'sold') {
        conditionBadge.innerHTML += `
            <span class="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full ml-2">
                SOLD OUT
            </span>
        `;
    }
    
    // 商品説明
    document.getElementById('product-description').textContent = product.description;
    
    // 商品詳細情報
    const categoryEl = document.getElementById('product-category');
    const partNumEl = document.getElementById('product-part-number');
    const stockEl = document.getElementById('product-stock');
    
    if (categoryEl) categoryEl.textContent = product.category_name || '-';
    if (partNumEl) partNumEl.textContent = product.part_number || '-';
    if (stockEl) stockEl.textContent = product.stock_quantity || '1';
    
    // 適合車両情報
    if (product.compatibility) {
        renderCompatibility();
    } else {
        const compatSection = document.getElementById('compatibility-section');
        if (compatSection) compatSection.style.display = 'none';
    }
    
    // 出品者情報
    renderSellerInfo();
    
    // 手数料表示
    renderFeeInfo();
}

// 手数料情報を表示
function renderFeeInfo() {
    const feeContainer = document.getElementById('fee-info');
    if (!feeContainer || !product) return;
    
    const price = Number(product.price);
    const platformFee = Math.floor(price * 0.10);
    const stripeFee = Math.floor(price * 0.036);
    const total = price + platformFee + stripeFee;
    
    feeContainer.innerHTML = `
        <div class="text-sm text-gray-600 mt-2 space-y-1">
            <div class="flex justify-between">
                <span>商品価格</span>
                <span>¥${price.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
                <span>手数料（10%）</span>
                <span>¥${platformFee.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
                <span>決済手数料（3.6%）</span>
                <span>¥${stripeFee.toLocaleString()}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-800 border-t pt-1">
                <span>お支払い合計</span>
                <span>¥${total.toLocaleString()}</span>
            </div>
        </div>
    `;
}

// 画像ギャラリーを表示
function renderImageGallery() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailsContainer = document.getElementById('image-thumbnails');
    
    if (!product.images || product.images.length === 0) {
        mainImage.src = 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image';
        thumbnailsContainer.innerHTML = '';
        return;
    }
    
    // メイン画像
    mainImage.src = product.images[0].image_url;
    mainImage.alt = product.title;
    
    // サムネイル（グリッド表示）
    thumbnailsContainer.innerHTML = product.images.map((img, index) => `
        <div class="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 ${index === 0 ? 'border-primary' : 'border-gray-200'} hover:border-primary transition-all shadow-sm hover:shadow-md"
             onclick="changeImage(${index})">
            <img src="${img.image_url}" 
                 alt="${product.title} - 画像${index + 1}"
                 class="w-full h-full object-cover"
                 loading="lazy">
        </div>
    `).join('');
}

// 画像を切り替え
function changeImage(index) {
    if (!product.images || index >= product.images.length) return;
    
    currentImageIndex = index;
    document.getElementById('main-product-image').src = product.images[index].image_url;
    
    // サムネイルのボーダーを更新
    const thumbnails = document.querySelectorAll('#image-thumbnails > div');
    thumbnails.forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.remove('border-gray-200');
            thumb.classList.add('border-primary');
        } else {
            thumb.classList.remove('border-primary');
            thumb.classList.add('border-gray-200');
        }
    });
}

// 適合車両情報を表示
function renderCompatibility() {
    const compat = product.compatibility;
    const container = document.getElementById('compatibility-info');
    if (!container) return;
    
    const html = `
        <div class="grid grid-cols-2 gap-4">
            ${compat.maker_id ? `
                <div>
                    <div class="text-sm text-gray-600">メーカー</div>
                    <div class="font-semibold">${product.maker_name || '-'}</div>
                </div>
            ` : ''}
            ${compat.model_id ? `
                <div>
                    <div class="text-sm text-gray-600">車種</div>
                    <div class="font-semibold">${product.model_name || '-'}</div>
                </div>
            ` : ''}
            ${compat.year_from || compat.year_to ? `
                <div>
                    <div class="text-sm text-gray-600">年式</div>
                    <div class="font-semibold">${compat.year_from || '?'}年 ～ ${compat.year_to || '?'}年</div>
                </div>
            ` : ''}
            ${compat.model_code ? `
                <div>
                    <div class="text-sm text-gray-600">型式</div>
                    <div class="font-semibold">${compat.model_code}</div>
                </div>
            ` : ''}
            ${compat.grade ? `
                <div>
                    <div class="text-sm text-gray-600">グレード</div>
                    <div class="font-semibold">${compat.grade}</div>
                </div>
            ` : ''}
            ${compat.engine_type ? `
                <div>
                    <div class="text-sm text-gray-600">エンジン</div>
                    <div class="font-semibold">${compat.engine_type}</div>
                </div>
            ` : ''}
        </div>
        ${compat.fitment_notes ? `
            <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="text-sm text-gray-700">
                    <i class="fas fa-info-circle text-yellow-600 mr-1"></i>
                    ${compat.fitment_notes}
                </div>
            </div>
        ` : ''}
    `;
    
    container.innerHTML = html;
}

// 出品者情報を表示
function renderSellerInfo() {
    const shopName = document.getElementById('seller-shop-name');
    const shopType = document.getElementById('seller-shop-type');
    const rating = document.getElementById('seller-rating');
    const verified = document.getElementById('seller-verified');
    
    if (shopName) shopName.textContent = product.shop_name || product.seller_name || product.company_name || '未設定';
    if (shopType) shopType.textContent = getShopTypeLabel(product.shop_type);
    if (rating) rating.textContent = product.rating ? Number(product.rating).toFixed(1) : '新規出品者';
    
    if (verified) {
        if (product.is_verified) {
            verified.innerHTML = '<span class="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded"><i class="fas fa-check-circle mr-1"></i>認証済み</span>';
        } else {
            verified.innerHTML = '';
        }
    }
}

// コンディションラベル
function getConditionLabel(condition) {
    const labels = {
        'new': '新品',
        'like_new': '未使用に近い',
        'excellent': '非常に良い',
        'good': '良い',
        'acceptable': '可',
        'junk': 'ジャンク品'
    };
    return labels[condition] || condition;
}

// ショップタイプラベル
function getShopTypeLabel(type) {
    const labels = {
        'factory': '整備工場',
        'dealer': 'ディーラー',
        'parts_shop': 'パーツショップ',
        'recycler': 'リサイクルショップ',
        'individual': '個人'
    };
    return labels[type] || type || '-';
}

// ===== 購入機能（Stripe Checkout） =====
async function purchaseProduct() {
    if (!product) {
        alert('商品情報を読み込んでいます...');
        return;
    }
    
    // ログインチェック
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
        if (confirm('購入するにはログインが必要です。ログインページに移動しますか？')) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
    }
    
    // 自分の商品チェック
    if (product.user_id == currentUser.id) {
        alert('自分の出品した商品は購入できません');
        return;
    }
    
    // 売り切れチェック
    if (product.status === 'sold') {
        alert('この商品は既に売り切れです');
        return;
    }
    
    // 確認ダイアログ
    const price = Number(product.price);
    const platformFee = Math.floor(price * 0.10);
    const stripeFee = Math.floor(price * 0.036);
    const total = price + platformFee + stripeFee;
    
    const confirmed = confirm(
        `「${product.title}」を購入しますか？\n\n` +
        `商品価格: ¥${price.toLocaleString()}\n` +
        `手数料: ¥${platformFee.toLocaleString()}\n` +
        `決済手数料: ¥${stripeFee.toLocaleString()}\n` +
        `━━━━━━━━━━━━━━\n` +
        `お支払い合計: ¥${total.toLocaleString()}\n\n` +
        `決済ページに移動します。`
    );
    
    if (!confirmed) return;
    
    // 購入ボタンを無効化
    const purchaseBtn = document.getElementById('purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>処理中...';
    }
    
    try {
        const response = await axios.post('/api/payment/create-checkout-session', {
            product_id: product.id
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.session_url) {
            // Stripeの決済ページにリダイレクト
            window.location.href = response.data.session_url;
        } else {
            alert(response.data.error || '決済の準備に失敗しました');
            resetPurchaseButton();
        }
    } catch (error) {
        console.error('Purchase error:', error);
        const errorMsg = error.response?.data?.error || '決済の準備に失敗しました。しばらく経ってから再度お試しください。';
        alert(errorMsg);
        resetPurchaseButton();
    }
}

function resetPurchaseButton() {
    const purchaseBtn = document.getElementById('purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>購入する';
    }
}

// ===== お気に入り（いいね）機能 =====
async function addToFavorites() {
    if (!product) return;
    
    // ログインチェック
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
        if (confirm('お気に入りに追加するにはログインが必要です。ログインページに移動しますか？')) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
    }
    
    const btn = document.getElementById('favorite-btn');
    const isFavorited = btn?.dataset.favorited === 'true';
    
    try {
        if (isFavorited) {
            // お気に入り解除
            await axios.delete(`/api/favorites/${product.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            updateFavoriteButton(false);
        } else {
            // お気に入り追加
            await axios.post('/api/favorites', {
                product_id: product.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            updateFavoriteButton(true);
        }
    } catch (error) {
        console.error('Favorite error:', error);
        const errorMsg = error.response?.data?.error || 'お気に入りの操作に失敗しました';
        alert(errorMsg);
    }
}

// ===== 出品者に問い合わせ（チャット）機能 =====
async function contactSeller() {
    if (!product) {
        alert('商品情報を読み込んでいます...');
        return;
    }
    
    // ログインチェック
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
        if (confirm('出品者に問い合わせるにはログインが必要です。ログインページに移動しますか？')) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
    }
    
    // 自分の商品チェック
    if (product.user_id == currentUser.id) {
        alert('自分の商品には問い合わせできません');
        return;
    }
    
    const contactBtn = document.getElementById('contact-btn');
    if (contactBtn) {
        contactBtn.disabled = true;
        contactBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>準備中...';
    }
    
    try {
        const response = await axios.post('/api/chat/rooms', {
            product_id: product.id,
            seller_id: product.user_id
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
            const roomId = response.data.data.id;
            window.location.href = `/chat/${roomId}`;
        } else {
            alert(response.data.error || 'チャットルームの作成に失敗しました');
            resetContactButton();
        }
    } catch (error) {
        console.error('Failed to create chat room:', error);
        alert('チャットルームの作成に失敗しました');
        resetContactButton();
    }
}

function resetContactButton() {
    const contactBtn = document.getElementById('contact-btn');
    if (contactBtn) {
        contactBtn.disabled = false;
        contactBtn.innerHTML = '<i class="fas fa-comment-dots mr-2"></i>出品者に問い合わせ';
    }
}

// エラー表示
function showError(message) {
    const container = document.getElementById('product-detail-container');
    if (container) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto py-20 text-center">
                <i class="fas fa-exclamation-circle text-6xl text-gray-400 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${message}</h2>
                <button onclick="window.location.href='/'" 
                        class="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all">
                    トップページに戻る
                </button>
            </div>
        `;
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
});
