// src/views/arena/Ending.tsx
import { Team, GameState } from "../../shared";
import { cn } from "../../lib/utils";

interface EndingProps {
  currentTeam: Team;
  gameState: GameState; 
}

export default function Ending({ currentTeam, gameState }: EndingProps) {
  // 直接依後端結算結果判斷，不再依賴金庫明細
  const isBailoutFailed = gameState.lastSlaughterOutcome === "FAILED";
  const isDead = currentTeam.isDead;
  const rankedTeams = [...gameState.teams].sort((a, b) => {
    if (a.isDead && !b.isDead) return 1;
    if (!a.isDead && b.isDead) return -1;
    return a.publicRank - b.publicRank;
  });
  const lastPlaceRank = rankedTeams.at(-1)?.publicRank;
  const isMastermind = currentTeam.publicRank === lastPlaceRank;
  const isBailoutProvider = !isBailoutFailed && currentTeam.publicRank === lastPlaceRank;
  const victimName = gameState.lastSlaughterVictimName || "某支小隊";

  // 根據結局決定畫面主題與文字
  let statusTitle = "";
  let message = "";
  let containerTheme = "";
  let rankTheme = "";

  if (gameState.lastSlaughterOutcome === "SUCCEEDED") {
    // 結局 A：金庫達標，大家平安
    statusTitle = "PEACE / 平安日";
    message = isBailoutProvider
      ? "金庫達到標準，你獲得了足夠的補助，心滿意足，今晚沒有任何人被屠殺。"
      : "金庫達到標準，你提供了足夠的補助，屠殺者心滿意足，今晚沒有任何人被屠殺。";
    containerTheme = "bg-emerald-400 border-black text-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]";
    rankTheme = "text-black drop-shadow-md";
  } else if (isBailoutFailed && !isDead) {
    // 結局 B：屠殺發動，但你活下來了 (沒死)
    if (isMastermind) {
      statusTitle = "RABID / 理智斷線";
      message = `金庫未達標，你的理智最終斷線，屠殺了 ${victimName}。`;
    } else {
      statusTitle = "SURVIVED / 倖存";
      message = `金庫未達標，${victimName} 成了代罪羔羊，而你逃過一劫。`;
    }
    containerTheme = "bg-white border-black text-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]";
    rankTheme = "text-black drop-shadow-md";
  } else {
    // 結局 C：屠殺發動，你被淘汰 (死了)
    statusTitle = "ELIMINATED / 淘汰";
    message = `金庫未達標，${victimName} 的名字被寫進屠殺名單，而命運的刀口落在了你的心臟。`;
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
            {isBailoutFailed ? "Final Judgment / 最終審判" : "Final Rank / 最終階級名次"}
          </div>
          
          <div className={cn("font-black tracking-tighter leading-none py-4", rankTheme, isDead ? "text-8xl md:text-[12rem]" : "text-8xl md:text-[12rem]") }>
            {isDead ? "☠" : `#${currentTeam.publicRank}`}
          </div>
          
          <div className="text-2xl font-bold uppercase tracking-[0.2em] opacity-80 mt-4">
            {currentTeam.name}
          </div>
        </div>

      </section>
    </div>
  );
}