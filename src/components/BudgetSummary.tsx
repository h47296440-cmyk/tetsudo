import React from 'react';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  Activity,
  Award,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { playBeep } from '../utils/audio';

interface BudgetSummaryProps {
  day: number;
  budget: number;
  approvalRating: number;
  isPaused: boolean;
  simSpeed: number;
  isMuted: boolean;
  totalRestoredKm: number;
  totalKm: number;
  latestEventTitle: string;
  onTogglePause: () => void;
  onChangeSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onOpenGuide: () => void;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  day,
  budget,
  approvalRating,
  isPaused,
  simSpeed,
  isMuted,
  totalRestoredKm,
  totalKm,
  latestEventTitle,
  onTogglePause,
  onChangeSpeed,
  onToggleMute,
  onOpenGuide,
}) => {
  // Format JPY to readable 億円 units
  const formatYen = (num: number) => {
    const oku = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    if (oku > 0) {
      return `${oku}億${man > 0 ? `${man}万` : ''}円`;
    }
    return `${man}万円`;
  };

  const restoredPercent = Math.min(100, Math.round((totalRestoredKm / totalKm) * 1000) / 10);

  return (
    <div id="reconstruction-header-dashboard" className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-6 shadow-xl mb-6">
      {/* Top row: Title and Operations Command buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
              Disaster Relief Ops
            </span>
            <span className="text-xs text-slate-500 font-mono">CODE: SECTOR-SANRIKU-2026</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-white mt-1.5 tracking-tight">
            災害復旧軌道シミュレーター <span className="text-emerald-400 font-extrabold text-lg lg:text-xl">「希望の架け橋」</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            震災で寸断された三陸の鉄道網を復旧し、高効率な鉄道物流ネットワークを構築せよ
          </p>
        </div>

        {/* Action button suite */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Guide Modal Trigger */}
          <button
            onClick={() => { playBeep(700, 0.08); onOpenGuide(); }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>司令部マニュアル</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => { onToggleMute(); }}
            className={`p-2 rounded-lg border transition ${
              isMuted 
                ? 'bg-slate-800/40 border-slate-800 text-slate-500' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? "ミュート解除" : "ミュート"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Simulation Rate Adjuster */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => { playBeep(500 + speed * 100, 0.05); onChangeSpeed(speed); }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition ${
                  simSpeed === speed && !isPaused
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Pause / Play Trigger */}
          <button
            onClick={() => { playBeep(200, 0.1); onTogglePause(); }}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold font-mono border transition ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-500 animate-pulse' 
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-500'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>時間再開 (RUN)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>一時停止 (PAUSE)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stats Row: 4 Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Budget State */}
        <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg flex items-center space-x-3.5">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">現在復旧残予算</div>
            <div className={`text-base lg:text-lg font-mono font-black ${budget < 300000000 ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`}>
              {formatYen(budget)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">※0円になるとオペレーション停止</div>
          </div>
        </div>

        {/* Card 2: Operations Duration */}
        <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">復旧指揮経過時間</div>
            <div className="text-base lg:text-lg font-mono font-black text-amber-400">
              災害発生後 {day} 日目
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">休止中: {isPaused ? 'YES' : 'NO'}(速度 {simSpeed}x)</div>
          </div>
        </div>

        {/* Card 3: Approvals Rating */}
        <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg flex items-center space-x-3.5">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-400">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">被災地域住民の期待度</div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base lg:text-lg font-mono font-black text-pink-400">{approvalRating}%</span>
              <span className="text-[10px] text-slate-400 font-mono">({approvalRating > 80 ? '傑出' : approvalRating > 50 ? '満足' : '困窮'})</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full transition-all duration-300" style={{ width: `${approvalRating}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Restoration Grid Progress */}
        <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">全線不通軌道 復旧率</div>
            <div className="flex items-center justify-between">
              <span className="text-base lg:text-lg font-mono font-black text-emerald-400">{restoredPercent}%</span>
              <span className="text-[10px] font-mono text-slate-400">{totalRestoredKm.toFixed(1)} / {totalKm.toFixed(1)} km</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${restoredPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Emergency News Alert Ticker */}
      <div className="mt-4 bg-slate-950/70 py-2 px-3 border border-slate-800/60 rounded-lg flex items-center space-x-3 overflow-hidden">
        <div className="flex items-center space-x-1 text-red-400 font-black text-[10px] tracking-wider uppercase font-mono border border-red-500/30 px-1.5 py-0.5 bg-red-950/40 rounded shrink-0">
          <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
          <span>災害対策本部 電報 ticker</span>
        </div>
        <div className="text-slate-300 text-xs font-medium truncate tracking-tight font-sans">
          {latestEventTitle || '各被災地区の物資備蓄を充足させ、軌道エンジニアの派遣計画を急いでください。'}
        </div>
      </div>
    </div>
  );
};
