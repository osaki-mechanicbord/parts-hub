/**
 * プロフィール編集ページ
 */

// 現在のユーザーID（実際の実装では認証から取得）
const currentUserId = 1;

// 画像データ
let profileImageFile = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    setupForm();
});

// プロフィール情報を読み込み
async function loadProfile() {
    try {
        const response = await axios.get(`/api/profile/${currentUserId}`);
        
        if (response.data.success) {
            const profile = response.data.data;
            fillForm(profile);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// フォームにデータを設定
function fillForm(profile) {
    // プロフィール画像
    if (profile.profile_image_url) {
        const preview = document.getElementById('profile-image-preview');
        preview.innerHTML = `<img src="${profile.profile_image_url}" alt="Profile" class="w-full h-full object-cover">`;
    }
    
    // 基本情報
    document.getElementById('shop-name').value = profile.shop_name || '';
    document.getElementById('shop-type').value = profile.shop_type || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('bio').value = profile.bio || '';
    
    // 住所情報
    document.getElementById('postal-code').value = profile.postal_code || '';
    document.getElementById('prefecture').value = profile.prefecture || '';
    document.getElementById('city').value = profile.city || '';
    document.getElementById('address').value = profile.address || '';
    
    // 銀行口座情報
    document.getElementById('bank-name').value = profile.bank_name || '';
    document.getElementById('branch-name').value = profile.branch_name || '';
    document.getElementById('account-type').value = profile.account_type || '';
    document.getElementById('account-number').value = profile.account_number || '';
    document.getElementById('account-holder').value = profile.account_holder || '';
}

// フォームのセットアップ
function setupForm() {
    document.getElementById('profile-form').addEventListener('submit', handleSubmit);
}

// プロフィール画像アップロード処理
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください');
        return;
    }
    
    // 画像タイプチェック
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('JPGまたはPNG形式の画像を選択してください');
        return;
    }
    
    profileImageFile = file;
    
    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('profile-image-preview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover">`;
    };
    reader.readAsDataURL(file);
}

// フォーム送信処理
async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // ボタンを無効化
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
            user_id: currentUserId,
            shop_name: document.getElementById('shop-name').value,
            shop_type: document.getElementById('shop-type').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            bio: document.getElementById('bio').value,
            postal_code: document.getElementById('postal-code').value,
            prefecture: document.getElementById('prefecture').value,
            city: document.getElementById('city').value,
            address: document.getElementById('address').value,
            bank_name: document.getElementById('bank-name').value,
            branch_name: document.getElementById('branch-name').value,
            account_type: document.getElementById('account-type').value,
            account_number: document.getElementById('account-number').value,
            account_holder: document.getElementById('account-holder').value
        };
        
        if (profileImageUrl) {
            profileData.profile_image_url = profileImageUrl;
        }
        
        const response = await axios.put(`/api/profile/${currentUserId}`, profileData);
        
        if (response.data.success) {
            alert('プロフィールを更新しました');
            window.location.href = '/mypage';
        } else {
            throw new Error(response.data.error || 'プロフィールの更新に失敗しました');
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(error.message || 'プロフィールの更新に失敗しました');
        
        // ボタンを元に戻す
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// プロフィール画像をアップロード
async function uploadProfileImage() {
    try {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        formData.append('user_id', currentUserId);
        
        const response = await axios.post('/api/profile/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
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
