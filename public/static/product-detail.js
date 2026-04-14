// 商品詳細ページのJavaScript

// 消費税率 (10%)
const TAX_RATE = 0.10;

// 税込み価格を計算（税抜き価格から）
function calcTaxIncluded(priceExcludingTax) {
    return Math.round(Number(priceExcludingTax || 0) * (1 + TAX_RATE));
}

// 消費税額を計算
function calcTaxAmount(priceExcludingTax) {
    return Math.round(Number(priceExcludingTax || 0) * TAX_RATE);
}

// 価格を税込みでフォーマット表示
function formatPriceTaxIncluded(priceExcludingTax) {
    return '¥' + calcTaxIncluded(priceExcludingTax).toLocaleString();
}

let currentImageIndex = 0;
let product = null;
let currentUser = null;

// URLからIDを取得
function getIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// 認証ヘッダーを取得
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
}

// ログインページにリダイレクト
function redirectToLogin() {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
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
            currentUser = response.data.user || response.data.data;
            return currentUser;
        }
    } catch (error) {
        console.warn('認証確認失敗:', error?.response?.status || error.message);
        // 401の場合のみトークンを削除（ネットワークエラー等では保持）
        if (error?.response?.status === 401) {
            localStorage.removeItem('token');
        }
    }
    return null;
}

