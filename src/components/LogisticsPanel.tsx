import React, { useState } from 'react';
import { Node, Edge, Resources, Staff, ResourceType, StaffType, MarketPrice } from '../types';
import { 
  ShoppingCart, 
  UserPlus, 
  Navigation, 
  Truck, 
  Ship, 
  Train, 
  ChevronRight, 
  Building2, 
  Package, 
  Users2,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { playBeep, playSuccess, playWarning, playTrainEngine } from '../utils/audio';

interface LogisticsPanelProps {
  nodes: Node[];
  edges: Edge[];
  marketPrices: MarketPrice;
  budget: number;
  onPurchaseMaterials: (nodeId: string, item: ResourceType, amount: number, totalCost: number) => void;
  onHireStaff: (nodeId: string, staffType: StaffType, count: number, totalCost: number) => void;
  onDispatchTransport: (
    from: string, 
    to: string, 
    type: 'truck' | 'barge' | 'train', 
    cargo: Partial<Resources>, 
    staff: Partial<Staff>,
    cargoType: ResourceType | 'staff',
    cost: number
  ) => void;
  isRailConnected: (fromId: string, toId: string) => boolean;
}

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({
  nodes,
  edges,
  marketPrices,
  budget,
  onPurchaseMaterials,
  onHireStaff,
  onDispatchTransport,
  isRailConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'hire' | 'dispatch'>('dispatch');

  // Market purchase local states
  const [procureNode, setProcureNode] = useState<string>('miyako');
  const [procureItem, setProcureItem] = useState<ResourceType>('ballast');
  const [procureAmount, setProcureAmount] = useState<number>(50);

  // Hire staff local states
  const [hireNode, setHireNode] = useState<string>('miyako');
  const [hireType, setHireType] = useState<StaffType>('general');
  const [hireCount, setHireCount] = useState<number>(5);

  // Dispatch local states
  const [scNode, setScNode] = useState<string>('miyako');
  const [destNode, setDestNode] = useState<string>('yamada');
  const [vType, setVType] = useState<'truck' | 'barge' | 'train'>('truck');
  
  // Dispatch loads states
  const [loadType, setLoadType] = useState<'ballast' | 'rail' | 'tie' | 'signal' | 'staff'>('ballast');
  const [loadQty, setLoadQty] = useState<number>(20);
  const [loadStaffType, setLoadStaffType] = useState<StaffType>('general');

  // Math helper
  const getDistanceBetween = (n1: string, n2: string): number => {
    // find edge direct or indirect, else default to average placeholder distance
    const directEdge = edges.find(
      e => (e.from === n1 && e.to === n2) || (e.from === n2 && e.to === n1)
    );
    if (directEdge) return directEdge.distance;
    
    // Simple mock distance for multi-hop
    const n1Obj = nodes.find(n => n.id === n1);
    const n2Obj = nodes.find(n => n.id === n2);
    if (n1Obj && n2Obj) {
      const dx = n1Obj.coord.x - n2Obj.coord.x;
      const dy = n1Obj.coord.y - n2Obj.coord.y;
      return Math.round(Math.sqrt(dx * dx + dy * dy) * 0.08 * 10) / 10; // scaled km
    }
    return 15;
  };

  const getSourceNode = () => nodes.find(n => n.id === scNode);
  const getDestNode = () => nodes.find(n => n.id === destNode);

  const testRailPath = isRailConnected(scNode, destNode);
  const isCoastToCoast = (scNode === 'kamaishi' || scNode === 'miyako' || scNode === 'otsuchi') && 
                         (destNode === 'kamaishi' || destNode === 'miyako' || destNode === 'otsuchi');

  // Calculate transport costs dynamically based on choices
  const dist = getDistanceBetween(scNode, destNode);
  let baseFee = 0;
  let distFee = 0;
  let capMax = 20; // default truck

  if (vType === 'truck') {
    baseFee = 80000;
    distFee = 16000 * dist; // high fuel cost detours
    capMax = 25;
  } else if (vType === 'barge') {
    baseFee = 450000;
    distFee = 4000 * dist; // low distance rate, high prep
    capMax = 220;
  } else if (vType === 'train') {
    baseFee = 15000;
    distFee = 600 * dist; // massive volume efficiency
    capMax = 150;
  }

  // Adjust volume dispatch constraints automatically
  const transportCostSum = Math.round(baseFee + distFee);

  // Dispatch processor
  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scNode === destNode) {
      alert('出発駅と到着駅は異なる場所にする必要があります。');
      playWarning();
      return;
    }

    const src = getSourceNode();
    const dest = getDestNode();
    if (!src || !dest) return;

    if (budget < transportCostSum) {
      alert('予算が不足しており、物流を手配できません。');
      playWarning();
      return;
    }

    // Capacity checking for Destination Node
    const currentDestTotalVal = dest.stockpile.ballast + dest.stockpile.rail + dest.stockpile.tie + dest.stockpile.signal;
    if (loadType !== 'staff' && currentDestTotalVal + loadQty > dest.capacity) {
      alert(`配送先の備蓄容量限界 (${dest.capacity}t) を上回る物資は受け入れられません。`);
      playWarning();
      return;
    }

    // Material logic
    const cargoToSend: Partial<Resources> = {};
    const staffToSend: Partial<Staff> = {};

    if (loadType === 'staff') {
      const currentAvail = src.staff[loadStaffType];
      if (currentAvail < loadQty) {
        alert(`出発地に配属中の「${loadStaffType === 'general' ? '一般作業員' : loadStaffType === 'engineer' ? '保線エンジニア' : '重機オペレーター'}」が不足しています。(現在 ${currentAvail}名)`);
        playWarning();
        return;
      }
      staffToSend[loadStaffType] = loadQty;
    } else {
      const currentAvail = src.stockpile[loadType];
      if (currentAvail < loadQty) {
        alert(`出発地の備蓄「${loadType === 'ballast' ? 'バラスト' : loadType === 'rail' ? 'レール' : loadType === 'tie' ? '枕木' : '電子信号モジュール'}」が不足しています。(現在 ${currentAvail.toFixed(1)}t)`);
        playWarning();
        return;
      }
      cargoToSend[loadType] = loadQty;
    }

    // Route checks
    if (vType === 'barge' && !isCoastToCoast) {
      alert('海上運賃バージは、港湾港口を構える「宮古、大槌、釜石」の海岸駅間でのみ運行可能です。');
      playWarning();
      return;
    }

    if (vType === 'train' && !testRailPath) {
      alert('復帰列車は、出発・到着駅間で軌道線路が完全に直通開通している必要があります。線路修復が完了しているか確認してください。');
      playWarning();
      return;
    }

    // Trigger effect
    if (vType === 'train') {
      playTrainEngine();
    } else {
      playSuccess();
    }

    onDispatchTransport(
      scNode, 
      destNode, 
      vType, 
      cargoToSend, 
      staffToSend, 
      loadType === 'staff' ? 'staff' : loadType, 
      transportCostSum
    );

    // Reset slider safely
    setLoadQty(Math.min(10, loadQty));
  };

  // Cost calculator
  const procureCostSum = Math.round(procureAmount * marketPrices[procureItem]);
  const hireCostSum = Math.round(hireCount * (hireType === 'general' ? marketPrices.generalWage * 5 : hireType === 'engineer' ? marketPrices.engineerWage * 5 : marketPrices.operatorWage * 5));

  const itemsNameMap = {
    ballast: 'バラスト敷砂利 (1t単位)',
    rail: '特殊スチールレール鋼 (1t単位)',
    tie: '防食コンクリート製枕木 (1本単位)',
    signal: '運行デジタル電子信号システム (1組単位)',
  };

  const personnelNameMap = {
    general: '軌道復旧一般普通作業員 (初期移動費込)',
    engineer: '保線電気・信号スペシャリスト (初期機材費込)',
    operator: '土砂・大梁撤去重機オペレーター (資格手当込)',
  };

  return (
    <div id="reconstruction-supply-logistics-workspace" className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-100 flex items-center col-span-2">
          <Navigation className="w-4 h-4 text-emerald-400 mr-2" />
          物流・資材・スタッフ司令本部
        </h2>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          COMMAND HUB ACTIVE
        </span>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg mb-4 text-xs font-semibold">
        <button
          onClick={() => { playBeep(400, 0.05); setActiveTab('dispatch'); }}
          className={`py-1.5 rounded-md flex items-center justify-center space-x-1 border transition ${
            activeTab === 'dispatch' 
              ? 'bg-slate-800 border-slate-700 text-slate-100 font-bold shadow' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>配送計画 (Dispatch)</span>
        </button>
        <button
          onClick={() => { playBeep(400, 0.05); setActiveTab('buy'); }}
          className={`py-1.5 rounded-md flex items-center justify-center space-x-1 border transition ${
            activeTab === 'buy' 
              ? 'bg-slate-800 border-slate-700 text-slate-100 font-bold shadow' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>市場資材調達 (Buy)</span>
        </button>
        <button
          onClick={() => { playBeep(400, 0.05); setActiveTab('hire'); }}
          className={`py-1.5 rounded-md flex items-center justify-center space-x-1 border transition ${
            activeTab === 'hire' 
              ? 'bg-slate-800 border-slate-700 text-slate-100 font-bold shadow' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>人員追加 (Recruit)</span>
        </button>
      </div>

      {/* Tab: Dispatch Logistic Route */}
      {activeTab === 'dispatch' && (
        <form onSubmit={handleDispatchSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 tracking-tight leading-normal">
              <span className="font-bold text-slate-200 block mb-1">💡 鉄道復旧と物流配送の関係性：</span>
              トラックは迂回による高額な配送費がかかります。
              線路開通が完了すると、圧倒的な積載能力・移動スピード・低費用の<strong className="text-emerald-400">「復興 freight 列車」</strong>を配備・活用できるようになります。
            </div>

            {/* Source and Destination */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mb-1">
                  1. 出発駅 / 倉庫
                </label>
                <select
                  value={scNode}
                  onChange={(e) => { playBeep(300, 0.05); setScNode(e.target.value); }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-slate-700 hover:bg-slate-900"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.jpName.split(' ')[0]} ({n.type === 'hub' ? '大倉庫' : n.type === 'port' ? '港口' : '駅'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mb-1">
                  2. 配送・任命先
                </label>
                <select
                  value={destNode}
                  onChange={(e) => { playBeep(300, 0.05); setDestNode(e.target.value); }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-slate-700 hover:bg-slate-900"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.jpName.split(' ')[0]} {n.isolationLevel > 0 ? `(孤立 ${n.isolationLevel}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Display source stock levels before planning */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 gap-2 flex flex-col">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">出発駅【{getSourceNode()?.jpName.split(' ')[0]}】現在の備蓄／待機。</div>
              <div className="grid grid-cols-4 gap-1 text-center">
                <div className="bg-slate-900 py-1 px-1.5 rounded">
                  <div className="text-[9px] text-slate-500 font-mono">バラスト</div>
                  <div className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.stockpile.ballast ?? 0).toFixed(0)}t</div>
                </div>
                <div className="bg-slate-900 py-1 px-1.5 rounded">
                  <div className="text-[9px] text-slate-500 font-mono">レール</div>
                  <div className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.stockpile.rail ?? 0).toFixed(0)}t</div>
                </div>
                <div className="bg-slate-900 py-1 px-1.5 rounded">
                  <div className="text-[9px] text-slate-500 font-mono">枕木</div>
                  <div className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.stockpile.tie ?? 0).toFixed(0)}</div>
                </div>
                <div className="bg-slate-900 py-1 px-1.5 rounded">
                  <div className="text-[9px] text-slate-500 font-mono">信号</div>
                  <div className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.stockpile.signal ?? 0).toFixed(0)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center mt-1">
                <div className="bg-slate-900/60 py-1 px-1 rounded">
                  <span className="text-[9px] text-slate-500 block">一般作業員</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.staff.general ?? 0)}名</span>
                </div>
                <div className="bg-slate-900/60 py-1 px-1 rounded">
                  <span className="text-[9px] text-slate-500 block">保線技術</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.staff.engineer ?? 0)}名</span>
                </div>
                <div className="bg-slate-900/60 py-1 px-1 rounded">
                  <span className="text-[9px] text-slate-500 block">重機OP</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{(getSourceNode()?.staff.operator ?? 0)}名</span>
                </div>
              </div>
            </div>

            {/* Transport type */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mb-1.5">
                3. 輸送交通機関の選定
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { playBeep(200, 0.05); setVType('truck'); }}
                  className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center transition ${
                    vType === 'truck'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Truck className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold block">トラック陸送</span>
                  <span className="text-[8px] font-mono block opacity-60">迂回2.5倍高額</span>
                </button>

                <button
                  type="button"
                  disabled={!isCoastToCoast}
                  onClick={() => { playBeep(200, 0.05); setVType('barge'); }}
                  className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center transition ${
                    !isCoastToCoast 
                      ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-900 text-slate-600'
                      : vType === 'barge'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-slate-100'
                  }`}
                  title={!isCoastToCoast ? "内陸地、または遠すぎるため海上運賃バージ輸送は不可能です" : "海上運賃バージ"}
                >
                  <Ship className="w-5 h-5 mb-1 animate-pulse" />
                  <span className="text-[10px] font-bold block">貨物バージ船</span>
                  <span className="text-[8px] font-mono block opacity-60">{!isCoastToCoast ? '海港間限定' : '重積載向き'}</span>
                </button>

                <button
                  type="button"
                  disabled={!testRailPath}
                  onClick={() => { playBeep(200, 0.05); setVType('train'); }}
                  className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center transition relative ${
                    !testRailPath 
                      ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-900 text-slate-600'
                      : vType === 'train'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-emerald-500/80 hover:text-emerald-400'
                  }`}
                  title={!testRailPath ? "直通レール路盤が開通していないため、列車輸送は運行できません。" : "直通復興 freight 列車"}
                >
                  {testRailPath && (
                    <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-slate-950 text-[7px] font-bold rounded-full px-1 py-0.2 uppercase font-mono animate-bounce">
                      LINK
                    </span>
                  )}
                  <Train className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold block">復旧貨物列車</span>
                  <span className="text-[8px] font-mono block opacity-60">{!testRailPath ? '軌道開通が必要' : '配備可能！超格安'}</span>
                </button>
              </div>
            </div>

            {/* Load settings */}
            <div className="grid grid-cols-2 gap-3 pb-1.5 pt-1.5">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mb-1">
                  4. 積載貨物カテゴリ
                </label>
                <select
                  value={loadType}
                  onChange={(e) => { playBeep(300, 0.05); setLoadType(e.target.value as any); }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-slate-700 hover:bg-slate-900"
                >
                  <option value="ballast">敷砂利・バラスト (t)</option>
                  <option value="rail">レール鋼材 (t)</option>
                  <option value="tie">枕木材 (本)</option>
                  <option value="signal">電子制御信号機 (組)</option>
                  <option value="staff">復旧エンジニア・人員 Mobilization</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mb-1">
                  {loadType === 'staff' ? '5. 部署役職／カウント' : '5. 輸送物資積載量'}
                </label>
                {loadType === 'staff' ? (
                  <select
                    value={loadStaffType}
                    onChange={(e) => { playBeep(300, 0.05); setLoadStaffType(e.target.value as any); }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-slate-700"
                  >
                    <option value="general">一般作業員 (名)</option>
                    <option value="engineer">保線エンジニア (名)</option>
                    <option value="operator">重機オペレーター (名)</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                    <button
                      type="button"
                      onClick={() => { playBeep(300, 0.05); setLoadQty(q => Math.max(1, q - 5)); }}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs font-black text-slate-400 hover:bg-slate-800 text-center"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      value={loadQty}
                      min={1}
                      max={capMax}
                      onChange={(e) => setLoadQty(Math.max(1, Math.min(capMax, Number(e.target.value))))}
                      className="w-full text-center bg-transparent border-none text-xs font-sans font-bold text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { playBeep(300, 0.05); setLoadQty(q => Math.min(capMax, q + 5)); }}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs font-black text-slate-400 hover:bg-slate-800 text-center"
                    >
                      +5
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cargo Quantity Slider */}
            {loadType === 'staff' ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>転属させる人員頭数 (名):</span>
                  <span className="text-emerald-400 font-bold">{loadQty} 名</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={loadQty}
                  onChange={(e) => setLoadQty(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>機材積載量トン・上限: (最大 {capMax}t):</span>
                  <span className={loadQty >= capMax ? 'text-amber-400 font-bold' : 'text-slate-300'}>{loadQty}t</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max={capMax}
                  step="5"
                  value={loadQty}
                  onChange={(e) => setLoadQty(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            )}
          </div>

          {/* Subtotal Costing Box and Submit button */}
          <div className="pt-3 border-t border-slate-800 mt-2">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mb-3 text-xs leading-relaxed flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-mono">輸送基本費用 + 運行燃料費 (距離: {dist}km)</div>
                <div className="text-sm font-mono font-black text-amber-400">
                  ¥{transportCostSum.toLocaleString()} JPY
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-mono">予定航路</div>
                <div className="text-[11px] text-slate-300 font-bold flex items-center justify-end">
                  <span>{getSourceNode()?.jpName.split(' ')[0]}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 inline mx-0.5" />
                  <span>{getDestNode()?.jpName.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={scNode === destNode || (vType === 'train' && !testRailPath) || (vType === 'barge' && !isCoastToCoast)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed text-slate-950 text-xs font-extrabold py-2.5 rounded-lg text-center flex items-center justify-center space-x-1 transition shadow-lg"
            >
              <Navigation className="w-4 h-4" />
              <span>輸送・任命作戦を直ちに実行</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Purchase Market Commodities */}
      {activeTab === 'buy' && (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 text-xs">資材搬送の受け入れ駅(自国倉庫)</span>
              <select
                value={procureNode}
                onChange={(e) => setProcureNode(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 p-1.5 text-xs font-bold rounded focus:outline-none"
              >
                {nodes.filter(n => n.type === 'hub' || n.type === 'port').map(n => (
                  <option key={n.id} value={n.id}>{n.jpName.split(' ')[0]}</option>
                ))}
              </select>
            </div>

            {/* Displaying Current Market prices with subtle indicator */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                市場商品＆レート (市況連動)
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {(['ballast', 'rail', 'tie', 'signal'] as ResourceType[]).map((type) => {
                  const itemCost = marketPrices[type];
                  const itemTitle = type === 'ballast' ? 'バラスト砕石' : type === 'rail' ? '鋼材レール' : type === 'tie' ? '鉄筋枕木' : '電子信号モジュ';
                  const isSelected = procureItem === type;

                  return (
                    <button
                      key={type}
                      onClick={() => { playBeep(300, 0.05); setProcureItem(type); }}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition ${
                        isSelected 
                          ? 'bg-blue-600/10 border-blue-500 text-slate-100' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-[10px] block opacity-85 font-semibold text-slate-400">{itemTitle}</span>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-xs font-mono font-bold text-slate-200">¥{itemCost.toLocaleString()}</span>
                        <span className="text-[8px] font-mono text-emerald-400 flex items-center font-bold">
                          <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> STABLE
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>調達数量 (t/組):</span>
                <span className="text-emerald-400 font-mono font-bold">{procureAmount} {procureItem === 'signal' ? '組' : procureItem === 'tie' ? '本' : 't'}</span>
              </div>
              <input
                type="range"
                min={procureItem === 'signal' ? "1" : "10"}
                max={procureItem === 'signal' ? "20" : "150"}
                step={procureItem === 'signal' ? "1" : "10"}
                value={procureAmount}
                onChange={(e) => setProcureAmount(Number(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-[9px] text-slate-500 font-mono text-center">
                ※購入したマテリアルは直ちに出発地【{nodes.find(n => n.id === procureNode)?.jpName.split(' ')[0]}】の倉庫に納入されます。
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-3 text-xs leading-relaxed flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono">市場仕入れ総見積額</span>
                <div className="text-base font-mono font-black text-sky-400">
                  ¥{procureCostSum.toLocaleString()} JPY
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono max-w-[130px] text-right line-clamp-2">
                配送先: {nodes.find(n => n.id === procureNode)?.jpName.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={() => {
                const node = nodes.find(n => n.id === procureNode);
                if (!node) return;
                
                // Stock limit check
                const currentTotalVal = node.stockpile.ballast + node.stockpile.rail + node.stockpile.tie + node.stockpile.signal;
                if (currentTotalVal + procureAmount > node.capacity) {
                  alert(`配備先倉庫の最大受入容量 (${node.capacity}t) が限界に達しています。空きを作ってください。`);
                  playWarning();
                  return;
                }

                if (budget < procureCostSum) {
                  alert('復旧予算が不足しており、資材を購入できません。');
                  playWarning();
                  return;
                }

                onPurchaseMaterials(procureNode, procureItem, procureAmount, procureCostSum);
                playSuccess();
              }}
              className="w-full bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold py-2.5 rounded-lg text-center flex items-center justify-center space-x-1 transition shadow-lg"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>市場決済・納入指示を発令</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Recruit Workforce Crews */}
      {activeTab === 'hire' && (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 text-xs">作業員の配任基地 (初期配置)</span>
              <select
                value={hireNode}
                onChange={(e) => setHireNode(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 p-1.5 text-xs font-bold rounded focus:outline-none"
              >
                {nodes.filter(n => n.type === 'hub' || n.type === 'port').map(n => (
                  <option key={n.id} value={n.id}>{n.jpName.split(' ')[0]}</option>
                ))}
              </select>
            </div>

            {/* Hiring selection elements */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                専門部隊の編成＆派遣料金
              </label>

              <div className="space-y-2">
                {(['general', 'engineer', 'operator'] as StaffType[]).map((type) => {
                  const wage = type === 'general' ? marketPrices.generalWage : type === 'engineer' ? marketPrices.engineerWage : marketPrices.operatorWage;
                  const isSelected = hireType === type;

                  // Daily wage estimates
                  return (
                    <button
                      key={type}
                      onClick={() => { playBeep(300, 0.05); setHireType(type); }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                        isSelected 
                          ? 'bg-purple-600/10 border-purple-500 text-slate-100' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block text-slate-200">
                          {type === 'general' ? '一般作業員' : type === 'engineer' ? '保線エンジニア' : '重機オペレーター'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          日当: ¥{wage.toLocaleString()} / 日 (5日契約金一括)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        契約料: ¥{(wage * 5).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>編制チーム人数:</span>
                <span className="text-purple-400 font-mono font-bold">{hireCount} 名</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={hireCount}
                onChange={(e) => setHireCount(Number(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                ※作業員は軌道敷設・土砂撤去等に必要です。現地（Edge）に直接アサインする際、毎日この契約日当が予算から引き落とされます。
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-3 text-xs leading-relaxed flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono">初期雇用費用合計 (5日保証)</span>
                <div className="text-base font-mono font-black text-purple-400">
                  ¥{hireCostSum.toLocaleString()} JPY
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono text-right capitalize">
                配属: {nodes.find(n => n.id === hireNode)?.jpName.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={() => {
                if (budget < hireCostSum) {
                  alert('復旧予算が不足しており、人員を雇用できません。');
                  playWarning();
                  return;
                }
                onHireStaff(hireNode, hireType, hireCount, hireCostSum);
                playSuccess();
              }}
              className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold py-2.5 rounded-lg text-center flex items-center justify-center space-x-1 transition shadow-lg"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>雇用契約・配備指令を発令</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
