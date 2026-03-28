/**
 * プロフィール編集ページ
 */

// 画像データ
let profileImageFile = null;

// ログインチェック＆トークン取得
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('ログインが必要です');
        window.location.href = '/login';
        return null;
    }
    return token;
}

// axios認証ヘッダー設定
function setupAxios() {
    const token = getToken();
    if (!token) return false;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    return true;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    if (!setupAxios()) return;
    loadProfile();
    setupForm();
    setupBankUI();
});

// プロフィール情報を読み込み（ログインユーザー自身）
async function loadProfile() {
    try {
        const response = await axios.get('/api/profile/me');
        
        if (response.data.success) {
            const profile = response.data.data;
            fillForm(profile);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert('セッションが切れました。再ログインしてください。');
            window.location.href = '/login';
        }
    }
}

// フォームにデータを設定
function fillForm(profile) {
    // プロフィール画像
    if (profile.profile_image_url) {
        const preview = document.getElementById('profile-image-preview');
        preview.innerHTML = '<img src="' + profile.profile_image_url + '" alt="Profile" class="w-full h-full object-cover">';
    }
    
    // 基本情報
    setVal('name', profile.name);
    setVal('nickname', profile.nickname);
    setVal('shop-name', profile.company_name);
    setVal('shop-type', profile.shop_type);
    setVal('phone', profile.phone);
    setVal('email', profile.email);
    setVal('bio', profile.bio);
    
    // 住所情報
    setVal('postal-code', profile.postal_code);
    setVal('prefecture', profile.prefecture);
    setVal('city', profile.city);
    setVal('address', profile.address);
    
    // 銀行口座情報 - オートコンプリートUIで復元
    if (profile.bank_name) {
        var bankInput = document.getElementById('bank-name');
        if (bankInput) bankInput.value = profile.bank_name;
        setVal('bank-code', profile.bank_code);

        // bank-db.js からマッチする銀行を探す
        if (typeof BANK_DB !== 'undefined' && profile.bank_code) {
            var bank = BANK_DB.banks.find(function(b) { return b.code === profile.bank_code; });
            if (bank && window.__bankUI) {
                window.__bankUI._restoreBank(bank);
            }
        }
        // コードがなくても名前でマッチを試みる
        if (!profile.bank_code && typeof BANK_DB !== 'undefined') {
            var bank = BANK_DB.banks.find(function(b) { return b.name === profile.bank_name; });
            if (bank && window.__bankUI) {
                window.__bankUI._restoreBank(bank);
            }
        }
    }

    if (profile.branch_name) {
        var branchInput = document.getElementById('branch-name');
        if (branchInput) branchInput.value = profile.branch_name;
        setVal('branch-code', profile.branch_code);

        if (typeof BANK_DB !== 'undefined' && window.__bankUI && window.__bankUI._selectedBank && profile.branch_code) {
            var branch = window.__bankUI._selectedBank.branches.find(function(b) { return b.code === profile.branch_code; });
            if (branch) window.__bankUI._restoreBranch(branch);
        }
        if (!profile.branch_code && window.__bankUI && window.__bankUI._selectedBank) {
            var branch = window.__bankUI._selectedBank.branches.find(function(b) { return b.name === profile.branch_name; });
            if (branch) window.__bankUI._restoreBranch(branch);
        }
    }

    // 口座種別（ラジオボタン）
    if (profile.account_type) {
        var radios = document.querySelectorAll('input[name="account-type-radio"]');
        radios.forEach(function(r) {
            r.checked = (r.value === profile.account_type);
        });
        setVal('account-type', profile.account_type);
    }

    setVal('account-number', profile.account_number);
    setVal('account-holder', profile.account_holder);

    // 銀行選択済みなら必須ラベル表示
    setTimeout(function() { updateBankRequiredLabels(); }, 100);
}

// ヘルパー：要素があれば値をセット
function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

