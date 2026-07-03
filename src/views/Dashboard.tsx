// src/views/Dashboard.tsx
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, AlertCircle, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Team, GameState, JOB_CONFIG, SALARY_TABLE, IMAGE_MAP } from "../shared";
import JobMarket from "./arena/JobMarket";
import ApAllocation from "./arena/ApAllocation";
import Parasite from "./arena/Parasite";
import Consumption from "./arena/Consumption";
import Report from "./arena/Report";
import Resign from "./arena/Resign";
import Slaughter from "./arena/Slaughter";
import Leaderboard from "./Leaderboard"; 
import Ending from "./arena/Ending"

interface DashboardProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
  message: { text: string; type: "success" | "error" } | null;
  onLogout: () => void;
}

type Tab = "dashboard" | "arena" | "ledger";

export default function Dashboard({ currentTeam, gameState, fetchGameState, setMessage, message, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [localAckedReport, setLocalAckedReport] = useState(false);

  useEffect(() => {
     setLocalAckedReport(false);
  }, [gameState.currentDay]);

  // 💡 1. 將主題色產生器移到最上面，讓下面的 WaitingPanel 可以用
  const getTheme = (jobId: string | null) => {
    switch (jobId) {
      case "GARDENER": return { bg: "bg-green-700", border: "border-green-700", hover: "hover:bg-green-800" };
      case "BUTLER": return { bg: "bg-rose-700", border: "border-rose-700", hover: "hover:bg-rose-800" };
      case "DRIVER": return { bg: "bg-amber-500", border: "border-amber-500", hover: "hover:bg-amber-600" };
      case "TUTOR": return { bg: "bg-blue-700", border: "border-blue-700", hover: "hover:bg-blue-800" };
      default: return { bg: "bg-black", border: "border-black", hover: "hover:bg-zinc-800" };
    }
  };
  const theme = getTheme(currentTeam.realJob);

  // 💡 2. 改名處理邏輯
  const handleRename = async () => {
    if (currentTeam.isRenamed) return;
    
    const newName = prompt("請輸入新的小隊名稱 (注意：整場遊戲僅限修改一次！)");
    if (!newName || newName.trim() === "") return;

    try {
      const res = await fetch("/api/action/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: currentTeam.id, newName: newName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGameState();
        setMessage({ text: `隊名已成功更改為「${newName.trim()}」！`, type: "success" });
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "連線錯誤", type: "error" });
    }
  };

  const renderArenaPhase = () => {
    // 💡 所有的 WaitingPanel 現在都會接收 theme 來變換顏色
    if (gameState.phase === "JOB_HUNTING") {
      if (currentTeam.actionProgress === "JOBed") return <WaitingPanel message="應徵志願已鎖定，等待市場分發與開啟..." theme={theme} />;
      return <JobMarket currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    if (gameState.phase === "EARN_AND_SPEND") {
      switch (currentTeam.actionProgress) {
         case "BEGINNING":
         case "JOBed":
            return <ApAllocation currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "APed":
            if(gameState.currentDay === 1) return <Consumption currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
            return <Parasite currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "PARASITED":
            return <Consumption currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "CONSUMED":
         case "REPORTED":
            return <WaitingPanel message="今日行動已全部鎖定，等待管理員開放檢舉或換日..." theme={theme} />;
         default:
            return <WaitingPanel message="資料同步中..." theme={theme} />;
      }
    }

    if (gameState.phase === "REPORT") {
      if (currentTeam.actionProgress === "REPORTED") return <WaitingPanel message="抉擇已鎖定，等待管理員進行全場結算..." theme={theme} />;
      return <Report currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    if (gameState.phase === "RESIGN") {
      if(currentTeam.actionProgress === "RESIGNED") return <WaitingPanel message="今日所有決策已完成，祝你們明天獨占鰲頭" theme={theme} />;
      return <Resign currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    if (gameState.phase === "SLAUGHTER") {
      if(currentTeam.actionProgress === "DONATED") return <WaitingPanel message="等待主持人結算" theme={theme} />;
      return <Slaughter currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    if(gameState.phase === "ENDING") {
      return <Ending currentTeam={currentTeam} gameState={gameState} />
    }

    return <WaitingPanel message="等待遊戲開始..." theme={theme} />;
  };

  const getLicenseProgressLabel = (team: Team) => {
   const progresses = Object.entries(team.licenseProgress || {})
      .map(([jobId, invested]) => {
         const required = JOB_CONFIG[jobId]?.apCost ?? 0;
         return `${JOB_CONFIG[jobId]?.name || jobId}: ${invested}/${required}`;
      })
      .filter(Boolean);

   return progresses.length > 0 ? progresses.join(" · ") : "尚未投入";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative">
      {/* 🌪️ 暴風雨 */}
      {gameState.currentDay >= 3 && <RainstormEffect />}
      
      {/* 頂部導航狀態列 (Header) */}
      <header className={cn("text-white sticky top-0 z-50 transition-colors duration-500 shadow-lg", theme.bg)}>
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            {/* 💡 3. 加入改名按鈕 */}
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none flex items-center gap-3">
              {currentTeam.name}
              {!currentTeam.isRenamed && (
                 <button 
                    onClick={handleRename}
                    className="text-[12px] font-bold tracking-widest uppercase bg-white/20 hover:bg-white hover:text-black px-2 py-1 rounded transition-colors"
                 >
                    改名
                 </button>
              )}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white/20 px-2 py-0.5 rounded">Day {gameState.currentDay} | {gameState.phase}</span>
            </div>
          </div>
          <div className="flex gap-4">
             {activeTab !== "dashboard" && (
                <button onClick={() => { setActiveTab("dashboard"); setMessage(null); }} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase bg-white text-black px-4 py-2 hover:bg-slate-200 transition-all">
                   <ArrowLeft className="w-4 h-4"/> 返回首頁
                </button>
             )}
             <button onClick={onLogout} className="text-[10px] font-black tracking-widest uppercase border border-white/20 hover:bg-white hover:text-black px-4 py-2 transition-all">登出</button>
          </div>
        </div>
      </header>

      {/* 錯誤/成功訊息提示 */}
      {message && activeTab !== "dashboard" && (
         <div className="max-w-6xl mx-auto px-8 mt-8 relative z-30">
            <div className={cn("p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-sm", message.type === "success" ? "bg-green-100 border-2 border-green-600 text-green-800" : "bg-red-100 border-2 border-red-600 text-red-800")}>
               <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {message.text}</div>
               <button onClick={() => setMessage(null)}><XCircle className="w-5 h-5"/></button>
            </div>
         </div>
      )}

      <main className="max-w-6xl mx-auto px-8 py-12 relative z-10">
        {activeTab === "dashboard" && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                 
                 {/* 公開資訊卡片 */}
                 <div className={cn("lg:col-span-2 bg-white border-4 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-colors duration-500", theme.border)}>
                    <div className={cn("flex items-center justify-between border-b-4 pb-4 mb-6 transition-colors duration-500", theme.border)}>
                        <div>
                           <h3 className="text-3xl font-black uppercase tracking-tighter">公開資訊</h3>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">每日指定階段將更新至公開帳本</p>
                        </div>
                        <span className={cn("text-[10px] px-2 py-1 font-black uppercase tracking-widest text-white transition-colors duration-500", theme.bg)}>Public Data</span>
                     </div>
                    <div className="grid grid-cols-2 gap-8 flex-1">
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">職業</div>
                          {currentTeam.realJob ? (
                             <div className="flex items-center gap-2">
                                <img src={IMAGE_MAP[currentTeam.realJob] || IMAGE_MAP.SKILL} className="w-8 h-8 object-contain" alt="job"/>
                                <div className="text-lg font-black uppercase">{JOB_CONFIG[currentTeam.realJob]?.name}</div>
                             </div>
                          ) : <div className="text-2xl font-black text-slate-300">無</div>}
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">當日水蜜桃價格</div>
                          <div className="text-3xl font-black text-black-500">${gameState.peachPrice || 0}</div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Alpha 係數</div>
                          <div className="text-3xl font-black">{(currentTeam.alpha || 0).toFixed(1)}</div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">人生勝利值</div>
                          <div className="text-3xl font-black tracking-tighter text-amber-600">{(currentTeam.realVictory || 0).toFixed(0)}</div>
                       </div>
                    </div>
                 </div>

                 {/* 秘密資訊卡片 */}
                 <div className={cn("text-white p-8 shadow-[8px_8px_0px_0px_rgba(200,200,200,1)] border-4 lg:col-span-3 transition-colors duration-500", theme.bg, theme.border)}>
                    <div className="flex items-center justify-between border-b-4 border-white/20 pb-4 mb-6">
                       <h3 className="text-3xl font-black uppercase tracking-tighter">私人資訊</h3>
                       <span className="text-[10px] bg-white text-black px-2 py-1 font-black uppercase tracking-widest">Private Data</span>
                    </div>
                    <div className="space-y-8">
                       <div className="grid grid-cols-3 gap-8">
                          <div>
                             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">持有現金</div>
                             <div className="text-2xl font-black tracking-tighter text-white-400">${currentTeam.cash}</div>
                          </div>
                          <div>
                             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">額外消費</div>
                             <div className="text-2xl font-black tracking-tighter text-white-400">{currentTeam.totalExtraPeaches}<span className="text-lg">顆</span></div>
                          </div>
                          <div>
                             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">累積休息</div>
                             <div className="text-2xl font-black tracking-tighter text-white-400">{currentTeam.totalRestHours}<span className="text-lg">H</span></div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">幸福指數</div>
                             <div className="text-2xl font-black text-white-400">{(currentTeam.happiness || 0).toFixed(2)}</div>
                          </div>
                          <div>
                             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">單位時薪</div>
                             <div className="text-2xl font-black text-white">${currentTeam.realJob ? currentTeam.wageRate : "-"}<span className="text-lg">/HR</span></div>
                          </div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">執照考取進度</div>
                          <div className="text-sm leading-snug font-black text-white break-words">{getLicenseProgressLabel(currentTeam)}</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <button onClick={() => { setActiveTab("ledger"); setMessage(null); }} className={cn("group relative bg-white border-4 p-8 text-left hover:bg-slate-100 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", theme.border)}>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">查看排名</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">The Ledger / 觀看公開帳本</p>
                    <ArrowUpRight className="absolute top-8 right-8 w-10 h-10 group-hover:scale-110 transition-transform" />
                 </button>
                 <button onClick={() => { setActiveTab("arena"); setMessage(null); }} className={cn("group relative border-4 p-8 text-left text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", theme.bg, theme.border, theme.hover)}>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">前往戰局</h3>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Enter Arena / 執行每日決策</p>
                    <ArrowUpRight className="absolute top-8 right-8 w-10 h-10 group-hover:scale-110 transition-transform" />
                 </button>
              </div>
           </div>
        )}

        {activeTab === "ledger" && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              <Leaderboard gameState={gameState} />
           </div>
        )}

        {activeTab === "arena" && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              {renderArenaPhase()}
           </div>
        )}
      </main>
    </div>
  );
}

// 💡 加上 "?" 讓 theme 變成可選參數
function WaitingPanel({ message, theme }: { message: string; theme?: { bg: string; border: string } }) {
  
  // 如果有傳 theme 就用 theme，沒傳就自動退回原本的黑灰色系
  const currentBg = theme?.bg || "bg-zinc-900";
  const currentBorder = theme?.border || "border-black";

  return (
    <section className={cn("border-4 p-12 text-center space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px] transition-colors duration-500", currentBg, currentBorder)}>
       {/* 為了配合各種主題色，這裡的讀取圈圈改用半透明白色，比較百搭 */}
       <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
       <div>
           <h3 className="text-3xl font-black uppercase text-white tracking-widest">STANDBY</h3>
           <p className="text-white/70 font-bold mt-2">{message}</p>
       </div>
    </section>
  );
}

// 🌪️ 暴風雨
function RainstormEffect() {
  const drops = Array.from({ length: 80 });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-difference opacity-50">
      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(-10vh) translateX(0) rotate(10deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(-15vh) rotate(10deg); opacity: 0; }
        }
        @keyframes lightning-flash {
          0%, 89%, 100% { background-color: transparent; }
          90% { background-color: rgba(255, 255, 255, 0.4); } 
          91% { background-color: rgba(255, 255, 255, 0.1); } 
          92% { background-color: rgba(255, 255, 255, 0.6); } 
          93% { background-color: transparent; }               
          95% { background-color: rgba(255, 255, 255, 0.2); }  
          96% { background-color: transparent; }
          98% { background-color: rgba(255, 255, 255, 0.3); }  
          99% { background-color: rgba(255, 255, 255, 0.05); } 
        }
        .rain-drop {
          position: absolute;
          background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(150,160,170,0.9));
          width: 2px;
          height: 120px;
          animation: rain-fall linear infinite;
        }
      `}</style>
      
      {drops.map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left: `${Math.random() * 120 - 10}%`,
              top: `-150px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 0.4 + 0.3}s`,
            }}
          />
      ))}
      <div className="absolute inset-0 animate-[lightning-flash_10s_infinite] pointer-events-none"></div>
      <div className="absolute inset-0 animate-[lightning-flash_17s_infinite] pointer-events-none" style={{ animationDelay: '5s' }}></div>
    </div>
  );
}