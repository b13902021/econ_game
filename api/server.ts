// server/server.ts
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import {
  gameState,
  withStateLock,
  updateHappiness,
  updateVictory,
  updateRank,
  getInitialState,
  JOB_CONFIG,
  SALARY_TABLE,
  PEACH_PRICE_TABLE,
  Team
} from "./_state.js";

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cookieParser());

const getCurrentPeachPrice = () => PEACH_PRICE_TABLE[gameState.currentDay] || 120;

const recalculateWageRates = () => {
  const jobCounts: Record<string, number> = {};

  gameState.teams.forEach((team) => {
    if (team.realJob) {
      jobCounts[team.realJob] = (jobCounts[team.realJob] || 0) + 1;
    }
  });

  gameState.teams.forEach((team) => {
    if (!team.realJob) {
      team.wageRate = 0;
      return;
    }

    const count = jobCounts[team.realJob] || 1;
    team.wageRate = SALARY_TABLE[team.realJob]?.[Math.min(count - 1, 9)] || 0;
  });
};

// ==========================================
// 1. 系統與登入
// ==========================================
app.post("/api/login", async (req, res) => {
  withStateLock(req, res, () => {
    const { name, pin } = req.body;
    const team = gameState.teams.find((t) => t.name === name && t.pin === pin);
    if (name === "ADMIN" && (pin === process.env.ADMIN_PIN || pin === "NTUECON")) {
      res.json({ role: "admin", token: "admin-token" });
      return;
    }
    if (team) {
      res.json({ role: "team", teamId: team.id, token: uuidv4() });
      return;
    }
    res.status(401).json({ error: "帳號或密碼錯誤" });
  });
});

app.get("/api/game-state", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, isAdmin } = req.query;
    
    gameState.peachPrice = getCurrentPeachPrice();

    gameState.teams.forEach(t => {
      updateHappiness(t);
      updateVictory(t, false);
    });
    updateRank(gameState);

    if (isAdmin === "true") {
      res.json({ ...gameState, peachPrice: gameState.peachPrice });
      return;
    }
    
    // 玩家視角：過濾掉其他小隊的私有資訊
    const maskedTeams = gameState.teams.map(t => {
      if (t.id === teamId) return { ...t };
      return {
        id: t.id, name: t.name, 
        publicJob: t.publicJob, publicVictory: t.publicVictory,
        publicRank: t.publicRank, previousRank: t.previousRank, previousVictory: t.previousVictory, 
        alpha: t.alpha, isDead: t.isDead
      } as any; //其他小隊的資訊
    });
    res.json({ ...gameState, peachPrice: gameState.peachPrice, teams: maskedTeams });
  });
});

// ==========================================
// 小隊改名 (僅限一次)
// ==========================================
app.post("/api/action/rename", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, newName } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);

    if (!team) return res.status(404).json({ error: "小隊不存在" });
    if (team.isRenamed) return res.status(400).json({ error: "您已經更改過隊名，無法再次修改" });
    
    // 基本防呆驗證
    if (!newName || newName.trim() === "") return res.status(400).json({ error: "隊名不能為空" });
    if (newName.length > 15) return res.status(400).json({ error: "隊名太長了，請保持在 15 字以內" });

    // 更新名稱並鎖定改名權限
    team.name = newName.trim();
    team.isRenamed = true;

    res.json({ success: true, team });
  });
});

// ==========================================
// 2. 玩家行動 API (依狀態機順序)
// ==========================================

// 應徵工作 (合併 apply 與 confirm)
app.post("/api/action/apply-job", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, jobId } = req.body; // jobId 現在只會是 "GARDENER" 等字串，或是 null
    const team = gameState.teams.find(t => t.id === teamId);
    
    if (!team) return res.status(404).json({ error: "小隊不存在" });
    if (gameState.phase !== "JOB_HUNTING") return res.status(400).json({ error: "職業市場已關閉" });
    if (team.actionProgress !== "BEGINNING") return res.status(400).json({ error: "您已確認過應徵志願" });
    
    // 如果 jobId 不是 null，代表他要應徵新職位，執行執照檢查並更新
    if (jobId !== null) {
       const hasLicense = (team.licenseProgress[jobId] || 0) >= JOB_CONFIG[jobId].apCost;
       if (!hasLicense) return res.status(400).json({ error: "缺乏相關執照" });
       
       team.realJob = jobId;
    }
    // 若 jobId 為 null，代表他選擇「放棄求職」或「確認當前職位」，team.realJob 保持不變

    // --- 同步申請名單 (重要：確保計薪邏輯正確) ---
    // 1. 先清除該小隊在所有名單中的舊紀錄
    Object.keys(gameState.jobApplications).forEach(key => {
      gameState.jobApplications[key] = gameState.jobApplications[key].filter(id => id !== teamId);
    });

    // 2. 如果他最終有工作 (不管是新應徵的還是舊的)，都放進工作名單中
    if (team.realJob) {
       if (!gameState.jobApplications[team.realJob]) gameState.jobApplications[team.realJob] = [];
       gameState.jobApplications[team.realJob].push(teamId);
    }

    team.actionProgress = "JOBed";
    res.json({ success: true, team });
  });
});

