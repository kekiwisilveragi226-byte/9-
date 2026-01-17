
import React, { useState } from 'react';
import { RefreshCw, Sparkles, Sword, Coffee, Zap, Timer, Copy, Check, Info, Quote } from 'lucide-react';
import { ShotData, ShotStrategy, SceneNature, DurationMode } from '../types';

interface ShotCardProps {
  shot: ShotData;
  onUpdateStrategy: (id: number, strategy: ShotStrategy) => void;
  onUpdateNature: (id: number, nature: SceneNature) => void;
  onUpdateDuration: (id: number, duration: DurationMode) => void;
  onRefresh: (id: number) => void;
}

const ShotCard: React.FC<ShotCardProps> = ({ shot, onUpdateStrategy, onUpdateNature, onUpdateDuration, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const currentStrategy = shot.user_override_strategy || shot.predicted_strategy;
  const currentNature = shot.user_override_nature || shot.scene_nature;
  const currentDuration = shot.user_override_duration_mode || shot.duration_mode;
  const isBattle = currentNature === '战斗状态';

  const handleCopy = () => {
    navigator.clipboard.writeText(shot.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group bg-slate-800/50 border ${shot.isUpdating ? 'border-blue-500/50' : 'border-slate-700'} rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-500 hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col`}>
      {shot.isUpdating && (
        <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center backdrop-blur-md">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
            <span className="text-sm font-black text-blue-100 tracking-widest animate-pulse">正在解析文本与画面...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-4 border-b border-slate-700/50 flex items-center justify-between transition-colors ${isBattle ? 'bg-red-950/30' : 'bg-blue-950/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${isBattle ? 'bg-red-600/30 text-red-400' : 'bg-blue-600/30 text-blue-400'}`}>
            {shot.id}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-100 text-xs">SCENE {shot.id}</h3>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${currentStrategy === '首帧' ? 'text-blue-500' : 'text-purple-500'}`}>
              {currentStrategy} STARTING
            </span>
          </div>
        </div>
        <button 
          onClick={() => onRefresh(shot.id)}
          disabled={shot.isUpdating}
          className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Narrative Connection - NEW SECTION */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 relative overflow-hidden">
          <Quote className="absolute -right-2 -bottom-2 w-12 h-12 text-slate-800/50 -rotate-12" />
          <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Quote className="w-2.5 h-2.5" /> 剧情关联分析
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed italic relative z-10">
            {shot.narrative_context || "未检测到显著文本关联..."}
          </p>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Info className="w-2.5 h-2.5" /> 导演推演逻辑
          </h4>
          <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/50">
            {shot.reasoning}
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2">
           <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-600 uppercase">策略干预</span>
             <div className="flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
               {(['首帧', '尾帧'] as ShotStrategy[]).map((s) => (
                 <button
                   key={s}
                   onClick={() => onUpdateStrategy(shot.id, s)}
                   className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all ${
                     currentStrategy === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
           </div>
           <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-600 uppercase">时长/性质</span>
             <div className="flex gap-1">
               <button 
                onClick={() => onUpdateDuration(shot.id, currentDuration === '6s' ? '10s' : '6s')}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1 text-[9px] font-black text-slate-400 hover:text-white"
               >
                 {currentDuration}
               </button>
               <button 
                onClick={() => onUpdateNature(shot.id, currentNature === '平时状态' ? '战斗状态' : '平时状态')}
                className={`flex-1 border rounded-lg py-1 text-[9px] font-black flex items-center justify-center ${
                  isBattle ? 'bg-red-950/30 border-red-500/50 text-red-400' : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400'
                }`}
               >
                 {isBattle ? <Sword className="w-2.5 h-2.5" /> : <Coffee className="w-2.5 h-2.5" />}
               </button>
             </div>
           </div>
        </div>

        {/* Prompt Display */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5" /> 动态指令 (Prompt)
            </h4>
          </div>
          
          <div className={`relative p-4 rounded-xl text-xs font-medium leading-relaxed border transition-all ${
            isBattle ? 'bg-red-900/5 border-red-500/10 text-red-100/90' : 'bg-blue-900/5 border-blue-500/10 text-blue-100/90'
          }`}>
            “{shot.prompt}”
          </div>

          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '复制成功' : '复制视频指令'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShotCard;
