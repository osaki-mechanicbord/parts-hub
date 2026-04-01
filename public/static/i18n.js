/**
 * PARTS HUB 多言語対応エンジン
 * - ブラウザ言語自動検出 + 手動切替
 * - テキストノードの辞書ベース翻訳
 * - placeholder, title, alt 属性の翻訳
 * - 動的コンテンツのMutationObserver監視
 */
(function() {
    'use strict';

    // 重複実行防止
    if (window.__i18n && window.__i18n._initialized) return;

    var STORAGE_KEY = 'parts_hub_lang';
    var DEFAULT_LANG = 'ja';
    var SUPPORTED = ['ja', 'en', 'zh', 'ko'];

    // 管理画面はスキップ
    var path = location.pathname;
    if (path.indexOf('/admin') === 0) return;

    // 辞書格納（言語コード→辞書オブジェクト）
    window.__i18n = window.__i18n || {};
    window.__i18n.dicts = window.__i18n.dicts || {};
    window.__i18n.currentLang = DEFAULT_LANG;
    window.__i18n._initialized = true;

    // 辞書登録API
    window.__i18n.register = function(lang, dict) {
        window.__i18n.dicts[lang] = dict;
    };

    // 現在の言語を取得
    function getLang() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
        // ブラウザ言語から推定
        var nav = (navigator.language || '').toLowerCase();
        if (nav.indexOf('zh') === 0) return 'zh';
        if (nav.indexOf('ko') === 0) return 'ko';
        if (nav.indexOf('en') === 0) return 'en';
        return DEFAULT_LANG;
    }

    // 言語設定
    function setLang(lang) {
        if (SUPPORTED.indexOf(lang) === -1) return;
        localStorage.setItem(STORAGE_KEY, lang);
        location.reload();
    }
    window.__i18n.setLang = setLang;

    // テキスト翻訳
    function t(text) {
        if (!text || typeof text !== 'string') return text;
        var lang = window.__i18n.currentLang;
        if (lang === 'ja') return text;
        var dict = window.__i18n.dicts[lang];
        if (!dict) return text;
        var trimmed = text.trim();
        if (!trimmed) return text;
        // 完全一致
        if (dict[trimmed] !== undefined) return text.replace(trimmed, dict[trimmed]);
        return text;
    }
    window.__i18n.t = t;

    // DOM要素のテキストを翻訳
    function translateNode(node) {
        if (!node) return;
        var lang = window.__i18n.currentLang;
        if (lang === 'ja') return;
        var dict = window.__i18n.dicts[lang];
        if (!dict) return;

        // テキストノード
        if (node.nodeType === 3) {
            var orig = node.textContent;
            if (!orig || !orig.trim()) return;
            var trimmed = orig.trim();
            if (dict[trimmed] !== undefined) {
                node.textContent = orig.replace(trimmed, dict[trimmed]);
            }
            return;
        }

        // 要素ノード
        if (node.nodeType !== 1) return;
        var tag = node.tagName;
        // script, style, svg はスキップ
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'NOSCRIPT') return;
        // data-no-i18n 属性があればスキップ
        if (node.hasAttribute && node.hasAttribute('data-no-i18n')) return;

        // placeholder 翻訳
        if (node.placeholder) {
            var ph = node.placeholder.trim();
            if (dict[ph]) node.placeholder = dict[ph];
        }
        // title 翻訳
        if (node.title) {
            var ti = node.title.trim();
            if (dict[ti]) node.title = dict[ti];
        }
        // alt 翻訳
        if (node.alt) {
            var al = node.alt.trim();
            if (dict[al]) node.alt = dict[al];
        }
        // aria-label
        if (node.getAttribute && node.getAttribute('aria-label')) {
            var ar = node.getAttribute('aria-label').trim();
            if (dict[ar]) node.setAttribute('aria-label', dict[ar]);
        }

        // 子ノードを再帰走査
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            translateNode(children[i]);
        }
    }

    // ページ全体を翻訳
    function translatePage() {
        var lang = window.__i18n.currentLang;
        if (lang === 'ja') return;
        if (!window.__i18n.dicts[lang]) return;
        translateNode(document.body);
        // html lang属性を更新
        document.documentElement.lang = lang;
    }
    window.__i18n.translatePage = translatePage;

    // 言語切替ボタンUI生成（ヘッダーのauth-header.jsに統一、左下固定ボタンは廃止）
    function createLangSwitcher() {
        // auth-header.js がヘッダーに言語切替を挿入するため、ここでは何もしない
    }

    // MutationObserver: 動的コンテンツも翻訳
    function observeDOM() {
        if (window.__i18n.currentLang === 'ja') return;
        if (!window.MutationObserver) return;
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === 'childList') {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        translateNode(m.addedNodes[j]);
                    }
                } else if (m.type === 'characterData') {
                    translateNode(m.target);
                }
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // 初期化
    function init() {
        window.__i18n.currentLang = getLang();
        // DOMContentLoaded後に翻訳適用
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                translatePage();
                createLangSwitcher();
                observeDOM();
            });
        } else {
            translatePage();
            createLangSwitcher();
            observeDOM();
        }
    }

    init();
})();
