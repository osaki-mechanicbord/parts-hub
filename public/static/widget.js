/**
 * PARTS HUB 埋め込みウィジェット v1.0
 * 外部サイトに貼り付けてパーツ検索機能を提供
 * 
 * 使い方:
 * <div id="parts-hub-widget"></div>
 * <script src="https://parts-hub-tci.com/static/widget.js" data-theme="light" data-category="all"></script>
 */
(function() {
  'use strict';
  
  // 設定
  var SCRIPT = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  var BASE_URL = 'https://parts-hub-tci.com';
  var THEME = SCRIPT.getAttribute('data-theme') || 'light';
  var CATEGORY = SCRIPT.getAttribute('data-category') || 'all';
  var TARGET_ID = SCRIPT.getAttribute('data-target') || 'parts-hub-widget';
  var COMPACT = SCRIPT.getAttribute('data-compact') === 'true';
  var MAX_RESULTS = parseInt(SCRIPT.getAttribute('data-max-results') || '6');

  // スタイル注入
  var style = document.createElement('style');
  style.textContent = [
    '.phw{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans JP",sans-serif;border-radius:12px;overflow:hidden;max-width:480px;margin:0 auto}',
    '.phw-light{background:#fff;border:1px solid #e5e7eb;color:#1f2937}',
    '.phw-dark{background:#1f2937;border:1px solid #374151;color:#f9fafb}',
    '.phw-header{padding:16px 16px 0;display:flex;align-items:center;gap:8px}',
    '.phw-logo{font-weight:700;font-size:14px;color:#ef4444;letter-spacing:-0.5px}',
    '.phw-powered{font-size:10px;opacity:0.5;margin-left:auto}',
    '.phw-search{padding:12px 16px;display:flex;gap:8px}',
    '.phw-input{flex:1;padding:10px 14px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;outline:none;transition:border-color 0.2s;background:inherit;color:inherit}',
    '.phw-dark .phw-input{border-color:#4b5563;background:#374151}',
    '.phw-input:focus{border-color:#ef4444}',
    '.phw-btn{padding:10px 16px;border-radius:8px;background:#ef4444;color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;white-space:nowrap}',
    '.phw-btn:hover{background:#dc2626}',
    '.phw-results{padding:0 16px 16px}',
    '.phw-item{display:flex;gap:10px;padding:10px;border-radius:8px;text-decoration:none;color:inherit;transition:background 0.15s;margin-bottom:4px}',
    '.phw-item:hover{background:rgba(239,68,87,0.05)}',
    '.phw-item-img{width:56px;height:56px;border-radius:8px;object-fit:cover;background:#f3f4f6;flex-shrink:0}',
    '.phw-item-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}',
    '.phw-item-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.phw-item-meta{font-size:11px;opacity:0.6;margin-top:2px}',
    '.phw-item-price{font-size:14px;font-weight:700;color:#ef4444;margin-top:2px}',
    '.phw-empty{text-align:center;padding:24px 16px;font-size:13px;opacity:0.5}',
    '.phw-loading{text-align:center;padding:16px;font-size:13px;opacity:0.5}',
    '.phw-footer{padding:8px 16px 12px;text-align:center;border-top:1px solid rgba(128,128,128,0.1)}',
    '.phw-footer a{font-size:11px;color:#ef4444;text-decoration:none;font-weight:600}',
    '.phw-footer a:hover{text-decoration:underline}',
    '.phw-cats{padding:0 16px 8px;display:flex;gap:4px;flex-wrap:wrap}',
    '.phw-cat{padding:4px 10px;border-radius:16px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid #e5e7eb;background:transparent;color:inherit;transition:all 0.15s}',
    '.phw-dark .phw-cat{border-color:#4b5563}',
    '.phw-cat.active{background:#ef4444;color:#fff;border-color:#ef4444}',
    '.phw-cat:hover{border-color:#ef4444}'
  ].join('\n');
  document.head.appendChild(style);

  // ウィジェットHTML構築
  var container = document.getElementById(TARGET_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TARGET_ID;
    SCRIPT.parentNode.insertBefore(container, SCRIPT);
  }

  var categories = [
    { key: 'all', label: 'すべて' },
    { key: 'engine', label: 'エンジン' },
    { key: 'transmission', label: 'ミッション' },
    { key: 'body', label: '外装' },
    { key: 'electrical', label: '電装' },
    { key: 'suspension', label: '足回り' },
    { key: 'tools', label: '工具・SST' }
  ];

  var catsHtml = '';
  if (!COMPACT) {
    catsHtml = '<div class="phw-cats">';
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      catsHtml += '<button class="phw-cat' + (c.key === CATEGORY ? ' active' : '') + '" data-cat="' + c.key + '">' + c.label + '</button>';
    }
    catsHtml += '</div>';
  }

  container.innerHTML = '<div class="phw phw-' + THEME + '">' +
    '<div class="phw-header">' +
    '<span class="phw-logo">PARTS HUB</span>' +
    '<span class="phw-powered">パーツ検索</span>' +
    '</div>' +
    '<div class="phw-search">' +
    '<input class="phw-input" type="text" placeholder="車種名・品番で検索..." id="phw-q">' +
    '<button class="phw-btn" id="phw-search-btn">検索</button>' +
    '</div>' +
    catsHtml +
    '<div class="phw-results" id="phw-results"></div>' +
    '<div class="phw-footer"><a href="' + BASE_URL + '" target="_blank" rel="noopener">PARTS HUB で更に探す &rarr;</a></div>' +
    '</div>';

  // 検索機能
  var currentCat = CATEGORY;
  var searchInput = document.getElementById('phw-q');
  var searchBtn = document.getElementById('phw-search-btn');
  var resultsEl = document.getElementById('phw-results');

  function doSearch() {
    var q = searchInput.value.trim();
    if (!q && currentCat === 'all') {
      resultsEl.innerHTML = '<div class="phw-empty">車種名や品番を入力して検索してください</div>';
      return;
    }

    resultsEl.innerHTML = '<div class="phw-loading">検索中...</div>';

    var url = BASE_URL + '/api/products?limit=' + MAX_RESULTS + '&status=active';
    if (q) url += '&q=' + encodeURIComponent(q);
    if (currentCat !== 'all') url += '&category=' + encodeURIComponent(currentCat);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      try {
        var res = JSON.parse(xhr.responseText);
        if (res.success && res.data && res.data.length > 0) {
          var html = '';
          for (var j = 0; j < res.data.length && j < MAX_RESULTS; j++) {
            var p = res.data[j];
            var imgUrl = p.thumbnail || p.image_url || (BASE_URL + '/icons/icon-192x192.png');
            var price = p.price ? '¥' + Number(p.price).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '';
            var condition = p.condition_label || p.condition || '';
            html += '<a href="' + BASE_URL + '/products/' + p.id + '" target="_blank" rel="noopener" class="phw-item">' +
              '<img class="phw-item-img" src="' + imgUrl + '" alt="" loading="lazy" onerror="this.src=\'' + BASE_URL + '/icons/icon-192x192.png\'">' +
              '<div class="phw-item-info">' +
              '<div class="phw-item-title">' + (p.title || '商品名なし') + '</div>' +
              '<div class="phw-item-meta">' + condition + '</div>' +
              '<div class="phw-item-price">' + price + '</div>' +
              '</div></a>';
          }
          resultsEl.innerHTML = html;
        } else {
          resultsEl.innerHTML = '<div class="phw-empty">該当するパーツが見つかりませんでした</div>';
        }
      } catch(e) {
        resultsEl.innerHTML = '<div class="phw-empty">検索結果を読み込めませんでした</div>';
      }
    };
    xhr.onerror = function() {
      resultsEl.innerHTML = '<div class="phw-empty">通信エラーが発生しました</div>';
    };
    xhr.send();
  }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
  });

  // カテゴリ切り替え
  var catBtns = container.querySelectorAll('.phw-cat');
  for (var k = 0; k < catBtns.length; k++) {
    catBtns[k].addEventListener('click', function() {
      for (var m = 0; m < catBtns.length; m++) catBtns[m].classList.remove('active');
      this.classList.add('active');
      currentCat = this.getAttribute('data-cat');
      doSearch();
    });
  }
})();
