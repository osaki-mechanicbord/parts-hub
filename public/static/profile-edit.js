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
    
    // 基本情報（会員登録時の内容を反映）
    setVal('name', profile.name);
    setVal('nickname', profile.nickname);
    setVal('shop-name', profile.company_name);  // DBのcompany_name → フォームのshop-name
    setVal('shop-type', profile.shop_type);
    setVal('phone', profile.phone);
    setVal('email', profile.email);
    setVal('bio', profile.bio);
    
    // 住所情報
    setVal('postal-code', profile.postal_code);
    setVal('prefecture', profile.prefecture);
    setVal('city', profile.city);
    setVal('address', profile.address);
    
    // 銀行口座情報
    setVal('bank-name', profile.bank_name);
    setVal('branch-name', profile.branch_name);
    setVal('account-type', profile.account_type);
    setVal('account-number', profile.account_number);
    setVal('account-holder', profile.account_holder);
}

// ヘルパー：要素があれば値をセット
function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

// フォームのセットアップ
function setupForm() {
    document.getElementById('profile-form').addEventListener('submit', handleSubmit);
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

// フォーム送信処理
async function handleSubmit(event) {
    event.preventDefault();
    
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
        
        // プロフィール情報を更新（/api/profile/me に送信）
        const profileData = {
            name: getVal('name'),
            nickname: getVal('nickname'),
            company_name: getVal('shop-name'),  // フォームのshop-name → DBのcompany_name
            shop_type: getVal('shop-type'),
            phone: getVal('phone'),
            email: getVal('email'),
            bio: getVal('bio'),
            postal_code: getVal('postal-code'),
            prefecture: getVal('prefecture'),
            city: getVal('city'),
            address: getVal('address'),
            bank_name: getVal('bank-name'),
            branch_name: getVal('branch-name'),
            account_type: getVal('account-type'),
            account_number: getVal('account-number'),
            account_holder: getVal('account-holder')
        };
        
        if (profileImageUrl) {
            profileData.profile_image_url = profileImageUrl;
        }
        
        const response = await axios.put('/api/profile/me', profileData);
        
        if (response.data.success) {
            // localStorageのユーザー情報も更新
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
        
        // ユーザーIDをlocalStorageから取得
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
