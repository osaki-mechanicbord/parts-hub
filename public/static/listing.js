// 商品出品フォーム管理
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
    const input = document.getElementById('image-input')
    input.setAttribute('capture', 'environment') // リアカメラを優先
    input.click()
  }

  // ファイル選択（ギャラリー）
  openGallery() {
    const input = document.getElementById('image-input')
    input.removeAttribute('capture')
    input.click()
  }

  // 画像プレビューとアップロード処理
  async handleImageUpload(files) {
    const fileArray = Array.from(files)
    
    if (this.uploadedImages.length + fileArray.length > this.maxImages) {
      alert(`画像は最大${this.maxImages}枚までです`)
      return
    }

    for (const file of fileArray) {
      // ファイルサイズチェック (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} はサイズが大きすぎます（最大10MB）`)
        continue
      }

      // 画像形式チェック
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`${file.name} は対応していない形式です`)
        continue
      }

      // 画像圧縮（モバイル対応）
      const compressedFile = await this.compressImage(file)

      // プレビュー表示用にDataURLを作成
      const reader = new FileReader()
      reader.onload = (e) => {
        this.uploadedImages.push({
          file: compressedFile,
          preview: e.target.result,
          uploaded: false
        })
        this.renderImagePreviews()
      }
      reader.readAsDataURL(compressedFile)
    }
  }

  // 画像圧縮（クライアント側）
  async compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 最大サイズを1920pxに制限
          const maxSize = 1920
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }))
            },
            'image/jpeg',
            0.85 // 画質85%
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // 画像プレビュー描画
  renderImagePreviews() {
    const container = document.getElementById('image-previews')
    if (!container) return

    container.innerHTML = this.uploadedImages.map((img, index) => `
      <div class="relative group">
        <img src="${img.preview}" alt="商品画像 ${index + 1}" 
             class="w-full h-32 object-cover rounded-lg border-2 border-gray-300">
        <button type="button" 
                onclick="productForm.removeImage(${index})"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 
                       opacity-0 group-hover:opacity-100 transition-opacity">
          <i class="fas fa-times"></i>
        </button>
        <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          ${index + 1}枚目
        </div>
        ${!img.uploaded ? '<div class="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center"><div class="text-white text-xs">アップロード待ち</div></div>' : ''}
      </div>
    `).join('')
  }

  // 画像削除
  removeImage(index) {
    this.uploadedImages.splice(index, 1)
    this.renderImagePreviews()
  }

  // 実際のR2へのアップロード（商品作成時）
  async uploadImagesToR2(productId) {
    const uploadPromises = this.uploadedImages.map(async (img, index) => {
      if (img.uploaded) return img.key

      const formData = new FormData()
      formData.append('image', img.file)
      formData.append('product_id', productId)
      formData.append('display_order', index + 1)

      try {
        const response = await axios.post('/api/products/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.success) {
          img.uploaded = true
          img.key = response.data.data.key
          return response.data.data.key
        }
      } catch (error) {
        console.error('Image upload failed:', error)
        throw new Error(`画像${index + 1}のアップロードに失敗しました`)
      }
    })

    return await Promise.all(uploadPromises)
  }

  // フォーム送信
  async submitForm() {
    try {
      // フォームデータ収集
      const formData = {
        seller_id: 1, // TODO: ログインユーザーIDを使用
        title: document.getElementById('product-title').value,
        description: document.getElementById('product-description').value,
        price: parseInt(document.getElementById('product-price').value),
        category_id: parseInt(document.getElementById('category-select').value),
        subcategory_id: parseInt(document.getElementById('subcategory-select').value) || null,
        maker_id: parseInt(document.getElementById('maker-select').value) || null,
        model_id: parseInt(document.getElementById('model-select').value) || null,
        part_number: document.getElementById('part-number').value || null,
        compatible_models: document.getElementById('compatible-models').value || null,
        condition: document.getElementById('condition-select').value,
        stock_quantity: parseInt(document.getElementById('stock-quantity').value),
        status: 'active',
        compatibility: {
          year_from: parseInt(document.getElementById('year-from').value) || null,
          year_to: parseInt(document.getElementById('year-to').value) || null,
          model_code: document.getElementById('model-code').value || null,
          grade: document.getElementById('grade').value || null,
          engine_type: document.getElementById('engine-type').value || null,
          drive_type: document.getElementById('drive-type').value || null,
          transmission_type: document.getElementById('transmission-type').value || null,
          oem_part_number: document.getElementById('oem-part-number').value || null,
          verification_method: document.getElementById('verification-method').value,
          fitment_notes: document.getElementById('fitment-notes').value || null,
          confidence_level: 4
        }
      }

      // バリデーション
      if (!formData.title || !formData.description || !formData.price || !formData.category_id || !formData.condition) {
        alert('必須項目を入力してください')
        return
      }

      if (this.uploadedImages.length === 0) {
        alert('商品画像を最低1枚アップロードしてください')
        return
      }

      // ローディング表示
      const submitBtn = document.getElementById('submit-btn')
      const originalText = submitBtn.innerHTML
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>出品中...'
      submitBtn.disabled = true

      // 商品作成
      const response = await axios.post('/api/products', formData)

      if (!response.data.success) {
        throw new Error(response.data.error || '商品登録に失敗しました')
      }

      const productId = response.data.data.id

      // 画像アップロード
      await this.uploadImagesToR2(productId)

      // 成功メッセージ
      alert('商品を出品しました！')
      window.location.href = `/products/${productId}`

    } catch (error) {
      console.error('Submit error:', error)
      alert(error.message || '出品に失敗しました')
      
      // ボタンを元に戻す
      const submitBtn = document.getElementById('submit-btn')
      submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>出品する'
      submitBtn.disabled = false
    }
  }

  // カテゴリ選択時にサブカテゴリをロード
  async loadSubcategories(categoryId) {
    if (!categoryId) {
      document.getElementById('subcategory-select').innerHTML = '<option value="">サブカテゴリを選択</option>'
      return
    }

    try {
      const response = await axios.get(`/api/categories/${categoryId}/subcategories`)
      const subcategories = response.data.data || []
      
      const select = document.getElementById('subcategory-select')
      select.innerHTML = '<option value="">サブカテゴリを選択</option>' + 
        subcategories.map(sub => `<option value="${sub.id}">${sub.name}</option>`).join('')
    } catch (error) {
      console.error('Failed to load subcategories:', error)
    }
  }

  // メーカー選択時に車種をロード
  async loadModels(makerId) {
    if (!makerId) {
      document.getElementById('model-select').innerHTML = '<option value="">車種を選択</option>'
      return
    }

    try {
      const response = await axios.get(`/api/makers/${makerId}/models`)
      const models = response.data.data || []
      
      const select = document.getElementById('model-select')
      select.innerHTML = '<option value="">車種を選択</option>' + 
        models.map(model => `<option value="${model.id}">${model.name}</option>`).join('')
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }
}

