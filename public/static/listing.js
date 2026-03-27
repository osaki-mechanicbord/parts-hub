// 商品出品フォーム管理 v2
// 安全にDOM要素の値を取得するヘルパー
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}
function getIntVal(id) {
  var v = getVal(id);
  return v ? parseInt(v) : null;
}

class ProductListingForm {
  constructor() {
    this.images = []
    this.maxImages = 10
    this.uploadedImages = []
    this.currentStep = 1
    this.formData = {}
  }

  // カメラ起動
  openCamera() {
    var input = document.getElementById('image-input')
    if (!input) return
    input.setAttribute('capture', 'environment')
    input.click()
  }

  // ファイル選択（ギャラリー）
  openGallery() {
    var input = document.getElementById('image-input')
    if (!input) return
    input.removeAttribute('capture')
    input.click()
  }

  // 画像プレビューとアップロード処理
  async handleImageUpload(files) {
    var fileArray = Array.from(files)
    
    if (this.uploadedImages.length + fileArray.length > this.maxImages) {
      alert('画像は最大' + this.maxImages + '枚までです')
      return
    }

    for (var file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        alert(file.name + ' はサイズが大きすぎます（最大10MB）')
        continue
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(file.name + ' は対応していない画像形式です（JPEG/PNG/WebPのみ）')
        continue
      }

      var compressedFile = await this.compressImage(file)

      var reader = new FileReader()
      var self = this
      reader.onload = function(e) {
        self.uploadedImages.push({
          file: compressedFile,
          preview: e.target.result,
          uploaded: false
        })
        self.renderImagePreviews()
      }
      reader.readAsDataURL(compressedFile)
    }
  }

  // 画像圧縮（クライアント側）
  async compressImage(file) {
    return new Promise(function(resolve) {
      var reader = new FileReader()
      reader.onload = function(e) {
        var img = new Image()
        img.onload = function() {
          var canvas = document.createElement('canvas')
          var width = img.width
          var height = img.height

          var maxSize = 1920
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          var ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            function(blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }))
            },
            'image/jpeg',
            0.85
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // 画像プレビュー描画
  renderImagePreviews() {
    var container = document.getElementById('image-previews')
    if (!container) return

    var self = this
    var previews = this.uploadedImages.map(function(img, index) {
      return '<div class="image-preview-item" style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:#f3f4f6;">' +
        '<img src="' + (img.preview || img.url || '') + '" alt="商品画像 ' + (index + 1) + '"' +
        ' style="width:100%;height:100%;object-fit:cover;">' +
        (index === 0 ? '<span style="position:absolute;top:4px;left:4px;background:#ef4444;color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;">メイン</span>' : '') +
        '<button type="button" onclick="productForm.removeImage(' + index + ')"' +
        ' style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;border:none;">' +
        '<i class="fas fa-times"></i></button></div>'
    }).join('')

    var addBtn = this.uploadedImages.length < this.maxImages ?
      '<div onclick="document.getElementById(\'image-input\').click()"' +
      ' style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:#fafbfc;border:2px dashed #d1d5db;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
      '<div style="text-align:center;"><i class="fas fa-plus" style="color:#9ca3af;font-size:18px;"></i>' +
      '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">追加</div></div></div>' : ''

    container.innerHTML = previews + addBtn

    var dropZone = document.getElementById('drop-zone')
    if (dropZone) {
      dropZone.style.display = this.uploadedImages.length > 0 ? 'none' : 'block'
    }

    if (typeof updateStepIndicator === 'function') updateStepIndicator()
  }

  // 画像削除
  removeImage(index) {
    this.uploadedImages.splice(index, 1)
    this.renderImagePreviews()
  }

  // R2アップロード
  async uploadImagesToR2(productId) {
    var self = this
    var uploadPromises = this.uploadedImages.map(async function(img, index) {
      if (img.uploaded) return img.key

      var formData = new FormData()
      formData.append('image', img.file)
      formData.append('product_id', productId)
      formData.append('display_order', index + 1)

      try {
        var response = await axios.post('/api/products/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (response.data.success) {
          img.uploaded = true
          img.key = response.data.data.key
          return response.data.data.key
        }
      } catch (error) {
        console.error('画像アップロード失敗:', error)
        throw new Error('画像' + (index + 1) + 'のアップロードに失敗しました')
      }
    })

    return await Promise.all(uploadPromises)
  }

  // フォーム送信
  async submitForm() {
    try {
      // ログインユーザー情報を取得
      var userStr = localStorage.getItem('user')
      var token = localStorage.getItem('token')
      if (!userStr || !token) {
        alert('出品するにはログインが必要です。ログインページに移動します。')
        window.location.href = '/login'
        return
      }
      var user = JSON.parse(userStr)

      // フォームデータ収集（null安全）
      var formData = {
        seller_id: user.id,
        title: getVal('product-title'),
        description: getVal('product-description'),
        price: getIntVal('product-price'),
        category_id: getIntVal('category-select'),
        subcategory_id: getIntVal('subcategory-select'),
        maker_id: getIntVal('maker-select'),
        model_id: getIntVal('model-select'),
        part_number: getVal('part-number') || null,
        compatible_models: getVal('compatible-models') || null,
        condition: getVal('condition-select'),
        stock_quantity: getIntVal('stock-quantity') || 1,
        status: 'active',
        compatibility: {
          year_from: getIntVal('year-from'),
          year_to: getIntVal('year-to'),
          model_code: getVal('model-code') || null,
          grade: getVal('grade') || null,
          engine_type: getVal('engine-type') || null,
          drive_type: getVal('drive-type') || null,
          transmission_type: getVal('transmission-type') || null,
          oem_part_number: getVal('oem-part-number') || null,
          verification_method: getVal('verification-method') || null,
          fitment_notes: getVal('fitment-notes') || null,
          confidence_level: 4
        }
      }

      // バリデーション（日本語メッセージ）
      if (!formData.title) {
        alert('商品タイトルを入力してください')
        return
      }
      if (!formData.description) {
        alert('商品説明を入力してください')
        return
      }
      if (!formData.price || formData.price <= 0) {
        alert('価格を正しく入力してください')
        return
      }
      if (!formData.category_id) {
        alert('カテゴリを選択してください')
        return
      }
      if (!formData.condition) {
        alert('商品の状態を選択してください')
        return
      }
      if (this.uploadedImages.length === 0) {
        alert('商品画像を最低1枚追加してください')
        return
      }

      // ローディング表示
      var submitBtn = document.getElementById('submit-btn')
      var originalText = submitBtn ? submitBtn.innerHTML : ''
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>出品処理中...'
        submitBtn.disabled = true
      }

      // 商品作成 or 更新 API呼び出し
      var response;
      if (window.EDIT_MODE && window.PRODUCT_ID) {
        // 編集モード: PUT で更新
        response = await axios.put('/api/products/' + window.PRODUCT_ID, formData, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
      } else {
        // 新規作成モード: POST
        response = await axios.post('/api/products', formData, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
      }

      if (!response.data.success) {
        throw new Error(response.data.error || '商品の登録に失敗しました')
      }

      var productId = window.EDIT_MODE ? window.PRODUCT_ID : response.data.data.id

      // 画像アップロード（新規画像がある場合のみ）
      if (this.uploadedImages.some(function(img) { return !img.uploaded })) {
        await this.uploadImagesToR2(productId)
      }

      // 成功表示
      var successMsg = window.EDIT_MODE ? '変更を保存しました！' : '出品完了！'
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>' + successMsg
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)'
      }

      // 成功メッセージ表示後、マイページ出品一覧に遷移
      var successBanner = document.createElement('div')
      successBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#22c55e;color:#fff;text-align:center;padding:16px;font-size:16px;font-weight:700;z-index:9999;'
      successBanner.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>' + (window.EDIT_MODE ? '商品を更新しました！マイページに移動します...' : '商品を出品しました！マイページに移動します...')
      document.body.appendChild(successBanner)

      setTimeout(function() {
        window.location.href = '/mypage#listings'
      }, 1500)

    } catch (error) {
      console.error('出品エラー:', error)
      var msg = '出品に失敗しました。'
      if (error.response && error.response.data && error.response.data.error) {
        msg = error.response.data.error
      } else if (error.message) {
        msg = error.message
      }
      alert(msg)
      
      var submitBtn = document.getElementById('submit-btn')
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>出品する'
        submitBtn.disabled = false
      }
    }
  }

  // カテゴリ変更 → サブカテゴリ読込
  async loadSubcategories(categoryId) {
    var el = document.getElementById('subcategory-select')
    if (!el) return
    if (!categoryId) {
      el.innerHTML = '<option value="">サブカテゴリを選択</option>'
      return
    }

    try {
      var response = await axios.get('/api/categories/' + categoryId + '/subcategories')
      var subcategories = response.data.data || []
      el.innerHTML = '<option value="">サブカテゴリを選択</option>' + 
        subcategories.map(function(sub) { return '<option value="' + sub.id + '">' + sub.name + '</option>' }).join('')
    } catch (error) {
      console.error('サブカテゴリの読み込みに失敗:', error)
    }
  }

  // メーカー変更 → 車種読込
  async loadModels(makerId) {
    var el = document.getElementById('model-select')
    if (!el) return
    if (!makerId) {
      el.innerHTML = '<option value="">車種を選択</option>'
      return
    }

    try {
      var response = await axios.get('/api/makers/' + makerId + '/models')
      var models = response.data.data || []
      el.innerHTML = '<option value="">車種を選択</option>' + 
        models.map(function(model) { return '<option value="' + model.id + '">' + model.name + '</option>' }).join('')
    } catch (error) {
      console.error('車種の読み込みに失敗:', error)
    }
  }
}