// ログインチェック（必要に応じて再取得を試みる）
async function ensureLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    if (currentUser) return true;
    
    // currentUserがnullの場合、再取得を試みる
    const user = await getCurrentUser();
    return !!user;
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
            // パンくずリストにタイトルをセット
            var bcTitle = document.getElementById('bc-product-title');
            if (bcTitle && product.title) bcTitle.textContent = product.title;
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
    const negotiateBtn = document.getElementById('negotiate-btn');
    
    if (!product) return;
    
    // 売り切れの場合
    if (product.status === 'sold') {
        if (purchaseBtn) {
            purchaseBtn.disabled = true;
            purchaseBtn.onclick = null;
            purchaseBtn.style.pointerEvents = 'none';
            purchaseBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>SOLD OUT';
            purchaseBtn.classList.remove('bg-primary', 'hover:bg-primary-dark');
            purchaseBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
        
        // SOLD OUTバナーを追加
        var banner = document.createElement('div');
        banner.style.cssText = 'background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;text-align:center;padding:12px;font-weight:800;font-size:16px;letter-spacing:2px;';
        banner.innerHTML = '<i class="fas fa-ban" style="margin-right:8px;"></i>SOLD OUT - この商品は売り切れです';
        var main = document.getElementById('product-detail-container');
        if (main && main.parentNode) {
            main.parentNode.insertBefore(banner, main);
        }
        
        if (contactBtn) {
            contactBtn.style.display = 'none';
        }

        // 値下げ交渉ボタンを無効化
        if (negotiateBtn) {
            negotiateBtn.disabled = true;
            negotiateBtn.onclick = null;
            negotiateBtn.style.pointerEvents = 'none';
            negotiateBtn.innerHTML = '<i class="fas fa-tag mr-2"></i>値下げ交渉（売り切れ）';
            negotiateBtn.classList.remove('border-blue-500', 'text-blue-600', 'hover:bg-blue-50');
            negotiateBtn.classList.add('border-gray-300', 'text-gray-400', 'bg-gray-100', 'cursor-not-allowed');
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
        // 自分の商品には値下げ交渉不要
        if (negotiateBtn) {
            negotiateBtn.style.display = 'none';
        }
    }
}

// お気に入り状態をチェック
async function checkFavoriteStatus() {
    if (!currentUser || !product) return;
    
    try {
        const response = await axios.get(`/api/favorites/check/${product.id}/${currentUser.id}`);
        if (response.data.success) {
            updateFavoriteButton(response.data.data.is_favorited);
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
    
    // 価格（税込み表示）
    const priceExTax = Number(product.price);
    const taxAmount = calcTaxAmount(priceExTax);
    const priceIncTax = calcTaxIncluded(priceExTax);
    document.getElementById('product-price').textContent = `¥${priceIncTax.toLocaleString()}`;
    
    // 税抜き価格の内訳表示
    const taxDetailEl = document.getElementById('tax-detail');
    if (taxDetailEl) {
        taxDetailEl.innerHTML = `<span class="text-xs text-gray-500">（税抜 ¥${priceExTax.toLocaleString()} + 消費税 ¥${taxAmount.toLocaleString()}）</span>`;
    }
    
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
    
    // 送料負担表示
    const shippingEl = document.getElementById('product-shipping-type');
    const priceLabelEl = document.getElementById('product-price-label');
    if (shippingEl) {
        if (product.shipping_type === 'seller_paid') {
            shippingEl.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold"><i class="fas fa-check-circle"></i>送料込み（出品者負担）</span>';
            if (priceLabelEl) priceLabelEl.textContent = '（税込・送料込）';
        } else {
            shippingEl.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"><i class="fas fa-box"></i>着払い（購入者負担）</span>';
            if (priceLabelEl) priceLabelEl.textContent = '（税込・送料別）';
        }
    }
    
    // 汎用品バッジ表示
    if (product.is_universal) {
        var universalRow = document.getElementById('product-universal-row');
        if (universalRow) universalRow.style.display = '';
    }

    // 製品スペック情報の表示
    renderProductSpecs(product);
    
    // 適合車両情報
    if (product.compatibility) {
        renderCompatibility();
    } else {
        const compatSection = document.getElementById('compatibility-section');
        if (compatSection) compatSection.style.display = 'none';
    }
    
    // OEM品番情報（ARGOS JPC連携）
    renderOemParts();
    
    // 出品者情報
    renderSellerInfo();
    
    // 手数料表示
    renderFeeInfo();
    
    // シェアボタン
    setupShareButtons();
}

// 手数料情報を表示
function renderFeeInfo() {
    const feeContainer = document.getElementById('fee-info');
    if (!feeContainer || !product) return;
    
    const priceExTax = Number(product.price);
    const taxAmount = calcTaxAmount(priceExTax);
    const priceIncTax = calcTaxIncluded(priceExTax);
    const cardFee = 330;
    
    feeContainer.innerHTML = `
        <div class="text-sm text-gray-600 mt-2 space-y-1">
            <div class="flex justify-between">
                <span>商品価格（税抜）</span>
                <span>¥${priceExTax.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
                <span>消費税（10%）</span>
                <span>¥${taxAmount.toLocaleString()}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-800 border-t pt-1">
                <span>商品価格（税込）</span>
                <span>¥${priceIncTax.toLocaleString()}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                <i class="fas fa-credit-card mr-1"></i>カード決済時は別途決済手数料¥${cardFee.toLocaleString()}（税込）がかかります
            </div>
            <div class="text-xs text-gray-500">
                <i class="fas fa-university mr-1"></i>銀行振込時は振込手数料（各金融機関により異なる）がかかります
            </div>
            <div class="text-xs text-green-600 mt-1">
                <i class="fas fa-check-circle mr-1"></i>サービス手数料（販売手数料10%）は出品者が負担 — 購入者の負担なし
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
            <img loading="lazy" src="${img.image_url}" 
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

// OEM品番情報を表示（ARGOS JPC連携）
function renderOemParts() {
    const section = document.getElementById('oem-parts-section');
    const list = document.getElementById('oem-parts-list');
    if (!section || !list) return;
    
    if (!product.oem_parts || product.oem_parts.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = '';
    
    const html = product.oem_parts.map(function(part) {
        const compatParts = part.compatible_part_numbers 
            ? part.compatible_part_numbers.split(',').filter(Boolean)
            : [];
        
        return `
            <div style="background:#fafafa; border:1px solid #f0f0f0; border-radius:8px; padding:10px 12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                        <code style="font-size:13px; font-weight:700; color:#1e293b; letter-spacing:0.5px; white-space:nowrap;">${part.oem_part_number}</code>
                        ${part.part_name ? `<span style="font-size:12px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${part.part_name}</span>` : ''}
                    </div>
                    ${part.reference_price ? `<span style="font-size:12px; color:#059669; font-weight:600; white-space:nowrap;">参考 ¥${Number(part.reference_price).toLocaleString()}</span>` : ''}
                </div>
                ${part.group_name || part.subgroup_name ? `
                    <div style="font-size:11px; color:#9ca3af; margin-top:4px;">
                        <i class="fas fa-folder-open" style="margin-right:3px;"></i>${part.group_name || ''}${part.subgroup_name ? ' > ' + part.subgroup_name : ''}
                    </div>
                ` : ''}
                ${compatParts.length > 0 ? `
                    <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                        <span style="font-size:10px; color:#9ca3af;">互換:</span>
                        ${compatParts.map(function(cp) {
                            return '<code style="font-size:10px; background:#e0f2fe; color:#0369a1; padding:1px 6px; border-radius:4px;">' + cp.trim() + '</code>';
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    list.innerHTML = html;
}

// 出品者情報を表示
function renderSellerInfo() {
    const shopName = document.getElementById('seller-shop-name');
    const shopType = document.getElementById('seller-shop-type');
    const verified = document.getElementById('seller-verified');
    const shopLink = document.getElementById('seller-shop-link');
    
    const displayName = product.shop_name || product.seller_name || product.company_name || '未設定';
    if (shopName) shopName.textContent = displayName;
    if (shopType) shopType.textContent = getShopTypeLabel(product.shop_type);
    
    // 出品者プロフィールリンク
    if (shopLink && product.user_id) {
        shopLink.href = '/seller/' + product.user_id;
    }
    
    if (verified) {
        if (product.is_verified) {
            verified.innerHTML = '<span class="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded"><i class="fas fa-check-circle mr-0.5"></i>認証済み</span>';
        } else {
            verified.innerHTML = '';
        }
    }

    // レビューサマリーを非同期で読み込む
    if (product.user_id) {
        loadSellerReviewSummary(product.user_id);
    }
}

// 出品者レビューサマリーを読み込み
async function loadSellerReviewSummary(sellerId) {
    try {
        const res = await axios.get('/api/reviews/seller/' + sellerId + '/summary');
        if (!res.data.success) return;
        const d = res.data.data;

        // バッジ表示
        const badgeArea = document.getElementById('seller-badge-area');
        if (badgeArea && d.badge) {
            const b = d.badge;
            badgeArea.innerHTML = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style="background:' + b.bgColor + ';color:' + b.color + '"><i class="fas ' + b.icon + ' mr-1"></i>' + b.label + '</span>';
        }

        // 星表示
        const starsEl = document.getElementById('seller-stars');
        if (starsEl) {
            let starsHtml = '';
            const avg = d.avg_rating;
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(avg)) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else if (i - avg < 1 && i - avg > 0) {
                    starsHtml += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    starsHtml += '<i class="far fa-star text-gray-300"></i>';
                }
            }
            starsEl.innerHTML = starsHtml;
        }

        // 評価数値
        const ratingEl = document.getElementById('seller-rating');
        if (ratingEl) ratingEl.textContent = d.avg_rating > 0 ? d.avg_rating.toFixed(1) : '新規';

        // レビュー件数
        const countEl = document.getElementById('seller-review-count');
        if (countEl) countEl.textContent = 'レビュー ' + d.total_reviews + '件';

        // 取引完了数
        const txEl = document.getElementById('seller-tx-count');
        if (txEl) txEl.textContent = d.completed_transactions;

        // 全レビューリンク
        const allLink = document.getElementById('seller-all-reviews-link');
        if (allLink) allLink.href = '/seller/' + sellerId;

        // 評価バー（5→1の順）
        const barsEl = document.getElementById('seller-rating-bars');
        if (barsEl && d.total_reviews > 0) {
            const dist = d.distribution;
            const labels = [
                { star: 5, count: dist.five },
                { star: 4, count: dist.four },
                { star: 3, count: dist.three },
                { star: 2, count: dist.two },
                { star: 1, count: dist.one }
            ];
            barsEl.innerHTML = labels.map(function(item) {
                const pct = d.total_reviews > 0 ? Math.round((item.count / d.total_reviews) * 100) : 0;
                return '<div class="flex items-center gap-1.5 text-xs"><span class="w-3 text-gray-500">' + item.star + '</span><div class="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden"><div class="bg-yellow-400 h-full rounded-full transition-all" style="width:' + pct + '%"></div></div><span class="w-6 text-right text-gray-400">' + item.count + '</span></div>';
            }).join('');
        } else if (barsEl) {
            barsEl.innerHTML = '<p class="text-xs text-gray-400 text-center py-1">まだレビューはありません</p>';
        }

        // 直近レビュー表示（最新1件）
        const latestEl = document.getElementById('seller-latest-review');
        if (latestEl && d.recent_reviews && d.recent_reviews.length > 0) {
            const r = d.recent_reviews[0];
            const stars = Array.from({length: 5}, function(_, i) {
                return i < r.rating ? '<i class="fas fa-star text-yellow-400"></i>' : '<i class="far fa-star text-gray-300"></i>';
            }).join('');
            const date = new Date(r.created_at);
            const dateStr = date.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
            latestEl.classList.remove('hidden');
            latestEl.innerHTML = '<div class="bg-gray-50 rounded-lg p-3"><div class="flex items-center justify-between mb-1"><div class="flex items-center gap-1 text-xs">' + stars + '</div><span class="text-[10px] text-gray-400">' + dateStr + '</span></div><p class="text-xs text-gray-600 line-clamp-2">' + (r.comment || '').substring(0, 80) + (r.comment && r.comment.length > 80 ? '...' : '') + '</p><p class="text-[10px] text-gray-400 mt-1">' + (r.reviewer_name || '匿名') + ' - ' + (r.product_title || '') + '</p></div>';
        }
    } catch(e) {
        console.log('レビューサマリー取得スキップ:', e.message);
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

// ===== 購入機能（支払い方法選択） =====
async function purchaseProduct() {
    if (!product) {
        alert('商品情報を読み込んでいます...');
        return;
    }
    
    // ログインチェック
    const loggedIn = await ensureLoggedIn();
    const token = localStorage.getItem('token');
    
    if (!loggedIn || !token) {
        if (confirm('購入するにはログインが必要です。ログインページに移動しますか？')) {
            redirectToLogin();
        }
        return;
    }
    
    // 自分の商品チェック
    if (currentUser && product.user_id == currentUser.id) {
        alert('自分の出品した商品は購入できません');
        return;
    }
    
    // 売り切れチェック
    if (product.status === 'sold') {
        alert('この商品は既に売り切れです');
        return;
    }
    
    // 金額計算
    const priceExTax = Number(product.price);
    const taxAmount = calcTaxAmount(priceExTax);
    const priceIncTax = calcTaxIncluded(priceExTax);
    const platformFee = 0; // 購入者のサービス手数料は無料（出品者負担）
    const cardProcessingFee = 330; // カード決済手数料¥330（税込）購入者負担
    const totalCard = priceIncTax + cardProcessingFee;
    const totalBank = priceIncTax; // 銀行振込は商品価格のみ（振込手数料は別途購入者負担）
    
    // 支払い方法選択モーダルを表示
    showPaymentMethodModal(priceExTax, taxAmount, priceIncTax, platformFee, cardProcessingFee, totalCard, totalBank);
}

function showPaymentMethodModal(priceExTax, taxAmount, priceIncTax, platformFee, cardProcessingFee, totalCard, totalBank) {
    // 既存モーダルがあれば削除
    const existing = document.getElementById('payment-method-modal');
    if (existing) existing.remove();
    
    // グローバルに金額を保持（toggleで使う）
    window._paymentAmounts = { priceExTax, taxAmount, priceIncTax, platformFee, cardProcessingFee, totalCard, totalBank };
    
    const modal = document.createElement('div');
    modal.id = 'payment-method-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;max-width:520px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
            <div style="padding:24px 24px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h2 style="font-size:20px;font-weight:bold;color:#111;">お支払い方法の選択</h2>
                    <button onclick="closePaymentModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
                </div>
                
                <!-- 支払い方法選択 -->
                <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
                    <!-- カード決済 -->
                    <label id="method-card-label" style="display:flex;align-items:flex-start;padding:16px;border:2px solid #3b82f6;border-radius:12px;cursor:pointer;background:#eff6ff;transition:all 0.2s;">
                        <input type="radio" name="payment_method" value="card" checked onchange="togglePaymentMethod()" style="margin-right:12px;margin-top:2px;width:18px;height:18px;flex-shrink:0;">
                        <i class="fas fa-credit-card" style="font-size:24px;color:#3b82f6;margin-right:12px;flex-shrink:0;margin-top:2px;"></i>
                        <div>
                            <div style="font-weight:bold;color:#111;">クレジットカード決済</div>
                            <div style="font-size:12px;color:#666;">Visa / Mastercard / JCB / Amex — 即時決済</div>
                            <div style="font-size:12px;color:#b45309;font-weight:600;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>決済手数料 ¥330（税込）</div>
                        </div>
                    </label>
                    
                    <!-- 銀行振込 -->
                    <label id="method-invoice-label" style="display:flex;align-items:flex-start;padding:16px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;background:#fff;transition:all 0.2s;">
                        <input type="radio" name="payment_method" value="invoice" onchange="togglePaymentMethod()" style="margin-right:12px;margin-top:2px;width:18px;height:18px;flex-shrink:0;">
                        <i class="fas fa-university" style="font-size:24px;color:#10b981;margin-right:12px;flex-shrink:0;margin-top:2px;"></i>
                        <div>
                            <div style="font-weight:bold;color:#111;">銀行振込</div>
                            <div style="font-size:12px;color:#666;">振込確認後に発送</div>
                            <div style="font-size:12px;color:#b45309;font-weight:600;margin-top:4px;">※ 振込手数料は購入者様のご負担となります</div>
                        </div>
                    </label>
                </div>
                
                <!-- 金額内訳 -->
                <div id="fee-breakdown" style="background:#f8f9fa;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#666;">商品価格（税抜）</span><span>¥${priceExTax.toLocaleString()}</span></div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#666;">消費税（10%）</span><span>¥${taxAmount.toLocaleString()}</span></div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#10b981;"><i class="fas fa-check-circle" style="margin-right:4px;"></i>サービス手数料</span><span style="color:#10b981;font-weight:600;">¥0（出品者負担）</span></div>
                    <div id="card-fee-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#666;">カード決済手数料</span><span>¥${cardProcessingFee.toLocaleString()}</span></div>
                    <div style="border-top:2px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between;">
                        <span style="font-weight:bold;font-size:16px;">お支払い合計</span>
                        <span id="total-amount-display" style="font-weight:bold;font-size:18px;color:#ef4444;">¥${totalCard.toLocaleString()}</span>
                    </div>
                    <div id="bank-fee-note" style="display:none;margin-top:8px;padding:8px;background:#fefce8;border-radius:6px;">
                        <p style="font-size:11px;color:#92400e;margin:0;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>上記に加え、振込手数料が別途かかります（金融機関により異なります）</p>
                    </div>
                </div>
                
                <!-- 銀行振込フォーム（非表示） -->
                <div id="invoice-form-section" style="display:none;margin-bottom:20px;">
                    <h3 style="font-weight:bold;margin-bottom:12px;color:#111;"><i class="fas fa-building" style="color:#10b981;margin-right:8px;"></i>請求先情報</h3>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <div>
                            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">会社名・氏名 <span style="color:#ef4444;">*</span></label>
                            <input type="text" id="inv-company" placeholder="例：株式会社○○自動車 / 山田太郎" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">担当者名</label>
                            <input type="text" id="inv-contact" placeholder="例：山田 太郎" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">住所</label>
                            <input type="text" id="inv-address" placeholder="例：東京都○○区..." style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div>
                                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">メール</label>
                                <input type="email" id="inv-email" placeholder="example@co.jp" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">電話番号</label>
                                <input type="tel" id="inv-phone" placeholder="03-xxxx-xxxx" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
                            </div>
                        </div>
                    </div>
                    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-top:12px;">
                        <p style="font-size:12px;color:#92400e;margin:0 0 8px;"><i class="fas fa-info-circle" style="margin-right:6px;"></i><strong>振込先情報</strong></p>
                        <p style="font-size:12px;color:#92400e;margin:0;line-height:1.8;">
                            PayPay銀行　ビジネス営業部　店番号 005<br>
                            普通　口座番号 1460031<br>
                            振込期限：注文後7日間<br>
                            入金が確認され次第、商品を発送いたします。<br>
                            ※ 振込手数料はお客様負担となります。
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- ボタン -->
            <div style="padding:0 24px 24px;display:flex;gap:12px;">
                <button onclick="closePaymentModal()" style="flex:1;padding:14px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:15px;cursor:pointer;color:#374151;">キャンセル</button>
                <button id="confirm-purchase-btn" onclick="confirmPurchase()" style="flex:2;padding:14px;border:none;border-radius:10px;background:#ef4444;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;">
                    <i class="fas fa-credit-card" style="margin-right:8px;"></i>カード決済で購入
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePaymentModal();
    });
}

function togglePaymentMethod() {
    const cardLabel = document.getElementById('method-card-label');
    const invoiceLabel = document.getElementById('method-invoice-label');
    const invoiceForm = document.getElementById('invoice-form-section');
    const confirmBtn = document.getElementById('confirm-purchase-btn');
    const cardFeeRow = document.getElementById('card-fee-row');
    const totalDisplay = document.getElementById('total-amount-display');
    const bankFeeNote = document.getElementById('bank-fee-note');
    const selected = document.querySelector('input[name="payment_method"]:checked')?.value;
    const amounts = window._paymentAmounts || {};
    
    if (selected === 'invoice') {
        // 銀行振込選択
        cardLabel.style.border = '2px solid #e5e7eb';
        cardLabel.style.background = '#fff';
        invoiceLabel.style.border = '2px solid #10b981';
        invoiceLabel.style.background = '#ecfdf5';
        invoiceForm.style.display = 'block';
        confirmBtn.innerHTML = '<i class="fas fa-file-invoice-dollar" style="margin-right:8px;"></i>銀行振込で注文する';
        confirmBtn.style.background = '#10b981';
        // 合計金額を銀行振込金額に切替（カード手数料なし、振込手数料は別途）
        if (cardFeeRow) cardFeeRow.style.display = 'none';
        if (totalDisplay) totalDisplay.textContent = '¥' + (amounts.totalBank || 0).toLocaleString();
        if (bankFeeNote) bankFeeNote.style.display = 'block';
    } else {
        // カード決済選択
        cardLabel.style.border = '2px solid #3b82f6';
        cardLabel.style.background = '#eff6ff';
        invoiceLabel.style.border = '2px solid #e5e7eb';
        invoiceLabel.style.background = '#fff';
        invoiceForm.style.display = 'none';
        confirmBtn.innerHTML = '<i class="fas fa-credit-card" style="margin-right:8px;"></i>カード決済で購入する';
        confirmBtn.style.background = '#ef4444';
        // 合計金額をカード金額に切替（カード手数料¥330含む）
        if (cardFeeRow) cardFeeRow.style.display = 'flex';
        if (totalDisplay) totalDisplay.textContent = '¥' + (amounts.totalCard || 0).toLocaleString();
        if (bankFeeNote) bankFeeNote.style.display = 'none';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-method-modal');
    if (modal) modal.remove();
}

async function confirmPurchase() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const method = document.querySelector('input[name="payment_method"]:checked')?.value || 'card';
    const confirmBtn = document.getElementById('confirm-purchase-btn');
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>処理中...';
    }
    
    try {
        if (method === 'card') {
            // Stripe Checkout
            const response = await axios.post('/api/payment/create-checkout-session', {
                product_id: product.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success && response.data.session_url) {
                window.location.href = response.data.session_url;
            } else {
                alert(response.data.error || '決済の準備に失敗しました');
                resetConfirmButton(method);
            }
        } else {
            // 請求書払い
            const companyName = document.getElementById('inv-company')?.value?.trim();
            if (!companyName) {
                alert('会社名は必須です');
                resetConfirmButton(method);
                return;
            }
            
            const billingInfo = {
                company_name: companyName,
                contact_name: document.getElementById('inv-contact')?.value?.trim() || '',
                address: document.getElementById('inv-address')?.value?.trim() || '',
                email: document.getElementById('inv-email')?.value?.trim() || '',
                phone: document.getElementById('inv-phone')?.value?.trim() || ''
            };
            
            const response = await axios.post('/api/payment/create-invoice-order', {
                product_id: product.id,
                billing_info: billingInfo
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                closePaymentModal();
                // 注文完了メッセージ
                showInvoiceOrderComplete(response.data);
            } else {
                alert(response.data.error || '注文の作成に失敗しました');
                resetConfirmButton(method);
            }
        }
    } catch (error) {
        console.error('Purchase error:', error);
        if (error?.response?.status === 401) {
            localStorage.removeItem('token');
            currentUser = null;
            closePaymentModal();
            if (confirm('ログインセッションが切れました。再度ログインしますか？')) {
                redirectToLogin();
            }
            return;
        }
        const errorMsg = error.response?.data?.error || '処理に失敗しました。しばらく経ってから再度お試しください。';
        alert(errorMsg);
        resetConfirmButton(method);
    }
}

function resetConfirmButton(method) {
    const btn = document.getElementById('confirm-purchase-btn');
    if (!btn) return;
    btn.disabled = false;
    if (method === 'invoice') {
        btn.innerHTML = '<i class="fas fa-file-invoice-dollar" style="margin-right:8px;"></i>銀行振込で注文する';
        btn.style.background = '#10b981';
    } else {
        btn.innerHTML = '<i class="fas fa-credit-card" style="margin-right:8px;"></i>カード決済で購入する';
        btn.style.background = '#ef4444';
    }
}

function showInvoiceOrderComplete(data) {
    const dueDate = data.invoice_due_date ? new Date(data.invoice_due_date).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '7日以内';
    
    const overlay = document.createElement('div');
    overlay.id = 'invoice-complete-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;max-width:520px;width:90%;max-height:90vh;overflow-y:auto;padding:32px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
            <div style="width:64px;height:64px;background:#ecfdf5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <i class="fas fa-check" style="font-size:28px;color:#10b981;"></i>
            </div>
            <h2 style="font-size:20px;font-weight:bold;color:#111;margin-bottom:8px;">注文を受け付けました</h2>
            <p style="color:#666;margin-bottom:20px;">銀行振込を選択されましたので、こちらにお振込をお願いします。</p>
            
            <!-- 振込先口座情報 -->
            <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:20px;text-align:left;margin-bottom:20px;">
                <h3 style="font-size:16px;font-weight:bold;color:#1e40af;margin:0 0 16px;text-align:center;">
                    <i class="fas fa-university" style="margin-right:8px;"></i>振込先口座情報
                </h3>
                <table style="width:100%;border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #bfdbfe;">
                        <td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">金融機関名</td>
                        <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">PayPay銀行</td>
                    </tr>
                    <tr style="border-bottom:1px solid #bfdbfe;">
                        <td style="padding:8px 0;color:#64748b;font-size:13px;">支店名</td>
                        <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">ビジネス営業部</td>
                    </tr>
                    <tr style="border-bottom:1px solid #bfdbfe;">
                        <td style="padding:8px 0;color:#64748b;font-size:13px;">店番号</td>
                        <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">005</td>
                    </tr>
                    <tr style="border-bottom:1px solid #bfdbfe;">
                        <td style="padding:8px 0;color:#64748b;font-size:13px;">口座種別</td>
                        <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">普通</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:13px;">口座番号</td>
                        <td style="padding:8px 0;font-weight:bold;color:#111;font-size:18px;letter-spacing:2px;">1460031</td>
                    </tr>
                </table>
            </div>
            
            <!-- 注文情報 -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:left;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="color:#666;font-size:14px;">請求書番号</span>
                    <span style="font-weight:bold;color:#111;">${data.invoice_number}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="color:#666;font-size:14px;">お振込金額</span>
                    <span style="font-weight:bold;color:#ef4444;font-size:18px;">¥${data.fees?.total?.toLocaleString() || '-'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;font-size:14px;">振込期限</span>
                    <span style="font-weight:bold;color:#f59e0b;">${dueDate}</span>
                </div>
            </div>
            
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:20px;text-align:left;">
                <p style="font-size:13px;color:#92400e;line-height:1.6;margin:0;">
                    <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                    入金が確認され次第、商品を発送いたします。<br>
                    振込先情報はご登録メールアドレスにもお送りしております。<br>
                    ※ 振込手数料はお客様のご負担となります。
                </p>
            </div>
            
            <button onclick="document.getElementById('invoice-complete-overlay').remove(); location.href='/transactions/${data.transaction_id}'" style="width:100%;padding:14px;border:none;border-radius:10px;background:#10b981;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;">
                <i class="fas fa-clipboard-list" style="margin-right:8px;"></i>取引詳細を確認する
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ===== お気に入り（いいね）機能 =====
async function addToFavorites() {
    if (!product) return;
    
    // ログインチェック
    const loggedIn = await ensureLoggedIn();
    const token = localStorage.getItem('token');
    
    if (!loggedIn || !token) {
        if (confirm('お気に入りに追加するにはログインが必要です。ログインページに移動しますか？')) {
            redirectToLogin();
        }
        return;
    }
    
    const btn = document.getElementById('favorite-btn');
    const isFavorited = btn?.dataset.favorited === 'true';
    
    try {
        // POST /api/favorites はトグル動作（追加済みなら解除、未追加なら追加）
        const response = await axios.post('/api/favorites', {
            product_id: product.id
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
            updateFavoriteButton(response.data.action === 'added');
        }
    } catch (error) {
        console.error('Favorite error:', error);
        if (error?.response?.status === 401) {
            localStorage.removeItem('token');
            currentUser = null;
            if (confirm('ログインセッションが切れました。再度ログインしますか？')) {
                redirectToLogin();
            }
            return;
        }
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
    const loggedIn = await ensureLoggedIn();
    const token = localStorage.getItem('token');
    
    if (!loggedIn || !token) {
        if (confirm('出品者に問い合わせるにはログインが必要です。ログインページに移動しますか？')) {
            redirectToLogin();
        }
        return;
    }
    
    // 自分の商品チェック
    if (currentUser && product.user_id == currentUser.id) {
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
        if (error?.response?.status === 401) {
            localStorage.removeItem('token');
            currentUser = null;
            if (confirm('ログインセッションが切れました。再度ログインしますか？')) {
                redirectToLogin();
            }
            return;
        }
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

// シェアボタンURL設定
function setupShareButtons() {
    if (!product) return;
    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(product.title + ' - PARTS HUB');
    var lineBtn = document.getElementById('share-line');
    if (lineBtn) lineBtn.href = 'https://social-plugins.line.me/lineit/share?url=' + url;
    var xBtn = document.getElementById('share-x');
    if (xBtn) xBtn.href = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
    var fbBtn = document.getElementById('share-facebook');
    if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
}

function copyProductUrl() {
    navigator.clipboard.writeText(window.location.href).then(function() {
        var btn = document.getElementById('share-copy');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check text-sm"></i>';
            btn.classList.add('bg-green-200', 'text-green-700');
            setTimeout(function() {
                btn.innerHTML = '<i class="fas fa-link text-sm"></i>';
                btn.classList.remove('bg-green-200', 'text-green-700');
            }, 2000);
        }
    });
}

// 製品スペック情報を表示
function renderProductSpecs(product) {
    var section = document.getElementById('product-specs-section');
    if (!section) return;

    var mfrName = product.manufacturer_name || product.manufacturer || null;
    var hasAnySpec = product.jan_code || mfrName || product.part_number || product.product_number || product.manufacturer_url;
    if (!hasAnySpec) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';

    // JANコード
    if (product.jan_code) {
        var row = document.getElementById('spec-jan-code-row');
        var val = document.getElementById('spec-jan-code');
        if (row) row.style.display = '';
        if (val) val.textContent = product.jan_code;
    }

    // メーカー名
    if (mfrName) {
        var row = document.getElementById('spec-manufacturer-row');
        var val = document.getElementById('spec-manufacturer');
        if (row) row.style.display = '';
        if (val) val.textContent = mfrName;
    }

    // 品番 (part_number は既存フィールドだが、スペック欄にも表示)
    if (product.part_number) {
        var row = document.getElementById('spec-part-number-row');
        var val = document.getElementById('spec-part-number');
        if (row) row.style.display = '';
        if (val) val.textContent = product.part_number;
    }

    // 製品番号
    if (product.product_number) {
        var row = document.getElementById('spec-product-number-row');
        var val = document.getElementById('spec-product-number');
        if (row) row.style.display = '';
        if (val) val.textContent = product.product_number;
    }

    // メーカーページリンク
    if (product.manufacturer_url) {
        var row = document.getElementById('spec-manufacturer-url-row');
        var link = document.getElementById('spec-manufacturer-link');
        if (row) row.style.display = '';
        if (link) {
            link.href = product.manufacturer_url;
            // ドメイン名を表示してわかりやすく
            try {
                var domain = new URL(product.manufacturer_url).hostname.replace('www.', '');
                link.innerHTML = '<i class="fas fa-external-link-alt"></i>' + domain + ' で確認する';
            } catch(e) {
                link.innerHTML = '<i class="fas fa-external-link-alt"></i>カタログを確認する';
            }
        }
    }
}
