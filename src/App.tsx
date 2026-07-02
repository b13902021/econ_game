// src/App.tsx
import { useState, useEffect } from "react";
import { LogIn, User, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./lib/utils";

// 引入我們剛才拆分好的兩大核心入口
import Dashboard from "./views/Dashboard";
import AdminPanel from "./views/AdminPanel";
// 引入共用的型別 (見下方注意事項)
import { GameState } from "./shared"; 

type Role = "team" | "admin" | null;

export default function App() {
  const [role, setRole] = useState<Role>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [loginName, setLoginName] = useState("");
  const [loginPin, setLoginPin] = useState("");

  // ==========================================
  // 全域狀態獲取與輪詢 (Polling)
  // ==========================================
  const fetchGameState = async () => {
    try {
      const url = role === "admin" 
        ? `/api/game-state?isAdmin=true` 
        : (teamId && role === "team" ? `/api/game-state?teamId=${teamId}` : "/api/game-state");
      
      const res = await fetch(url);
      if (res.ok) {
         const data = await res.json();
         setGameState(data);
      }
    } catch (err) { 
      console.error("狀態更新失敗", err); 
    }
  };

  // 只有在登入後，才開始每 3 秒跟伺服器要一次最新資料
  useEffect(() => {
    if (role) {
        fetchGameState();
        const interval = setInterval(fetchGameState, 3000);
        return () => clearInterval(interval);
    }
  }, [role, teamId]);

  // ==========================================
  // 登入與登出處理
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/login", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ name: loginName, pin: loginPin }) 
      });
      const data = await res.json();
      if (res.ok) {
        setRole(data.role); 
        setTeamId(data.teamId || null); 
        setMessage(null);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) { 
        setMessage({ text: "連線失敗，請確認伺服器是否啟動", type: "error" }); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleLogout = () => {
     setRole(null);
     setTeamId(null);
     setGameState(null);
     setMessage(null);
     setLoginName("");
     setLoginPin("");
  };

  // ==========================================
  // 畫面路由 (Router)
  // ==========================================
  
  // 1. 尚未登入：顯示登入畫面
  if (!role) {
    return (
      <div className="min-h-screen flex bg-white font-sans overflow-hidden">
        <div className="hidden lg:flex w-1/2 bg-black text-white p-16 flex-col justify-between select-none">
          <div className="space-y-6">
             <div className="text-xs tracking-[0.4em] uppercase opacity-50">Enterprise Strategy v2.0</div>
             <h1 className="text-[120px] font-black leading-[0.85] tracking-tighter uppercase">Parasite<br/>Elite</h1>
          </div>
          <div className="space-y-8">
            <p className="text-xl opacity-80 max-w-sm leading-relaxed font-light">Experience the brutal reality of social mobility and strategic resource management.</p>
            <div className="flex gap-8 text-[10px] tracking-widest uppercase opacity-40">
               <span className="border-b border-white/20 pb-1">2026 NTUECON CAMP</span>
               <span className="border-b border-white/20 pb-1">GAME SYSTEM v2</span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-12">
            <div className="space-y-3 text-center lg:text-left"><h2 className="text-4xl font-black tracking-tighter uppercase">歡迎登入</h2><p className="text-slate-400 font-medium">請輸入您的帳號密碼以開始競爭</p></div>
            <form onSubmit={handleLogin} className="space-y-10">
              <div className="space-y-8">
                <div className="relative border-b-2 border-slate-100 focus-within:border-black transition-colors py-2"><label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Account / 隊名</label><div className="flex items-center gap-3"><User className="w-5 h-5 text-slate-300" /><input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)} className="w-full bg-transparent border-none outline-none text-xl placeholder:text-slate-200 font-bold" placeholder="Admin or Team Name" required /></div></div>
                <div className="relative border-b-2 border-slate-100 focus-within:border-black transition-colors py-2"><label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Password / 密碼</label><div className="flex items-center gap-3"><LogIn className="w-5 h-5 text-slate-300" /><input type="password" value={loginPin} onChange={(e) => setLoginPin(e.target.value)} className="w-full bg-transparent border-none outline-none text-xl placeholder:text-slate-200 font-bold tracking-widest" placeholder="••••••••" required /></div></div>
              </div>
              {message && (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("p-4 rounded-lg text-sm font-bold flex items-center gap-3", message.type === "error" ? "bg-red-50 text-red-600" : "bg-black text-white")}><AlertCircle className="w-5 h-5" />{message.text}</motion.div>)}
              <button type="submit" disabled={loading} className="w-full bg-black text-white py-6 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-2xl disabled:opacity-50 active:scale-[0.98]">{loading ? "AUTHENTICATING..." : "Enter the Arena"}</button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. 登入後，等待狀態從伺服器載入
  if (!gameState) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-2xl font-black uppercase tracking-widest animate-pulse">載入中 / Synchronizing Data...</div>;
  }

  // 3. 已登入：管理員面板
  if (role === "admin") {
     return (
        <div className="min-h-screen bg-slate-100">
           <div className="bg-black text-white p-2 px-6 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Administrator</span>
              <button onClick={handleLogout} className="text-xs font-bold hover:text-red-400 transition-colors uppercase tracking-widest">Logout / 登出</button>
           </div>
           <AdminPanel gameState={gameState} fetchGameState={fetchGameState} />
        </div>
     );
  }

  // 4. 已登入：玩家小隊主控台
  const currentTeam = gameState.teams.find(t => t.id === teamId);
  if (role === "team" && currentTeam) {
     return (
        <Dashboard 
           currentTeam={currentTeam} 
           gameState={gameState} 
           fetchGameState={fetchGameState} 
           message={message} 
           setMessage={setMessage} 
           onLogout={handleLogout} 
        />
     );
  }

  return null;
}