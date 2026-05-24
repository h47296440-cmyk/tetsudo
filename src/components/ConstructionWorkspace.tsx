import React, { useState } from 'react';
import { Node, Edge, Staff, MarketPrice } from '../types';
import { 
  Wrench, 
  HardHat, 
  MapPin, 
  Anchor, 
  Warehouse, 
  Users, 
  FolderLock, 
  Coins, 
  AlertTriangle, 
  ChevronRight, 
  Briefcase, 
  ArrowRightLeft,
  CheckCircle2,
  Construction
} from 'lucide-react';
import { playBeep, playSuccess, playWarning } from '../utils/audio';
import { DISASTER_INFO } from '../data';

interface ConstructionWorkspaceProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  marketPrices: MarketPrice;
  onDeployWorkers: (edgeId: string, nodeSourceId: string, type: 'general' | 'engineer' | 'operator', count: number) => void;
  onWithdrawWorkers: (edgeId: string, nodeDestId: string, type: 'general' | 'engineer' | 'operator', count: number) => void;
}

export const ConstructionWorkspace: React.FC<ConstructionWorkspaceProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  marketPrices,
  onDeployWorkers,
  onWithdrawWorkers,
}) => {
  const [mobilizeFromId, setMobilizeFromId] = useState<string>('');
  const [withdrawToId, setWithdrawToId] = useState<string>('');

  const [crewType, setCrewType] = useState<'general' | 'engineer' | 'operator'>('general');
  const [crewQty, setCrewQty] = useState<number>(2);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  // Initialize source node state when edge selection changes
  React.useEffect(() => {
    if (selectedEdge) {
      setMobilizeFromId(selectedEdge.from);
      setWithdrawToId(selectedEdge.from);
    }
  }, [selectedEdgeId]);

  if (!selectedNode && !selectedEdge) {
    return (
      <div id="no-item-selected-workspace" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-slate-500 animate-pulse">
          <Wrench className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">司令部ワークスペース</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            左側のレーダー線路地図から、「駅（ノード）」または「赤点線の被災区間（エッジ）」をクリックして詳細な復旧手順・資材備蓄状況を確認・指揮してください。
          </p>
        </div>
      </div>
    );
  }

  // NODE DETAILS INTERFACE
  if (selectedNode) {
    const isIsolated = selectedNode.isolationLevel > 0 && selectedNode.type !== 'port';
    const totalMaterialsInYard = selectedNode.stockpile.ballast + selectedNode.stockpile.rail + selectedNode.stockpile.tie + selectedNode.stockpile.signal;
    const capacityUsagePercent = Math.round((totalMaterialsInYard / selectedNode.capacity) * 100);

    return (
      <div id="node-details-workspace" className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg h-full overflow-y-auto space-y-4">
        {/* Header summary of selected Station Node */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded tracking-wider uppercase">
              {selectedNode.type === 'hub' ? '復旧総合司令本部' : selectedNode.type === 'port' ? '臨海貿易物流拠点' : '地方旅客駅'}
            </span>
            <h3 className="text-base font-black text-white mt-1">{selectedNode.jpName}</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Station Identifier: {selectedNode.id.toUpperCase()}-STN</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">地域孤立状態指数</span>
            <span className={`text-sm font-mono font-black ${isIsolated ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isIsolated ? `孤立度: ${selectedNode.isolationLevel}%` : '本線直通接続済'}
            </span>
          </div>
        </div>

        {/* Population approvals */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">管轄圏内人口</span>
            <span className="text-sm font-mono font-black text-slate-200">
              {selectedNode.population.toLocaleString()} 人
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">自力アクセス手段</span>
            <span className="text-sm font-mono font-black text-slate-200">
              {selectedNode.type === 'port' ? '海上埠頭 (開港中)' : isIsolated ? '崩落・渋滞迂回路のみ' : '復旧開通鉄道本線'}
            </span>
          </div>
        </div>

        {/* Station Materials Stockpiles tracker */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center">
              <FolderLock className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              構内資材貯蓄ヤード
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {totalMaterialsInYard.toFixed(0)} / {selectedNode.capacity} t ({capacityUsagePercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${capacityUsagePercent > 85 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${capacityUsagePercent}%` }} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">バラスト砕石</span>
                <span className="text-xs font-mono font-bold text-slate-100">{selectedNode.stockpile.ballast.toFixed(1)} t</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">レール板・鋼材</span>
                <span className="text-xs font-mono font-bold text-slate-100">{selectedNode.stockpile.rail.toFixed(1)} t</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-teal-600" />
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">コンクリート枕木</span>
                <span className="text-xs font-mono font-bold text-slate-100">{selectedNode.stockpile.tie} 本</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-600" />
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">電子信号ユニット</span>
                <span className="text-xs font-mono font-bold text-slate-100">{selectedNode.stockpile.signal} 組</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
          </div>
        </div>

        {/* Stationed personnel summary */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center border-b border-slate-800 pb-1">
            <Users className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
            構内配備中・待機技術スタッフ
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 py-2.5 px-1 rounded border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block font-semibold">一般作業員</span>
              <span className="text-sm font-mono font-extrabold text-purple-400">{selectedNode.staff.general} 名</span>
            </div>
            <div className="bg-slate-950 py-2.5 px-1 rounded border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block font-semibold">保線エンジニア</span>
              <span className="text-sm font-mono font-extrabold text-purple-400">{selectedNode.staff.engineer} 名</span>
            </div>
            <div className="bg-slate-950 py-2.5 px-1 rounded border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block font-semibold">重機OP</span>
              <span className="text-sm font-mono font-extrabold text-purple-400">{selectedNode.staff.operator} 名</span>
            </div>
          </div>
        </div>

        {/* Command Guidelines tip */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-400 text-[11px] leading-relaxed">
          <span className="font-extrabold block mb-0.5">📋 コマンド本部メモ：</span>
          資材を他駅へ移動させるには、「物流司令」タブから配送計画をセットしてください。また、この駅に隣接する不通区間に工事をアサインできます。
        </div>
      </div>
    );
  }

  // EDGE DAMAGED SECTOR DETAILS INTERFACE
  if (selectedEdge) {
    const damageInfo = DISASTER_INFO[selectedEdge.damageType];
    const nodeFromObj = nodes.find(n => n.id === selectedEdge.from);
    const nodeToObj = nodes.find(n => n.id === selectedEdge.to);

    const isFullyRepaired = selectedEdge.status === 'operational';

    // Daily wage calculation for workers assigned to this line
    const dailyWageCost = 
      selectedEdge.activeWorkers.general * marketPrices.generalWage +
      selectedEdge.activeWorkers.engineer * marketPrices.engineerWage +
      selectedEdge.activeWorkers.operator * marketPrices.operatorWage;

    // Helper to calculate required vs consumed materials
    const getMaterialsNeededList = () => {
      const items: { label: string, key: 'ballast' | 'rail' | 'tie' | 'signal', total: number, cons: number }[] = [
        { label: 'バラスト砕石', key: 'ballast', total: selectedEdge.requiredResources.ballast, cons: selectedEdge.consumedResources.ballast },
        { label: 'スチールレール', key: 'rail', total: selectedEdge.requiredResources.rail, cons: selectedEdge.consumedResources.rail },
        { label: '鉄筋枕木', key: 'tie', total: selectedEdge.requiredResources.tie, cons: selectedEdge.consumedResources.tie },
        { label: '電子信号システム', key: 'signal', total: selectedEdge.requiredResources.signal, cons: selectedEdge.consumedResources.signal },
      ];
      return items;
    };

    // Helper for labor days
    const getLaborList = () => {
      return [
        { label: '一般作業員の日数', key: 'general' as const, total: selectedEdge.requiredLaborDays.general, cons: selectedEdge.consumedLaborDays.general, current: selectedEdge.activeWorkers.general },
        { label: '技術者・エンジニア日数', key: 'engineer' as const, total: selectedEdge.requiredLaborDays.engineer, cons: selectedEdge.consumedLaborDays.engineer, current: selectedEdge.activeWorkers.engineer },
        { label: '重機オペレーター日数', key: 'operator' as const, total: selectedEdge.requiredLaborDays.operator, cons: selectedEdge.consumedLaborDays.operator, current: selectedEdge.activeWorkers.operator },
      ];
    };

    // Calculate daily construction speed
    const calcDailySpeedAndNeeds = () => {
      const g = selectedEdge.activeWorkers.general;
      const e = selectedEdge.activeWorkers.engineer;
      const o = selectedEdge.activeWorkers.operator;

      // Base progress velocity formulation
      if (g === 0 && e === 0 && o === 0) return { progressSpeed: 0, missingMaterial: false };

      // Evaluate if we are missing required materials at adjoining station yards to even work!
      // In this realistic engine, workers consume material FROM the selected mobilizing station (or adjoining node stockpiles)
      // to do their job. If the station stockpiles are empty of required materials, work halts!
      const activeSource = nodes.find(n => n.id === mobilizeFromId);
      if (!activeSource) return { progressSpeed: 0, missingMaterial: false };

      let hasMaterials = true;
      const progressCoefficient = (g * 0.4 + e * 0.9 + o * 0.7) / (selectedEdge.distance * 1.8);
      
      return { 
        progressSpeed: Math.round(progressCoefficient * 10) / 10, 
        missingMaterial: !hasMaterials 
      };
    };

    const speedInfo = calcDailySpeedAndNeeds();

    const handleDeploy = (e: React.FormEvent) => {
      e.preventDefault();
      const srcNode = nodes.find(n => n.id === mobilizeFromId);
      if (!srcNode) return;

      const idleStaffCount = srcNode.staff[crewType];
      if (idleStaffCount < crewQty) {
        alert(`${srcNode.jpName.split(' ')[0]} 駅に待機している該当の作業員が不足しています。(現在 ${idleStaffCount}名)`);
        playWarning();
        return;
      }

      onDeployWorkers(selectedEdge.id, mobilizeFromId, crewType, crewQty);
      playSuccess();
    };

    const handleWithdraw = (e: React.FormEvent) => {
      e.preventDefault();
      const currentOnEdge = selectedEdge.activeWorkers[crewType];
      if (currentOnEdge < crewQty) {
        alert(`この工事区間にはその技術者が ${currentOnEdge} 名しか配属されていません。`);
        playWarning();
        return;
      }

      onWithdrawWorkers(selectedEdge.id, withdrawToId, crewType, crewQty);
      playSuccess();
    };

    return (
      <div id="edge-details-workspace" className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg h-full overflow-y-auto space-y-4">
        {/* Damaged section title card header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider ${isFullyRepaired ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isFullyRepaired ? '復旧開通・安全点検済' : '線路不通 被災工事区間'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">L={selectedEdge.distance}km</span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              {nodeFromObj?.jpName.split(' ')[0]} ⇄ {nodeToObj?.jpName.split(' ')[0]} 間
            </h3>
            <p className="text-[11px] text-amber-500 font-bold flex items-center mt-1 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              被災状況: {damageInfo ? damageInfo.title : '重度軌道損壊'}
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">現在の修復工程</span>
            <span className={`text-base font-mono font-black ${isFullyRepaired ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
              {Math.round(selectedEdge.progress)}%
            </span>
          </div>
        </div>

        {/* Big styled progress bar loader */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/80 p-[2px]">
            <div 
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${selectedEdge.progress}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>全体予定復旧工事コスト: ¥{selectedEdge.restorationCost.toLocaleString()}</span>
            <span>修復完了 {selectedEdge.progress.toFixed(1)}%</span>
          </div>
        </div>

        {isFullyRepaired ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center text-emerald-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
            <h4 className="text-xs font-bold text-slate-100 uppercase font-mono">RAIL TRACK SECURED</h4>
            <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
              この区間は安全に復帰しました。宮古からの<strong>希望の復興貨物列車 (Freight Train)</strong>が直通可能となり、物流輸送コストが劇的に低減されました。
            </p>
          </div>
        ) : (
          <>
            {/* Split specifications: Materials & Teamwork requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box A: Material Check list */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block mb-2 font-mono">🛡️ 投入必要資材リスト</span>
                <div className="space-y-2 text-[10px] font-mono">
                  {getMaterialsNeededList().map((item) => {
                    const percent = Math.min(100, Math.round((item.cons / item.total) * 100));
                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>{item.label}</span>
                          <span className={percent >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                            {item.cons.toFixed(0)} / {item.total} {item.key === 'signal' ? '組' : item.key === 'tie' ? '本' : 't'}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Box B: Labor requirements */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block mb-2 font-mono">👷 必要工数＆派遣チーム</span>
                <div className="space-y-2 text-[10px] font-mono">
                  {getLaborList().map((staff) => {
                    const percent = Math.min(100, Math.round((staff.cons / staff.total) * 100));
                    const staffLabel = staff.key === 'general' ? '一般作業員' : staff.key === 'engineer' ? '保線技能者' : '重機オペ等';
                    return (
                      <div key={staff.key} className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>{staffLabel} (現在 {staff.current}名)</span>
                          <span className={percent >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                            {Math.round(staff.cons)} / {staff.total} 人日
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Operations Forecast Card */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">現場日当人件費 (24h毎)</span>
                <span className={`font-mono font-bold ${dailyWageCost > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  ¥{dailyWageCost.toLocaleString()} / 日
                </span>
                <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">※資材ヤードから毎日引き落とし</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">予測復旧速度</span>
                <span className={`font-mono font-bold ${speedInfo.progressSpeed > 0 ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`}>
                  {speedInfo.progressSpeed > 0 ? `+${speedInfo.progressSpeed}% / 日` : '作業員不足で停止中'}
                </span>
                <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">※材料と作業員の配置が必要です</span>
              </div>
            </div>

            {/* WORKFORCE DISPATCH OPERATION CENTER - TWO FORMS (Deploy & Withdraw) */}
            <div className="space-y-3.5 border-t border-slate-800 pt-3.5">
              <span className="text-xs font-bold text-slate-300 flex items-center">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
                現地復旧人員のアサイン調整
              </span>

              {/* Form Tab Toggles */}
              <div className="grid grid-cols-2 gap-4">
                {/* DEPLOY STAFF FORM */}
                <form onSubmit={handleDeploy} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block border-b border-slate-900 pb-1">➕ 宿舎から現場へ技術スタッフ配置</span>
                  
                  <div>
                    <span className="text-[9px] text-slate-500 block mb-0.5">派遣元の待機駅</span>
                    <select
                      value={mobilizeFromId}
                      onChange={(e) => { playBeep(200, 0.05); setMobilizeFromId(e.target.value); }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-bold"
                    >
                      <option value={selectedEdge.from}>{nodeFromObj?.jpName.split(' ')[0]}</option>
                      <option value={selectedEdge.to}>{nodeToObj?.jpName.split(' ')[0]}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">職種選択</span>
                      <select
                        value={crewType}
                        onChange={(e) => setCrewType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-semibold"
                      >
                        <option value="general">一般作業員</option>
                        <option value="engineer">保線技師</option>
                        <option value="operator">重機オペ</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">人数</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={crewQty}
                        onChange={(e) => setCrewQty(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-1.5 rounded transition text-[11px]"
                  >
                    配置を決定
                  </button>
                </form>

                {/* WITHDRAW STAFF FORM */}
                <form onSubmit={handleWithdraw} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-rose-400 block border-b border-slate-900 pb-1">➖ 現場から待機駅へ引き揚げ／撤収</span>

                  <div>
                    <span className="text-[9px] text-slate-500 block mb-0.5">撤収派遣先</span>
                    <select
                      value={withdrawToId}
                      onChange={(e) => { playBeep(200, 0.05); setWithdrawToId(e.target.value); }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-bold"
                    >
                      <option value={selectedEdge.from}>{nodeFromObj?.jpName.split(' ')[0]}</option>
                      <option value={selectedEdge.to}>{nodeToObj?.jpName.split(' ')[0]}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">職種選択</span>
                      <select
                        value={crewType}
                        onChange={(e) => setCrewType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-semibold"
                      >
                        <option value="general">一般作業員</option>
                        <option value="engineer">保線技師</option>
                        <option value="operator">重機オペ</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">人数</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={crewQty}
                        onChange={(e) => setCrewQty(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-1 rounded font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold p-1.5 rounded transition text-[11px]"
                  >
                    撤収を実行
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
};