// 離職 (退 1 休息時數，重置應徵狀態)
app.post("/api/action/resign", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, isToQuit } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);
    if (!team) return res.status(404).json({ error: "小隊不存在" });

    if (isToQuit){
      if(team.todayRest <= 0) return res.status(400).json({ error: "今日休息時數不足，無法辭職" });
      team.realJob = null;
      team.totalRestHours -= 1;
      updateHappiness(team);
      updateVictory(team, false);
    }
    team.actionProgress = "RESIGNED";
    res.json({ success: true, team });
  });
});

// 提交 AP 分配
app.post("/api/action/submit-ap", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, rest, pizza, work, skills } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);
    
    if (!team) return res.status(404).json({ error: "小隊不存在" });
    if (team.actionProgress !== "BEGINNING" && team.actionProgress !== "JOBed") {
        return res.status(400).json({ error: "AP分配已鎖定" });
    }

    let requiredAp = rest + pizza + work;
    Object.values(skills).forEach((val: any) => requiredAp += val);

    if (requiredAp > 16) return res.status(400).json({ error: "分配的 AP 超過 16 上限" });
    if (team.realJob && work < 8) return res.status(400).json({ error: "正職工作至少需要 8 AP" });

    team.cash += pizza * 150;
    if (team.realJob && work >= 8) {
      team.cash += work * team.wageRate;
      team.workHours = work;
    }

    // 💡 直接累加執照進度 (無須 lockedLicenseProgress)
    Object.entries(skills).forEach(([jobId, apInv]: [string, any]) => {
      if (apInv > 0) {
        team.licenseProgress[jobId] = (team.licenseProgress[jobId] || 0) + apInv;
      }
    });
    team.todayRest = rest;
    team.totalRestHours += rest;
    updateHappiness(team);
    updateVictory(team, false);
    updateRank(gameState);


    team.actionProgress = "APed";
    res.json({ success: true, team });
  });
});

// 浮報決定
app.post("/api/action/parasite", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, multiplier } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);
    if (!team) return res.status(404).json({ error: "小隊不存在" });
    if (team.actionProgress !== "APed") return res.status(400).json({ error: "尚未完成AP分配" });

    const baseSalary = team.realJob ? (team.workHours * team.wageRate) : 0;
    team.greedAmount = Math.round(baseSalary * multiplier);
    
    team.actionProgress = "PARASITED";
    res.json({ success: true, team });
  });
});

// 確認水蜜桃消費
app.post("/api/action/confirm-consumption", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, extraPeaches = 0 } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);
    if (!team) return res.status(404).json({ error: "小隊不存在" });
    
    const currentPrice = getCurrentPeachPrice();
    team.cash -= (5 + extraPeaches) * currentPrice; 
    team.totalExtraPeaches += extraPeaches;
    
    updateHappiness(team);
    updateVictory(team, true);
updateRank(gameState);

    
    team.actionProgress = "CONSUMED";
    res.json({ success: true, team });
  });
});

// 登記檢舉
app.post("/api/action/report", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, targetId } = req.body; 
    const team = gameState.teams.find(t => t.id === teamId);
    
    if (!team) return res.status(404).json({ error: "小隊不存在" });
    if (teamId === targetId) return res.status(400).json({ error: "不能檢舉自己" });
    
    if (targetId && targetId !== "NONE") {
        const target = gameState.teams.find(t => t.id === targetId);
        if (team.realJob && target?.realJob !== team.realJob) {
          return res.status(400).json({ error: `您有正職，只能檢舉同職業者` });
        }
    }
    
    team.reportedTargetId = targetId;
    team.actionProgress = "REPORTED";
    res.json({ success: true, message: `檢舉決策已鎖定！` });
  });
});

// 捐獻 (Day 4)
app.post("/api/action/donate", async (req, res) => {
  withStateLock(req, res, () => {
    const { teamId, amount } = req.body;
    const team = gameState.teams.find(t => t.id === teamId);
    if (!team || team.cash < amount) return res.status(400).json({ error: "現金不足" });
    team.cash -= amount;
    team.slaughterDonation = (team.slaughterDonation || 0) + amount;
    gameState.bailoutPool += amount;
    updateVictory(team, false);
    team.actionProgress = "DONATED";
    res.json({ success: true, team });
  });
});

// 屠殺專用 API (九取一隨機淘汰)
app.post("/api/admin/execute-slaughter", async (req, res) => {
  withStateLock(req, res, () => {
    if (gameState.phase !== "SLAUGHTER") return res.status(400).json({ error: "不在屠殺階段" });
    if (gameState.bailoutPool < gameState.bailoutRequirement){
      const lastPlaceRank = gameState.teams.at(-1)?.publicRank;
      const potentialVictims = gameState.teams.filter(t => t.publicRank !== lastPlaceRank);
      const victim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
      victim.isDead = true;
      res.json({ success: true, victimName: victim.name });
    }
    else{
      res.json({ success: true, victimName: null });
    }
    gameState.teams.forEach(team => updateVictory(team, true));
    updateRank(gameState);
    gameState.phase = "ENDING";
  });
});

