import React from 'react';
import { 
  X, 
  HelpCircle, 
  Truck, 
  Train, 
  Layers, 
  Hammer, 
  ChevronRight, 
  Coins 
} from 'lucide-react';
import { playBeep } from '../utils/audio';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="command-guide-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 lg:p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={() => { playBeep(200, 0.05); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3.5 mb-4">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-black text-white">災害対策本部 - 線路復旧・物流オペレーション指導書</h2>
        </div>

        {/* Modal content steps */}
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <p>
            司令官、三陸沿岸鉄道の全域を再建するには「周到なマテリアル調達」と「高効率なサプライチェーン網」の設計が不回避です。下記のステップに従ってオペレーションを推進してください：
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1 */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">1</span>
                <span className="font-extrabold text-slate-200">資材注文とスタッフ雇用</span>
              </div>
              <p className="text-[11px] text-slate-400">
                『市場資材調達』および『人員追加』タブから、バラスト砂利、レール、枕木、電子信号システムを購入し、作業員を雇用します。初期物資・雇用スタッフは「宮古（Miyako）」の司令基地に配備されます。
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">2</span>
                <span className="font-extrabold text-slate-200">陸送トラック等での迂回配備</span>
              </div>
              <p className="text-[11px] text-slate-400">
                『配送計画』タブで、宮古にストックした資材やスタッフを、トラック等に載せて被災駅（例：Yamada）の備蓄ヤードに配送します。現在は道路壊滅のため、トラック陸送費は著しく高騰（2.5倍）しています。
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">3</span>
                <span className="font-extrabold text-slate-200">不通区間の工事開始</span>
              </div>
              <p className="text-[11px] text-slate-400">
                路線レーダー地図から被災不通区間（赤点線）をクリックします。右側のワークスペースから、隣接する待機駅を選び、一般・保線・重機スタッフを現地に「配置」すると、日を追うごとに自動で修復工程が進捗します。
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">4</span>
                <span className="font-extrabold text-emerald-400">鉄道直通・復旧列車の開通！</span>
              </div>
              <p className="text-[11px] text-slate-400">
                不通区間の修復が100%に達しラインが開通すると、その区間での<strong className="text-emerald-400 font-bold">「復興貨物列車 (Freight Train)」</strong>が解禁。トラックとは比較にならない大量の資材を、格安（コスト約95%オフ）で一気に届けることが自慢の鉄道輸送ネットワークに昇格します！
              </p>
            </div>

          </div>

          <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/40 space-y-2">
            <span className="font-bold text-slate-200 block text-xs">🎯 復興クリア条件＆予算補助ボーナス：</span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
              <li>全5路線の不通区間を100%修理して、<strong>「久慈（Kuji）」および「陸前高田（Rikuzentakata）」</strong>の不通駅の鉄道を繋ぎ直してください。</li>
              <li>特定の区間が開通されたとき、地元自治体より追加復興補助金が口座（残高）に投入されます。</li>
              <li>派遣した作業員は毎日日当人件費を消耗します。資材が不足して工事がストップしている、または既に復旧した区間の作業員は引き揚げ（「撤収」）を行い、効率的に予算管理をしましょう。</li>
            </ul>
          </div>
        </div>

        {/* Modal Action footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800 mt-5">
          <button
            onClick={() => { playBeep(200, 0.05); onClose(); }}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 rounded-lg text-xs transition"
          >
            承知した、復旧指揮を開始する
          </button>
        </div>

      </div>
    </div>
  );
};