// グローバルインスタンス
const productForm = new ProductListingForm()

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
  // カテゴリとメーカーのロード
  try {
    const [categoriesRes, makersRes] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/makers')
    ])

    // カテゴリ選択肢を設定
    const categorySelect = document.getElementById('category-select')
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">カテゴリを選択 *</option>' +
        categoriesRes.data.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')
    }

    // メーカー選択肢を設定
    const makerSelect = document.getElementById('maker-select')
    if (makerSelect) {
      makerSelect.innerHTML = '<option value="">メーカーを選択</option>' +
        makersRes.data.makers.map(maker => `<option value="${maker.id}">${maker.name}</option>`).join('')
    }
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }

  // 画像アップロードエリアのイベント設定
  const imageInput = document.getElementById('image-input')
  const dropZone = document.getElementById('drop-zone')

  if (imageInput && dropZone) {
    imageInput.addEventListener('change', (e) => {
      productForm.handleImageUpload(e.target.files)
    })

    // ドラッグ&ドロップ対応
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('border-blue-500', 'bg-blue-50')
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
      productForm.handleImageUpload(e.dataTransfer.files)
    })
  }

  // カテゴリ変更イベント
  const categorySelect = document.getElementById('category-select')
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      productForm.loadSubcategories(e.target.value)
    })
  }

  // メーカー変更イベント
  const makerSelect = document.getElementById('maker-select')
  if (makerSelect) {
    makerSelect.addEventListener('change', (e) => {
      productForm.loadModels(e.target.value)
    })
  }

  // 編集モードの場合、商品データを読み込み
  if (window.EDIT_MODE && window.PRODUCT_ID) {
    loadProductForEdit(window.PRODUCT_ID)
  }
})

// 編集モード：商品データを読み込んで表示
async function loadProductForEdit(productId) {
  try {
    const response = await axios.get(`/api/products/${productId}`)
    
    if (response.data.success) {
      const product = response.data.data
      
      // フォームに値を設定
      document.getElementById('product-title').value = product.title || ''
      document.getElementById('product-description').value = product.description || ''
      document.getElementById('product-price').value = product.price || ''
      document.getElementById('stock-quantity').value = product.stock_quantity || 1
      document.getElementById('part-number').value = product.part_number || ''
      
      // カテゴリ
      if (product.category_id) {
        document.getElementById('category-select').value = product.category_id
        if (product.subcategory_id) {
          await productForm.loadSubcategories(product.category_id)
          document.getElementById('subcategory-select').value = product.subcategory_id
        }
      }
      
      // 状態
      if (product.condition) {
        document.getElementById('condition-select').value = product.condition
      }
      
      // メーカー・車種
      if (product.maker_id) {
        document.getElementById('maker-select').value = product.maker_id
        if (product.model_id) {
          await productForm.loadModels(product.maker_id)
          document.getElementById('model-select').value = product.model_id
        }
      }
      
      // 適合情報
      const compatibility = product.compatibility || {}
      document.getElementById('year-from').value = compatibility.year_from || ''
      document.getElementById('year-to').value = compatibility.year_to || ''
      document.getElementById('model-code').value = compatibility.model_code || ''
      document.getElementById('grade').value = compatibility.grade || ''
      document.getElementById('engine-type').value = compatibility.engine_type || ''
      document.getElementById('drive-type').value = compatibility.drive_type || ''
      
      // 画像を読み込み
      if (product.images && product.images.length > 0) {
        productForm.uploadedImages = product.images.map(img => ({
          url: img.image_url,
          display_order: img.display_order
        }))
        productForm.renderImagePreviews()
      }
      
      // ローディング非表示、フォーム表示
      document.getElementById('loading').style.display = 'none'
      document.getElementById('form-content').classList.remove('hidden')
      
      // 送信ボタンのテキストを変更
      const submitBtn = document.getElementById('submit-btn')
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>変更を保存'
      }
      
    } else {
      throw new Error(response.data.error || '商品情報の取得に失敗しました')
    }
  } catch (error) {
    console.error('Failed to load product:', error)
    document.getElementById('loading').innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>${error.message || '商品情報の読み込みに失敗しました'}</p>
        <button onclick="window.history.back()" class="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold">
          戻る
        </button>
      </div>
    `
  }
}
