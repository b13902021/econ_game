// src/views/AdminPanel.tsx
import { useState } from "react";
import { GameState, Team, JOB_CONFIG, SALARY_TABLE } from "../shared";
import { cn } from "../lib/utils";

interface AdminPanelProps {
  gameState: GameState;
  fetchGameState: () => void;
}

export default function AdminPanel({ gameState, fetchGameState }: AdminPanelProps) {
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleAction = async (url: string | null, confirmText: string) => {
    if(!url) return;
    if (!confirm(confirmText)) return;
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "執行成功！資料已更新。", type: "success" });
        fetchGameState();
      } else {
        setMessage({ text: data.error || "發生錯誤", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線失敗，請檢查伺服器狀態", type: "error" });
    }
  };

  // 狀態機文字對應轉換
  const getNextPhaseConfig = () => {
    switch (gameState.phase) {
      case "JOB_HUNTING":
        return {
          title: "結束求職，開放 AP 分配階段",
          url: "/api/admin/open-ap-market",
          confirm: "⚠ 確定所有小隊都已完成投遞履歷嗎？按下後將開放 AP 分配。"
        };
      case "EARN_AND_SPEND":
        if(gameState.currentDay === 1){
          return {
            title: "進入下一天",
            url: "/api/admin/next-day",
            confirm: "⚠ 確定要結束今天並進入下一天嗎？"
          }
        }
        return { title: "未知階段", url: null, confirm: "" };
      case "AP_ALLOCATION":
        return {
          title: "鎖定 AP 分配，開放浮報階段",
          url: "/api/admin/open-parasite",
          confirm: "⚠ 確定所有小隊都已完成 AP 分配嗎？按下後將開放浮報。"
        };
      case "PARASITE":
        return {
          title: "鎖定浮報與消費，開放檢舉階段",
          url: "/api/admin/open-report",
          confirm: "⚠ 確定所有小隊都已完成浮報與水蜜桃消費嗎？按下後將進入檢舉階段。"
        };
      case "REPORT":
        return {
          title: `結算檢舉結果並進入${(gameState.currentDay === 4)?"屠殺":"辭職"}階段`,
          url: "/api/admin/resolve-report",
          confirm: "⚠ 確定要結算所有檢舉結果嗎？"
        };
      case "RESIGN":
        return {
          title: "進入下一天",
          url: "/api/admin/next-day",
          confirm: "⚠ 確定要結束今天並進入下一天嗎？"
        }
      case "SLAUGHTER":
        return {
          title: "結算屠殺",
          url: "/api/admin/execute-slaughter",
          confirm: `⚠ 確定要結算屠殺嗎？`
        };
      case "ENDING":
        return {
          title: "遊戲已結束",
          url: null,
          confirm: '遊戲已經結束'
        }
      default:
        return { title: "未知階段", url: null, confirm: "" };
    }
  };

  const nextPhase = getNextPhaseConfig();

  const getConsumptionLabel = (team: Team) => {
    if (team.totalExtraPeaches > 0) {
      return `${team.totalExtraPeaches} 顆`;
    }
    return "--";
  };

  const getReportLabel = (team: Team) => {
    if (team.greedAmount > 0) {
      return `$${team.greedAmount}`;
    }
    return "--";
  };

  const getSlaughterDonationLabel = (team: Team) => {
    if (team.slaughterDonation > 0) {
      return `$${team.slaughterDonation}`;
    }
    return "--";
  };

  const getJobLabel = (team: Team) => {
    const jobCode = team.publicJob || team.realJob;
    if (!jobCode) return "--";
    return JOB_CONFIG[jobCode]?.name || jobCode;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* 頂部 Header */}
      <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(100,116,139,1)] flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-black uppercase tracking-widest">Admin Console</h2>
           <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-4">
             <span>📅 第 {gameState.currentDay} 天</span>
             <span className="px-2 py-1 bg-purple-600 text-white rounded">當前階段: {gameState.phase}</span>
           </p>
        </div>
        
        {/* 💡 屠殺階段專屬：管理員視角的金庫監控 */}
        {gameState.phase === "SLAUGHTER" && (
           <div className="bg-yellow-400 text-black px-6 py-2 border-2 border-white text-right">
              <div className="text-[10px] font-black uppercase tracking-widest">Bailout Pool Status</div>
              <div className="text-2xl font-black tracking-tighter">${gameState.bailoutPool} / 1000</div>
              {gameState.bailoutPool >= 1000 ? (
                 <div className="text-green-800 text-xs font-bold">✔ 安全達標</div>
              ) : (
                 <div className="text-red-700 text-xs font-bold animate-pulse">⚠ 危險：等待小隊發動屠殺</div>
              )}
           </div>
        )}
      </div>

      {message && (
        <div className={cn("p-4 border-4 font-bold text-lg", message.type === "error" ? "bg-red-100 border-red-600 text-red-800" : "bg-green-100 border-green-600 text-green-800")}>
          {message.text}
        </div>
      )}

      {/* 核心控制區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border-4 border-black p-6 bg-purple-50 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
           <h3 className="text-2xl font-black uppercase text-purple-900 border-b-4 border-purple-900 pb-2">階段推進器</h3>
           <p className="text-sm font-bold text-purple-700">請確認下方監控表中所有小隊皆顯示「✔ 完成」後再點擊推進。</p>
           
           <button 
             onClick={() => handleAction(nextPhase.url, nextPhase.confirm)}
             className="w-full py-8 bg-purple-600 text-white font-black text-2xl uppercase tracking-widest border-4 border-black hover:bg-purple-700 hover:translate-y-[2px] hover:translate-x-[2px] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
           >
             {nextPhase.title} ➔
           </button>
        </div>

        <div className="border-4 border-black p-6 bg-red-50 space-y-4">
           <h3 className="text-2xl font-black uppercase text-red-700 border-b-4 border-red-700 pb-2">危險操作</h3>
           <p className="text-sm font-bold text-red-500">此區操作將不可逆轉地改變遊戲狀態。</p>
           
           <button 
             onClick={() => handleAction("/api/admin/reset", "【極度危險】確定要重置整個遊戲嗎？所有隊伍資料與進度將被徹底清空！")}
             className="w-full py-4 bg-white text-red-600 font-black text-lg border-4 border-red-600 hover:bg-red-100 transition-all shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] active:shadow-none"
           >
             重置遊戲 (Reset)
           </button>
        </div>
      </div>

      {/* 💡 修復幽靈參照：改用 actionProgress 判斷進度的監控表 */}
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-slate-100 p-4 border-b-4 border-black flex justify-between items-center">
           <h3 className="text-2xl font-black uppercase">小隊決策進度監控</h3>
           <button onClick={fetchGameState} className="px-4 py-2 border-2 border-black font-bold bg-white hover:bg-slate-200">⟳ 重新整理</button>
        </div>
        <div className="overflow-x-auto p-4">
             <table className="w-full min-w-[1700px] text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b-4 border-black text-xs uppercase tracking-widest">
                   <th className="p-4 font-black border-r-2 border-black">Team</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">職業</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">進度</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">勝利</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">現金</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">幸福</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">今日休息</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">總休息</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">額外消費</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">浮報金額</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">檢舉標的</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">屠殺捐獻</th>
                   <th className="p-4 font-black border-r-2 border-black text-center">alpha</th>
                 </tr>
               </thead>
               <tbody>
                 {gameState.teams.map((team) => {
                   return (
                     <tr key={team.id} className={cn("border-b border-slate-200 hover:bg-slate-50", team.isDead && "opacity-50 grayscale bg-red-50")}>
                       <td className="p-4 font-bold border-r-2 border-black">
                          {team.name} {team.isDead && "☠"}
                       </td>
                       <td className="p-4 font-bold text-center border-r-2 border-black">{getJobLabel(team)}</td>
                       <td className="p-4 font-bold text-center border-r-2 border-black text-xs text-slate-500">{team.actionProgress}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{(team.realVictory || 0).toFixed(2)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">${(team.cash || 0).toFixed(0)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{(team.happiness || 0).toFixed(2)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{(team.todayRest || 0).toFixed(0)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{(team.totalRestHours || 0).toFixed(0)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{getConsumptionLabel(team)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{getReportLabel(team)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{team.reportedTargetId || "--"}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{getSlaughterDonationLabel(team)}</td>
                       <td className="p-4 font-black text-center border-r-2 border-black">{team.alpha.toFixed(1)}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
        </div>
      </div>

      {/* 💼 工作市場監控 */}
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-blue-100 p-4 border-b-4 border-black">
           <h3 className="text-2xl font-black uppercase text-blue-900">工作市場監控</h3>
        </div>
        <div className="overflow-x-auto p-4">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-blue-50 border-b-4 border-black text-xs uppercase tracking-widest">
                   <th className="p-4 font-black border-r-2 border-black">工作</th>
                   <th className="p-4 font-black border-r-2 border-black">執照考取隊伍</th>
                   <th className="p-4 font-black border-r-2 border-black">現在在職隊伍</th>
                   <th className="p-4 font-black">現在時薪</th>
                 </tr>
               </thead>
               <tbody>
                 {Object.entries(JOB_CONFIG).map(([jobCode, jobInfo]) => {
                   const employed = gameState.teams.filter(t => t.realJob === jobCode).map(t => t.name);
                   const examProgress = gameState.teams
                     .filter(t => {
                       const progress = t.licenseProgress?.[jobCode] || 0;
                       return progress > 0;
                     })
                     .map(t => {
                       const progress = t.licenseProgress?.[jobCode] || 0;
                       if (progress >= jobInfo.apCost) {
                         return `${t.name} (✔ 已完成)`;
                       } else {
                         return `${t.name} (${progress}/${jobInfo.apCost})`;
                       }
                     });

                     const count = employed.length > 0 ? employed.length : 1;
                     const currentSalary = SALARY_TABLE[jobCode]?.[Math.min(count - 1, 9)] || 0;
                   
                   return (
                     <tr key={jobCode} className="border-b border-slate-200 hover:bg-blue-50">
                       <td className="p-4 font-black border-r-2 border-black text-blue-900">{jobInfo.name}</td>
                       <td className="p-4 font-bold border-r-2 border-black">
                         {examProgress.length > 0 ? examProgress.join(", ") : "--"}
                       </td>
                       <td className="p-4 font-bold border-r-2 border-black">
                         {employed.length > 0 ? employed.join(", ") : "--"}
                       </td>
                       <td className="p-4 font-black text-green-700">${currentSalary}</td>
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