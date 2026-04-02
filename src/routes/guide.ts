import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const guideRoutes = new Hono<{ Bindings: Bindings }>()

// ===== ガイド記事テンプレート定義 =====
interface GuideTemplate {
  name: string
  label: string
  description: string
  defaultCategory: string
  generateSections: (params: Record<string, string>) => { heading: string; body: string }[]
  generateComparison?: (params: Record<string, string>) => { item: string; dealer: string; parts_hub: string; savings: string }[]
}

const TEMPLATES: Record<string, GuideTemplate> = {
  'cost-comparison': {
    name: 'cost-comparison',
    label: '費用比較ガイド',
    description: 'パーツの費用をディーラーとPARTS HUBで比較するガイド記事',
    defaultCategory: '費用比較',
    generateSections: (p) => [
      { heading: `${p.part_name}の一般的な費用`, body: `${p.part_name}の交換・修理は、安全性と車両性能に直結する重要な整備項目です。一般的に${p.price_range || '数千円〜数万円'}が相場ですが、ディーラーと一般整備工場では価格に大きな差があります。${p.additional_context || ''}` },
      { heading: 'なぜ仕入れコストの削減が重要なのか', body: `${p.part_name}を定期的に交換する整備工場にとって、仕入れコストの削減は利益率に直結します。部品商からの仕入れ価格は固定されがちですが、PARTS HUBでは全国の整備工場が余剰在庫を出品しているため、市価より安く入手できる可能性があります。特に${p.target_vehicle || '幅広い車種'}で需要が高いパーツです。` },
      { heading: 'PARTS HUBで賢く調達する方法', body: `PARTS HUBでは「${p.search_keyword || p.part_name}」で検索すれば、対応するパーツが一覧表示されます。品番検索にも対応しているため、適合を確認した上で購入できます。出品者とのチャット機能で状態の詳細を事前に確認でき、${p.quality_note || '品質に納得した上で購入'}可能です。中古パーツやリビルトパーツを活用して、仕入れコストを削減しましょう。` }
    ],
    generateComparison: (p) => {
      if (!p.comparison_items) return []
      try {
        return JSON.parse(p.comparison_items)
      } catch { return [] }
    }
  },
  'how-to': {
    name: 'how-to',
    label: '実践ハウツーガイド',
    description: '整備工場の実践的なノウハウを解説するガイド記事',
    defaultCategory: '実践ガイド',
    generateSections: (p) => [
      { heading: `${p.topic}とは`, body: p.intro || `${p.topic}について、整備工場の現場で役立つ実践的な情報をまとめました。${p.background || ''}` },
      { heading: '具体的な方法と手順', body: p.method || `${p.topic}を実践するための具体的な手順を解説します。${p.steps || ''}` },
      { heading: 'PARTS HUBを活用した改善策', body: p.parts_hub_tie_in || `PARTS HUBを活用することで、${p.topic}に関連するコスト削減や効率化が可能です。全国の整備工場ネットワークを通じて、必要なパーツや工具を最適な価格で調達できます。` }
    ]
  },
  'business-improvement': {
    name: 'business-improvement',
    label: '経営改善ガイド',
    description: '整備工場の経営改善に焦点を当てたガイド記事',
    defaultCategory: '経営改善',
    generateSections: (p) => [
      { heading: `${p.challenge}の現状と課題`, body: p.current_situation || `整備業界において${p.challenge}は多くの事業者が直面している課題です。${p.statistics || ''}` },
      { heading: '改善のための具体的なアプローチ', body: p.solution || `${p.challenge}を改善するために、以下のアプローチが効果的です。${p.approach_detail || ''}` },
      { heading: '成功事例と期待効果', body: p.expected_results || `これらの施策を実践した整備工場では、${p.success_metric || 'コスト削減や売上向上'}の成果が報告されています。PARTS HUBの活用はこの取り組みをさらに加速させます。` }
    ]
  },
  'web-marketing': {
    name: 'web-marketing',
    label: 'Web集客ガイド',
    description: '整備工場のデジタルマーケティングに関するガイド記事',
    defaultCategory: 'Web集客',
    generateSections: (p) => [
      { heading: `なぜ${p.channel}が整備工場に重要なのか`, body: p.importance || `${p.channel}は整備工場の新規顧客獲得において非常に効果的なチャネルです。${p.market_data || ''}` },
      { heading: '具体的な始め方と設定手順', body: p.setup_guide || `${p.channel}を効果的に活用するための具体的な設定手順と、最初に行うべきことを解説します。${p.initial_steps || ''}` },
      { heading: '効果測定と改善サイクル', body: p.measurement || `${p.channel}の効果を測定し、継続的に改善していく方法を解説します。${p.kpi_info || ''}` },
      { heading: 'PARTS HUBとの連携で効果を最大化', body: p.synergy || `${p.channel}とPARTS HUBを組み合わせることで、集客力とコスト競争力の両面から整備工場の経営を強化できます。` }
    ]
  }
}

// ===================================================================
// ガイド記事自動生成用：50+キーワードプール
// ===================================================================
interface GuideKeyword {
  slug: string
  template: string
  params: Record<string, string>
}

