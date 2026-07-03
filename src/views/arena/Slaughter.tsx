// src/views/arena/Slaughter.tsx
import { useState, type ChangeEvent } from "react";
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
   const [donationAmount, setDonationAmount] = useState("");

  const handleDonate = async () => {
      const parsedAmount = Number(donationAmount);
      if(!confirm(`確認捐獻$${donationAmount}嗎?`))
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
          setMessage({ text: "請輸入有效的捐獻金額！", type: "error" });
          return;
      }

      if (parsedAmount > currentTeam.cash) {
       setMessage({ text: "現金不足以支付此捐獻額！", type: "error" });
       return;
    }

    try {
      const res = await fetch("/api/action/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: currentTeam.id, amount: parsedAmount })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGameState();
            setMessage({ text: `成功向金庫捐獻 $${parsedAmount}！`, type: "success" });
            setDonationAmount("");
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
  };
  const isLastPlace = (currentTeam.publicRank === gameState.teams.at(-1)?.publicRank);
  
  
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

      <div className="bg-black text-white p-8 border-4 border-black space-y-8">

          {currentTeam.reportResult && (
             <div className="bg-white text-black border-4 border-yellow-500 p-6 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[20px] font-black uppercase tracking-widest text-yellow-600">檢舉結果</div>
                <div className="text-[20px] font-black uppercase tracking-tight">{currentTeam.reportResult.message1}</div>
                <div className="text-[20px] font-black uppercase tracking-tight">{currentTeam.reportResult.message2}</div>
             </div>
          )}
          
          {/* 金庫資訊顯示區塊：根據 isLastPlace 判斷要顯示什麼 */}
          <div className="text-center space-y-2">
             {isLastPlace ? (
                <>
                   <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Bailout Pool / 目前總金庫餘額</div>
                   <div className="text-7xl font-black tracking-tighter text-white">
                       ${gameState.bailoutPool}
                   </div>
                   <div className="text-sm font-bold text-white/50 uppercase tracking-widest">目標金額: ${gameState.bailoutRequirement}</div>
                </>
             ) : (
                <>
                   <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Bailout Target / 總金庫目標金額</div>
                   <div className="text-7xl font-black tracking-tighter text-white">
                       ${gameState.bailoutRequirement}
                   </div>
                   <div className="text-sm font-bold text-white/50 uppercase tracking-widest">（您無權限查看目前餘額）</div>
                </>
             )}
          </div>

          {/* 捐獻區塊 */}
          {isLastPlace ? (
             <div className="bg-zinc-900 p-6 border border-zinc-700">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Action Locked / 行動鎖定</div>
                <div className="flex flex-col items-center justify-center bg-black border-2 border-dashed border-slate-700 py-10 px-4 text-center opacity-80">
                   <div className="text-2xl font-black text-slate-500 uppercase tracking-widest">您是本次屠殺的主謀</div>
                   <div className="text-sm font-bold text-slate-600 mt-2">請靜候其他小隊的援助與命運的審判。</div>
                </div>
             </div>
          ) : (
             <div className="bg-zinc-900 p-6 border border-zinc-700">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Make a Donation / 執行捐獻 (可為 $0)</div>
                <div className="flex flex-col md:flex-row items-stretch gap-4">
                   <div className="flex flex-1 items-stretch bg-black border-2 border-white focus-within:border-yellow-500 transition-colors">
                      <span className="flex items-center px-4 font-black text-white bg-zinc-800 border-r-2 border-white">$</span>
                      <input 
                         type="number" 
                         min="0" 
                         max={currentTeam.cash}
                         step="50" 
                         value={donationAmount} 
                         onChange={(e: ChangeEvent<HTMLInputElement>) => setDonationAmount(e.target.value)} 
                         className="w-full px-4 outline-none font-black text-2xl bg-transparent text-white"
                      />
                   </div>
                   <button 
                      onClick={handleDonate} 
                      disabled={donationAmount === "" || Number(donationAmount) < 0 || Number(donationAmount) > currentTeam.cash || currentTeam.actionProgress === "DONATED"}
                      className="px-8 py-4 bg-yellow-500 text-black font-black uppercase tracking-widest text-lg hover:bg-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                      {currentTeam.actionProgress === "DONATED" ? "已提交" : "確認捐獻"}
                   </button>
                </div>
                <div className="text-right mt-2 text-xs font-bold text-white/40">
                    您目前最多可捐獻: ${currentTeam.cash}
                </div>
             </div>
          )}
          
      </div>
    </section>
  );
  
  
}