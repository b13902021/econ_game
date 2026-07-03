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
  
  // 本地狀態：記錄是否已經看過昨天的結算報告
  const [localAckedReport, setLocalAckedReport] = useState(false);

  // 當天數改變時 (換日)，重置已讀狀態
  useEffect(() => {
     setLocalAckedReport(false);
  }, [gameState.currentDay]);

  // ==========================================
  // 導航器：戰局內的階段判定 (Arena Router)
  // ==========================================
  const renderArenaPhase = () => {

    // 1. 求職階段
    if (gameState.phase === "JOB_HUNTING") {
      if (currentTeam.actionProgress === "JOB_CONFIRMED") {
         return <WaitingPanel message="應徵志願已鎖定，等待市場分發與開啟..." />;
      }
      return <JobMarket currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    // 2. 勞動與消費階段 (基於 Finite State Machine 路由)
    if (gameState.phase === "EARN_AND_SPEND") {
      switch (currentTeam.actionProgress) {
         case "BEGINNING":
         case "JOB_CONFIRMED":
            return <ApAllocation currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "AP_ALLOCATED":
            if(gameState.currentDay === 1)
               return <Consumption currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
            return <Parasite currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "PARASITE_DECIDED":
            return <Consumption currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
         case "CONSUMPTION_DECIDED":
         case "REPORT_SUBMITTED":
            return <WaitingPanel message="今日行動已全部鎖定，等待管理員開放檢舉或換日..." />;
         default:
            return <WaitingPanel message="資料同步中..." />;
      }
    }

    // 3. 檢舉階段
    if (gameState.phase === "REPORT") {
      if (currentTeam.actionProgress === "REPORT_SUBMITTED") {
         return <WaitingPanel message="抉擇已鎖定，等待管理員進行全場結算..." />;
      }
      return <Report currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    // 4. 辭職階段
    if (gameState.phase === "RESIGN") {
      if(currentTeam.actionProgress === "RESIGN_DECIDED")
         return <WaitingPanel message="今日所有決策已完成，祝你們明天獨占鰲頭" />;
      return <Resign currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    // 5. 屠殺階段
    if (gameState.phase === "SLAUGHTER") {
      if(currentTeam.actionProgress === "DONATE_SUMMITTED")
         return <WaitingPanel message="等待主持人結算" />;
      return <Slaughter currentTeam={currentTeam} gameState={gameState} fetchGameState={fetchGameState} setMessage={setMessage} />;
    }

    return <WaitingPanel message="等待遊戲開始..." />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* 頂部導航狀態列 (Header) */}
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">
              {currentTeam.name}
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
             <button onClick={onLogout} className="text-[10px] font-black tracking-widest uppercase border border-white/20 hover:bg-white hover:text-black px-4 py-2 transition-all">
                登出
             </button>
          </div>
        </div>
      </header>

      {/* 錯誤/成功訊息提示 */}
      {message && activeTab !== "dashboard" && (
         <div className="max-w-6xl mx-auto px-8 mt-8">
            <div className={cn("p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-sm", message.type === "success" ? "bg-green-100 border-2 border-green-600 text-green-800" : "bg-red-100 border-2 border-red-600 text-red-800")}>
               <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {message.text}</div>
               <button onClick={() => setMessage(null)}><XCircle className="w-5 h-5"/></button>
            </div>
         </div>
      )}

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* ======================= Tab 1: 主畫面 Dashboard ======================= */}
        {activeTab === "dashboard" && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* (將)公開資訊卡片 */}
                 <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                    <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
                        {/* 用一個 div 把標題和說明包起來，它們就會在內部自然換行 */}
                        <div>
                           <h3 className="text-3xl font-black uppercase tracking-tighter">公開資訊</h3>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">相關資訊將在每日指定階段更新至公開帳本</p>
                        </div>
                        
                        <span className="text-[10px] px-2 py-1 font-black uppercase tracking-widest bg-black text-white">Public Data</span>
                     </div>
                    {/* 三欄均分配置 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">職業</div>
                          {currentTeam.realJob ? (
                             <div className="flex items-center gap-2">
                                <img src={IMAGE_MAP[currentTeam.realJob] || IMAGE_MAP.SKILL} className="w-8 h-8 object-contain" alt="job"/>
                                <div className="text-xl font-black uppercase">{JOB_CONFIG[currentTeam.realJob]?.name}</div>
                             </div>
                          ) : <div className="text-2xl font-black text-slate-300">無</div>}
                       </div>

                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alpha 係數</div>
                          <div className="text-4xl font-black">{(currentTeam.alpha || 0).toFixed(1)}</div>
                       </div>

                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">人生勝利值</div>
                          <div className="text-4xl font-black tracking-tighter text-amber-600">{(currentTeam.realVictory || 0).toFixed(0)}</div>
                       </div>
                    </div>
                 </div>

                 {/* 秘密資訊卡片 */}
                 <div className="bg-black text-white p-8 shadow-[8px_8px_0px_0px_rgba(200,200,200,1)] border-4 border-black">
                    <div className="flex items-center justify-between border-b-4 border-white/20 pb-4 mb-6">
                       <h3 className="text-3xl font-black uppercase tracking-tighter">私人資訊</h3>
                       <span className="text-[10px] bg-white text-black px-2 py-1 font-black uppercase tracking-widest">Private Data</span>
                    </div>
                    {/* 秘密資訊 5 宮格配置 */}
                    <div className="grid grid-cols-2 gap-8">
                       
                       {/* 1. 現金 */}
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">持有現金</div>
                          <div className="text-4xl font-black tracking-tighter text-green-400">${currentTeam.cash}</div>
                       </div>
                       
                       {/* 2. 多吃的水蜜桃 */}
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">額外消費水蜜桃</div>
                          <div className="text-4xl font-black tracking-tighter text-orange-400">{currentTeam.totalExtraPeaches} <span className="text-lg">顆</span></div>
                       </div>
                       
                       {/* 3. 累積休息時數 */}
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">累積休息時數</div>
                          <div className="text-4xl font-black tracking-tighter text-blue-400">{currentTeam.totalRestHours} <span className="text-lg">H R S</span></div>
                       </div>
                       
                       {/* 4. 幸福指數 */}
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">目前幸福指數</div>
                          <div className="text-3xl font-black text-pink-400">{(currentTeam.happiness || 0).toFixed(2)}</div>
                       </div>
                       
                       {/* 5. 當前職位時薪 */}
                       <div>
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">當前職位時薪</div>
                          <div className="text-3xl font-black text-white">
                             ${(() => {
                                 return currentTeam.realJob ? currentTeam.wageRate : "-";
                             })()}
                          <span className="text-lg">/HR</span></div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* 大按鈕區 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <button onClick={() => { setActiveTab("ledger"); setMessage(null); }} className="group relative bg-white border-4 border-black p-8 text-left hover:bg-slate-100 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">查看排名</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">The Ledger / 觀看公開帳本</p>
                    <ArrowUpRight className="absolute top-8 right-8 w-10 h-10 group-hover:scale-110 transition-transform" />
                 </button>
                 <button onClick={() => { setActiveTab("arena"); setMessage(null); }} className="group relative bg-black border-4 border-black p-8 text-left text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-800">
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">前往戰局</h3>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Enter Arena / 執行每日決策</p>
                    <ArrowUpRight className="absolute top-8 right-8 w-10 h-10 group-hover:scale-110 transition-transform" />
                 </button>
              </div>
           </div>
        )}

        {/* ======================= Tab 2: 排名 Ledger ======================= */}
        {activeTab === "ledger" && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              <Leaderboard gameState={gameState} />
           </div>
        )}

        {/* ======================= Tab 3: 戰局 Arena ======================= */}
        {activeTab === "arena" && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              {renderArenaPhase()}
           </div>
        )}
      </main>
    </div>
  );
}

// 共用的小元件：等待畫面
function WaitingPanel({ message }: { message: string }) {
  return (
    <section className="bg-zinc-900 border-4 border-black p-12 text-center space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px]">
       <div className="w-16 h-16 border-4 border-t-white border-zinc-700 rounded-full animate-spin"></div>
       <div>
           <h3 className="text-3xl font-black uppercase text-white tracking-widest">STANDBY</h3>
           <p className="text-zinc-400 font-bold mt-2">{message}</p>
       </div>
    </section>
  );
}