// src/views/arena/Ending.tsx
import { Team, GameState } from "../../shared";
import { cn } from "../../lib/utils";

interface EndingProps {
  currentTeam: Team;
  gameState: GameState; 
}

export default function Ending({ currentTeam, gameState }: EndingProps) {
  // 取得目標金額與目前金庫金額
  const requirement = gameState.bailoutRequirement || 1000;
  const pool = gameState.bailoutPool || 0;
  
  // 判斷邏輯：是否屠殺成功？玩家是否死亡？
  const isBailoutFailed = pool < requirement;
  const isDead = currentTeam.isDead;

  // 根據結局決定畫面主題與文字
  let statusTitle = "";
  let message = "";
  let containerTheme = "";
  let rankTheme = "";

  if (!isBailoutFailed) {
    // 結局 A：金庫達標，大家平安
    statusTitle = "PEACE / 平安無事";
    message = "最後一名獲得了足夠的補助，大家平安無事";
    containerTheme = "bg-emerald-400 border-black text-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]";
    rankTheme = "text-black drop-shadow-md";
  } else if (isBailoutFailed && !isDead) {
    // 結局 B：屠殺發動，但你活下來了 (沒死)
    statusTitle = "SURVIVED / 倖存";
    message = "最後一名鐵了心發動屠殺，而你逃過一劫";
    containerTheme = "bg-white border-black text-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]";
    rankTheme = "text-black drop-shadow-md";
  } else {
    // 結局 C：屠殺發動，你被淘汰 (死了)
    statusTitle = "ELIMINATED / 淘汰";
    message = "最後一名鐵了心，而命運的刀口落在了你的心臟上";
    containerTheme = "bg-red-950 border-red-600 text-red-500 shadow-[16px_16px_0px_0px_rgba(220,38,38,0.2)]";
    rankTheme = "text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]";
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4 animate-in fade-in zoom-in-95 duration-1000">
      <section className={cn("border-8 p-12 md:p-20 text-center space-y-12 max-w-4xl w-full transition-all", containerTheme)}>
        
        {/* ========================================== */}
        {/* 上半部：結局宣判文字 */}
        {/* ========================================== */}
        <div className="space-y-6">
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">
            {statusTitle}
          </h2>
          <p className="text-2xl md:text-3xl font-bold tracking-widest leading-relaxed">
            {message}
          </p>
        </div>

        {/* 分隔線 */}
        <hr className={cn("border-t-4 w-2/3 mx-auto", isDead ? "border-red-900" : "border-black/20")} />

        {/* ========================================== */}
        {/* 下半部：大大的最終名次呈現 */}
        {/* ========================================== */}
        <div className="space-y-2">
          <div className="text-sm font-black uppercase tracking-[0.4em] opacity-70">
            Final Rank / 最終階級名次
          </div>
          
          <div className={cn("text-8xl md:text-[12rem] font-black tracking-tighter leading-none py-4", rankTheme)}>
            #{currentTeam.publicRank}
          </div>
          
          <div className="text-2xl font-bold uppercase tracking-[0.2em] opacity-80 mt-4">
            {currentTeam.name}
          </div>
        </div>

      </section>
    </div>
  );
}