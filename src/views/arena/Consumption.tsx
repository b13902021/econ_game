// src/views/arena/Consumption.tsx
import { useState } from "react";
import { Team, GameState } from "../../shared";
import { cn } from "../../lib/utils";

interface ConsumptionProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

export default function Consumption({ currentTeam, gameState, fetchGameState, setMessage }: ConsumptionProps) {
  // 狀態只記錄「額外多買」的水蜜桃數量，不能低於 0
  const [extraPeaches, setExtraPeaches] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 即時預覽計算
  // ==========================================
  const peachPrice = gameState.peachPrice;
  const totalCost = (5 + extraPeaches) * peachPrice;
  const derivedCash = currentTeam.cash - totalCost;

  // 預覽幸福指數 (拔除幽靈參照 ap 與 isParasitizing)
  const liveTotalExtra = currentTeam.totalExtraPeaches + extraPeaches;
  const derivedHappiness = Math.sqrt(liveTotalExtra) + Math.sqrt(currentTeam.totalRestHours);

  // 預覽人生勝利值
  const derivedVictory = currentTeam.alpha * derivedHappiness * derivedCash;

  // ==========================================
  // 處理按鈕點擊 (完全只在前端運作)
  // ==========================================
  const handleIncrement = () => {
    if (derivedCash - peachPrice >= 0) {
      setExtraPeaches(prev => prev + 1);
      setMessage(null);
    } else {
      setMessage({ text: "預覽警告：剩餘資金不足以購買更多水蜜桃！", type: "error" });
    }
  };

  const handleDecrement = () => {
    if (extraPeaches > 0) {
      setExtraPeaches(prev => prev - 1);
      setMessage(null);
    } else {
      setMessage({ text: "預覽警告：每天必須強制維持 5 顆水蜜桃的底線消費！", type: "error" });
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting || currentTeam.actionProgress === "CONSUMED") return;
    if(!confirm(""確定提交嗎？提交後將無法更改消費數量。")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/action/confirm-consumption", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ teamId: currentTeam.id, extraPeaches }) 
      });

      if (res.ok) {
         fetchGameState(); 
         setMessage(null);
      } else {
         const data = await res.json();
         setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線失敗，請稍後再試", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
      <div className="border-b-4 border-black pb-4 flex items-end justify-between">
      <div>
        <h3 className="text-4xl font-black uppercase tracking-tighter text-pink-500">Consumption</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第三階段：水蜜桃消費</p>
      </div>
      
      {/* 修改這裡：加上 flex 並排、底部對齊(items-end)、以及間距(gap-8) */}
      <div className="flex items-end gap-6 text-right">
        
        {/* 1. 先放：預覽今日水蜜桃總消費 */}
        <div>
          <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">預覽今日水蜜桃總消費</div>
          <div className="text-2xl font-black tracking-tighter">{5 + extraPeaches} 顆</div>
        </div>

        {/* 在這裡加入斜線分隔符號 */}
        <div className="text-3xl font-light text-slate-300 mb-0.5">/</div>

        {/* 2. 後放：結算後現金 (已移除原本多餘的 mt-2) */}
        <div>
          <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">結算後現金</div>
          <div className={cn("text-2xl font-black tracking-tighter", derivedCash < 0 ? "text-red-600" : "text-black")}>
            ${derivedCash.toFixed(0)}
          </div>
        </div>
        
      </div>
</div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50 p-8 border-4 border-dashed border-slate-300">
        <div className="text-center md:text-left space-y-2">
          <div className="text-5xl font-black tracking-tighter">🍑 ${peachPrice}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {extraPeaches > 0 ? `額外購買: ${extraPeaches} 顆` : "僅維持基本生存消費（5顆/天）"}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleDecrement} className="w-16 h-16 border-4 border-black text-3xl font-black bg-white hover:bg-red-50 transition-colors">-</button>
          <button onClick={handleIncrement} className="w-16 h-16 border-4 border-black text-3xl font-black bg-white hover:bg-green-50 transition-colors">+</button>
        </div>
      </div>

      <div className="pt-8 border-t-4 border-dashed border-black">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || currentTeam.actionProgress === "CONSUMED"}
          className="w-full py-6 bg-black text-white text-xl font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          {isSubmitting ? "提交中..." : currentTeam.actionProgress === "CONSUMED" ? "消費已鎖定" : `確認消費 $${totalCost}`}
        </button>
      </div>
    </section>
  );
}
