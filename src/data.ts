import { Node, Edge, MarketPrice, GameEvent } from './types';

export const INITIAL_MARKET_PRICES: MarketPrice = {
  ballast: 15000,       // ¥15,000 per ton
  rail: 85000,          // ¥85,000 per ton
  tie: 12000,           // ¥12,000 per unit
  signal: 450000,       // ¥450,000 per electronics unit
  generalWage: 20000,   // ¥20,000 per day per worker
  engineerWage: 35000,  // ¥35,000 per day per engineer
  operatorWage: 30000,  // ¥30,000 per day per heavy machine operator
};

export const INITIAL_NODES: Node[] = [
  {
    id: 'miyako',
    name: 'Miyako Depot',
    jpName: '宮古総合車両基地 (復旧本部)',
    type: 'hub',
    coord: { x: 500, y: 350 },
    stockpile: { ballast: 400, rail: 80, tie: 150, signal: 25 },
    capacity: 2000,
    staff: { general: 30, engineer: 12, operator: 10 },
    isolationLevel: 0,
    population: 32000,
  },
  {
    id: 'kamaishi',
    name: 'Kamaishi Port',
    jpName: '釜石臨海物流ポート',
    type: 'port',
    coord: { x: 500, y: 650 },
    stockpile: { ballast: 1000, rail: 200, tie: 400, signal: 10 },
    capacity: 5000,
    staff: { general: 25, engineer: 5, operator: 15 },
    isolationLevel: 0, // Port has sea access, not isolated
    population: 38000,
  },
  {
    id: 'otsuchi',
    name: 'Otsuchi Station',
    jpName: '大槌複合ステーション',
    type: 'station',
    coord: { x: 500, y: 530 },
    stockpile: { ballast: 20, rail: 0, tie: 0, signal: 0 },
    capacity: 600,
    staff: { general: 2, engineer: 0, operator: 0 },
    isolationLevel: 100, // Isolated from rail, road clogged
    population: 12000,
  },
  {
    id: 'yamada',
    name: 'Yamada Valley Pass',
    jpName: '陸中山田トンネル山間部',
    type: 'junction',
    coord: { x: 420, y: 440 },
    stockpile: { ballast: 30, rail: 10, tie: 10, signal: 0 },
    capacity: 500,
    staff: { general: 0, engineer: 0, operator: 0 },
    isolationLevel: 90,
    population: 15000,
  },
  {
    id: 'taro',
    name: 'Taro Cliff Bridge',
    jpName: '田老海岸長大高架部',
    type: 'junction',
    coord: { x: 500, y: 220 },
    stockpile: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    capacity: 500,
    staff: { general: 0, engineer: 0, operator: 0 },
    isolationLevel: 80,
    population: 6000,
  },
  {
    id: 'kuji',
    name: 'Kuji Terminal',
    jpName: '久慈セントラル駅',
    type: 'station',
    coord: { x: 500, y: 90 },
    stockpile: { ballast: 50, rail: 15, tie: 30, signal: 5 },
    capacity: 1000,
    staff: { general: 5, engineer: 2, operator: 1 },
    isolationLevel: 100, // Isolated from rail, north network severed
    population: 34000,
  },
  {
    id: 'rikuzentakata',
    name: 'Rikuzentakata Node',
    jpName: '陸前高田復興ターミナル',
    type: 'station',
    coord: { x: 500, y: 780 },
    stockpile: { ballast: 100, rail: 20, tie: 50, signal: 2 },
    capacity: 1500,
    staff: { general: 8, engineer: 3, operator: 4 },
    isolationLevel: 100,
    population: 19000,
  },
];