const GUIDE_KEYWORD_POOL: GuideKeyword[] = [
  // === 費用比較ガイド (20+) ===
  { slug: 'alternator-cost', template: 'cost-comparison', params: { part_name: 'オルタネーター', title: 'オルタネーター交換の費用比較ガイド', price_range: '15,000円〜80,000円', target_vehicle: 'トヨタ・日産・ホンダなど国産車全般', search_keyword: 'オルタネーター リビルト', comparison_items: JSON.stringify([{item:'リビルトオルタネーター',dealer:'45,000円',parts_hub:'18,000円',savings:'60%'},{item:'新品オルタネーター',dealer:'80,000円',parts_hub:'45,000円',savings:'44%'}]) }},
  { slug: 'starter-motor-cost', template: 'cost-comparison', params: { part_name: 'スターターモーター', title: 'スターターモーター交換の費用と調達ガイド', price_range: '10,000円〜60,000円', target_vehicle: '軽自動車からミニバンまで', search_keyword: 'セルモーター スターター', comparison_items: JSON.stringify([{item:'リビルトスターター',dealer:'35,000円',parts_hub:'12,000円',savings:'66%'},{item:'新品スターター',dealer:'60,000円',parts_hub:'35,000円',savings:'42%'}]) }},
  { slug: 'radiator-cost', template: 'cost-comparison', params: { part_name: 'ラジエーター', title: 'ラジエーター交換費用の徹底比較', price_range: '20,000円〜100,000円', target_vehicle: '普通乗用車・SUV', search_keyword: 'ラジエーター', comparison_items: JSON.stringify([{item:'社外ラジエーター',dealer:'65,000円',parts_hub:'22,000円',savings:'66%'},{item:'純正ラジエーター',dealer:'100,000円',parts_hub:'55,000円',savings:'45%'}]) }},
  { slug: 'compressor-cost', template: 'cost-comparison', params: { part_name: 'エアコンコンプレッサー', title: 'エアコンコンプレッサー交換費用ガイド', price_range: '30,000円〜120,000円', target_vehicle: '乗用車全般', search_keyword: 'エアコン コンプレッサー リビルト', comparison_items: JSON.stringify([{item:'リビルトコンプレッサー',dealer:'80,000円',parts_hub:'30,000円',savings:'63%'},{item:'新品コンプレッサー',dealer:'120,000円',parts_hub:'65,000円',savings:'46%'}]) }},
  { slug: 'power-steering-pump-cost', template: 'cost-comparison', params: { part_name: 'パワーステアリングポンプ', title: 'パワステポンプの交換費用と調達方法', price_range: '15,000円〜70,000円', target_vehicle: '油圧パワステ搭載車', search_keyword: 'パワステポンプ', comparison_items: JSON.stringify([{item:'リビルトポンプ',dealer:'50,000円',parts_hub:'18,000円',savings:'64%'},{item:'新品ポンプ',dealer:'70,000円',parts_hub:'40,000円',savings:'43%'}]) }},
  { slug: 'turbo-charger-cost', template: 'cost-comparison', params: { part_name: 'ターボチャージャー', title: 'ターボチャージャーの交換費用比較', price_range: '50,000円〜300,000円', target_vehicle: 'ターボ搭載の軽自動車・スポーツカー', search_keyword: 'タービン ターボ リビルト', comparison_items: JSON.stringify([{item:'リビルトターボ',dealer:'150,000円',parts_hub:'55,000円',savings:'63%'},{item:'新品ターボ',dealer:'300,000円',parts_hub:'180,000円',savings:'40%'}]) }},
  { slug: 'transmission-cost', template: 'cost-comparison', params: { part_name: 'トランスミッション（AT/CVT）', title: 'AT・CVTミッション交換費用ガイド', price_range: '100,000円〜500,000円', target_vehicle: '乗用車全般', search_keyword: 'AT CVT ミッション', comparison_items: JSON.stringify([{item:'リビルトAT',dealer:'350,000円',parts_hub:'120,000円',savings:'66%'},{item:'中古AT(低走行)',dealer:'250,000円',parts_hub:'80,000円',savings:'68%'}]) }},
  { slug: 'catalytic-converter-cost', template: 'cost-comparison', params: { part_name: '触媒コンバーター', title: '触媒（キャタライザー）交換の費用比較', price_range: '30,000円〜200,000円', target_vehicle: '排ガス規制対応車', search_keyword: '触媒 キャタライザー', comparison_items: JSON.stringify([{item:'社外触媒',dealer:'120,000円',parts_hub:'35,000円',savings:'71%'},{item:'純正触媒',dealer:'200,000円',parts_hub:'90,000円',savings:'55%'}]) }},
  { slug: 'abs-module-cost', template: 'cost-comparison', params: { part_name: 'ABSモジュール（アクチュエーター）', title: 'ABSユニット交換の費用と中古品活用', price_range: '30,000円〜150,000円', target_vehicle: 'ABS搭載車全般', search_keyword: 'ABS モジュール アクチュエーター', comparison_items: JSON.stringify([{item:'中古ABSユニット',dealer:'100,000円',parts_hub:'25,000円',savings:'75%'},{item:'リビルトABS',dealer:'150,000円',parts_hub:'60,000円',savings:'60%'}]) }},
  { slug: 'headlight-unit-cost', template: 'cost-comparison', params: { part_name: 'ヘッドライトユニット（HID/LED）', title: 'ヘッドライトユニット交換費用ガイド', price_range: '15,000円〜150,000円', target_vehicle: 'HID・LED搭載車', search_keyword: 'ヘッドライト HID LED', comparison_items: JSON.stringify([{item:'中古ヘッドライト',dealer:'80,000円',parts_hub:'20,000円',savings:'75%'},{item:'社外ヘッドライト',dealer:'60,000円',parts_hub:'25,000円',savings:'58%'}]) }},
  { slug: 'fuel-pump-cost', template: 'cost-comparison', params: { part_name: '燃料ポンプ', title: '燃料ポンプ交換の費用と最適な調達法', price_range: '10,000円〜50,000円', target_vehicle: 'インジェクション車', search_keyword: '燃料ポンプ フューエルポンプ', comparison_items: JSON.stringify([{item:'社外燃料ポンプ',dealer:'35,000円',parts_hub:'10,000円',savings:'71%'},{item:'純正燃料ポンプ',dealer:'50,000円',parts_hub:'25,000円',savings:'50%'}]) }},
  { slug: 'ecu-cost', template: 'cost-comparison', params: { part_name: 'ECU（エンジンコントロールユニット）', title: 'ECU交換費用とリビルト品の活用', price_range: '30,000円〜200,000円', target_vehicle: '電子制御エンジン搭載車', search_keyword: 'ECU コンピューター', comparison_items: JSON.stringify([{item:'中古ECU',dealer:'120,000円',parts_hub:'25,000円',savings:'79%'},{item:'リビルトECU',dealer:'200,000円',parts_hub:'70,000円',savings:'65%'}]) }},
  { slug: 'door-mirror-cost', template: 'cost-comparison', params: { part_name: 'ドアミラー（電動格納式）', title: '電動ドアミラー交換の費用比較', price_range: '8,000円〜50,000円', target_vehicle: '乗用車全般', search_keyword: 'ドアミラー 電動', comparison_items: JSON.stringify([{item:'中古ドアミラー',dealer:'35,000円',parts_hub:'8,000円',savings:'77%'},{item:'新品ドアミラー',dealer:'50,000円',parts_hub:'25,000円',savings:'50%'}]) }},
  { slug: 'shock-absorber-cost', template: 'cost-comparison', params: { part_name: 'ショックアブソーバー', title: 'ショックアブソーバー交換費用を徹底比較', price_range: '8,000円〜40,000円（1本）', target_vehicle: '乗用車全般', search_keyword: 'ショックアブソーバー ダンパー', comparison_items: JSON.stringify([{item:'社外ショック(4本)',dealer:'80,000円',parts_hub:'28,000円',savings:'65%'},{item:'純正ショック(4本)',dealer:'160,000円',parts_hub:'70,000円',savings:'56%'}]) }},
  { slug: 'drive-shaft-cost', template: 'cost-comparison', params: { part_name: 'ドライブシャフト', title: 'ドライブシャフト交換費用と中古品調達', price_range: '15,000円〜60,000円', target_vehicle: 'FF車・4WD車', search_keyword: 'ドライブシャフト', comparison_items: JSON.stringify([{item:'リビルトドライブシャフト',dealer:'45,000円',parts_hub:'15,000円',savings:'67%'},{item:'新品ドライブシャフト',dealer:'60,000円',parts_hub:'35,000円',savings:'42%'}]) }},
  { slug: 'water-pump-cost', template: 'cost-comparison', params: { part_name: 'ウォーターポンプ', title: 'ウォーターポンプ交換の費用比較ガイド', price_range: '5,000円〜30,000円', target_vehicle: '水冷エンジン搭載車全般', search_keyword: 'ウォーターポンプ', comparison_items: JSON.stringify([{item:'社外ウォーターポンプ',dealer:'18,000円',parts_hub:'5,000円',savings:'72%'},{item:'純正ウォーターポンプ',dealer:'30,000円',parts_hub:'15,000円',savings:'50%'}]) }},
  { slug: 'ignition-coil-cost', template: 'cost-comparison', params: { part_name: 'イグニッションコイル', title: 'イグニッションコイル交換費用と賢い調達法', price_range: '3,000円〜15,000円（1個）', target_vehicle: 'ダイレクトイグニッション車', search_keyword: 'イグニッションコイル', comparison_items: JSON.stringify([{item:'社外コイル(4個)',dealer:'40,000円',parts_hub:'12,000円',savings:'70%'},{item:'純正コイル(4個)',dealer:'60,000円',parts_hub:'28,000円',savings:'53%'}]) }},
  { slug: 'oxygen-sensor-cost', template: 'cost-comparison', params: { part_name: 'O2センサー（酸素センサー）', title: 'O2センサー交換費用の比較ガイド', price_range: '5,000円〜30,000円', target_vehicle: '排ガス浄化システム搭載車', search_keyword: 'O2センサー 酸素センサー', comparison_items: JSON.stringify([{item:'社外O2センサー',dealer:'20,000円',parts_hub:'5,000円',savings:'75%'},{item:'純正O2センサー',dealer:'30,000円',parts_hub:'14,000円',savings:'53%'}]) }},

  // === 実践ハウツーガイド (12+) ===
  { slug: 'timing-belt-replacement', template: 'how-to', params: { topic: 'タイミングベルト交換の適切な時期と方法', title: 'タイミングベルト交換のベストタイミングと費用削減術', intro: 'タイミングベルトは走行距離10万km前後で交換が推奨される重要な消耗品です。切れるとエンジンに致命的なダメージを与えるため、適切な時期での交換が不可欠です。ここでは交換の判断基準と、PARTS HUBを活用したコスト削減方法を解説します。', method: '交換目安は走行距離10万km、または前回交換から7〜10年です。同時にウォーターポンプ、テンショナー、アイドラーも交換するのがベストプラクティスです。これによりエンジン脱着の工賃を1回で済ませることができ、トータルコストを抑えられます。PARTS HUBでは「タイミングベルトセット」で検索すると、セット品が多数出品されています。' }},
  { slug: 'hybrid-battery-diagnosis', template: 'how-to', params: { topic: 'ハイブリッド車バッテリー診断と交換', title: 'ハイブリッド車の駆動用バッテリー診断・交換ガイド', intro: 'プリウスやアクアなどのハイブリッド車の駆動用バッテリーは、走行距離15〜20万kmで劣化が顕著になります。新品は20〜40万円と高額ですが、リビルトバッテリーを活用すれば大幅にコストを抑えられます。診断方法と調達のポイントを解説します。', method: 'まずOBDスキャナーで各セルの電圧バランスを確認します。電圧差が0.3V以上あるセルが複数ある場合は交換時期です。HVバッテリーの取り扱いには安全資格が必要です。PARTS HUBでは動作確認済みのリビルトHVバッテリーが出品されており、新品の50〜70%引きで調達できます。' }},
  { slug: 'dpf-cleaning-maintenance', template: 'how-to', params: { topic: 'DPF（ディーゼル微粒子フィルター）の清掃・メンテナンス', title: 'DPFの詰まり対策と清掃メンテナンス完全ガイド', intro: 'ディーゼル車のDPFは走行条件によって目詰まりが発生し、エンジン警告灯の点灯や出力低下を引き起こします。交換すると10万円以上かかるDPFですが、適切なメンテナンスで寿命を延ばせます。', method: 'DPF再生には自動再生と手動（強制）再生があります。短距離走行が多い車両は手動再生の頻度が上がるため、定期的に高速道路走行を行うことが効果的です。目詰まりが進行した場合は専門のDPF洗浄サービスを利用するか、PARTS HUBで中古・リビルトDPFを調達して交換する方法もあります。' }},
  { slug: 'adas-calibration-guide', template: 'how-to', params: { topic: 'ADAS（先進運転支援システム）カメラキャリブレーション', title: 'ADAS カメラ・センサーのキャリブレーション実践ガイド', intro: '衝突被害軽減ブレーキやレーンキープアシストなどのADASは、フロントガラス交換やバンパー脱着後にカメラ・センサーのキャリブレーション（再校正）が必要です。これを怠ると正常に動作しないだけでなく、車検にも通りません。', method: 'ADASキャリブレーションにはターゲットボードとスキャンツールが必要です。静的キャリブレーションは工場内で行い、動的キャリブレーションは実際の走行が必要です。SST（専用ツール）はPARTS HUBで中古品を調達でき、導入コストを50%以上削減できます。' }},
  { slug: 'classic-car-parts-sourcing', template: 'how-to', params: { topic: '旧車・絶版車のパーツ調達', title: '旧車・絶版車パーツの調達方法と注意点', intro: '製造から20年以上経過した旧車は、メーカーの部品供給が終了していることが多く、パーツ調達が大きな課題です。PARTS HUBのようなプラットフォームは、全国の整備工場から希少パーツを発見できる強力なツールです。', method: 'まず品番を正確に特定することが重要です。メーカーの部品カタログやEPC（電子パーツカタログ）を活用しましょう。PARTS HUBでは品番検索に加えて、「探しています」機能で全国の出品者に問いかけることができます。中古パーツの状態確認にはチャット機能を活用し、写真付きで詳細を確認しましょう。' }},
  { slug: 'obd-scan-diagnosis', template: 'how-to', params: { topic: 'OBD診断機の選び方と故障コード読み取り', title: 'OBD診断スキャンツールの選び方と活用法', intro: 'OBD（車載式故障診断）スキャンツールは整備工場の必須ツールです。故障コードの読み取りからリアルタイムデータの確認まで、整備の効率化に不可欠です。用途に合った診断機の選び方と、中古品での賢い調達方法を解説します。', method: '汎用スキャンツール（LAUNCH, Autel等）は幅広い車種に対応し、10〜50万円程度です。メーカー純正診断機は高機能ですが100万円以上するものも。まずは中古の汎用ツールから始めるのが賢明です。PARTS HUBでは整備工場が使わなくなった診断機を出品しており、新品の30〜60%引きで入手できることがあります。' }},
  { slug: 'rust-prevention-undercoat', template: 'how-to', params: { topic: '下回り防錆・アンダーコートの施工', title: '車両下回りの防錆処理とアンダーコート施工ガイド', intro: '積雪地域や沿岸部では融雪剤や塩害による下回りの腐食が深刻な問題です。定期的な防錆処理とアンダーコートの施工は、車両の寿命を大幅に延ばします。施工方法と必要な資材の調達について解説します。', method: '施工前にまず高圧洗浄で錆や汚れを除去します。錆が進行している場合はワイヤーブラシやサンダーで除去し、錆転換剤を塗布します。その上からアンダーコート剤をスプレーガンで塗布します。PARTS HUBでは防錆資材やスプレーガンなどの工具も調達可能です。' }},
  { slug: 'wheel-alignment-diy', template: 'how-to', params: { topic: 'ホイールアライメント調整の基礎知識', title: 'ホイールアライメント調整の基礎と機器導入ガイド', intro: 'ホイールアライメントの調整は、タイヤの偏摩耗防止と走行安定性の向上に不可欠です。アライメントテスターの導入は高額ですが、中古機器を活用すれば投資を抑えられます。', method: 'トー、キャンバー、キャスターの3要素を車両メーカーの基準値に合わせます。4輪アライメントテスターは新品で200〜500万円しますが、PARTS HUBで中古品を50万円台から見つけることができます。導入することで他店からのアライメント調整依頼も受けられ、新たな収益源になります。' }},
  { slug: 'air-conditioning-repair', template: 'how-to', params: { topic: 'カーエアコン修理と冷媒ガス充填', title: 'カーエアコン修理の手順と部品調達ガイド', intro: '夏場のカーエアコントラブルは緊急性が高く、迅速な対応が求められます。エバポレーターやコンデンサーなどの主要部品の故障診断から修理手順、リビルト部品の活用方法まで包括的に解説します。', method: 'まずマニホールドゲージで高圧・低圧を測定し、ガス漏れ箇所を特定します。コンプレッサー故障の場合はリビルト品が有効で、PARTS HUBでは新品の50〜70%の価格で調達できます。エバポレーター交換はダッシュボード脱着が必要なため工賃が高額になりますが、部品代をPARTS HUBで削減すれば顧客への見積もりを抑えられます。' }},
  { slug: 'battery-reconditioning', template: 'how-to', params: { topic: 'バッテリーの再生・パルス充電技術', title: 'バッテリー再生技術とパルス充電器の活用法', intro: '硫酸鉛がバッテリー極板に結晶化する「サルフェーション」は、バッテリー劣化の主要原因です。パルス充電技術を活用すれば、寿命を迎えたバッテリーの一部を再生できます。', method: 'パルス充電器は高周波パルスで硫酸鉛結晶を分解します。完全に劣化したバッテリーの再生は困難ですが、容量が70%程度まで低下したものなら再生の可能性があります。パルス充電器は新品で3〜10万円ですが、PARTS HUBでは中古品が出品されることもあります。再生不可能なバッテリーの交換用にも、PARTS HUBで各サイズのバッテリーが調達可能です。' }},
  { slug: 'injector-cleaning-test', template: 'how-to', params: { topic: 'インジェクター洗浄とテスト方法', title: 'インジェクター洗浄・テストの実践手順', intro: '燃料インジェクターの詰まりや噴霧パターンの乱れは、燃費悪化やエンジン不調の原因になります。超音波洗浄やフローテストによるメンテナンスで、交換せずに性能を回復させる方法を解説します。', method: 'まずインジェクターを取り外し、外観検査でリークやクラックがないか確認します。超音波洗浄機に15〜30分浸漬し、フローテスターで噴射量と噴霧パターンを確認します。規定値から10%以上ずれている場合は交換が必要です。PARTS HUBでは超音波洗浄機やフローテスター、中古インジェクターの調達が可能です。' }},
  { slug: 'window-regulator-repair', template: 'how-to', params: { topic: 'パワーウインドウレギュレーターの修理・交換', title: 'パワーウインドウレギュレーター修理の実践ガイド', intro: 'パワーウインドウの動作不良はワイヤー式レギュレーターの断線やモーター故障が主な原因です。純正品は高額ですが、中古品やリビルト品を活用すれば大幅にコストを抑えられます。', method: 'ドアトリムを外し、レギュレーターの状態を確認します。ワイヤー切れの場合はレギュレーター一式の交換が必要です。モーターのみの故障なら単体交換も可能です。PARTS HUBでは車種別の中古レギュレーターが多数出品されており、純正新品の70〜80%引きで調達できることがあります。' }},

  // === 経営改善ガイド (10+) ===
  { slug: 'inventory-optimization', template: 'business-improvement', params: { challenge: '在庫最適化と余剰パーツの収益化', title: '整備工場の在庫最適化と余剰パーツ収益化戦略', current_situation: '多くの整備工場では、過去の経験に基づく「感覚的な」在庫管理が行われており、結果として年間仕入れ額の15〜25%が余剰在庫として眠っています。これは年間100万円以上の機会損失に相当します。', solution: '在庫回転率の分析とABC管理（売れ筋を優先管理）を導入することで、適正在庫を維持できます。余剰在庫はPARTS HUBに出品することで即座に収益化が可能です。出品は無料、成約時のみ10%の手数料なのでリスクゼロで始められます。', expected_results: '在庫最適化に取り組んだ整備工場では、在庫関連コストの30%削減と、余剰パーツ出品による年間50〜200万円の追加収益が報告されています。' }},
  { slug: 'technician-recruitment', template: 'business-improvement', params: { challenge: '整備士不足と人材確保', title: '整備士不足時代の人材確保と業務効率化', current_situation: '全国の自動車整備士数は年々減少しており、2025年時点で約5.4万人の不足が見込まれています。特に地方では深刻で、求人を出しても応募がない状況が続いています。', solution: '人材確保には待遇改善が不可欠です。PARTS HUBを活用して仕入れコストを削減し、浮いた原資を人件費に充てることで、他店との差別化が可能です。また、パーツ調達業務の効率化（検索・比較・発注がオンラインで完結）により、既存スタッフの負担軽減にもつながります。', expected_results: 'パーツ調達コストの20%削減に成功した整備工場では、年間利益の増加分を原資にベースアップを実施し、離職率が40%改善した事例があります。' }},
  { slug: 'customer-retention-strategy', template: 'business-improvement', params: { challenge: '顧客リピート率の向上', title: '整備工場の顧客リピート率を高める経営戦略', current_situation: '整備工場の平均顧客リピート率は50〜60%程度とされています。新規顧客獲得コストは既存顧客維持の5倍かかるため、リピート率の改善は利益に直結します。', solution: 'リピート率向上には、①適正価格の見積もり提示、②整備内容の丁寧な説明、③次回整備時期のリマインド、④SNSでの情報発信が効果的です。PARTS HUBを活用して仕入れコストを抑え、その分をお客様への価格還元に回すことで、「安くて信頼できる」工場として選ばれ続けます。' }},
  { slug: 'workshop-profitability', template: 'business-improvement', params: { challenge: '整備工場の収益性改善', title: '整備工場の収益性を劇的に改善する方法', current_situation: '整備工場の平均営業利益率は3〜5%と低水準で推移しています。人件費の上昇と部品価格の高騰により、利益を確保することがますます困難になっています。', solution: 'リビルトパーツや中古パーツの活用は、部品原価を30〜70%削減できる最も即効性のある施策です。PARTS HUBでは全国の整備工場から出品される良質なパーツを、品番検索で簡単に見つけられます。また、自社の余剰在庫を出品して副収入を得ることも可能です。', expected_results: '仕入れルートにPARTS HUBを追加した整備工場では、粗利率が平均8ポイント改善し、年間200〜500万円の利益増を達成しています。' }},
  { slug: 'insurance-claims-optimization', template: 'business-improvement', params: { challenge: '保険修理の利益最大化', title: '保険修理における利益を最大化する調達戦略', current_situation: '保険修理では保険会社との協定工賃が固定されるため、部品代の最適化が利益を左右します。外装パーツは純正品指定が多いですが、機能部品はリビルトや社外品の活用余地があります。', solution: '保険修理で中古・リビルトパーツを活用する場合、保険会社との事前合意が重要です。品質が保証されたリビルトパーツであれば、多くの保険会社が認めています。PARTS HUBでは出品者の評価やレビューを確認できるため、信頼性の高いパーツを選定できます。' }},
  { slug: 'ev-business-transition', template: 'business-improvement', params: { challenge: 'EV時代への事業転換', title: 'EV時代に備える整備工場の事業転換戦略', current_situation: '2035年にはガソリン車の新車販売が禁止される見込みで、EV・PHEV・HEVの整備需要が急増します。一方でEVはエンジンオイル交換やマフラー修理がなく、従来の収益構造が大きく変わります。', solution: 'EV整備に必要な知識（高電圧システム、バッテリーマネジメント等）の習得と、EV専用診断ツールの導入が急務です。PARTS HUBではHVバッテリーのリビルト品やEV用部品の取引が増えており、新しい仕入れルートとして活用できます。また、ガソリン車向け工具・設備の売却もPARTS HUBで可能です。' }},
  { slug: 'workshop-digital-management', template: 'business-improvement', params: { challenge: 'ペーパーレス化と業務のデジタル管理', title: '整備工場のペーパーレス化と業務効率化', current_situation: '多くの整備工場では紙の伝票や手書きの整備記録が主流で、情報の検索や集計に多くの時間を費やしています。デジタル化が遅れている工場ほど、業務効率と顧客満足度に課題を抱えています。', solution: '整備管理ソフト（ブロードリーフ、鈑金プロ等）の導入に加え、パーツ調達のオンライン化も重要なステップです。PARTS HUBでは検索から購入まで全てオンラインで完結するため、電話やFAXによる発注業務を大幅に削減できます。' }},
  { slug: 'used-parts-quality-assurance', template: 'business-improvement', params: { challenge: '中古パーツの品質保証体制の構築', title: '中古パーツの品質保証と顧客信頼の構築', current_situation: '中古パーツは価格面で大きなメリットがありますが、「品質が不安」という声が顧客・整備士双方から聞かれます。品質保証の仕組みを整えることで、中古パーツの活用率と顧客満足度を同時に高められます。', solution: 'PARTS HUBでは出品者が商品の状態を詳細に記載し、写真で確認できます。さらに取引レビュー制度とバッジシステムにより、信頼性の高い出品者を見分けることが可能です。「ゴールド」以上のバッジを持つ出品者から調達すれば、品質面での安心感が大幅に向上します。' }},

  // === Web集客ガイド (10+) ===
  { slug: 'instagram-marketing-workshop', template: 'web-marketing', params: { channel: 'Instagram', title: '整備工場のInstagram集客完全ガイド', importance: 'Instagramは月間アクティブユーザー数3,300万人を超え、特に20〜40代の自動車ユーザーにリーチできるプラットフォームです。整備のビフォーアフターや工場の雰囲気を視覚的に伝えることで、新規顧客の獲得に直結します。', setup_guide: 'ビジネスアカウントを開設し、プロフィールに工場の住所・電話番号・営業時間を設定します。投稿は「整備ビフォーアフター」「スタッフ紹介」「お客様の声」の3カテゴリをローテーションで。リール動画は特にリーチが伸びやすく、タイヤ交換やオイル交換の作業風景が人気です。' }},
  { slug: 'youtube-channel-workshop', template: 'web-marketing', params: { channel: 'YouTube', title: '整備工場のYouTubeチャンネル開設・運用ガイド', importance: 'YouTubeは「車 異音」「エンジン 不調」など、整備に関する検索ボリュームが非常に大きいプラットフォームです。整備解説動画を公開することで、専門性のアピールと潜在顧客の獲得が同時にできます。', setup_guide: 'チャンネル名は工場名＋「整備チャンネル」が分かりやすいです。まず「よくあるトラブルTOP5」「オイル交換の正しい手順」など、検索されやすいテーマから始めましょう。スマートフォンでの撮影で十分です。概要欄にはPARTS HUBへのリンクも記載できます。' }},
  { slug: 'google-ads-workshop', template: 'web-marketing', params: { channel: 'Google広告（リスティング広告）', title: '整備工場のGoogle広告活用ガイド', importance: 'Google広告は「○○市 車検」「近くの整備工場」など、今すぐ来店したい顧客に直接リーチできる広告手法です。月額1〜3万円の少額予算から始められ、効果測定も明確です。', setup_guide: 'まず「地域名＋車検」「地域名＋整備」などのキーワードで出稿します。広告文には「見積もり無料」「代車あり」など具体的な訴求を入れます。ランディングページには料金表とお客様の声を掲載し、電話タップで即予約できる導線を作りましょう。' }},
  { slug: 'line-business-workshop', template: 'web-marketing', params: { channel: 'LINE公式アカウント', title: '整備工場のLINE公式アカウント活用術', importance: 'LINE公式アカウントは日本で最も普及しているメッセージングアプリを活用した顧客接点です。友だち追加されれば継続的にメッセージを送れるため、車検リマインドやキャンペーン告知に最適です。月間アクティブユーザー9,600万人以上にリーチ可能です。', setup_guide: 'LINE公式アカウントを開設し、リッチメニューに「車検予約」「お問い合わせ」「営業時間」ボタンを設置します。友だち追加の特典（オイル交換500円引き等）を用意し、来店時にQRコードで登録を促します。自動応答メッセージで営業時間外の問い合わせにも対応できます。' }},
  { slug: 'tiktok-workshop-marketing', template: 'web-marketing', params: { channel: 'TikTok', title: '整備工場のTikTokマーケティング入門', importance: 'TikTokは若年層だけでなく30〜40代ユーザーも急増中で、「車いじり」「整備あるある」コンテンツが人気カテゴリです。15〜60秒の短い動画で工場の技術力や人柄をアピールでき、バズれば数十万回再生も珍しくありません。', setup_guide: '「整備のプロが教える○○」シリーズや、「この音、何の故障？」クイズ形式の動画が反応を集めやすいです。BGMとテロップを効果的に使い、テンポよく仕上げましょう。投稿頻度は週2〜3本が理想です。' }},
  { slug: 'meo-local-seo', template: 'web-marketing', params: { channel: 'MEO（Googleマップ最適化）', title: '整備工場のMEO対策で地域集客を強化する方法', importance: 'MEO（Map Engine Optimization）は、Googleマップでの検索結果を上位表示させる施策です。「近くの整備工場」「○○市 オイル交換」などのローカル検索は購買意欲の高いユーザーが多く、来店率が非常に高いのが特徴です。', setup_guide: 'まずGoogleビジネスプロフィールの情報を充実させます。営業時間、電話番号、写真（外観・内観・作業風景）を登録し、お客様にクチコミ投稿をお願いしましょう。週1回以上の投稿更新がランキング向上に効果的です。PARTS HUBでの仕入れ実績も「コスト削減の取り組み」として投稿できます。' }},
  { slug: 'referral-program-workshop', template: 'web-marketing', params: { channel: '紹介プログラム（口コミ紹介）', title: '整備工場の顧客紹介プログラム設計ガイド', importance: '既存顧客からの紹介は最も信頼性が高く、成約率の高い集客方法です。紹介顧客の生涯価値は通常の新規顧客の2〜3倍とも言われ、仕組み化することで安定的な新規獲得が可能になります。', setup_guide: '紹介者と被紹介者の双方にメリットがある仕組みを作ります。例：紹介者にオイル交換無料券、被紹介者に初回車検10%OFF。紹介カードを作成して名刺サイズで配布し、LINEでの紹介URLも用意するとハードルが下がります。' }},
]

