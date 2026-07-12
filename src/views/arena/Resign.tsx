// src/views/arena/Resign.tsx
import { useState } from "react";
import { Team, GameState, JOB_CONFIG, JOB_COLORS, IMAGE_MAP } from "../../shared";
import { cn } from "../../lib/utils";

interface ResignProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

export default function Resign({ currentTeam, gameState, fetchGameState, setMessage }: ResignProps) {
  const canResign = currentTeam.todayRest > 0;

  const handleResign = async (isToQuit: boolean) => {
   
    if (!canResign && isToQuit) {
        setMessage({ text: "休息時數不足 (需要 1 單位)，無法辦理辭職交接手續！", type: "error" });
        return;
    }

    if (!currentTeam.realJob){
      if(!confirm(isToQuit ? "確定放棄職位嗎" : "確定保留職位嗎")) return;
    }
    
    try {
      const res = await fetch("/api/action/resign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: currentTeam.id, isToQuit: isToQuit })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGameState();
        setMessage({ text: "已成功", type: "success" });
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
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
         <div className="space-y-8">
            {currentTeam.realJob ? (
               <>
                  {(() => {
                     const colors = JOB_COLORS[currentTeam.realJob] || JOB_COLORS.GARDENER;
                     return (
                        <div className={cn("border-4 p-8 flex flex-col md:flex-row items-center justify-between gap-8", colors.bg, colors.border)}>
                           <div className="flex items-center gap-8">
                              <img src={IMAGE_MAP[currentTeam.realJob]} alt="job" className="w-24 h-24 object-contain drop-shadow-md" />
                              <div>
                                 <div className={cn("text-sm font-black uppercase tracking-widest mb-1", colors.label)}>Current Position / 當前職位</div>
                                 <div className={cn("text-5xl font-black uppercase", colors.text)}>{JOB_CONFIG[currentTeam.realJob]?.name} / {JOB_CONFIG[currentTeam.realJob]?.enName}</div>
                                 <div className={cn("text-xl font-bold mt-3 inline-block px-4 py-1", colors.bg, colors.text, "bg-opacity-70")}>
                                    今日休息時數: {currentTeam.todayRest} HRS
                                 </div>
                              </div>
                           </div>
                        </div>
                     );
                  })()}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                     <button 
                        onClick={() => handleResign(false)}
                        className="w-full py-8 bg-black text-white font-black text-2xl uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                     >
                        保留職位，結束今日
                     </button>
                     
                     <button 
                        onClick={() => handleResign(true)}
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
                        onClick={() => handleResign(false)}
                        className="px-16 py-6 bg-black text-white font-black text-2xl uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                     >
                        確認並結束今日
                     </button>
                  </div>
               </div>
            )}
         </div>
      </section>

    </div>
  );
}
