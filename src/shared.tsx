// src/shared.tsx
import { cn } from "./lib/utils";

// 1. 型別定義 (完全與後端對齊，徹底消滅幽靈參照)
export interface Team {
  id: string;
  name: string;
  isRenamed: boolean;
  pin: string;

  publicRank: number;
  previousRank: number;
  realVictory: number;
  publicVictory: number;
  previousVictory: number;
  realJob: string | null;
  publicJob: string | null;

  cash: number;
  alpha: number;
  happiness: number;
  totalRestHours: number;
  totalExtraPeaches: number;
  wageRate: number; 
  slaughterDonation: number;

  actionProgress:  "BEGINNING" | "JOBed" | "APed" | "PARASITED" | "CONSUMED" | "REPORTED" | "RESIGNED" | "DONATED";
  todayRest: number;
  workHours: number;
  licenseProgress: Record<string, number>;
  greedAmount: number;
  reportedTargetId: string | null;
  reportResult: any | null; 
  isDead: boolean; // 💡 新增的死亡標記
}

export interface GameState {
  currentDay: number; 
  phase: "JOB_HUNTING" | "EARN_AND_SPEND" | "AP_ALLOCATION" | "PARASITE" | "REPORT" | "RESIGN" | "SLAUGHTER" | "ENDING";
  bailoutPool: number; 
  bailoutRequirement: number;
  lastSlaughterVictimName: string | null;
  lastSlaughterOutcome: "FAILED" | "SUCCEEDED" | null;
  teams: Team[]; 
  jobApplications: Record<string, string[]>;
  peachPrice: number;
}

// 2. 常數設定
export const JOB_CONFIG: Record<string, any> = {
  GARDENER: { name: "園丁", enName: "Gardener", apCost: 5, description: "親近大地，在繁茂的莊園中維持秩序。" },
  BUTLER: { name: "管家", enName: "Butler", apCost: 6, description: "大宅的心臟，維持精英生活的體面與無暇。" },
  DRIVER: { name: "司機", enName: "Driver", apCost: 8, description: "穿梭都市繁華，精英階層不可或缺的移動延伸。" },
  TUTOR: { name: "家教", enName: "Tutor", apCost: 10, description: "傳播知識，指導下一代的精英種子。" },
};

export const JOB_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  GARDENER: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", label: "text-green-500" },
  BUTLER: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", label: "text-red-500" },
  DRIVER: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-900", label: "text-yellow-500" },
  TUTOR: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", label: "text-blue-500" },
};

export const SALARY_TABLE: Record<string, number[]> = {
  GARDENER: [190, 180, 160, 130, 100, 70, 70, 70, 70, 70],
  BUTLER: [220, 200, 170, 130, 90, 50, 50, 50, 50, 50],
  DRIVER: [260, 230, 190, 140, 90, 40, 40, 40, 40, 40],
  TUTOR: [320, 270, 210, 140, 80, 20, 20, 20, 20, 20],
};

// 3. UI 對應與共用元件
export const IMAGE_MAP: Record<string, string> = {
  GARDENER: "/gardener.png", BUTLER: "/housekeeper.png", DRIVER: "/driver.png",
  TUTOR: "/tutor.png", PIZZA: "/pizza.png", REST: "/sleep.png", SKILL: "/clock.png"
};

export const CustomIcon = ({ type, className = "w-8 h-8", draggable = false, onDragStart }: { type: string; className?: string; draggable?: boolean; onDragStart?: (e: React.DragEvent) => void }) => {
  return (
    <div draggable={draggable} onDragStart={onDragStart} className={cn("relative flex items-center justify-center select-none transition-transform", draggable ? "cursor-grab active:cursor-grabbing hover:scale-110" : "cursor-default", className)}>
      <img src={IMAGE_MAP[type] || IMAGE_MAP.SKILL} alt={type} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </div>
  );
};