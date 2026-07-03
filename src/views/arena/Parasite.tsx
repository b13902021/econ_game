// src/views/arena/Parasite.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Team, GameState } from "../../shared";

interface ParasiteProps {
  currentTeam: Team;
  gameState: GameState;
  fetchGameState: () => void;
  setMessage: (msg: any) => void;
}

const getTheme = (jobId: string | null) => {
  switch (jobId) {
    case "GARDENER": return { border: "border-green-600", text: "text-green-700", light: "bg-green-50", dark: "bg-green-900", borderDark: "border-green-900" };
    case "BUTLER": return { border: "border-red-600", text: "text-red-700", light: "bg-red-50", dark: "bg-red-900", borderDark: "border-red-900" };
    case "DRIVER": return { border: "border-yellow-500", text: "text-yellow-700", light: "bg-yellow-50", dark: "bg-yellow-900", borderDark: "border-yellow-900" };
    case "TUTOR": return { border: "border-blue-600", text: "text-blue-700", light: "bg-blue-50", dark: "bg-blue-900", borderDark: "border-blue-900" };
    default: return { border: "border-slate-400", text: "text-slate-500", light: "bg-slate-50", dark: "bg-slate-800", borderDark: "border-slate-800" };
  }
};

//*
const getJobStory = (jobId: string | null) => {
  switch (jobId) {
    case "GARDENER":
      return "你是一名在朴家工作的園丁。在朴家前院的花園裡，有一個裝滿園藝器具的老舊倉庫。工作一陣子後，你發現根本沒有其他人會經過這個倉庫，於是起了想賺外快的歹念。你可以選擇偷走值多少錢的器具拿去賣；可選擇 0 至你今日總薪水等值之間的任意數目，這些錢將私吞並成為資產的一部分；當然，也須承擔被檢舉的風險。";
    case "BUTLER":
      return "你是一名在朴家工作的管家。每天朴先生都會發給你固定的買菜錢。然而，你發現朴先生因工作忙碌好像不太關心物價，總是塞給你超出買菜所需的金額，也不看收據。今天買菜前你又拿到一大疊鈔票，你開始思考是否可以拿走一些作為自己的買菜錢；可選擇 0 至你今日總薪水等值之間的任意數目，並承擔被檢舉的風險。";
    case "TUTOR":
      return "你是一名在朴家工作的家教，朴先生的高中生孩子在學校過著充滿課業與人際壓力的生活，年齡相仿的你是他生活中唯一可以依靠的大哥哥/大姊姊，於是他總是找你訴苦。有次你幫他解題時，他牽起你的手說喜歡你。面對突如其來的告白，你雖然對他沒有感覺，卻開始覬覦起他所擁有的豪華物質生活。你可以讓他送禮物來表達心意，並偷偷賣掉禮物當作外快；禮物價格由你決定，可選擇 0 至你今日總薪水等值之間的任意數目，並承擔被檢舉的風險。";
    case "DRIVER":
      return "你是一名在朴家工作的司機。作為一個沒有安全感的有錢人，朴老闆要求你每次工作開始前都要先把車子的油加滿，但你報帳幾次後發現老闆好像沒有在看收據，完全相信你講的油錢價格。今天你又去加油了，你要選擇比實際價格多報多少油錢呢？可選擇 0 至你今日總薪水等值之間的任意數目，這些錢將私吞並成為資產的一部分；當然，也須承擔被其他朴家工人檢舉的風險。";
    default:
      return "這是一個讓你衡量貪婪與風險的階段。你可以選擇浮報金額，獲得額外現金，但也會承擔被檢舉的風險。";
  }
};