// フォームのセットアップ
function setupForm() {
    document.getElementById('profile-form').addEventListener('submit', handleSubmit);

    // 口座種別ラジオボタン → hidden input 連動
    document.querySelectorAll('input[name="account-type-radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            document.getElementById('account-type').value = this.value;
        });
    });

    // 口座番号: 数字のみ + エラー解除
    var accNum = document.getElementById('account-number');
    if (accNum) {
        accNum.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            this.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        });
    }

    // 口座名義: 入力時エラー解除
    var accHolder = document.getElementById('account-holder');
    if (accHolder) {
        accHolder.addEventListener('input', function() {
            this.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        });
    }
}

// プロフィール画像アップロード処理
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください');
        return;
    }
    
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('JPGまたはPNG形式の画像を選択してください');
        return;
    }
    
    profileImageFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profile-image-preview');
        preview.innerHTML = '<img src="' + e.target.result + '" alt="Profile" class="w-full h-full object-cover">';
    };
    reader.readAsDataURL(file);
}

// 銀行選択時の必須バリデーション
function validateBankFields() {
    var bankCode = getVal('bank-code');
    var bankName = getVal('bank-name');
    var hasBankSelected = !!(bankCode || bankName);

    if (!hasBankSelected) return true; // 銀行未選択なら検証不要

    var errors = [];
    var accNum = document.getElementById('account-number');
    var accHolder = document.getElementById('account-holder');

    // 口座番号チェック
    if (!accNum || !accNum.value.trim()) {
        errors.push('口座番号');
        if (accNum) accNum.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    } else if (accNum.value.trim().length !== 7) {
        errors.push('口座番号（7桁）');
        accNum.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    } else {
        if (accNum) accNum.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    }

    // 口座名義チェック
    if (!accHolder || !accHolder.value.trim()) {
        errors.push('口座名義（カタカナ）');
        if (accHolder) accHolder.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    } else {
        if (accHolder) accHolder.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    }

    if (errors.length > 0) {
        alert('銀行口座を登録する場合、以下の項目は必須です:\n\n・' + errors.join('\n・'));
        return false;
    }
    return true;
}

// 必須ラベルの表示切替
function updateBankRequiredLabels() {
    var bankCode = getVal('bank-code');
    var bankName = getVal('bank-name');
    var hasBankSelected = !!(bankCode || bankName);
    var reqLabels = document.querySelectorAll('.bank-required-label');
    reqLabels.forEach(function(el) {
        el.style.display = hasBankSelected ? 'inline-flex' : 'none';
    });
}

