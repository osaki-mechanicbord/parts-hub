// 商品詳細ページのJavaScript

let currentImageIndex = 0;
let product = null;

// URLからスラッグを取得
function getSlugFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// 商品データを読み込み
async function loadProduct() {
    const slug = getSlugFromUrl();
    
    try {
        const response = await axios.get(`/api/products/${slug}`);
        
        if (response.data.success) {
            product = response.data.data;
            renderProduct();
        } else {
            showError('商品が見つかりませんでした');
        }
    } catch (error) {
        console.error('Product load error:', error);
        showError('商品の読み込みに失敗しました');
    }
}

// 商品を表示
function renderProduct() {
    if (!product) return;
    
    // ページタイトル
    document.title = `${product.title} - PARTS HUB`;
    
    // 画像ギャラリー
    renderImageGallery();
    
    // 商品情報
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('product-price').textContent = `¥${Number(product.price).toLocaleString()}`;
    document.getElementById('product-description').textContent = product.description;
    
    // 商品詳細情報
    document.getElementById('product-condition').textContent = getConditionLabel(product.condition);
    document.getElementById('product-stock').textContent = product.stock_quantity;
    document.getElementById('product-category').textContent = product.category_name || '-';
    document.getElementById('product-part-number').textContent = product.part_number || '-';
    document.getElementById('product-view-count').textContent = product.view_count;
    
    // 適合車両情報
    if (product.compatibility) {
        renderCompatibility();
    } else {
        document.getElementById('compatibility-section').style.display = 'none';
    }
    
    // 出品者情報
    renderSellerInfo();
}

// 画像ギャラリーを表示
function renderImageGallery() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailsContainer = document.getElementById('image-thumbnails');
    
    if (!product.images || product.images.length === 0) {
        mainImage.src = '/static/placeholder.jpg';
        thumbnailsContainer.innerHTML = '';
        return;
    }
    
    // メイン画像
    mainImage.src = product.images[0].image_url;
    mainImage.alt = product.title;
    
    // サムネイル
    thumbnailsContainer.innerHTML = product.images.map((img, index) => `
        <img src="${img.image_url}" 
             alt="${product.title} - 画像${index + 1}"
             class="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${index === 0 ? 'border-primary' : 'border-gray-200'} hover:border-primary transition-all"
             onclick="changeImage(${index})">
    `).join('');
}

// 画像を切り替え
function changeImage(index) {
    if (!product.images || index >= product.images.length) return;
    
    currentImageIndex = index;
    document.getElementById('main-product-image').src = product.images[index].image_url;
    
    // サムネイルのボーダーを更新
    const thumbnails = document.querySelectorAll('#image-thumbnails img');
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
    
    shopName.textContent = product.shop_name || '未設定';
    shopType.textContent = getShopTypeLabel(product.shop_type);
    rating.textContent = product.rating ? product.rating.toFixed(1) : '未評価';
    
    if (product.is_verified) {
        verified.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i>認証済み';
    } else {
        verified.innerHTML = '<span class="text-gray-500">未認証</span>';
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
    return labels[type] || type;
}

// お気に入りに追加
function addToFavorites() {
    // TODO: お気に入り機能の実装
    alert('お気に入り機能は近日公開予定です');
}

// 購入ボタン
function purchaseProduct() {
    // TODO: 購入機能の実装
    alert('購入機能は近日公開予定です');
}

// 出品者に問い合わせ
function contactSeller() {
    // TODO: メッセージ機能の実装
    alert('メッセージ機能は近日公開予定です');
}

// エラー表示
function showError(message) {
    document.getElementById('product-detail-container').innerHTML = `
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

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
});