export const INITIAL_EDGES: Edge[] = [
  {
    id: 'edge_miyako_yamada',
    from: 'miyako',
    to: 'yamada',
    distance: 14.2,
    status: 'damaged',
    damageType: 'landslide',
    damageSeverity: 80,
    requiredResources: { ballast: 120, rail: 40, tie: 80, signal: 2 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 150, engineer: 50, operator: 80 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 180000000, // ¥180M JPY (¥1.8億円)
  },
  {
    id: 'edge_yamada_otsuchi',
    from: 'yamada',
    to: 'otsuchi',
    distance: 11.5,
    status: 'damaged',
    damageType: 'track_washaway',
    damageSeverity: 95,
    requiredResources: { ballast: 240, rail: 80, tie: 160, signal: 4 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 200, engineer: 40, operator: 50 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 260000000, // ¥260M JPY (¥2.6億円)
  },
  {
    id: 'edge_otsuchi_kamaishi',
    from: 'otsuchi',
    to: 'kamaishi',
    distance: 13.8,
    status: 'damaged',
    damageType: 'signal_submerged',
    damageSeverity: 70,
    requiredResources: { ballast: 80, rail: 20, tie: 40, signal: 16 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 100, engineer: 120, operator: 30 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 350000000, // ¥350M JPY (¥3.5億円)
  },
  {
    id: 'edge_miyako_taro',
    from: 'miyako',
    to: 'taro',
    distance: 16.5,
    status: 'damaged',
    damageType: 'bridge_washout',
    damageSeverity: 100,
    requiredResources: { ballast: 150, rail: 180, tie: 200, signal: 6 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 250, engineer: 180, operator: 120 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 850000000, // ¥850M JPY (¥8.5億円) - Significant scale!
  },
  {
    id: 'edge_taro_kuji',
    from: 'taro',
    to: 'kuji',
    distance: 22.0,
    status: 'damaged',
    damageType: 'track_washaway',
    damageSeverity: 60,
    requiredResources: { ballast: 320, rail: 120, tie: 240, signal: 8 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 180, engineer: 60, operator: 40 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 310000000, // ¥310M JPY (¥3.1億円)
  },
  {
    id: 'edge_kamaishi_rikuzentakata',
    from: 'kamaishi',
    to: 'rikuzentakata',
    distance: 28.4,
    status: 'damaged',
    damageType: 'track_washaway',
    damageSeverity: 75,
    requiredResources: { ballast: 400, rail: 160, tie: 320, signal: 10 },
    consumedResources: { ballast: 0, rail: 0, tie: 0, signal: 0 },
    requiredLaborDays: { general: 300, engineer: 100, operator: 80 },
    consumedLaborDays: { general: 0, engineer: 0, operator: 0 },
    activeWorkers: { general: 0, engineer: 0, operator: 0 },
    progress: 0,
    restorationCost: 520000000, // ¥520M JPY (¥5.2億円)
  },
];

export const INITIAL_EVENTS: GameEvent[] = [
  {
    id: 'init_event_1',
    day: 1,
    title: '海溝型巨大地震による甚大な被害',
    description: '三陸沿岸部を襲った巨大地震と津波により、沿岸鉄道（100km超）の橋梁流出、トンネル崩落、駅舎冠水など各所で甚大な被害が発生し、全線不通となりました。復旧本部を開設し、物流支援と軌道修復の指揮を執ってください。',
    type: 'danger',
    effectText: '災害復旧予算 ¥4,500,000,000 (45億円) が配分されました。',
  },
  {
    id: 'init_event_2',
    day: 1,
    title: '陸上物流ルートの大渋滞',
    description: '道路網も損傷が激しく、トラックによる資材搬送は「迂回ルート」を強いられます。通常に比べ輸送時間が3倍、燃料費などの物流経費が2.5倍に跳ね上がっています。鉄道が復旧した区間は「復旧貨物列車」を運行可能で、物流コストを激減させられます。',
    type: 'warning',
    effectText: 'トラック輸送料金高騰（+150%）。線路の復旧にあわせて列車配送網を構築してください。',
  },
];

export const DISASTER_INFO = {
  landslide: {
    title: 'トンネル内土砂崩落',
    desc: '山間部での激しい地震によるトンネル崩壊。重機とオペレーターの配備、そして何より土砂を書き出す一般作業員の人海戦術が必要です。',
    icon: 'Mountain',
  },
  bridge_washout: {
    title: '河口大橋梁の流失',
    desc: '津波で高架橋・橋脚が完全に破壊されています。大量のレール（特殊鋼）と専門の架橋・保線エンジニアによる高技術施工が必要です。',
    icon: 'Bridge',
  },
  track_washaway: {
    title: '軌道路盤の流失',
    desc: '高波・豪雨によりバラスト（砕石）と枕木が散逸しました。大量のバラストや枕木、重機による精密な道床つき固めが必要です。',
    icon: 'Activity',
  },
  signal_submerged: {
    title: '信号通信装置の冠水',
    desc: '駅舎および信通区が津波で被災。電子信号装置が完全に塩害で破壊されています。高価な電子信号モジュール、および保線ITエンジニアの配備が必要です。',
    icon: 'Cpu',
  },
};