// ===================================================================
// 地域別ニュースコラム自動生成用：47都道府県 × 季節テーマ
// ===================================================================
interface PrefectureInfo {
  name: string
  nameEn: string
  region: string
  features: string[]  // 地域特有の自動車・整備事情
  industries: string[] // 主要産業（物流との関連）
  climate: string      // 気候特性
}

const PREF_DATA: Record<string, PrefectureInfo> = {
  hokkaido:  { name: '北海道', nameEn: 'Hokkaido', region: '北海道', features: ['寒冷地仕様パーツの需要が高い', '冬季タイヤ・バッテリー取引が活発', '広大な面積で走行距離が長い'], industries: ['農業','漁業','観光'], climate: '亜寒帯' },
  aomori:    { name: '青森県', nameEn: 'Aomori', region: '東北', features: ['防錆パーツ需要が高い', '4WD関連部品が人気', '融雪剤対策が必須'], industries: ['りんご栽培','漁業'], climate: '積雪地域' },
  iwate:     { name: '岩手県', nameEn: 'Iwate', region: '東北', features: ['長距離走行車が多い', '足回りパーツ需要が安定'], industries: ['農業','畜産'], climate: '内陸性' },
  miyagi:    { name: '宮城県', nameEn: 'Miyagi', region: '東北', features: ['東北最大の都市部市場', '多車種のパーツ流通'], industries: ['水産加工','製造業'], climate: '太平洋側' },
  akita:     { name: '秋田県', nameEn: 'Akita', region: '東北', features: ['豪雪地帯のパーツ需要', '農業機械関連の整備も多い'], industries: ['米作','林業'], climate: '日本海側・豪雪' },
  yamagata:  { name: '山形県', nameEn: 'Yamagata', region: '東北', features: ['物流車両の整備需要', '商用車パーツが盛ん'], industries: ['さくらんぼ','米作'], climate: '内陸性・豪雪' },
  fukushima: { name: '福島県', nameEn: 'Fukushima', region: '東北', features: ['物流拠点が多い', 'トラック整備需要が高い'], industries: ['製造業','農業'], climate: '太平洋側' },
  ibaraki:   { name: '茨城県', nameEn: 'Ibaraki', region: '関東', features: ['自動車保有台数が全国上位', '工業地帯で整備需要が高い'], industries: ['製造業','農業'], climate: '温暖' },
  tochigi:   { name: '栃木県', nameEn: 'Tochigi', region: '関東', features: ['自動車メーカー工場が立地', 'テスト車両用パーツ需要'], industries: ['自動車産業','農業'], climate: '内陸性' },
  gunma:     { name: '群馬県', nameEn: 'Gunma', region: '関東', features: ['SUBARUの本拠地', '自動車関連産業の集積'], industries: ['自動車産業','繊維'], climate: '内陸性' },
  saitama:   { name: '埼玉県', nameEn: 'Saitama', region: '関東', features: ['自動車保有台数が多い', '乗用車整備需要が高い'], industries: ['商業','製造業'], climate: '温暖' },
  chiba:     { name: '千葉県', nameEn: 'Chiba', region: '関東', features: ['商用車と乗用車の双方', '京葉工業地帯の物流'], industries: ['物流','農業','観光'], climate: '温暖・海洋性' },
  tokyo:     { name: '東京都', nameEn: 'Tokyo', region: '関東', features: ['全国最大の自動車市場', '先端技術パーツ需要が集中'], industries: ['商業','IT','金融'], climate: '温暖' },
  kanagawa:  { name: '神奈川県', nameEn: 'Kanagawa', region: '関東', features: ['日産自動車の本社', '多種多様なパーツ需要'], industries: ['自動車産業','物流'], climate: '温暖・海洋性' },
  niigata:   { name: '新潟県', nameEn: 'Niigata', region: '中部', features: ['豪雪地帯', 'スタッドレスタイヤ需要が活発'], industries: ['米作','製造業'], climate: '日本海側・豪雪' },
  toyama:    { name: '富山県', nameEn: 'Toyama', region: '中部', features: ['品質意識が高い', '純正パーツ需要が根強い'], industries: ['製造業','製薬'], climate: '日本海側' },
  ishikawa:  { name: '石川県', nameEn: 'Ishikawa', region: '中部', features: ['観光関連車両が多い', '業務用車両パーツ需要'], industries: ['観光','伝統工芸'], climate: '日本海側' },
  fukui:     { name: '福井県', nameEn: 'Fukui', region: '中部', features: ['車社会', 'パーツ需要が安定'], industries: ['繊維','眼鏡'], climate: '日本海側' },
  yamanashi: { name: '山梨県', nameEn: 'Yamanashi', region: '中部', features: ['山間部走行が多い', '足回りパーツの消耗が早い'], industries: ['果樹栽培','観光'], climate: '内陸性' },
  nagano:    { name: '長野県', nameEn: 'Nagano', region: '中部', features: ['標高差のある走行', 'エンジン・冷却系パーツ需要'], industries: ['精密機器','観光','農業'], climate: '内陸性・高地' },
  gifu:      { name: '岐阜県', nameEn: 'Gifu', region: '中部', features: ['中京工業地帯の一角', '幅広い整備需要'], industries: ['製造業','観光'], climate: '内陸性' },
  shizuoka:  { name: '静岡県', nameEn: 'Shizuoka', region: '中部', features: ['SUZUKI・YAMAHAの本拠地', 'バイク・自動車パーツ市場'], industries: ['自動車産業','茶','水産'], climate: '温暖' },
  aichi:     { name: '愛知県', nameEn: 'Aichi', region: '中部', features: ['トヨタのお膝元', '最大の自動車産業集積地'], industries: ['自動車産業','航空宇宙'], climate: '温暖' },
  mie:       { name: '三重県', nameEn: 'Mie', region: '近畿', features: ['HONDAの鈴鹿製作所', 'モータースポーツ関連需要'], industries: ['自動車産業','石油化学'], climate: '温暖' },
  shiga:     { name: '滋賀県', nameEn: 'Shiga', region: '近畿', features: ['通勤車率が高い', '消耗品パーツの回転が早い'], industries: ['製造業','農業'], climate: '内陸性' },
  kyoto:     { name: '京都府', nameEn: 'Kyoto', region: '近畿', features: ['タクシー・バス需要', '業務用パーツ需要'], industries: ['観光','伝統産業','IT'], climate: '盆地性' },
  osaka:     { name: '大阪府', nameEn: 'Osaka', region: '近畿', features: ['西日本最大の経済圏', 'ダイハツ本社', '幅広いパーツ市場'], industries: ['商業','製造業'], climate: '温暖' },
  hyogo:     { name: '兵庫県', nameEn: 'Hyogo', region: '近畿', features: ['神戸港の輸入車パーツ', '播磨地域の商用車整備'], industries: ['鉄鋼','造船','商業'], climate: '温暖' },
  nara:      { name: '奈良県', nameEn: 'Nara', region: '近畿', features: ['通勤車両が多い', '日常消耗品需要が安定'], industries: ['観光','農業'], climate: '盆地性' },
  wakayama:  { name: '和歌山県', nameEn: 'Wakayama', region: '近畿', features: ['山間部が多い', '足回り・駆動系需要が高い'], industries: ['農業','漁業','林業'], climate: '温暖' },
  tottori:   { name: '鳥取県', nameEn: 'Tottori', region: '中国', features: ['車社会で保有率が高い', '一人当たりの自動車保有率が高い'], industries: ['農業','漁業'], climate: '日本海側' },
  shimane:   { name: '島根県', nameEn: 'Shimane', region: '中国', features: ['中山間地域が多い', '軽トラック・四駆需要が高い'], industries: ['農業','漁業'], climate: '日本海側' },
  okayama:   { name: '岡山県', nameEn: 'Okayama', region: '中国', features: ['三菱自動車の工場', '物流ハブとして商用車パーツ盛ん'], industries: ['製造業','農業'], climate: '温暖・晴天多い' },
  hiroshima: { name: '広島県', nameEn: 'Hiroshima', region: '中国', features: ['MAZDAの本社', 'マツダ車パーツ流通量が多い'], industries: ['自動車産業','造船'], climate: '温暖' },
  yamaguchi: { name: '山口県', nameEn: 'Yamaguchi', region: '中国', features: ['化学工業地帯の特殊車両', '九州との結節点'], industries: ['化学工業','水産'], climate: '温暖' },
  tokushima: { name: '徳島県', nameEn: 'Tokushima', region: '四国', features: ['京阪神との物流', '商用車整備拠点が集中'], industries: ['製造業','農業'], climate: '温暖' },
  kagawa:    { name: '香川県', nameEn: 'Kagawa', region: '四国', features: ['自動車密度が高い', 'コンパクトカー・軽自動車中心'], industries: ['商業','農業'], climate: '温暖・少雨' },
  ehime:     { name: '愛媛県', nameEn: 'Ehime', region: '四国', features: ['造船・物流関連の整備需要', 'トラック整備が中心'], industries: ['造船','タオル','柑橘'], climate: '温暖' },
  kochi:     { name: '高知県', nameEn: 'Kochi', region: '四国', features: ['東西に長い県土', '走行距離が伸びやすい'], industries: ['農業','漁業','林業'], climate: '温暖・多雨' },
  fukuoka:   { name: '福岡県', nameEn: 'Fukuoka', region: '九州', features: ['九州最大の経済圏', '日産・トヨタ工場が立地'], industries: ['自動車産業','商業','IT'], climate: '温暖' },
  saga:      { name: '佐賀県', nameEn: 'Saga', region: '九州', features: ['農業県で軽トラック需要が高い', '実用車向けパーツ中心'], industries: ['農業','陶磁器'], climate: '温暖' },
  nagasaki:  { name: '長崎県', nameEn: 'Nagasaki', region: '九州', features: ['離島が多い', 'オンライン調達の意義が大きい'], industries: ['造船','漁業','観光'], climate: '温暖・海洋性' },
  kumamoto:  { name: '熊本県', nameEn: 'Kumamoto', region: '九州', features: ['HONDAの工場', '半導体産業の成長で物流車両増加'], industries: ['半導体','農業','自動車'], climate: '温暖' },
  oita:      { name: '大分県', nameEn: 'Oita', region: '九州', features: ['ダイハツの工場', '軽自動車パーツ流通が活発'], industries: ['自動車産業','温泉観光'], climate: '温暖' },
  miyazaki:  { name: '宮崎県', nameEn: 'Miyazaki', region: '九州', features: ['農畜産業の商用車整備', '温暖で良質な中古パーツが出回る'], industries: ['農畜産業','観光'], climate: '温暖・多照' },
  kagoshima: { name: '鹿児島県', nameEn: 'Kagoshima', region: '九州', features: ['火山灰対策パーツ需要', 'エアフィルター・ワイパー消耗品'], industries: ['農畜産業','焼酎'], climate: '温暖・火山灰' },
  okinawa:   { name: '沖縄県', nameEn: 'Okinawa', region: '沖縄', features: ['塩害による腐食が深刻', '防錆パーツ・外装部品需要が高い'], industries: ['観光','米軍基地関連'], climate: '亜熱帯' },
}

