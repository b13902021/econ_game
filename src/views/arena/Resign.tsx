// src/views/arena/Resign.tsx
import { Team, GameState, JOB_CONFIG, IMAGE_MAP } from "../../shared";
import { cn } from "../../lib/utils";

interface ResignProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

export default function Resign({ currentTeam, gameState, fetchGameState, setMessage }: ResignProps) {
  const canResign = currentTeam.totalRestHours > 0;

  const handleQuitJob = async () => {
    if (!canResign) {
        setMessage({ text: "休息時數不足 (需要 1 單位)，無法辦理辭職交接手續！", type: "error" });
        return;
    }
    if (!confirm("確定要放棄目前的正職嗎？\n⚠️ 此動作將消耗 1 單位休息時數！\n明天您將需要重新在就業市場競爭職位。")) return;
    
    try {
      const res = await fetch("/api/action/quit-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: currentTeam.id })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGameState();
        setMessage({ text: "已成功辭職，明天請重新尋找工作。", type: "success" });
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
  };

  return (
    <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
      <div className="border-b-4 border-black pb-4">
         <h3 className="text-4xl font-black uppercase tracking-tighter text-blue-900">End of Day</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第五階段：職位去留與換日等待</p>
      </div>

      <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-8 text-center space-y-6">
          <h4 className="text-2xl font-black uppercase tracking-widest text-slate-800">
             今日行動已全部結算完畢
          </h4>
          <p className="text-slate-500 font-bold">
             所有的勞動、消費與檢舉皆已寫入中央帳本。<br/>請靜候管理員進行換日作業。
          </p>

          <div className="max-w-md mx-auto bg-white border-2 border-black p-6 mt-6">
             <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Position / 當前職位</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1">累積休息時數: {currentTeam.totalRestHours}</span>
             </div>
             
             {/* 💡 修復幽靈參照 currentJob 替換為 realJob */}
             {currentTeam.realJob ? (
                <div className="space-y-4">
                   <div className="flex items-center justify-center gap-3">
                      <img src={IMAGE_MAP[currentTeam.realJob]} alt="job" className="w-8 h-8 object-contain" />
                      <span className="text-2xl font-black uppercase">{JOB_CONFIG[currentTeam.realJob]?.name}</span>
                   </div>
                   <p className="text-xs font-bold text-slate-500">
                      如果您對目前的職位滿意，無須進行任何動作，您將在明天繼續保有此職位。<br/>
                      如果您明天想爭取其他工作，請點擊下方按鈕辭職。
                   </p>
                   <button 
                      onClick={handleQuitJob}
                      disabled={!canResign}
                      className={cn(
                          "w-full py-4 mt-2 font-black uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
                          canResign 
                            ? "bg-white text-red-600 border-4 border-red-600 hover:bg-red-600 hover:text-white" 
                            : "bg-slate-200 text-slate-400 border-4 border-slate-300 cursor-not-allowed"
                      )}
                   >
                      {canResign ? "放棄當前職位 (消耗 1 休息時數)" : "休息時數不足，無法辭職"}
                   </button>
                </div>
             ) : (
                <div className="space-y-2 py-4">
                   <span className="text-xl font-black text-slate-400 uppercase tracking-widest">Unemployed</span>
                   <p className="text-xs font-bold text-slate-500 mt-2">
                      您目前處於無業狀態。請在明天的求職市場中把握機會。
                   </p>
                </div>
             )}
          </div>
      </div>

      <div className="pt-4 flex items-center justify-center gap-3 text-slate-400 animate-pulse">
         <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
         <span className="text-xs font-black uppercase tracking-widest">Waiting for Administrator...</span>
      </div>
    </section>
  );
}