// src/views/Leaderboard.tsx
import { GameState, JOB_CONFIG } from "../shared";
import { cn } from "../lib/utils";

interface LeaderboardProps {
  gameState: GameState;
}

export default function Leaderboard({ gameState }: LeaderboardProps) {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      
      {/* 帳本標題區 */}
      <div className="bg-zinc-950 text-white p-8 md:p-12 border-b-[16px] border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] opacity-5 transform rotate-12 pointer-events-none text-[200px] font-black">
          LEDGER
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter relative z-10">
          The Ledger
        </h1>
        <p className="text-zinc-400 mt-4 text-sm md:text-base font-bold tracking-widest uppercase relative z-10">
          Day {gameState.currentDay} | Public Records & Asset Evaluation
        </p>
      </div>

      {/* 帳本明細表 */}
      <div className="bg-white border-4 border-black mt-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b-4 border-black">
                <th className="p-6 font-black text-sm uppercase tracking-widest border-r-2 border-black w-24 text-center">Rank</th>
                <th className="p-6 font-black text-sm uppercase tracking-widest border-r-2 border-black">Entity (Team)</th>
                <th className="p-6 font-black text-sm uppercase tracking-widest border-r-2 border-black text-center">Public Job</th>
                {/* 新增 Alpha 欄位標頭 */}
                <th className="p-6 font-black text-sm uppercase tracking-widest border-r-2 border-black text-center">Alpha</th>
                <th className="p-6 font-black text-sm uppercase tracking-widest text-right">Victory Value</th>
              </tr>
            </thead>
            <tbody>
              {gameState.teams.map((team, idx) => {
                
                
                // 判斷是否為第一天 (-1)，若是則強制視同無變動
                const isFirstDay = team.previousRank === -1;
                const rankDiff = isFirstDay ? 0 : team.previousRank - team.publicRank;

                return (
                  <tr 
                    key={team.id} 
                    className={cn(
                      "border-b border-zinc-300 transition-colors",
                      idx === gameState.teams.length - 1 && "border-b-0",
                      idx === 0 && !team.isDead ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-zinc-50",
                      team.isDead && "bg-red-50 grayscale opacity-80"
                    )}
                  >
                    <td className="p-6 border-r-2 border-black text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={cn("text-3xl font-black", idx === 0 && !team.isDead ? "text-amber-600" : (team.isDead ? "text-red-800" : "text-black"))}>
                          {team.isDead ? "☠" : team.publicRank}
                        </span>
                        
                        {/* 箭頭與持平邏輯 (包含 -1 的防呆處理) */}
                        {!team.isDead && !isFirstDay && rankDiff > 0 && <span className="text-green-600 text-xs font-bold mt-1">▲ {rankDiff}</span>}
                        {!team.isDead && !isFirstDay && rankDiff < 0 && <span className="text-red-600 text-xs font-bold mt-1">▼ {Math.abs(rankDiff)}</span>}
                        {!team.isDead && (isFirstDay || rankDiff === 0) && <span className="text-zinc-400 text-xs font-bold mt-1">—</span>}
                      </div>
                    </td>

                    <td className="p-6 border-r-2 border-black">
                      <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
                         <span className={team.isDead ? "line-through text-red-900" : ""}>{team.name}</span>
                         {team.isDead && <span className="text-[10px] bg-red-800 text-white px-2 py-1 uppercase tracking-widest rounded-sm">ELIMINATED</span>}
                      </div>
                      <div className="text-xs font-bold text-zinc-400 mt-1 uppercase">ID: {team.id}</div>
                    </td>

                    <td className="p-6 border-r-2 border-black text-center align-middle">
                      {team.publicJob ? (
                        <span className={cn("inline-block px-4 py-2 font-black text-xs uppercase tracking-widest", team.isDead ? "bg-red-900 text-red-200" : "bg-black text-white")}>
                          {JOB_CONFIG[team.publicJob]?.name || team.publicJob}
                        </span>
                      ) : (
                        <span className="inline-block px-4 py-2 border-2 border-dashed border-zinc-300 text-zinc-400 font-black text-xs uppercase tracking-widest">
                          Unemployed
                        </span>
                      )}
                    </td>

                    {/* 新增 Alpha 欄位 */}
                    <td className="p-6 border-r-2 border-black text-center align-middle">
                      <span className={cn(
                        "text-2xl font-black tracking-tighter",
                        idx === 0 && !team.isDead ? "text-amber-600" : (team.isDead ? "text-red-800 line-through" : "text-slate-700")
                      )}>
                        {(team.alpha || 0).toFixed(1)}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <span className={cn(
                        "text-3xl font-black tracking-tighter",
                        idx === 0 && !team.isDead ? "text-amber-600" : (team.isDead ? "text-red-800 line-through" : "text-black")
                      )}>
                        {Math.floor(team.publicVictory || 0).toLocaleString()} 
                      </span>
                      <span className="text-zinc-400 text-sm font-bold ml-1">pts</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}