// フォーム送信処理
async function handleSubmit(event) {
    event.preventDefault();
    
    // 銀行口座バリデーション
    if (!validateBankFields()) return;
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    try {
        // プロフィール画像をアップロード（ある場合）
        let profileImageUrl = null;
        if (profileImageFile) {
            profileImageUrl = await uploadProfileImage();
        }
        
        // プロフィール情報を更新
        const profileData = {
            name: getVal('name'),
            nickname: getVal('nickname'),
            company_name: getVal('shop-name'),
            shop_type: getVal('shop-type'),
            phone: getVal('phone'),
            email: getVal('email'),
            bio: getVal('bio'),
            postal_code: getVal('postal-code'),
            prefecture: getVal('prefecture'),
            city: getVal('city'),
            address: getVal('address'),
            bank_name: getVal('bank-name'),
            bank_code: getVal('bank-code'),
            branch_name: getVal('branch-name'),
            branch_code: getVal('branch-code'),
            account_type: getVal('account-type'),
            account_number: getVal('account-number'),
            account_holder: getVal('account-holder')
        };
        
        if (profileImageUrl) {
            profileData.profile_image_url = profileImageUrl;
        }
        
        const response = await axios.put('/api/profile/me', profileData);
        
        if (response.data.success) {
            if (response.data.user) {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                Object.assign(storedUser, response.data.user);
                localStorage.setItem('user', JSON.stringify(storedUser));
            }
            alert('プロフィールを更新しました');
            window.location.href = '/mypage';
        } else {
            throw new Error(response.data.error || 'プロフィールの更新に失敗しました');
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(error.response?.data?.error || error.message || 'プロフィールの更新に失敗しました');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ヘルパー：要素の値を取得
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// プロフィール画像をアップロード
async function uploadProfileImage() {
    try {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        formData.append('user_id', user.id || '0');
        
        const response = await axios.post('/api/profile/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
            return response.data.data.url;
        } else {
            throw new Error(response.data.error || '画像アップロードに失敗しました');
        }
    } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
    }
}

// ============================================================
// 銀行オートコンプリートUI
// ============================================================
function setupBankUI() {
    if (typeof BANK_DB === 'undefined') return;

    var selectedBank = null;
    var selectedBranch = null;

    var bankInput = document.getElementById('bank-name');
    var bankDrop = document.getElementById('bank-dropdown');
    var branchInput = document.getElementById('branch-name');
    var branchDrop = document.getElementById('branch-dropdown');
    var dropIdx = -1;

    // カタカナ→ひらがな
    function k2h(s) {
        return s.replace(/[\u30A1-\u30FA]/g, function(c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
    }

    function hl(text, q) {
        if (!q) return text;
        var i = text.toLowerCase().indexOf(q.toLowerCase());
        if (i === -1) { i = k2h(text).indexOf(k2h(q)); }
        if (i === -1) return text;
        return text.substring(0, i) + '<mark class="bg-yellow-200 rounded px-0.5">' + text.substring(i, i + q.length) + '</mark>' + text.substring(i + q.length);
    }

    function matchItem(item, q) {
        var ql = q.toLowerCase();
        var qh = k2h(ql);
        return item.kana.indexOf(qh) !== -1 || item.name.toLowerCase().indexOf(ql) !== -1 || item.code.indexOf(ql) !== -1;
    }

    function renderDrop(drop, items, query, onClick) {
        if (items.length === 0) {
            drop.innerHTML = '<div class="p-3 text-center text-gray-400 text-sm"><i class="fas fa-search mr-1"></i>見つかりません</div>';
            drop.classList.remove('hidden');
            return;
        }
        drop.innerHTML = items.map(function(it, i) {
            return '<div class="bank-ac-item px-3 py-2 cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-0" data-idx="' + i + '">' +
                '<span class="text-gray-400 font-mono text-xs w-10 text-center flex-shrink-0">' + it.code + '</span>' +
                '<div class="min-w-0 flex-1"><div class="text-sm font-medium text-gray-800">' + hl(it.name, query) + '</div>' +
                '<div class="text-xs text-gray-400">' + hl(it.kana, query) + '</div></div>' +
                (it.branches ? '<span class="text-xs text-gray-300">' + it.branches.length + '支店</span>' : '') +
            '</div>';
        }).join('');
        drop.classList.remove('hidden');
        dropIdx = -1;
        drop.querySelectorAll('.bank-ac-item').forEach(function(el) {
            el.addEventListener('click', function() { onClick(items[parseInt(this.getAttribute('data-idx'))]); });
        });
    }

    function navDrop(drop, dir) {
        var els = drop.querySelectorAll('.bank-ac-item');
        if (!els.length) return;
        dropIdx = Math.max(0, Math.min(dropIdx + dir, els.length - 1));
        els.forEach(function(el, i) {
            el.classList.toggle('active', i === dropIdx);
            if (i === dropIdx) el.scrollIntoView({ block: 'nearest' });
        });
    }

    // === 銀行入力 ===
    bankInput.addEventListener('input', function() {
        var q = this.value.trim();
        if (!q) { bankDrop.classList.add('hidden'); return; }
        var res = BANK_DB.banks.filter(function(b) { return matchItem(b, q); }).slice(0, 15);
        renderDrop(bankDrop, res, q, doSelectBank);
    });

    bankInput.addEventListener('keydown', function(e) {
        if (bankDrop.classList.contains('hidden')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); navDrop(bankDrop, 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); navDrop(bankDrop, -1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            var el = bankDrop.querySelector('.bank-ac-item.active');
            if (el) el.click();
        }
    });

    function doSelectBank(bank) {
        selectedBank = bank;
        selectedBranch = null;
        bankInput.value = bank.name;
        bankInput.classList.add('bank-field-ok');
        bankDrop.classList.add('hidden');
        document.getElementById('bank-code').value = bank.code;
        document.getElementById('bank-code-show').textContent = bank.code;
        document.getElementById('bank-info').classList.remove('hidden');

        branchInput.disabled = false;
        branchInput.value = '';
        branchInput.placeholder = bank.name + ' の支店名を入力';
        branchInput.classList.remove('bank-field-ok');
        document.getElementById('branch-code').value = '';
        document.getElementById('branch-info').classList.add('hidden');
        branchInput.focus();

        // 必須ラベル表示
        updateBankRequiredLabels();
    }

    function clearBank() {
        selectedBank = null;
        selectedBranch = null;
        bankInput.value = '';
        bankInput.classList.remove('bank-field-ok');
        document.getElementById('bank-code').value = '';
        document.getElementById('bank-info').classList.add('hidden');
        branchInput.disabled = true;
        branchInput.value = '';
        branchInput.placeholder = '銀行を先に選択してください';
        branchInput.classList.remove('bank-field-ok');
        document.getElementById('branch-code').value = '';
        document.getElementById('branch-info').classList.add('hidden');
        bankInput.focus();

        // 必須ラベル非表示 + エラー表示クリア
        updateBankRequiredLabels();
        var accNum = document.getElementById('account-number');
        var accHolder = document.getElementById('account-holder');
        if (accNum) accNum.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        if (accHolder) accHolder.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    }

    // === 支店入力 ===
    branchInput.addEventListener('input', function() {
        if (!selectedBank) return;
        var q = this.value.trim();
        var res = q ? selectedBank.branches.filter(function(b) { return matchItem(b, q); }).slice(0, 20) : selectedBank.branches.slice(0, 20);
        renderDrop(branchDrop, res, q, doSelectBranch);
    });

    branchInput.addEventListener('focus', function() {
        if (selectedBank && !selectedBranch) this.dispatchEvent(new Event('input'));
    });

    branchInput.addEventListener('keydown', function(e) {
        if (branchDrop.classList.contains('hidden')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); navDrop(branchDrop, 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); navDrop(branchDrop, -1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            var el = branchDrop.querySelector('.bank-ac-item.active');
            if (el) el.click();
        }
    });

    function doSelectBranch(branch) {
        selectedBranch = branch;
        branchInput.value = branch.name;
        branchInput.classList.add('bank-field-ok');
        branchDrop.classList.add('hidden');
        document.getElementById('branch-code').value = branch.code;
        document.getElementById('branch-code-show').textContent = branch.code;
        document.getElementById('branch-info').classList.remove('hidden');
        // 次のフィールドにフォーカス
        document.getElementById('account-number').focus();
    }

    function clearBranch() {
        selectedBranch = null;
        branchInput.value = '';
        branchInput.classList.remove('bank-field-ok');
        document.getElementById('branch-code').value = '';
        document.getElementById('branch-info').classList.add('hidden');
        branchInput.focus();
    }

    // ドロップダウン外クリックで閉じる
    document.addEventListener('click', function(e) {
        if (!bankInput.contains(e.target) && !bankDrop.contains(e.target)) bankDrop.classList.add('hidden');
        if (!branchInput.contains(e.target) && !branchDrop.contains(e.target)) branchDrop.classList.add('hidden');
    });

    // グローバル公開（HTMLのonclick用 + 復元用）
    window.__bankUI = {
        clearBank: clearBank,
        clearBranch: clearBranch,
        _selectedBank: null,
        _restoreBank: function(bank) {
            selectedBank = bank;
            window.__bankUI._selectedBank = bank;
            bankInput.classList.add('bank-field-ok');
            document.getElementById('bank-code').value = bank.code;
            document.getElementById('bank-code-show').textContent = bank.code;
            document.getElementById('bank-info').classList.remove('hidden');
            branchInput.disabled = false;
            branchInput.placeholder = bank.name + ' の支店名を入力';
            updateBankRequiredLabels();
        },
        _restoreBranch: function(branch) {
            selectedBranch = branch;
            branchInput.classList.add('bank-field-ok');
            document.getElementById('branch-code').value = branch.code;
            document.getElementById('branch-code-show').textContent = branch.code;
            document.getElementById('branch-info').classList.remove('hidden');
        }
    };
}
