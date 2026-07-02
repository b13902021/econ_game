// src/views/arena/Resign.tsx
import { useState } from "react";
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
  
  // 本地狀態：判斷是否已經決定好去留 (若後端已經是 RESIGN_DECIDED 則預設鎖定)
  const [isLocked, setIsLocked] = useState(currentTeam.actionProgress === "RESIGN_DECIDED");

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
        setIsLocked(true);
        setMessage({ text: "已成功辭職，明天請重新尋找工作。", type: "success" });
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
  };

  const handleKeepJob = () => {
      if (!confirm("確定要保留當前狀態，並結束今日所有行動嗎？")) return;
      setIsLocked(true);
      setMessage({ text: "已鎖定職位狀態，請靜候管理員進行換日作業。", type: "success" });
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ========================================== */}
      {/* 區塊 1：今日結算報告 (Report Results) */}
      {/* ========================================== */}
      {currentTeam.reportResult && (
        <section className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
           <div className="border-b-4 border-slate-200 pb-6 mb-8 flex items-center justify-between">
              <div>
                 <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-indigo-800">
                    Daily Report
                 </h3>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                    今日結算報告與裁決
                 </p>
              </div>
           </div>

           <div className="space-y-6">
              {/* 被動訊息 (自己的浮報/被檢舉結果) */}
              {currentTeam.reportResult.message1 && (
                 <div className="bg-slate-50 border-l-[12px] border-slate-800 p-6 md:p-8">
                    <p className="text-xl md:text-2xl font-black text-slate-800 leading-relaxed tracking-wide">
                       {currentTeam.reportResult.message1}
                    </p>
                 </div>
              )}
              
              {/* 主動訊息 (自己檢舉別人的結果) */}
              {currentTeam.reportResult.message2 && (
                 <div className="bg-indigo-50 border-l-[12px] border-indigo-600 p-6 md:p-8">
                    <p className="text-xl md:text-2xl font-black text-indigo-900 leading-relaxed tracking-wide">
                       {currentTeam.reportResult.message2}
                    </p>
                 </div>
              )}
           </div>
        </section>
      )}

      {/* ========================================== */}
      {/* 區塊 2：職位去留決策 (Resign or Keep) */}
      {/* ========================================== */}
      <section className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
         <div className="border-b-4 border-black pb-6 mb-8">
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-blue-900">End of Day</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">第五階段：職位去留與換日等待</p>
         </div>

         {isLocked ? (
            // 鎖定後的等待畫面
            <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center space-y-6">
               <div className="w-16 h-16 border-4 border-t-blue-600 border-slate-300 rounded-full animate-spin mx-auto"></div>
               <h4 className="text-3xl font-black uppercase tracking-widest text-slate-800">
                  狀態已鎖定
               </h4>
               <p className="text-lg text-slate-500 font-bold">
                  您已完成今日所有的決策。<br/>請保持靜默，靜候管理員進行換日作業。
               </p>
            </div>
         ) : (
            // 尚未鎖定的決策畫面
            <div className="space-y-8">
               {currentTeam.realJob ? (
                  <>
                     <div className="bg-blue-50 border-4 border-blue-200 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                           <img src={IMAGE_MAP[currentTeam.realJob]} alt="job" className="w-24 h-24 object-contain drop-shadow-md" />
                           <div>
                              <div className="text-sm font-black uppercase tracking-widest text-blue-500 mb-1">Current Position / 當前職位</div>
                              <div className="text-5xl font-black uppercase text-blue-900">{JOB_CONFIG[currentTeam.realJob]?.name}</div>
                              <div className="text-xl font-bold text-blue-700 mt-3 bg-blue-100 inline-block px-4 py-1">
                                 累積休息時數: {currentTeam.totalRestHours} HRS
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <button 
                           onClick={handleKeepJob}
                           className="w-full py-8 bg-black text-white font-black text-2xl uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                        >
                           保留職位，結束今日
                        </button>
                        
                        <button 
                           onClick={handleQuitJob}
                           disabled={!canResign}
                           className={cn(
                               "w-full py-8 font-black text-2xl uppercase tracking-widest transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
                               canResign 
                                 ? "bg-white text-red-600 border-4 border-red-600 hover:bg-red-600 hover:text-white" 
                                 : "bg-slate-200 text-slate-400 border-4 border-slate-300 cursor-not-allowed"
                           )}
                        >
                           {canResign ? "放棄職位 (耗 1 休息時數)" : "休息時數不足，無法辭職"}
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="text-center py-16 space-y-8 bg-slate-50 border-4 border-dashed border-slate-300">
                     <h4 className="text-5xl font-black text-slate-400 uppercase tracking-widest">Unemployed</h4>
                     <p className="text-xl font-bold text-slate-500">
                        您目前處於無業狀態。<br/>請在明天的求職市場中把握機會。
                     </p>
                     <div className="flex justify-center">
                        <button 
                           onClick={handleKeepJob}
                           className="px-16 py-6 bg-black text-white font-black text-2xl uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                        >
                           確認並結束今日
                        </button>
                     </div>
                  </div>
               )}
            </div>
         )}
      </section>

    </div>
  );
}