// グローバルインスタンス
var productForm = new ProductListingForm()

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async function() {
  // カテゴリとメーカーのロード
  try {
    var results = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/makers')
    ])
    var categoriesRes = results[0]
    var makersRes = results[1]

    var categorySelect = document.getElementById('category-select')
    if (categorySelect && categoriesRes.data.categories) {
      categorySelect.innerHTML = '<option value="">カテゴリを選択 *</option>' +
        categoriesRes.data.categories.map(function(cat) { return '<option value="' + cat.id + '">' + cat.name + '</option>' }).join('')
    }

    var makerSelect = document.getElementById('maker-select')
    if (makerSelect && makersRes.data.makers) {
      makerSelect.innerHTML = '<option value="">メーカーを選択</option>' +
        makersRes.data.makers.map(function(maker) { return '<option value="' + maker.id + '">' + maker.name + '</option>' }).join('')
    }
  } catch (error) {
    console.error('初期データの読み込みに失敗:', error)
  }

  // 画像アップロードエリアのイベント設定
  var imageInput = document.getElementById('image-input')
  var dropZone = document.getElementById('drop-zone')

  if (imageInput) {
    imageInput.addEventListener('change', function(e) {
      productForm.handleImageUpload(e.target.files)
    })
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault()
      dropZone.classList.add('border-blue-500', 'bg-blue-50')
    })
    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
    })
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault()
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
      productForm.handleImageUpload(e.dataTransfer.files)
    })
  }

  // カテゴリ変更イベント
  var categorySelect = document.getElementById('category-select')
  if (categorySelect) {
    categorySelect.addEventListener('change', function(e) {
      productForm.loadSubcategories(e.target.value)
    })
  }

  // メーカー変更イベント
  var makerSelect = document.getElementById('maker-select')
  if (makerSelect) {
    makerSelect.addEventListener('change', function(e) {
      productForm.loadModels(e.target.value)
    })
  }

  // 編集モードの場合
  if (window.EDIT_MODE && window.PRODUCT_ID) {
    loadProductForEdit(window.PRODUCT_ID)
  }
})

