import React from 'react';
import { GameEvent } from '../types';
import { FileText, Bell, Award, ThumbsUp, Newspaper, ChevronRight } from 'lucide-react';

interface ScenarioEventsProps {
  events: GameEvent[];
  unlockedGrants: string[];
}

export const ScenarioEvents: React.FC<ScenarioEventsProps> = ({
  events,
  unlockedGrants,
}) => {
  const reversedEvents = [...events].reverse();

  return (
    <div id="reconstruction-stories-logs" className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-100 flex items-center">
          <Newspaper className="w-4 h-4 text-pink-400 mr-2" />
          復興ニュース電報・補助金交付状況
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          合計記事数: {events.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[250px] lg:min-h-[auto]">
        {/* Box A: Reconstruction News list */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col h-full">
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 block mb-2">
            📰 三陸新報・災害復旧記者クラブ
          </span>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[190px] pr-1">
            {reversedEvents.map((evt) => {
              let badgeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
              if (evt.type === 'danger') badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
              if (evt.type === 'warning') badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
              if (evt.type === 'success') badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

              return (
                <div 
                  key={evt.id} 
                  className="bg-slate-900/60 p-2.5 rounded border border-slate-850 hover:bg-slate-900 transition flex flex-col space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">Day {evt.day} 復興日報</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase ${badgeColor}`}>
                      {evt.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <span className="text-xs font-bold text-slate-200 tracking-tight leading-normal">
                    {evt.title}
                  </span>
                  
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    {evt.description}
                  </p>

                  {evt.effectText && (
                    <div className="text-[9px] font-mono text-emerald-400 font-medium bg-emerald-950/20 p-1 rounded mt-1 select-none">
                      📌 効果: {evt.effectText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Box B: Local Government subsidies & Milestone Achievements */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col h-full justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 block mb-2">
              🏆 特例復興国庫補助金・完了実績
            </span>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              <div className="bg-slate-900/40 p-2 rounded border border-slate-800/80 text-[10.5px]">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span className="flex items-center">
                    <Award className="w-3.5 h-3.5 text-blue-400 mr-1" />
                    【初期】災害復興基本支援
                  </span>
                  <span className="text-emerald-400 font-mono">¥45億円 ★交付済</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  大規模災害発生時のインフラ軌道応急インパルス交付国庫特例支援予算。
                </p>
              </div>

              <div className="bg-slate-900/40 p-2 rounded border border-slate-800/80 text-[10.5px]">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span className="flex items-center">
                    <Award className={`w-3.5 h-3.5 mr-1 ${unlockedGrants.includes('grant_south') ? 'text-emerald-400' : 'text-slate-600'}`} />
                    【実績】南ブロック陸上鉄道網 連結補助
                  </span>
                  <span className={unlockedGrants.includes('grant_south') ? 'text-emerald-400 font-mono' : 'text-slate-500 font-mono'}>
                    {unlockedGrants.includes('grant_south') ? '¥5億円 ★獲得済' : '¥5億円 (大槌-釜石間開通)'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  釜石臨海港と山田地区を繋ぐ南線路復旧の完了で自動執行されます。
                </p>
              </div>

              <div className="bg-slate-900/40 p-2 rounded border border-slate-800/80 text-[10.5px]">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span className="flex items-center">
                    <Award className={`w-3.5 h-3.5 mr-1 ${unlockedGrants.includes('grant_north') ? 'text-emerald-400' : 'text-slate-600'}`} />
                    【実績】北海沿岸大ジャンクション 精密架橋
                  </span>
                  <span className={unlockedGrants.includes('grant_north') ? 'text-emerald-400 font-mono' : 'text-slate-500 font-mono'}>
                    {unlockedGrants.includes('grant_north') ? '¥12億円 ★獲得済' : '¥12億円 (宮古-田老間開通)'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  最難関「田老長大高架橋梁」の再建開通を完了すると執行されます。
                </p>
              </div>
            </div>
          </div>

          {/* Slogans support info */}
          <div className="border-t border-slate-900 pt-2 text-[10px] text-slate-400 leading-normal flex items-center justify-between mt-1">
            <span className="flex items-center text-pink-400">
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              県民支持率が 80% を超えると、労働効率が 15% 上昇します！
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
