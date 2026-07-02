// src/views/arena/Report.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Team, GameState } from "../../shared";

interface ReportProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

export default function Report({ currentTeam, gameState, fetchGameState, setMessage }: ReportProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const hasSubmitted = currentTeam.reportedTargetId !== null;

  const handleSubmitReport = async (targetId: string | "NONE") => {
    if (targetId !== "NONE" && !confirm("確定要實名檢舉該小隊嗎？\n\n警告：若對方並未浮報薪水，您將面臨嚴厲的「誣告罰款」！")) {
        return;
    }

    try {
      const res = await fetch("/api/action/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            teamId: currentTeam.id, 
            targetId: targetId 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
          fetchGameState();
          setMessage(null);
      } else {
          setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
        setMessage({ text: "連線錯誤", type: "error" });
    }
  };

  if (hasSubmitted) {
    return (
      <section className="bg-zinc-900 border-4 border-black p-12 text-center space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px]">
         <div className="w-16 h-16 border-4 border-t-purple-500 border-zinc-700 rounded-full animate-spin"></div>
         <div>
             <h3 className="text-3xl font-black uppercase text-white tracking-widest">抉擇已鎖定</h3>
             <p className="text-zinc-400 font-bold mt-2">請保持靜默，等待管理員進行全場檢舉結算。</p>
         </div>
      </section>
    );
  }

  if (gameState.currentDay === 1) {
    return (
      <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="border-b-4 border-black pb-4">
           <h3 className="text-4xl font-black uppercase tracking-tighter text-purple-600">Whistleblower</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第四階段：檢舉同業</p>
        </div>
        <div className="bg-purple-50 border-4 border-purple-200 p-8 text-center space-y-4">
            <p className="text-2xl font-black text-purple-800 tracking-widest">🕊️ 第一天為和平日</p>
            <p className="text-purple-600 font-bold">今日市場風平浪靜，尚無檢舉機制。<br/>請直接點擊下方按鈕結束本階段。</p>
        </div>
        <button 
            onClick={() => handleSubmitReport("NONE")} 
            className="w-full py-6 bg-black text-white text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
            確認並進入等待
        </button>
      </section>
    );
  }

  // 💡 修正幽靈目標：過濾掉自己，以及「已經死亡」的小隊
  const otherTeams = gameState.teams.filter(t => t.id !== currentTeam.id && !t.isDead);

  return (
    <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
      <div className="border-b-4 border-black pb-4">
         <h3 className="text-4xl font-black uppercase tracking-tighter text-purple-600">Whistleblower</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第四階段：檢舉同業</p>
      </div>

      <div className="space-y-2">
         <p className="font-black text-xl text-purple-900">真相與代價</p>
         <p className="font-bold text-purple-700 text-sm bg-purple-50 p-4 border-l-4 border-purple-500">
            您只能檢舉 <span className="text-red-600 underline">一支小隊</span>。若對方確實浮報薪資，系統將沒收其不法所得並施加罰款；<br/>
            但若您指控的對象是清白的，您將被視為<span className="text-red-600 bg-red-100 px-1">惡意誣告</span>，並扣除鉅額罰金！
         </p>
      </div>

      {/* 目標選擇網格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
         {otherTeams.map(team => (
            <button
               key={team.id}
               onClick={() => setSelectedTargetId(team.id)}
               className={cn(
                  "p-4 border-4 transition-all text-left relative overflow-hidden",
                  selectedTargetId === team.id 
                     ? "border-purple-600 bg-purple-100 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] translate-y-[-2px] translate-x-[-2px]" 
                     : "border-slate-300 bg-white hover:border-purple-300 hover:bg-slate-50"
               )}
            >
               <span className="block text-xs font-bold text-slate-500 mb-1">TEAM ID: {team.id.substring(0,4)}</span>
               <span className={cn("block text-xl font-black", selectedTargetId === team.id ? "text-purple-700" : "text-black")}>
                   {team.name}
               </span>
               {selectedTargetId === team.id && (
                   <div className="absolute top-2 right-2 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
               )}
            </button>
         ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-4 border-dashed border-slate-300">
         <button 
             onClick={() => handleSubmitReport(selectedTargetId!)} 
             disabled={!selectedTargetId}
             className="flex-1 py-4 bg-purple-600 border-4 border-purple-800 text-white font-black text-lg uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
         >
            實名檢舉選定小隊
         </button>
         <button 
             onClick={() => handleSubmitReport("NONE")} 
             className="flex-1 py-4 bg-white border-4 border-black text-black font-black text-lg uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
         >
            放棄檢舉，明哲保身
         </button>
      </div>
    </section>
  );
}