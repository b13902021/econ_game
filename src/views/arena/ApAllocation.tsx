// src/views/arena/ApAllocation.tsx
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Team, GameState, JOB_CONFIG, IMAGE_MAP, CustomIcon } from "../../shared";

interface ApAllocationProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

const getTheme = (jobId: string | null) => {
  switch (jobId) {
    case "GARDENER": return { border: "border-green-600", bg: "bg-green-600", text: "text-green-700", light: "bg-green-50", hover: "hover:bg-green-700" };
    case "BUTLER": return { border: "border-red-600", bg: "bg-red-600", text: "text-red-700", light: "bg-red-50", hover: "hover:bg-red-700" };
    case "DRIVER": return { border: "border-yellow-500", bg: "bg-yellow-500", text: "text-yellow-700", light: "bg-yellow-50", hover: "hover:bg-yellow-600" };
    case "TUTOR": return { border: "border-blue-600", bg: "bg-blue-600", text: "text-blue-700", light: "bg-blue-50", hover: "hover:bg-blue-700" };
    default: return { border: "border-black", bg: "bg-black", text: "text-black", light: "bg-slate-50", hover: "hover:bg-zinc-800" };
  }
};

export default function ApAllocation({ currentTeam, gameState, fetchGameState, setMessage }: ApAllocationProps) {
  const theme = getTheme(currentTeam.realJob);

  // 本地狀態：預設 AP 固定為 16 點
  const [localAp, setLocalAp] = useState({
    rest: 16,
    pizza: 0,
    work: 0,
    skills: { GARDENER: 0, BUTLER: 0, DRIVER: 0, TUTOR: 0 } as Record<string, number>
  });

  useEffect(() => {
    // 防呆：只要回到 STANDBY，或本地加總不等於 16，強制重置
    const totalLocal = localAp.rest + localAp.pizza + localAp.work + Object.values(localAp.skills).reduce((a, b) => a + b, 0);
    if (currentTeam.actionProgress === "BEGINNING" || totalLocal !== 16) {
       setLocalAp({
          rest: 16, 
          pizza: 0,
          work: 0,
          skills: { GARDENER: 0, BUTLER: 0, DRIVER: 0, TUTOR: 0 }
       });
    }
  }, [currentTeam.actionProgress, gameState.currentDay]);

  const pizzaEarn = localAp.pizza * 150;
  const workRate = currentTeam.realJob ? (currentTeam.wageRate || 0) : 0; 
  const workEarn = localAp.work >= 8 ? localAp.work * workRate : 0;
  
  const derivedCash = currentTeam.cash + pizzaEarn + workEarn;
  const derivedHappiness = Math.sqrt(currentTeam.totalExtraPeaches) + Math.sqrt(currentTeam.totalRestHours + localAp.rest);
  const derivedVictory = currentTeam.alpha * derivedHappiness * derivedCash;

  const moveApLocally = (source: string, dest: string) => {
     if (source === dest) return;
     setLocalAp(prev => {
        // 創造一個新的記憶體參照，避免直接污染原來的 state
        const next = { ...prev, skills: { ...prev.skills } };
        function add(str: string, value: number): number {
            if(str === "work" && !currentTeam.realJob)
                  return -1;
            if (str.startsWith("skill-")) {
               let jobId = str.slice(6); 
               const locked = currentTeam.licenseProgress?.[jobId] || 0;
               if (next.skills[jobId] + value < 0 || locked + next.skills[jobId] + value > JOB_CONFIG[jobId].apCost) {
                  return -1;
               }
               next.skills[jobId] += value;
            } else {
               if ((next as any)[str] + value < 0) {
                   return -1;
               }
               (next as any)[str] += value;
            }
            return 0;
        }
        
        // 確保扣除與增加都合法，否則「整筆交易退回」
        if (add(source, -1) < 0 || add(dest, 1) < 0) {
            return prev; 
        }
        return next;
     });
     setMessage(null);
  };

  const handleDragStart = (e: React.DragEvent, sourceZone: string) => { e.dataTransfer.setData("sourceZone", sourceZone); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, destZone: string) => {
    e.preventDefault();
    const sourceZone = e.dataTransfer.getData("sourceZone");
    if (sourceZone) moveApLocally(sourceZone, destZone);
  };

  const handleSubmitAp = async () => {
     // 🚨 嚴格防呆：如果有正職，不能放 0 AP，且必須大於等於 8 AP
     if (currentTeam.realJob && localAp.work < 8) {
         alert("您必須至少工作8小時，嚴禁混水摸魚")
        
        return;
     }
     try {
       const res = await fetch("/api/action/submit-ap", { 
           method: "POST", 
           headers: { "Content-Type": "application/json" }, 
           body: JSON.stringify({ teamId: currentTeam.id, rest: localAp.rest, pizza: localAp.pizza, work: localAp.work, skills: localAp.skills }) 
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
    <section className={cn("border-4 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8 bg-white", theme.border)}>
      <div className={cn("border-b-4 pb-4", theme.border)}>
         <h3 className={cn("text-4xl font-black uppercase tracking-tighter", theme.text)}>AP Allocation</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第一階段：分配您的行動點數 (共 16 點)</p>
      </div>

      {/* 預覽資訊面板 */}
      <div className={cn("border-4 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center", theme.light, theme.border)}>
         <div>
             <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", theme.text)}>
                結算後現金
             </div>
             <div className={cn("text-3xl font-black tracking-tighter", theme.text)}>
                ${derivedCash}
             </div>
         </div>
         
         <div>
             <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", theme.text)}>
                預覽幸福指數
             </div>
             <div className={cn("text-3xl font-black tracking-tighter", theme.text)}>
                {derivedHappiness.toFixed(2)}
             </div>
         </div>
         
         <div>
             <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", theme.text)}>
                預覽人生勝利值
             </div>
             <div className={cn("text-3xl font-black tracking-tighter", theme.text)}>
                {derivedVictory.toFixed(0)}
             </div>
         </div>
      </div>
      
      <div className="space-y-6">
         <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "rest")} className={cn("border-4 p-4 shadow-sm", theme.light, theme.border)}>
            <div className="flex justify-between items-center mb-3">
                <span className={cn("text-lg font-black uppercase flex items-center gap-2", theme.text)}><img src={IMAGE_MAP.REST} className="w-5 h-5"/>休息區 ({localAp.rest} AP)</span>
            </div>
            <div className={cn("min-h-20 flex flex-wrap gap-2 p-4 bg-white border-2 border-dashed", theme.border)}>
               {Array.from({ length: localAp.rest }).map((_, i) => (
                  <CustomIcon type="REST" key={`rest-${i}`} draggable onDragStart={(e) => handleDragStart(e, "rest")} className="w-10 h-10 hover:scale-110 transition-transform" />
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "pizza")} className="border-4 border-black p-4 bg-white flex flex-col hover:border-slate-500 transition-colors shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                      <span className="font-black text-lg flex items-center gap-2"><img src={IMAGE_MAP.PIZZA} className="w-5 h-5"/>摺披薩盒</span>
                      <span className="text-xs text-slate-400 font-bold mt-1">$150 / AP</span>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => moveApLocally("pizza", "rest")} className="w-8 h-8 border-2 border-black font-black flex items-center justify-center text-lg bg-slate-100 hover:bg-slate-200 transition-colors">-</button>
                     <button onClick={() => moveApLocally("rest", "pizza")} className="w-8 h-8 border-2 border-black font-black flex items-center justify-center text-lg bg-slate-100 hover:bg-slate-200 transition-colors">+</button>
                  </div>
               </div>
               <div className="flex-1 min-h-[140px] flex flex-wrap gap-2 p-3 bg-slate-50 border border-black/10">
                  {Array.from({ length: localAp.pizza }).map((_, i) => (
                     <CustomIcon type="PIZZA" key={`pizza-${i}`} draggable onDragStart={(e) => handleDragStart(e, "pizza")} className="w-8 h-8 hover:scale-110 transition-transform" />
                  ))}
               </div>
            </div>

            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "work")} className={cn("border-4 p-4 bg-white flex flex-col transition-colors shadow-sm", currentTeam.realJob ? theme.border : "border-slate-300 opacity-50 bg-slate-50")}>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                      <span className={cn("font-black text-lg", currentTeam.realJob ? theme.text : "text-slate-400")}>上班工作</span>
                      {currentTeam.realJob ? (
                          <span className={cn("text-xs font-bold mt-1", theme.text)}>必須投入至少 8 AP | 時薪 ${workRate}</span>
                      ) : (
                          <span className="text-xs text-slate-400 mt-1">無正職資格，無法上班</span>
                      )}
                  </div>
                  {currentTeam.realJob && (
                     <div className="flex gap-1">
                        <button onClick={() => moveApLocally("work", "rest")} className={cn("w-8 h-8 border-2 font-black flex items-center justify-center text-lg transition-colors", theme.border, theme.light, theme.text)}>-</button>
                        <button onClick={() => moveApLocally("rest", "work")} className={cn("w-8 h-8 border-2 font-black flex items-center justify-center text-lg transition-colors", theme.border, theme.light, theme.text)}>+</button>
                     </div>
                  )}
               </div>
               <div className={cn("flex-1 min-h-[140px] flex flex-wrap gap-2 p-3 border", currentTeam.realJob ? theme.light : "bg-slate-100 border-slate-200")}>
                  {currentTeam.realJob && Array.from({ length: localAp.work }).map((_, i) => (
                     <CustomIcon type={currentTeam.realJob!} key={`work-${i}`} draggable onDragStart={(e) => handleDragStart(e, "work")} className="w-8 h-8 hover:scale-110 transition-transform" />
                  ))}
               </div>
            </div>
         </div>

         <div className="border-4 border-black p-6 bg-white space-y-4 flex flex-col shadow-sm">
            <span className="font-black text-lg flex items-center gap-2"><img src={IMAGE_MAP.SKILL} className="w-5 h-5"/>執照考取進度</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.entries(JOB_CONFIG).map(([key, config]: [any, any]) => {
                  const locked = currentTeam.licenseProgress?.[key] || 0;
                  const pending = localAp.skills[key] || 0;
                  const progress = locked + pending;
                  return (
                     <div key={key} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, `skill-${key}`)} className="p-4 bg-slate-50 border-2 border-slate-200 hover:border-slate-400 transition-colors flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-sm font-black uppercase tracking-widest">{config.name} ({progress}/{config.apCost})</span>
                           <div className="flex gap-1">
                              <button onClick={() => moveApLocally(`skill-${key}`, "rest")} className="w-6 h-6 border-2 border-black text-sm font-black flex items-center justify-center bg-white hover:bg-slate-200 transition-colors">-</button>
                              <button onClick={() => moveApLocally("rest", `skill-${key}`)} className="w-6 h-6 border-2 border-black text-sm font-black flex items-center justify-center bg-white hover:bg-slate-200 transition-colors">+</button>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           {Array.from({ length: locked }).map((_, i) => <div key={`lk-${i}`} className="w-6 h-6 opacity-30 grayscale"><CustomIcon type="SKILL" className="w-full h-full"/></div>)}
                           {Array.from({ length: pending }).map((_, i) => <CustomIcon type="SKILL" key={`pd-${i}`} draggable onDragStart={(e) => handleDragStart(e, `skill-${key}`)} className="w-6 h-6 hover:scale-110 transition-transform" />)}
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>
      </div>

      <div className={cn("pt-8 border-t-4 border-dashed", theme.border)}>
         <button onClick={handleSubmitAp} className={cn("w-full py-6 text-white text-xl font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all", theme.bg, theme.hover)}>
            確認 AP 投入並結算薪水
         </button>
      </div>
    </section>
  );
}