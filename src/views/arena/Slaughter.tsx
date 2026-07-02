// src/views/arena/Slaughter.tsx
import { useState } from "react";
import { Team, GameState } from "../../shared";
import { cn } from "../../lib/utils";
import { AlertCircle } from "lucide-react";

interface SlaughterProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

export default function Slaughter({ currentTeam, gameState, fetchGameState, setMessage }: SlaughterProps) {
  const [donationAmount, setDonationAmount] = useState(100);

  const handleDonate = async () => {
    if (donationAmount <= 0) {
       setMessage({ text: "捐獻金額必須大於 0", type: "error" });
       return;
    }
    if (donationAmount > currentTeam.cash) {
       setMessage({ text: "現金不足以支付此捐獻額！", type: "error" });
       return;
    }

    try {
      const res = await fetch("/api/action/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: currentTeam.id, amount: donationAmount })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGameState();
        setMessage({ text: `成功向金庫捐獻 $${donationAmount}！`, type: "success" });
        setDonationAmount(0);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
  };

  const isSafe = gameState.bailoutPool >= 1000;
  const isEliminated = currentTeam.cash <= 0;

  if (isEliminated) {
     return (
        <section className="bg-red-950 border-4 border-red-600 p-12 text-center space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px]">
           <AlertCircle className="w-20 h-20 text-red-600" />
           <div>
               <h3 className="text-4xl font-black uppercase text-red-500 tracking-widest">ELIMINATED</h3>
               <p className="text-red-300 font-bold mt-4 text-lg">您的資產已被清空，在此次階級鬥爭中遭到淘汰。</p>
           </div>
        </section>
     );
  }

  return (
    <section className="bg-yellow-400 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="border-b-4 border-black pb-4 flex items-center justify-between">
         <div>
             <h3 className="text-4xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
                 <AlertCircle className="w-10 h-10" />
                 Final Slaughter
             </h3>
             <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">終極階段：援助金庫與階級清算</p>
         </div>
      </div>

      <div className="bg-black text-white p-8 border-4 border-black space-y-6">
          <div className="text-center space-y-2">
             <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Bailout Pool / 總金庫餘額</div>
             <div className={cn("text-7xl font-black tracking-tighter", isSafe ? "text-green-500" : "text-white")}>
                 ${gameState.bailoutPool}
             </div>
             <div className="text-sm font-bold text-white/50 uppercase tracking-widest">目標金額: $1000</div>
          </div>

          {!isSafe ? (
             <div className="bg-red-950 border-2 border-red-600 p-4 text-red-400 font-bold text-sm text-center">
                【極度危險】金庫尚未達標！若以現狀結算，系統將強制處決社會指數最低的小隊。<br/>
                請各小隊盡速捐獻現金以度過危機！
             </div>
          ) : (
             <div className="bg-green-950 border-2 border-green-600 p-4 text-green-400 font-bold text-sm text-center">
                【安全】金庫已達標！本次大屠殺警報解除。
             </div>
          )}

          <div className="bg-zinc-900 p-6 border border-zinc-700">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Make a Donation / 執行捐獻</div>
             <div className="flex flex-col md:flex-row items-stretch gap-4">
                <div className="flex flex-1 items-stretch bg-black border-2 border-white focus-within:border-yellow-500 transition-colors">
                   <span className="flex items-center px-4 font-black text-white bg-zinc-800 border-r-2 border-white">$</span>
                   <input 
                      type="number" 
                      min="0" 
                      max={currentTeam.cash}
                      step="50" 
                      value={donationAmount} 
                      onChange={(e) => setDonationAmount(Number(e.target.value))} 
                      className="w-full px-4 outline-none font-black text-2xl bg-transparent text-white"
                   />
                </div>
                <button 
                   onClick={handleDonate} 
                   disabled={isSafe || currentTeam.cash <= 0 || donationAmount <= 0}
                   className="px-8 py-4 bg-yellow-500 text-black font-black uppercase tracking-widest text-lg hover:bg-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                   確認捐獻
                </button>
             </div>
             <div className="text-right mt-2 text-xs font-bold text-white/40">
                 您目前最多可捐獻: ${currentTeam.cash}
             </div>
          </div>
      </div>
    </section>
  );
}