// src/views/arena/Parasite.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Team, GameState } from "../../shared";

interface ParasiteProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

const getTheme = (jobId: string | null) => {
  switch (jobId) {
    case "GARDENER": return { border: "border-green-600", text: "text-green-700", light: "bg-green-50", dark: "bg-green-900", borderDark: "border-green-900" };
    case "BUTLER": return { border: "border-red-600", text: "text-red-700", light: "bg-red-50", dark: "bg-red-900", borderDark: "border-red-900" };
    case "DRIVER": return { border: "border-yellow-500", text: "text-yellow-700", light: "bg-yellow-50", dark: "bg-yellow-900", borderDark: "border-yellow-900" };
    case "TUTOR": return { border: "border-blue-600", text: "text-blue-700", light: "bg-blue-50", dark: "bg-blue-900", borderDark: "border-blue-900" };
    default: return { border: "border-slate-400", text: "text-slate-500", light: "bg-slate-50", dark: "bg-slate-800", borderDark: "border-slate-800" };
  }
};

export default function Parasite({ currentTeam, gameState, fetchGameState, setMessage }: ParasiteProps) {
  const theme = getTheme(currentTeam.realJob);
  const [multiplier, setMultiplier] = useState(0.0);
  
  const hasRealJob = currentTeam.realJob !== null;

  // 1. 底薪只算正職
  const baseSalary = hasRealJob ? (currentTeam.workHours * currentTeam.wageRate) : 0;

  // 2. 預覽髒錢與總現金
  const greedAmount = Math.round(baseSalary * multiplier);
  const derivedCash = currentTeam.cash + greedAmount;
  
  // 3. 預估勝利值
  const derivedHappiness = Math.sqrt(currentTeam.totalExtraPeaches) + Math.sqrt(currentTeam.totalRestHours);
  const derivedVictory = currentTeam.alpha * derivedHappiness * derivedCash;

  const handleParasite = async (forceSkip: boolean = false) => {
    try {
      const res = await fetch("/api/action/parasite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            teamId: currentTeam.id, 
            multiplier: forceSkip ? 0 : multiplier 
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

  // ==========================================
  // 無業狀態 UI (直接略過)
  // ==========================================
  if (!hasRealJob) {
      return (
        <section className="bg-slate-100 border-4 border-slate-300 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
          <div className="border-b-4 border-slate-300 pb-4">
             <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-500">Underground</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第二階段：浮報薪水決策</p>
          </div>
          <div className="bg-slate-200 border-4 border-slate-300 p-12 text-center space-y-4">
              <h4 className="text-2xl font-black text-slate-500 uppercase tracking-widest">無業狀態</h4>
              <p className="font-bold text-slate-500">浮報薪水為企業員工的專屬特權，您目前沒有正職身分，無法參與此階段。</p>
          </div>
          <div className="pt-4">
             <button 
                onClick={() => handleParasite(true)} 
                className="w-full py-6 bg-black text-white font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-zinc-800"
             >
                確認並進入下一步
             </button>
          </div>
        </section>
      );
  }

  // ==========================================
  // 正常從業人員 UI
  // ==========================================
  return (
    <section className={cn("bg-white border-4 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8", theme.border)}>
      <div className={cn("border-b-4 pb-4", theme.border)}>
         <h3 className={cn("text-4xl font-black uppercase tracking-tighter", theme.text)}>Underground</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第二階段：浮報薪水決策</p>
      </div>

      <div className={cn("border-4 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-white", theme.dark, theme.borderDark)}>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">合法薪資</div>
             <div className="text-2xl font-black tracking-tighter">${baseSalary}</div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">預估額外髒錢</div>
             <div className={cn("text-2xl font-black tracking-tighter", greedAmount > 0 ? "text-red-400" : "text-white/30")}>
                + ${greedAmount}
             </div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">目前幸福指數</div>
             <div className="text-2xl font-black tracking-tighter text-white/80">
                {derivedHappiness.toFixed(2)}
             </div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">將公開勝利值</div>
             <div className="text-2xl font-black tracking-tighter">{derivedVictory.toFixed(0)}</div>
         </div>
      </div>

      <div className="p-8 bg-red-50 border-4 border-red-300 space-y-8">
         <div className="space-y-2">
             <p className="font-black text-xl text-red-800 flex items-center gap-2">
                ⚠️ 貪婪的代價與誘惑
             </p>
             <p className="font-bold text-red-700 text-sm">
                您可以利用職務之便，選擇浮報薪水以獲得鉅額的現金。<br/>
                但請注意：若今日結算時被同業檢舉，您將<span className="text-red-900 bg-red-200 px-1 font-black">失去所有浮報所得</span>，並額外被扣除合法薪資的 <span className="text-red-900 bg-red-200 px-1 font-black">20%</span> 作為賠償。
             </p>
         </div>
         
         <div className="space-y-6 bg-white p-6 border-2 border-dashed border-red-400">
            <div className="flex justify-between items-end">
               <span className="font-black uppercase text-sm tracking-widest text-slate-500">滑動選擇浮報比例</span>
               <span className="text-4xl font-black text-red-600">{(multiplier * 100).toFixed(0)}%</span>
            </div>
            
            <input 
                type="range" min="0" max="1" step="0.05" 
                value={multiplier} 
                onChange={(e) => setMultiplier(Number(e.target.value))} 
                className="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" 
            />
            
            <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>0% (安分守己)</span>
                <span>50%</span>
                <span className="text-red-500">100% (極高風險)</span>
            </div>
         </div>

         <div className="pt-4">
            <button 
                onClick={() => handleParasite(false)} 
                className={cn(
                    "w-full py-6 font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                    multiplier === 0 
                        ? "bg-white border-4 border-black text-black hover:bg-slate-100" 
                        : "bg-red-600 border-4 border-red-900 text-white hover:bg-red-700"
                )}
            >
               {multiplier === 0 ? "放棄浮報，進入下一步" : `確認風險並執行浮報 (${(multiplier * 100).toFixed(0)}%)`}
            </button>
         </div>
      </div>
    </section>
  );
}