// 季節テーマプール（月ごと）
interface SeasonalTheme {
  months: number[]
  themes: {
    slug_suffix: string
    title_template: string  // ${pref} で県名置換
    generateContent: (pref: PrefectureInfo) => { heading: string; body: string }[]
  }[]
}

const SEASONAL_THEMES: SeasonalTheme[] = [
  // 春（3-5月）
  { months: [3, 4, 5], themes: [
    { slug_suffix: 'spring-maintenance', title_template: '${pref}の春の車検・整備シーズンに向けたパーツ調達ガイド',
      generateContent: (p) => [
        { heading: `${p.name}の春の整備需要`, body: `${p.name}では3月〜5月にかけて車検の集中時期を迎えます。年度末・年度初めの車両入替えや新生活に伴う整備需要が高まり、ブレーキパーツ、フィルター類、ベルト類の消耗品需要が一年で最も増加します。${p.features[0]}という地域特性もあり、効率的なパーツ調達が工場の収益を左右します。` },
        { heading: '車検整備で需要が増えるパーツTOP5', body: `春の車検シーズンに最も需要が高まるパーツは、1位：ブレーキパッド・ローター、2位：エンジンオイルフィルター、3位：エアフィルター、4位：ファンベルト・タイミングベルト、5位：ワイパーブレードです。PARTS HUBでは${p.region}エリアの整備工場からの出品も多く、${p.name}への配送も迅速です。` },
        { heading: `${p.name}の整備工場がPARTS HUBを活用するメリット`, body: `${p.industries.join('・')}が盛んな${p.name}では、物流車両から乗用車まで幅広い車種の整備需要があります。PARTS HUBなら品番検索で適合パーツを即座に見つけられ、車検の繁忙期でもスムーズに調達が可能です。余剰在庫の出品による副収入も期待できます。` }
      ]
    },
    { slug_suffix: 'tire-change-season', title_template: '${pref}の春のタイヤ交換シーズン：効率化と収益アップのポイント',
      generateContent: (p) => [
        { heading: `${p.name}のタイヤ交換需要`, body: `${p.climate}の気候特性を持つ${p.name}では、春先のスタッドレスタイヤからサマータイヤへの履き替え需要が集中します。3月中旬〜4月にかけてタイヤ交換のピークを迎え、ホイール、ナット、TPMS（空気圧センサー）の需要も同時に高まります。` },
        { heading: 'タイヤ関連パーツの効率的な調達', body: `タイヤ交換時に発見される足回りの不具合（ハブベアリング、タイロッドエンド、ブーツ類の劣化）への対応もビジネスチャンスです。PARTS HUBでは足回りパーツのリビルト品や社外品が豊富に出品されており、ディーラー価格の40〜70%で調達可能です。` },
        { heading: `${p.name}の工場への提案`, body: `タイヤ交換と同時に足回り点検を無料で実施し、追加整備を提案することで客単価を向上させましょう。${p.features.slice(-1)[0]}。パーツのコストをPARTS HUBで抑えることで、お客様にも適正価格を提示でき、リピート率の向上にもつながります。` }
      ]
    }
  ]},
  // 夏（6-8月）
  { months: [6, 7, 8], themes: [
    { slug_suffix: 'summer-air-conditioning', title_template: '${pref}の夏のエアコン修理需要とパーツ調達戦略',
      generateContent: (p) => [
        { heading: `${p.name}の夏のエアコン修理ラッシュ`, body: `${p.name}の夏は${p.climate}の気候のもと気温が上昇し、カーエアコンの修理依頼が急増します。6月〜8月にかけてコンプレッサー故障、ガス漏れ、エバポレーター劣化の修理が集中し、パーツの確保が工場の対応力を左右します。${p.features[0]}。` },
        { heading: 'エアコン関連パーツの需要と価格動向', body: `夏場のエアコン修理で最も需要が高いのはコンプレッサーで、リビルト品ならPARTS HUBで新品の50〜70%の価格で調達可能です。コンデンサー、エキスパンションバルブ、配管Oリングセットなども頻繁に必要になります。事前にストックしておくことで、即日修理対応が可能になりお客様満足度が向上します。` },
        { heading: '夏場の繁忙期を乗り越える調達術', body: `${p.name}の整備工場にとって、夏場はエアコン修理に加えてバッテリー上がりや冷却系トラブルも増加する繁忙期です。${p.industries.join('・')}関連の業務用車両も含め、多くの修理依頼に迅速に対応するには、PARTS HUBでの事前調達が効果的です。全国の工場から出品されるリビルトパーツを活用し、仕入れコストを抑えながら利益を確保しましょう。` }
      ]
    },
    { slug_suffix: 'summer-cooling-system', title_template: '${pref}の夏場の冷却系トラブル対策ガイド',
      generateContent: (p) => [
        { heading: `${p.name}の夏場の冷却系トラブル`, body: `夏場の高温時に発生しやすいオーバーヒートは、ラジエーター、サーモスタット、ウォーターポンプの劣化が主な原因です。${p.name}の${p.climate}気候では特に注意が必要で、長距離走行や渋滞の多いエリアではリスクが高まります。` },
        { heading: '冷却系パーツの予防的調達', body: `ラジエーター（社外品で2〜3万円台）、サーモスタット（3,000円前後）、ウォーターポンプ（5,000〜15,000円）は、夏前にストックしておくと緊急対応がスムーズです。PARTS HUBでは車種別の冷却系パーツが豊富に出品されています。` },
        { heading: 'トラブル予防で顧客満足度を向上', body: `春の車検時や点検時に冷却水の状態チェックと予防的な部品交換を提案することで、夏場のトラブルを未然に防げます。${p.features.slice(-1)[0]}。予防整備は顧客満足度とリピート率の向上に直結し、PARTS HUBで調達コストを抑えることで、魅力的な価格での提案が可能です。` }
      ]
    }
  ]},
  // 秋（9-11月）
  { months: [9, 10, 11], themes: [
    { slug_suffix: 'autumn-winter-prep', title_template: '${pref}の秋の冬支度：スタッドレス・冬季パーツの準備ガイド',
      generateContent: (p) => [
        { heading: `${p.name}の冬支度シーズン`, body: `${p.name}では10月〜11月にかけて冬の準備が本格化します。${p.climate}の気候のもと、スタッドレスタイヤへの交換、バッテリー点検、不凍液の補充が主な整備需要です。${p.features[0]}。この時期に需要が高まるパーツを事前に確保しておくことが重要です。` },
        { heading: '冬季パーツの需要予測と在庫戦略', body: `冬に需要が急増するパーツは、バッテリー（寒冷地は特に）、ワイパーブレード（スノーワイパー）、ヒーターコア、グロープラグ（ディーゼル車）です。PARTS HUBで秋のうちにリビルト品や社外品を調達しておけば、冬季の急な需要にも即対応できます。` },
        { heading: `${p.name}の整備工場向け冬の収益戦略`, body: `${p.industries.join('・')}が盛んな${p.name}では、冬場も業務用車両の稼働が続くため、整備需要は途切れません。タイヤ交換＋冬季点検パッケージを提案し、同時にバッテリーやワイパーの交換も行うことで客単価を向上させましょう。PARTS HUBでの仕入れコスト削減が利益確保の鍵です。` }
      ]
    },
    { slug_suffix: 'autumn-inspection-season', title_template: '${pref}の秋の車検シーズン：効率的なパーツ調達で収益最大化',
      generateContent: (p) => [
        { heading: `${p.name}の秋の車検需要`, body: `9月〜11月は春に次ぐ車検の集中時期です。${p.name}では特に${p.industries[0]}関連の車両を中心に、定期的な車検整備の需要が高まります。この時期をうまく乗り越えることが、年間収益を左右します。` },
        { heading: '車検整備の効率化ポイント', body: `車検整備の効率化には、頻繁に使用するパーツの事前ストックが不可欠です。ブレーキパッド、ディスクローター、ブーツ類、フィルター類をPARTS HUBで事前に調達しておくことで、入庫から完了までのリードタイムを短縮できます。${p.features.slice(-1)[0]}。` },
        { heading: 'コスト削減と品質を両立する調達法', body: `PARTS HUBでは出品者のレビューとバッジ（新規→スターター→ブロンズ→シルバー→ゴールド→プラチナ）で信頼性を確認できます。ゴールド以上のバッジを持つ出品者から調達すれば、品質面でも安心です。${p.region}エリアの出品者からの調達なら送料も抑えられます。` }
      ]
    }
  ]},
  // 冬（12-2月）
  { months: [12, 1, 2], themes: [
    { slug_suffix: 'winter-battery-trouble', title_template: '${pref}の冬のバッテリートラブル対策と調達ガイド',
      generateContent: (p) => [
        { heading: `${p.name}の冬のバッテリートラブル`, body: `${p.climate}の気候を持つ${p.name}では、冬場の気温低下に伴いバッテリートラブルが急増します。バッテリーは気温が0℃以下になると性能が30〜50%低下するため、${p.name}の整備工場では12月〜2月にバッテリー交換依頼が集中します。` },
        { heading: 'バッテリー調達のコスト削減戦略', body: `カーバッテリーは新品で5,000〜30,000円（乗用車用）ですが、PARTS HUBでは新品未使用バッテリーや高品質な社外品が出品されることもあります。また、${p.region}エリアの出品者から調達すれば送料を最小限に抑えられます。アイドリングストップ車用バッテリーは特に高額なため、賢い調達が重要です。` },
        { heading: `${p.name}の冬場の緊急対応体制`, body: `冬場は${p.industries.join('・')}を支える物流車両のトラブルも増加します。ロードサービス連携や緊急対応体制を整えておくことで、新規顧客の獲得チャンスが広がります。PARTS HUBでバッテリー各サイズをストックしておけば、即日交換対応が可能になり、お客様の信頼を獲得できます。` }
      ]
    },
    { slug_suffix: 'winter-snow-parts', title_template: '${pref}の冬場に必要な整備パーツ完全ガイド',
      generateContent: (p) => [
        { heading: `${p.name}の冬の整備需要`, body: `冬場の${p.name}では、寒冷・降雪・路面凍結に関連するパーツ需要が高まります。${p.features[0]}。ヒーター・デフロスター関連部品、ワイパーモーター、ウォッシャーポンプ、4WDシステムのトランスファーオイルなど、季節特有の需要に対応する準備が必要です。` },
        { heading: '冬季パーツの需要予測と先行調達', body: `冬場の需要が特に高いパーツは、グロープラグ（ディーゼル車）、ヒーターブロアモーター、サーモスタット、LLC（不凍液）、ワイパーモーター、フューエルフィルター（凍結防止用）です。PARTS HUBで11月中に先行調達しておけば、繁忙期の在庫切れを防げます。` },
        { heading: '冬場の整備工場の収益最大化', body: `${p.name}の整備工場は、冬季点検パッケージ（バッテリー＋冷却液＋ワイパー＋灯火類）を提供することで客単価を向上させられます。PARTS HUBでのまとめ買いでコストを抑え、パッケージ価格を魅力的に設定しましょう。${p.features.slice(-1)[0]}。リピーター獲得につながる施策です。` }
      ]
    }
  ]}
]