export default function Parasite({ currentTeam, gameState, fetchGameState, setMessage }: ParasiteProps) {
  const theme = getTheme(currentTeam.realJob);
  //*
  const story = getJobStory(currentTeam.realJob);
  const [multiplier, setMultiplier] = useState(0.0);
  
  const hasRealJob = currentTeam.realJob !== null;

  // 1. 底薪只算正職
  const baseSalary = hasRealJob ? (currentTeam.workHours * currentTeam.wageRate) : 0;

  // 2. 預覽髒錢與總現金
  const greedAmount = Math.round(baseSalary * multiplier);
  const derivedCash = currentTeam.cash + greedAmount;
  
  // 3. 預估勝利值
  const derivedHappiness = Math.sqrt(currentTeam.totalExtraPeaches) + Math.sqrt(currentTeam.totalRestHours);
  const derivedVictory = currentTeam.alpha * derivedHappiness * derivedCash;

  const handleParasite = async (forceSkip: boolean = false) => {
    try {
      const res = await fetch("/api/action/parasite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            teamId: currentTeam.id, 
            multiplier: forceSkip ? 0 : multiplier 
        })
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

  // ==========================================
  // 無業狀態 UI (直接略過)
  // ==========================================
  if (!hasRealJob) {
      return (
        <section className="bg-slate-100 border-4 border-slate-300 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
          <div className="border-b-4 border-slate-300 pb-4">
             <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-500">Underground</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第二階段：浮報薪水決策</p>
          </div>
          <div className="bg-slate-200 border-4 border-slate-300 p-12 text-center space-y-4">
              <h4 className="text-2xl font-black text-slate-500 uppercase tracking-widest">無業狀態</h4>
              <p className="font-bold text-slate-500">浮報薪水為企業員工的專屬特權，您目前沒有正職身分，無法參與此階段。</p>
          </div>
          <div className="pt-4">
             <button 
                onClick={() => handleParasite(true)} 
                className="w-full py-6 bg-black text-white font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-zinc-800"
             >
                確認並進入下一步
             </button>
          </div>
        </section>
      );
  }

  // ==========================================
  // 正常從業人員 UI
  // ==========================================
  return (
    <section className={cn("bg-white border-4 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8", theme.border)}>
      <div className={cn("border-b-4 pb-4", theme.border)}>
         <h3 className={cn("text-4xl font-black uppercase tracking-tighter", theme.text)}>Underground</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">第二階段：浮報薪水決策</p>
      </div>
      
      //*
      <div className={cn("rounded-3xl border-4 p-6 shadow-inner", theme.light, theme.border)}>
         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
           <div>
             <p className="text-xs uppercase tracking-[0.35em] text-slate-500">寄生情境</p>
             <h4 className={cn("mt-2 text-2xl font-black tracking-tight", theme.text)}>{currentTeam.realJob ? currentTeam.realJob : "職業劇情"}</h4>
           </div>
           <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">{currentTeam.realJob ? currentTeam.realJob : "一般"}</span>
         </div>
         <p className="mt-4 text-sm leading-7 text-slate-700">{story}</p>
      </div>

      <div className={cn("border-4 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-white", theme.dark, theme.borderDark)}>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">合法薪資</div>
             <div className="text-2xl font-black tracking-tighter">${baseSalary}</div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">髒錢總額</div>
             <div className={cn("text-2xl font-black tracking-tighter", greedAmount > 0 ? "text-red-400" : "text-white/30")}>
                + ${greedAmount}
             </div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">目前幸福指數</div>
             <div className="text-2xl font-black tracking-tighter text-white/80">
                {derivedHappiness.toFixed(2)}
             </div>
         </div>
         <div>
             <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">人生勝利值</div>
             <div className="text-2xl font-black tracking-tighter">{derivedVictory.toFixed(0)}</div>
         </div>
      </div>

      <div className="p-8 bg-red-50 border-4 border-red-300 space-y-8">
         <div className="space-y-2">
             <p className="font-black text-xl text-red-800 flex items-center gap-2">
                ⚠️ 貪婪的代價與誘惑
             </p>
             <p className="font-bold text-red-700 text-sm">
                您可以利用職務之便，選擇浮報薪水以獲得鉅額的現金。<br/>
                但請注意：若今日結算時被同業檢舉，您將<span className="text-red-900 bg-red-200 px-1 font-black">失去所有浮報所得</span>，並額外被扣除合法薪資的 <span className="text-red-900 bg-red-200 px-1 font-black">20%</span> 作為賠償。
             </p>
         </div>
         
         <div className="space-y-6 bg-white p-6 border-2 border-dashed border-red-400">
            <div className="flex justify-between items-end">
               <span className="font-black uppercase text-sm tracking-widest text-slate-500">滑動選擇浮報比例</span>
               <span className="text-4xl font-black text-red-600">{(multiplier * 100).toFixed(0)}%</span>
            </div>
            
            <input 
                type="range" min="0" max="1" step="0.05" 
                value={multiplier} 
                onChange={(e) => setMultiplier(Number(e.target.value))} 
                className="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" 
            />
            
            <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>0% (安分守己)</span>
                <span>50%</span>
                <span className="text-red-500">100% (極高風險)</span>
            </div>
         </div>

         <div className="pt-4">
            <button 
                onClick={() => handleParasite(false)} 
                className={cn(
                    "w-full py-6 font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                    multiplier === 0 
                        ? "bg-white border-4 border-black text-black hover:bg-slate-100" 
                        : "bg-red-600 border-4 border-red-900 text-white hover:bg-red-700"
                )}
            >
               {multiplier === 0 ? "放棄浮報，進入下一步" : `確認風險並執行浮報 (${(multiplier * 100).toFixed(0)}%)`}
            </button>
         </div>
      </div>
    </section>
  );
}