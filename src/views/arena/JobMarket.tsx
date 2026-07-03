// src/views/arena/JobMarket.tsx
import { Team, GameState, JOB_CONFIG, SALARY_TABLE, IMAGE_MAP } from "../../shared";
import { cn } from "../../lib/utils";

interface JobMarketProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

const THEME_MAP: Record<string, string> = {
  GARDENER: "border-green-600",
  BUTLER: "border-red-600",
  DRIVER: "border-yellow-500",
  TUTOR: "border-blue-600",
};

export default function JobMarket({ currentTeam, gameState, fetchGameState, setMessage }: JobMarketProps) {
  const isConfirmed = currentTeam.actionProgress === "JOBed";
  const hasRealJob = currentTeam.realJob !== null;

  const handleApplyJob = async (jobId: string | null) => {
    try {
      const res = await fetch("/api/action/apply-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 💡 乾淨傳遞：直接送出字串或 null，不再塞入詭異的 "NONE"
        body: JSON.stringify({ teamId: currentTeam.id, jobId }) 
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

  return (
    <section className={cn("border-4 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8 transition-colors", hasRealJob ? "bg-slate-100 border-slate-400" : "bg-white border-black")}>
      <div className={cn("border-b-4 pb-4 flex justify-between items-end", hasRealJob ? "border-slate-400" : "border-black")}>
         <div>
             <h3 className={cn("text-4xl font-black uppercase tracking-tighter", hasRealJob && "text-slate-500")}>Workplace</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employment Market / 上流社會職場應徵</p>
         </div>
         {hasRealJob && (
             <div className="px-4 py-2 bg-slate-200 border-2 border-slate-400 font-black text-xs uppercase flex items-center gap-2 text-slate-500">
                <img src={IMAGE_MAP[currentTeam.realJob!]} className="w-4 h-4 grayscale opacity-50" />
                在職中：{JOB_CONFIG[currentTeam.realJob!].name}
             </div>
         )}
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8", hasRealJob && "opacity-50 grayscale pointer-events-none")}>
        {Object.entries(JOB_CONFIG).map(([jobId, config]: [string, any]) => {
          const hasLicense = currentTeam.licenseProgress[jobId] >= config.apCost;

          return (
            <div 
              key={jobId} 
              className={cn(
                "p-8 border-4 transition-all relative flex flex-col justify-between min-h-[200px]",
                hasLicense && !hasRealJob ? THEME_MAP[jobId] || "border-black" : "border-slate-300",
                (hasRealJob || !hasLicense) ? "bg-slate-50" : "hover:bg-slate-50"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={IMAGE_MAP[jobId] || IMAGE_MAP.SKILL} className="w-8 h-8 object-contain" alt={jobId} />
                  <h4 className="text-2xl font-black uppercase">{config.name}</h4>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-black">最高 ${SALARY_TABLE[jobId]?.[0] || 0}</span>
                </div>
              </div>

              {/* 💡 嚴格根據你的邏輯要求渲染卡片狀態 */}
              {hasRealJob ? (
                 <div className="w-full py-4 bg-slate-200 text-slate-500 font-black text-center uppercase tracking-widest border-2 border-dashed border-slate-400">
                    您已有工作
                 </div>
              ) : !hasLicense ? (
                 <div className="w-full py-4 bg-slate-200 text-slate-400 font-black text-center uppercase tracking-widest border-2 border-dashed border-slate-300">
                    未取得執照
                 </div>
              ) : isConfirmed && currentTeam.realJob === jobId ? (
                 <div className="w-full py-4 bg-green-600 text-white font-black text-center uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    已投遞履歷
                 </div>
              ) : isConfirmed ? (
                 <div className="w-full py-4 bg-slate-300 text-slate-500 font-black text-center uppercase tracking-widest border-2 border-dashed border-slate-400">
                    鎖定中
                 </div>
              ) : (
                 <button 
                    onClick={() => handleApplyJob(jobId)}
                    disabled={isConfirmed}
                    className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                 >
                    一鍵投遞並鎖定
                 </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 💡 底部大按鈕：動態顯示文字，並統一送出 null */}
      <div className={cn("pt-8 border-t-4 border-dashed", hasRealJob ? "border-slate-400" : "border-black")}>
         <button 
            onClick={() => handleApplyJob(null)} 
            disabled={isConfirmed}
            className={cn(
              "w-full py-6 text-xl font-black uppercase tracking-[0.2em] transition-all",
              isConfirmed ? "bg-slate-300 text-slate-500 cursor-not-allowed border-4 border-slate-400" : "bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            )}
         >
            {isConfirmed 
               ? "狀態鎖定，等待市場結算" 
               : hasRealJob 
                  ? "確認當前職位" 
                  : "放棄求職，滾回去地下室"
            }
         </button>
      </div>
    </section>
  );
}