// ===================================================================
// API: テンプレート一覧取得
// ===================================================================
guideRoutes.get('/templates', (c) => {
  const templates = Object.values(TEMPLATES).map(t => ({
    name: t.name,
    label: t.label,
    description: t.description,
    defaultCategory: t.defaultCategory
  }))
  return c.json({ success: true, data: templates })
})

// ===================================================================
// API: テンプレートからプレビュー生成
// ===================================================================
guideRoutes.post('/preview', async (c) => {
  try {
    const body = await c.req.json()
    const { template_type, params } = body
    const template = TEMPLATES[template_type]
    if (!template) return c.json({ success: false, error: 'テンプレートが見つかりません' }, 400)
    const sections = template.generateSections(params)
    const comparison = template.generateComparison ? template.generateComparison(params) : undefined
    return c.json({
      success: true,
      data: {
        title: params.title || `${params.part_name || params.topic || params.challenge || params.channel}ガイド`,
        description: params.description || sections[0]?.body.slice(0, 120) + '...',
        category: params.category || template.defaultCategory,
        sections,
        comparison: comparison && comparison.length > 0 ? comparison : undefined
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'プレビュー生成に失敗しました' }, 500)
  }
})

// ===================================================================
// API: ガイド記事の保存（新規/更新）
// ===================================================================
guideRoutes.post('/save', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { slug, title, description, category, sections, comparison, status, template_type, target_keyword } = body
    if (!slug || !title || !sections || sections.length === 0) {
      return c.json({ success: false, error: 'slug, title, sectionsは必須です' }, 400)
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return c.json({ success: false, error: 'slugは英小文字、数字、ハイフンのみ使用できます' }, 400)
    }
    const sectionsJson = JSON.stringify(sections)
    const comparisonJson = comparison ? JSON.stringify(comparison) : null
    const publishedAt = status === 'published' ? new Date().toISOString() : null
    const existing = await DB.prepare('SELECT id FROM guide_articles WHERE slug = ?').bind(slug).first()
    if (existing) {
      await DB.prepare(`
        UPDATE guide_articles SET title = ?, description = ?, category = ?, sections_json = ?, comparison_json = ?,
          status = ?, template_type = ?, target_keyword = ?, meta_title = ?, meta_description = ?,
          updated_at = CURRENT_TIMESTAMP, published_at = COALESCE(published_at, ?)
        WHERE slug = ?
      `).bind(title, description || '', category || '実践ガイド', sectionsJson, comparisonJson,
        status || 'draft', template_type || null, target_keyword || null,
        title + ' - PARTS HUB', (description || '').slice(0, 160), publishedAt, slug).run()
    } else {
      await DB.prepare(`
        INSERT INTO guide_articles (slug, title, description, category, sections_json, comparison_json, status, template_type, target_keyword, meta_title, meta_description, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(slug, title, description || '', category || '実践ガイド', sectionsJson, comparisonJson,
        status || 'draft', template_type || null, target_keyword || null,
        title + ' - PARTS HUB', (description || '').slice(0, 160), publishedAt).run()
    }
    return c.json({ success: true, message: existing ? '更新しました' : '作成しました', slug })
  } catch (error) {
    console.error('Save guide error:', error)
    return c.json({ success: false, error: 'ガイド記事の保存に失敗しました' }, 500)
  }
})

// ===================================================================
// API: ガイド記事一覧取得
// ===================================================================
guideRoutes.get('/list', async (c) => {
  try {
    const { DB } = c.env
    const status = c.req.query('status')
    let query = 'SELECT id, slug, title, category, status, view_count, template_type, target_keyword, created_at, updated_at, published_at FROM guide_articles'
    const params: any[] = []
    if (status) { query += ' WHERE status = ?'; params.push(status) }
    query += ' ORDER BY updated_at DESC'
    const { results } = await DB.prepare(query).bind(...params).all()
    return c.json({ success: true, data: results })
  } catch (error) { return c.json({ success: true, data: [] }) }
})

// ===================================================================
// API: ガイド記事詳細取得
// ===================================================================
guideRoutes.get('/detail/:slug', async (c) => {
  try {
    const { DB } = c.env
    const slug = c.req.param('slug')
    const article = await DB.prepare('SELECT * FROM guide_articles WHERE slug = ?').bind(slug).first() as any
    if (!article) return c.json({ success: false, error: '記事が見つかりません' }, 404)
    article.sections = JSON.parse(article.sections_json || '[]')
    article.comparison = article.comparison_json ? JSON.parse(article.comparison_json) : null
    return c.json({ success: true, data: article })
  } catch (error) { return c.json({ success: false, error: '記事の取得に失敗しました' }, 500) }
})

// ===================================================================
// API: ガイド記事削除
// ===================================================================
guideRoutes.delete('/:slug', async (c) => {
  try {
    const { DB } = c.env
    const slug = c.req.param('slug')
    await DB.prepare('DELETE FROM guide_articles WHERE slug = ?').bind(slug).run()
    return c.json({ success: true, message: '削除しました' })
  } catch (error) { return c.json({ success: false, error: '削除に失敗しました' }, 500) }
})

// ===================================================================
// API: 一括テンプレート生成
// ===================================================================
guideRoutes.post('/bulk-generate', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { articles } = body
    if (!articles || !Array.isArray(articles)) {
      return c.json({ success: false, error: 'articlesは配列で指定してください' }, 400)
    }
    const results: { slug: string; status: string }[] = []
    for (const article of articles) {
      const template = TEMPLATES[article.template_type]
      if (!template) { results.push({ slug: article.slug, status: 'error: template not found' }); continue }
      const sections = template.generateSections(article.params)
      const comparison = template.generateComparison ? template.generateComparison(article.params) : undefined
      const title = article.params.title || `${article.params.part_name || article.params.topic || ''}ガイド`
      const description = article.params.description || sections[0]?.body.slice(0, 120) + '...'
      const category = article.params.category || template.defaultCategory
      const status = article.status || 'draft'
      const publishedAt = status === 'published' ? new Date().toISOString() : null
      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO guide_articles (slug, title, description, category, sections_json, comparison_json, status, template_type, target_keyword, meta_title, meta_description, published_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(article.slug, title, description, category, JSON.stringify(sections),
          comparison && comparison.length > 0 ? JSON.stringify(comparison) : null,
          status, article.template_type, article.params.target_keyword || null,
          title + ' - PARTS HUB', description.slice(0, 160), publishedAt).run()
        results.push({ slug: article.slug, status: 'ok' })
      } catch (e) { results.push({ slug: article.slug, status: 'error' }) }
    }
    return c.json({ success: true, data: results, total: results.length })
  } catch (error) { return c.json({ success: false, error: '一括生成に失敗しました' }, 500) }
})

// ===================================================================
// API: ガイド記事の自動生成（Cron用エンドポイント）
// GET /api/guides/auto-generate?key=SECRET&type=guide
// ===================================================================
guideRoutes.get('/auto-generate', async (c) => {
  try {
    const { DB } = c.env
    const key = c.req.query('key')
    const type = c.req.query('type') || 'both' // guide | news | both

    // シンプルな認証（環境変数 CRON_SECRET と照合、未設定なら固定キー）
    const expectedKey = 'ph-cron-2026-secure'
    if (key !== expectedKey) {
      return c.json({ success: false, error: '認証エラー' }, 403)
    }

    const results: { type: string; slug: string; title: string; status: string }[] = []

    // --- ガイド記事の自動生成 ---
    if (type === 'guide' || type === 'both') {
      // 既存のガイド記事slugを取得
      const existingGuides = await DB.prepare(
        'SELECT slug FROM guide_articles'
      ).all()
      const existingSlugs = new Set((existingGuides.results || []).map((r: any) => r.slug))

      // 未生成のキーワードを見つける
      const availableKeywords = GUIDE_KEYWORD_POOL.filter(kw => !existingSlugs.has(kw.slug))

      if (availableKeywords.length > 0) {
        // 日付ベースのインデックスで毎日異なる記事を選択（ランダムではなく確定的）
        const dayIndex = Math.floor(Date.now() / 86400000) % availableKeywords.length
        const selected = availableKeywords[dayIndex]

        const template = TEMPLATES[selected.template]
        if (template) {
          const sections = template.generateSections(selected.params)
          const comparison = template.generateComparison ? template.generateComparison(selected.params) : undefined
          const title = selected.params.title || `${selected.params.part_name || selected.params.topic || ''}ガイド`
          const description = sections[0]?.body.slice(0, 120) + '...'
          const category = selected.params.category || template.defaultCategory
          const now = new Date().toISOString()

          await DB.prepare(`
            INSERT OR IGNORE INTO guide_articles (slug, title, description, category, sections_json, comparison_json, status, template_type, target_keyword, meta_title, meta_description, published_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            selected.slug, title, description, category,
            JSON.stringify(sections),
            comparison && comparison.length > 0 ? JSON.stringify(comparison) : null,
            selected.template, selected.params.part_name || selected.params.topic || null,
            title + ' - PARTS HUB', description.slice(0, 160), now
          ).run()

          results.push({ type: 'guide', slug: selected.slug, title, status: 'created' })
        }
      } else {
        results.push({ type: 'guide', slug: '', title: '', status: 'no_new_keywords_available' })
      }
    }

    // --- 地域ニュースコラムの自動生成 ---
    if (type === 'news' || type === 'both') {
      const now = new Date()
      const currentMonth = now.getMonth() + 1 // 1-12
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)

      // 現在の季節テーマを取得
      const seasonalTheme = SEASONAL_THEMES.find(s => s.months.includes(currentMonth))
      if (seasonalTheme) {
        // 都道府県リスト
        const prefKeys = Object.keys(PREF_DATA)

        // 日付ベースで都道府県とテーマを選択（毎日異なる）
        const prefIndex = dayOfYear % prefKeys.length
        const themeIndex = Math.floor(dayOfYear / prefKeys.length) % seasonalTheme.themes.length
        const selectedPrefKey = prefKeys[prefIndex]
        const selectedPref = PREF_DATA[selectedPrefKey]
        const selectedTheme = seasonalTheme.themes[themeIndex]

        // 年月を含むslugで一意性を確保
        const yearMonth = `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}`
        const newsSlug = `${selectedPrefKey}-${selectedTheme.slug_suffix}-${yearMonth}`
        const newsTitle = selectedTheme.title_template.replace('${pref}', selectedPref.name)

        // 既存チェック
        const existingNews = await DB.prepare(
          'SELECT id FROM articles WHERE slug = ?'
        ).bind(newsSlug).first()

        if (!existingNews) {
          const sections = selectedTheme.generateContent(selectedPref)
          const content = sections.map(s => `## ${s.heading}\n\n${s.body}`).join('\n\n')
          const summary = sections[0].body.slice(0, 150) + '...'
          const pubNow = now.toISOString()

          await DB.prepare(`
            INSERT INTO articles (title, slug, summary, content, category, tags, status, is_featured, published_at)
            VALUES (?, ?, ?, ?, ?, ?, 'published', 0, ?)
          `).bind(
            newsTitle, newsSlug, summary, content,
            '地域ニュース',
            `${selectedPref.name},${selectedPref.region},パーツ,整備`,
            pubNow
          ).run()

          results.push({ type: 'regional_news', slug: newsSlug, title: newsTitle, status: 'created' })
        } else {
          results.push({ type: 'regional_news', slug: newsSlug, title: newsTitle, status: 'already_exists' })
        }
      }
    }

    // IndexNow通知
    const newSlugs = results.filter(r => r.status === 'created')
    if (newSlugs.length > 0) {
      const indexNowUrls = newSlugs.map(r => {
        if (r.type === 'guide') return `https://parts-hub-tci.com/guide/${r.slug}`
        return `https://parts-hub-tci.com/news/${r.slug}`
      })

      try {
        await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: 'parts-hub-tci.com',
            key: 'b6c6c26b44b84f1e8e41b70a22ddfe3d',
            urlList: [...indexNowUrls, 'https://parts-hub-tci.com/sitemap.xml']
          })
        })
      } catch (e) { /* IndexNow通知失敗は無視 */ }
    }

    return c.json({
      success: true,
      generated: results,
      pool_status: {
        guide_keywords_total: GUIDE_KEYWORD_POOL.length,
        prefectures_total: Object.keys(PREF_DATA).length,
        seasonal_themes: SEASONAL_THEMES.length
      },
      message: `生成完了: ${results.filter(r => r.status === 'created').length}件`
    })
  } catch (error) {
    console.error('Auto-generate error:', error)
    return c.json({ success: false, error: '自動生成に失敗しました' }, 500)
  }
})

