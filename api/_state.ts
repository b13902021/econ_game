// server/state.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws"; // 💡 加回來！本地端需要它

dotenv.config();

// ==========================================
// 1. 型別與常數定義
// ==========================================
export interface Team {
  id: string;
  name: string; //
  isRenamed: boolean;
  pin: string;

  // 排名資訊
  publicRank: number; //
  previousRank: number;
  realVictory: number; //
  publicVictory: number; 
  previousVictory: number; 
  realJob: string | null; //
  publicJob: string | null;
  isDead: boolean; //

  // 私有資訊
  cash: number; //
  alpha: number;
  happiness: number; //
  totalRestHours: number; //
  totalExtraPeaches: number; //
  wageRate: number; //
  slaughterDonation: number; //

  // 決策與進度
  actionProgress: "BEGINNING" | "JOBed" | "APed" | "PARASITED" | "CONSUMED" | "REPORTED" | "RESIGNED" | "DONATED"; //
  todayRest: number; //
  workHours: number;
  licenseProgress: Record<string, number>;
  greedAmount: number; //
  reportedTargetId: string | null; //
  reportResult: any | null;
}

export interface GameState {
  currentDay: number; 
  phase: "JOB_HUNTING" | "EARN_AND_SPEND" | "AP_ALLOCATION" | "PARASITE" | "REPORT" | "RESIGN" | "SLAUGHTER" | "ENDING"; 
  teams: Team[];
  bailoutPool: number;
  bailoutRequirement: number;
  jobApplications: Record<string, string[]>;
  peachPrice: number;
}

export const PEACH_PRICE_TABLE: Record<number, number> = {
  1: 120, 2: 120, 3: 200, 4: 200,
};

export const JOB_CONFIG: any = {
  GARDENER: { name: "園丁", apCost: 5, description: "親近大地，在繁茂的莊園中維持秩序。" },
  BUTLER: { name: "管家", apCost: 6, description: "大宅的心臟，維持精英生活的體面與無暇。" },
  DRIVER: { name: "司機", apCost: 8, description: "穿梭都市繁華，精英階層不可或缺的移動延伸。" },
  TUTOR: { name: "家教", apCost: 10, description: "傳播知識，指導下一代的精英種子。" },
};

export const SALARY_TABLE: Record<string, number[]> = {
  GARDENER: [190, 180, 160, 130, 100, 70, 70, 70, 70, 70],
  BUTLER: [220, 200, 170, 130, 90, 50, 50, 50, 50, 50],
  DRIVER: [260, 230, 190, 140, 90, 40, 40, 40, 40, 40],
  TUTOR: [320, 270, 210, 140, 80, 20, 20, 20, 20, 20],
};

export function getInitialState(): GameState {
  const state: GameState = {
    currentDay: 1, 
    phase: "EARN_AND_SPEND",
    bailoutPool: 0, 
    bailoutRequirement: 0,
    teams: [], 
    jobApplications: {},
    peachPrice: PEACH_PRICE_TABLE[1] || 120,
  };

  // 1. 預先設定好 10 組不同的小隊密碼（可自行修改裡面的值）
  const secretPins = ["AS1723", "JMK1883", "MF1912", "DR1772", "FH1899", "AM1842", "AS1933", "HG1839", "JES1943", "TRM1766"];

  // 2. 初始化 10 支小隊的資料
  state.teams = Array.from({ length: 10 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `${i + 1}小隊`,
    isRenamed: false,
    pin: secretPins[i], // 根據索引值 i 依序取出對應的密碼
    cash: 0,
    publicRank: 1,
    previousRank: -1,
    realVictory: 0,
    publicVictory: 0,
    previousVictory: 0,
    realJob: null,
    publicJob: null,
    alpha: 1,
    happiness: 0,
    totalRestHours: 0,
    totalExtraPeaches: 0,
    wageRate: 0,
    slaughterDonation: 0,
    actionProgress: "BEGINNING",
    todayRest: 0,
    workHours: 0,
    licenseProgress: { GARDENER: 0, BUTLER: 0, DRIVER: 0, TUTOR: 0 },
    greedAmount: 0,
    reportedTargetId: null,
    reportResult: null,
    isDead: false
  }));
  return state;
}

