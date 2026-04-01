/**
 * 通知バッジ - 全ページ共通
 * ログイン中のユーザーの未読通知数を定期的に取得し、バッジ表示する
 */
(function() {
  'use strict';

  // 管理画面はスキップ
  if (location.pathname.indexOf('/admin') === 0) return;

  var POLL_INTERVAL = 30000; // 30秒ごとにポーリング
  var timer = null;

  function getToken() {
    return localStorage.getItem('token');
  }

  function getUserId() {
    try {
      var u = JSON.parse(localStorage.getItem('user') || 'null');
      return u ? u.id : null;
    } catch(e) { return null; }
  }

  // バッジ要素を更新
  function updateBadges(count) {
    var ids = ['mobile-notif-badge', 'notification-badge'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      if (count > 0) {
        el.textContent = count > 99 ? '99+' : String(count);
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }

    // auth-header.js で動的に挿入されるベルアイコンにもバッジ追加
    var authBell = document.getElementById('auth-header-notif-badge');
    if (authBell) {
      if (count > 0) {
        authBell.textContent = count > 99 ? '99+' : String(count);
        authBell.classList.remove('hidden');
      } else {
        authBell.classList.add('hidden');
      }
    }

    // ファビコンのtitle更新
    if (count > 0) {
      document.title = document.title.replace(/^\(\d+\+?\)\s*/, '') ;
      document.title = '(' + (count > 99 ? '99+' : count) + ') ' + document.title;
    } else {
      document.title = document.title.replace(/^\(\d+\+?\)\s*/, '');
    }
  }

  // 未読数を取得
  function fetchUnreadCount() {
    var token = getToken();
    var userId = getUserId();
    if (!token || !userId) {
      updateBadges(0);
      return;
    }

    // user情報がまだない場合はまず取得を試みる
    if (!userId && token && typeof axios !== 'undefined') {
      axios.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(function(res) {
          if (res.data && res.data.success && res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
            doFetch(res.data.user.id);
          }
        })
        .catch(function() {});
      return;
    }

    doFetch(userId);
  }

  function doFetch(uid) {
    if (!uid) return;
    if (typeof axios === 'undefined') {
      // axios未読み込みの場合はfetch使用
      fetch('/api/notifications/' + uid + '/unread-count')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) updateBadges(data.data.count);
        })
        .catch(function() {});
      return;
    }

    axios.get('/api/notifications/' + uid + '/unread-count')
      .then(function(res) {
        if (res.data && res.data.success) {
          updateBadges(res.data.data.count);
        }
      })
      .catch(function() {});
  }

  // 初期化
  function init() {
    // 初回取得（少し遅延させてaxios/auth-headerの読み込みを待つ）
    setTimeout(fetchUnreadCount, 500);

    // 定期ポーリング
    timer = setInterval(fetchUnreadCount, POLL_INTERVAL);

    // ページ復帰時にも取得（タブ切替対応）
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    });
  }

  // グローバルAPI（他のJSから未読数の再取得を呼べるように）
  window.__notifBadge = {
    refresh: fetchUnreadCount
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