// ===================================================================
// API: 自動生成の状態確認（残りキーワード数、生成済み件数）
// ===================================================================
guideRoutes.get('/auto-generate/status', async (c) => {
  try {
    const { DB } = c.env

    // ガイド記事の状態
    const existingGuides = await DB.prepare('SELECT slug FROM guide_articles').all()
    const existingSlugs = new Set((existingGuides.results || []).map((r: any) => r.slug))
    const remainingGuides = GUIDE_KEYWORD_POOL.filter(kw => !existingSlugs.has(kw.slug))

    // 地域ニュースの状態
    const newsCount = await DB.prepare("SELECT COUNT(*) as count FROM articles WHERE category = '地域ニュース'").first() as any

    // 現在の季節テーマ
    const currentMonth = new Date().getMonth() + 1
    const currentSeason = SEASONAL_THEMES.find(s => s.months.includes(currentMonth))

    return c.json({
      success: true,
      data: {
        guide: {
          total_keywords: GUIDE_KEYWORD_POOL.length,
          generated: existingSlugs.size,
          remaining: remainingGuides.length,
          remaining_slugs: remainingGuides.map(k => k.slug),
          days_of_content: remainingGuides.length // 1日1記事
        },
        regional_news: {
          total_prefectures: Object.keys(PREF_DATA).length,
          generated_count: newsCount?.count || 0,
          current_season: currentSeason ? currentSeason.themes.map(t => t.slug_suffix) : [],
          themes_per_season: SEASONAL_THEMES.map(s => ({ months: s.months, themes: s.themes.length }))
        }
      }
    })
  } catch (error) {
    return c.json({ success: false, error: '状態取得に失敗しました' }, 500)
  }
})

// ===================================================================
// API: ガイドキーワードプール一覧取得
// ===================================================================
guideRoutes.get('/keyword-pool', (c) => {
  const pool = GUIDE_KEYWORD_POOL.map(kw => ({
    slug: kw.slug,
    template: kw.template,
    title: kw.params.title || kw.params.part_name || kw.params.topic || kw.params.challenge || kw.params.channel || ''
  }))
  return c.json({ success: true, data: pool, total: pool.length })
})

// ===================================================================
// API: 地域ニュースプール一覧取得
// ===================================================================
guideRoutes.get('/regional-pool', (c) => {
  const pool = Object.entries(PREF_DATA).map(([key, pref]) => ({
    slug: key,
    name: pref.name,
    region: pref.region,
    features: pref.features,
    climate: pref.climate
  }))
  const themes = SEASONAL_THEMES.map(s => ({
    months: s.months,
    themes: s.themes.map(t => ({ slug_suffix: t.slug_suffix, title_template: t.title_template }))
  }))
  return c.json({ success: true, prefectures: pool, seasonal_themes: themes, total_combinations: pool.length * themes.reduce((s, t) => s + t.themes.length, 0) })
})

export default guideRoutes