// 編集モード：商品データを読み込んで表示
async function loadProductForEdit(productId) {
  try {
    var response = await axios.get('/api/products/' + productId)
    
    if (response.data.success) {
      var product = response.data.data
      
      var el
      el = document.getElementById('product-title'); if (el) el.value = product.title || ''
      el = document.getElementById('product-description'); if (el) el.value = product.description || ''
      el = document.getElementById('product-price'); if (el) el.value = product.price || ''
      el = document.getElementById('stock-quantity'); if (el) el.value = product.stock_quantity || 1
      el = document.getElementById('part-number'); if (el) el.value = product.part_number || ''
      
      if (product.category_id) {
        el = document.getElementById('category-select'); if (el) el.value = product.category_id
        if (product.subcategory_id) {
          await productForm.loadSubcategories(product.category_id)
          el = document.getElementById('subcategory-select'); if (el) el.value = product.subcategory_id
        }
      }
      
      if (product.condition) {
        el = document.getElementById('condition-select'); if (el) el.value = product.condition
      }
      
      if (product.maker_id) {
        el = document.getElementById('maker-select'); if (el) el.value = product.maker_id
        if (product.model_id) {
          await productForm.loadModels(product.maker_id)
          el = document.getElementById('model-select'); if (el) el.value = product.model_id
        }
      }
      
      var compat = product.compatibility || {}
      el = document.getElementById('year-from'); if (el) el.value = compat.year_from || ''
      el = document.getElementById('year-to'); if (el) el.value = compat.year_to || ''
      el = document.getElementById('model-code'); if (el) el.value = compat.model_code || ''
      el = document.getElementById('grade'); if (el) el.value = compat.grade || ''
      el = document.getElementById('engine-type'); if (el) el.value = compat.engine_type || ''
      el = document.getElementById('drive-type'); if (el) el.value = compat.drive_type || ''
      
      if (product.images && product.images.length > 0) {
        productForm.uploadedImages = product.images.map(function(img) {
          return { url: img.image_url, display_order: img.display_order }
        })
        productForm.renderImagePreviews()
      }
      
      el = document.getElementById('loading'); if (el) el.style.display = 'none'
      el = document.getElementById('form-content'); if (el) el.classList.remove('hidden')
      
      var submitBtn = document.getElementById('submit-btn')
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save" style="margin-right:8px;"></i>変更を保存'
      }
      
    } else {
      throw new Error(response.data.error || '商品情報の取得に失敗しました')
    }
  } catch (error) {
    console.error('商品読み込みエラー:', error)
    var loadingEl = document.getElementById('loading')
    if (loadingEl) {
      loadingEl.innerHTML = '<div style="text-align:center;padding:48px 0;color:#ef4444;">' +
        '<i class="fas fa-exclamation-circle" style="font-size:36px;margin-bottom:16px;display:block;"></i>' +
        '<p>' + (error.message || '商品情報の読み込みに失敗しました') + '</p>' +
        '<button onclick="window.history.back()" style="margin-top:16px;background:#f3f4f6;color:#374151;padding:8px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;">戻る</button></div>'
    }
  }
}
