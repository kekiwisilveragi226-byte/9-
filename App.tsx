
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Play, Film, Image as ImageIcon, MessageSquare, Loader2, Sparkles, ChevronRight, Clock, AlertCircle, Palette } from 'lucide-react';
import { ShotData, ShotStrategy, SceneNature, DurationMode } from './types';
import ShotCard from './components/ShotCard';
import { analyzeFullGrid, refreshSingleShot } from './services/geminiService';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [novelText, setNovelText] = useState('');
  const [styleAnchor, setStyleAnchor] = useState('电影感, 4k, 细腻质感, 丁达尔效应');
  const [shots, setShots] = useState<ShotData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullAnalysis = async () => {
    if (!image || !novelText.trim()) {
      setError('请先上传分镜图并输入小说原文。');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // 初始分析默认以 6s 为基准，AI 会自行判断文武模式
      const result = await analyzeFullGrid(image, novelText, '6s', styleAnchor);
      setShots(result);
    } catch (err: any) {
      setError(`分析失败: ${err.message || '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateStrategy = useCallback((id: number, strategy: ShotStrategy) => {
    setShots(prev => prev.map(shot => {
      if (shot.id === id) {
        return { ...shot, user_override_strategy: strategy };
      }
      return shot;
    }));
  }, []);

  const handleUpdateNature = useCallback((id: number, nature: SceneNature) => {
    setShots(prev => prev.map(shot => {
      if (shot.id === id) {
        return { ...shot, user_override_nature: nature };
      }
      return shot;
    }));
  }, []);

  const handleUpdateDuration = useCallback((id: number, duration: DurationMode) => {
    setShots(prev => prev.map(shot => {
      if (shot.id === id) {
        return { ...shot, user_override_duration_mode: duration };
      }
      return shot;
    }));
  }, []);

  const handleRefreshShot = async (id: number) => {
    if (!image) return;

    setShots(prev => prev.map(s => s.id === id ? { ...s, isUpdating: true } : s));
    
    const targetShot = shots.find(s => s.id === id);
    const targetStrategy = targetShot?.user_override_strategy || targetShot?.predicted_strategy || '首帧';
    const targetNature = targetShot?.user_override_nature || targetShot?.scene_nature || '平时状态';
    const targetDuration = targetShot?.user_override_duration_mode || targetShot?.duration_mode || '6s';

    try {
      const result = await refreshSingleShot(image, novelText, id, targetStrategy, targetNature, targetDuration, styleAnchor);
      setShots(prev => prev.map(s => s.id === id ? { 
        ...s, 
        ...result, 
        isUpdating: false,
        duration_mode: targetDuration
      } : s));
    } catch (err: any) {
      console.error(err);
      setShots(prev => prev.map(s => s.id === id ? { ...s, isUpdating: false } : s));
      alert(`刷新分镜 #${id} 失败`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full lg:w-[420px] bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col gap-8 h-screen overflow-y-auto sticky top-0 scrollbar-hide">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-blue-900/20">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">九宫格导演 v2.1</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Cine-AI Director System</p>
          </div>
        </div>

        {/* Style Anchor Input */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> 风格锚定 (Style Suffix)
          </h2>
          <div className="relative group">
            <input
              type="text"
              value={styleAnchor}
              onChange={(e) => setStyleAnchor(e.target.value)}
              placeholder="例如: 赛博朋克, 8k, unreal engine 5, 史诗感..."
              className="w-full bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold uppercase">Auto-Suffix</div>
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed">该风格词将自动追加至每个分镜提示词末尾，确保全篇视觉统一性。</p>
        </section>

        {/* Upload Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" /> 上传3x3分镜图
          </h2>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer border-2 border-dashed rounded-2xl aspect-video lg:aspect-square flex flex-col items-center justify-center transition-all duration-300 ${
              image ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
            }`}
          >
            {image ? (
              <>
                <img src={image} alt="Storyboard Grid" className="w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 更换分镜
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                <p className="text-xs font-bold text-slate-400">点击上传 3x3 九宫格图片</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
        </section>

        {/* Novel Text */}
        <section className="space-y-4 flex-1 flex flex-col">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> 小说原文解析
          </h2>
          <textarea
            value={novelText}
            onChange={(e) => setNovelText(e.target.value)}
            placeholder="粘贴文本，AI将以此推导角色动机与动态节奏..."
            className="flex-1 w-full bg-slate-800/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none min-h-[150px]"
          />
        </section>

        {/* Main Action */}
        <button
          onClick={handleFullAnalysis}
          disabled={isAnalyzing || !image || !novelText}
          className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${
            isAnalyzing 
              ? 'bg-slate-800 text-slate-500'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xl shadow-blue-600/30 active:scale-[0.98]'
          }`}
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isAnalyzing ? '导演组正在紧急推演' : '一键全景自动导演'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-3 rounded-xl">
            <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> ERROR</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-950 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Director Mode Active</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">分镜动态序列 <span className="text-slate-700">/ GRID</span></h2>
              <p className="text-slate-500 text-sm font-medium">根据九宫格坐标协议 (N1-N9) 生成的标准化拍摄指令</p>
            </div>
            
            {shots.length > 0 && (
              <div className="flex items-center gap-4 px-5 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex -space-x-2.5">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">D{i}</div>
                  ))}
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div className="text-[10px] font-bold text-slate-400">
                  <span className="block text-slate-100 tracking-widest uppercase">Production Ready</span>
                  {shots.length} 个镜头指令已就绪
                </div>
              </div>
            )}
          </header>

          {shots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20">
              {shots.map((shot) => (
                <ShotCard 
                  key={shot.id} 
                  shot={shot} 
                  onUpdateStrategy={handleUpdateStrategy}
                  onUpdateNature={handleUpdateNature}
                  onUpdateDuration={handleUpdateDuration}
                  onRefresh={handleRefreshShot}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-48 border-2 border-dashed border-slate-900 rounded-[3rem] group">
              <div className="relative mb-6">
                <Play className="w-16 h-16 text-slate-800 group-hover:text-blue-500/20 transition-colors" />
                <div className="absolute inset-0 scale-150 blur-3xl bg-blue-500/5 rounded-full" />
              </div>
              <p className="text-slate-600 font-bold tracking-widest uppercase text-xs">Awaiting Master Input</p>
              <div className="mt-4 flex gap-2">
                 <div className="w-1 h-1 bg-slate-800 rounded-full" />
                 <div className="w-1 h-1 bg-slate-800 rounded-full animate-pulse" />
                 <div className="w-1 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