// ==========================================
// 3. 管理員 API
// ==========================================

// 管理端：開啟AP分配市場 (對應你要求的 open-ap-market)
app.post("/api/admin/open-ap-market", async (req, res) => {
  withStateLock(req, res, () => {
    recalculateWageRates();
    gameState.teams.forEach((team) => {
      team.publicJob = team.realJob;
    });
    gameState.phase = "EARN_AND_SPEND";
    res.json({ success: true, gameState });
  });
});

app.post("/api/admin/open-report", async (req, res) => {
  withStateLock(req, res, () => {
    gameState.phase = "REPORT";
    res.json({ success: true, gameState });
  });
});

// 管理端：結算檢舉
app.post("/api/admin/resolve-report", async (req, res) => {
  withStateLock(req, res, () => {
    const reportedCounts: Record<string, number> = {};
    gameState.teams.forEach(t => {
       if (t.reportedTargetId && t.reportedTargetId !== "NONE") {
          reportedCounts[t.reportedTargetId] = (reportedCounts[t.reportedTargetId] || 0) + 1;
       }
    });

    const getBaseSalary = (t: Team) => t.realJob ? (t.workHours * t.wageRate) : 0;

    gameState.teams.forEach(team => {
       const wasReported = (reportedCounts[team.id] || 0) > 0;
       const myBaseSalary = getBaseSalary(team);
       let activeMsg = "";
       let passiveMsg = "";

       if (team.greedAmount > 0) {
          if (wasReported) {
              let fine = Math.round(myBaseSalary * 0.2);
              team.cash -= fine;
              passiveMsg = `人在做天在看，你被抓獲貪汙！沒收不法所得，並扣除 20% 薪資 $${fine}。`;
          } else {
              team.cash += team.greedAmount;
              passiveMsg = `瞞天過海！成功取得浮報薪資 $${team.greedAmount}。`;
          }
       } else {
          if (wasReported) {
              let claim = Math.round(reportedCounts[team.id] * myBaseSalary * 0.2);
              team.cash += claim;
              passiveMsg = `您無辜被檢舉，清白得以證明！獲得誣告者賠償共 $${claim}。`;
          } else {
              passiveMsg = `安分守己，平安度過一日。`;
          }
       }

       if (team.reportedTargetId && team.reportedTargetId !== "NONE") {
          const targetTeam = gameState.teams.find(t => t.id === team.reportedTargetId);
          if (targetTeam) {
              const targetBaseSalary = getBaseSalary(targetTeam);
              if (targetTeam.greedAmount > 0) {
                  let reward = Math.round((targetBaseSalary * 0.2) / reportedCounts[targetTeam.id]);
                  team.cash += reward;
                  activeMsg = `你抓到了 ${targetTeam.name} 的貪污行為，分得獎金 $${reward}！`;
              } else {
                  let damages = Math.round(targetBaseSalary * 0.2);
                  team.cash -= damages;
                  activeMsg = `你誣告了 ${targetTeam.name}，必須支付賠償金 $${damages}！`;
              }
          }
       }
       updateVictory(team, true);
        updateRank(gameState);

       // 寫入 DB，讓前端明天能看到
       team.reportResult = { message1: passiveMsg, message2: activeMsg };
    });
    if (gameState.currentDay < 4) {
      gameState.phase = "RESIGN";
    } else {
      gameState.phase = "SLAUGHTER";
      const lastPlaceRank = gameState.teams.at(-1)?.publicRank;
      const lastPlaceCount = gameState.teams.filter(t => t.publicRank === lastPlaceRank).length;
      gameState.bailoutRequirement = 500 + 500 * lastPlaceCount;
    }
    res.json({ success: true, phase: gameState.phase });
  });
});


// 換日結算
app.post("/api/admin/next-day", async (req, res) => {
  withStateLock(req, res, () => {
    if (gameState.currentDay >= 4) return res.status(400).json({ error: "遊戲已結束" });
    gameState.teams.forEach(team => {
      team.workHours = 0;
      team.wageRate = 0;
      team.greedAmount = 0;
      team.slaughterDonation = 0;
      team.reportedTargetId = null;
      
      // 💡 換日時清空報告，確保前端不會永遠被卡住
      team.reportResult = null;
      team.actionProgress = "BEGINNING";
      if(team.publicRank <= 3) team.alpha += 0.1;
    });

    gameState.currentDay += 1;
    gameState.jobApplications = {};
    gameState.phase = "JOB_HUNTING";

    gameState.teams.forEach(team => {
      team.previousVictory = team.publicVictory;
      team.previousRank = team.publicRank;
      updateVictory(team, true);
    });
    updateRank(gameState);
    res.json({ success: true, gameState });
  });
});

app.post("/api/admin/reset", async (req, res) => {
  withStateLock(req, res, () => {
    Object.assign(gameState, getInitialState());
    res.json({ success: true, gameState });
  });
});

// 把原本底下的 createViteServer 與 app.use(express.static(...)) 全都刪掉，換成這樣：

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on local port ${PORT}`));
}

export default app;