// ==========================================
// 2. 資料庫與狀態同步邏輯 (Mutex 鎖)
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // 告訴 Supabase 這是伺服器環境，不要煩惱登入狀態
  },
  realtime: {
    transport: WebSocket as any // 💡 終極殺招：用 as any 叫 TypeScript 閉嘴，強行把 ws 餵進去！
  }
}) : null;

export let gameState = getInitialState();

class AsyncLock {
  private promise = Promise.resolve();
  acquire(): Promise<() => void> {
    let release = () => {};
    const next = new Promise<void>(resolve => { release = resolve; });
    const current = this.promise.then(() => release);
    this.promise = this.promise.then(() => next);
    return current;
  }
}
const stateLock = new AsyncLock();

async function loadStateFromDB() {
  if (!supabase) return;
  const { data, error } = await supabase.from("parasite_game").select("state").eq("id", 1).maybeSingle();
  const defaultState = getInitialState();

  if (data && data.state) {
    const persistedState = data.state as Partial<GameState> & { teams?: Team[] };
    const mergedTeams = (persistedState.teams || []).map((team: Team) => {
      const fallbackTeam = defaultState.teams.find(t => t.id === team.id) || defaultState.teams[0];
      return {
        ...fallbackTeam,
        ...team,
        id: team.id || fallbackTeam.id,
        name: team.name || fallbackTeam.name,
        pin: fallbackTeam.pin, // 現在它會精準抓到屬於自己小隊的秘密密碼了
      };
    });

    gameState = {
      ...defaultState,
      ...persistedState,
      teams: mergedTeams.length > 0 ? mergedTeams : defaultState.teams,
    };
  } else if (!error) {
    await supabase.from("parasite_game").upsert({ id: 1, state: defaultState });
  }
}

async function saveStateToDB() {
  if (!supabase) return;
  await supabase.from("parasite_game").upsert({ id: 1, state: gameState, updated_at: new Date().toISOString() });
}

export async function withStateLock(req: any, res: any, action: () => Promise<any> | any) {
  const release = await stateLock.acquire();
  try {
    await loadStateFromDB();
    await action();
    await saveStateToDB();
  } catch (error: any) {
    console.error(`🔥 [API 錯誤] 路徑: ${req.path} | 錯誤內容:`, error);
    res.status(500).json({ error: "伺服器處理錯誤" });
  } finally {
    release();
  }
}

// ==========================================
// 3. 遊戲邏輯輔助函式
// ==========================================
export function updateHappiness(team: Team) {
  team.happiness = Math.sqrt(team.totalExtraPeaches) + Math.sqrt(team.totalRestHours);
}

export function updateVictory(team: Team, announce: boolean) {
  team.realVictory = team.alpha * team.happiness * team.cash;
  if (announce) {
    team.publicVictory = team.realVictory;
  }
}

export function getRankedTeams(stateToUpdate: GameState) {
  return [...stateToUpdate.teams].sort((a, b) => {
    if (a.isDead && !b.isDead) return 1;
    if (!a.isDead && b.isDead) return -1;
    return b.publicVictory - a.publicVictory;
  });
}

export function updateRank(stateToUpdate: GameState){
  const rankedTeams = getRankedTeams(stateToUpdate);

  for(let i = 0 ; i < rankedTeams.length; ++i){
    if(i === 0 || rankedTeams[i].publicVictory < rankedTeams[i-1].publicVictory)
        rankedTeams[i].publicRank = i+1;
    else
        rankedTeams[i].publicRank = rankedTeams[i-1].publicRank;
  }
}