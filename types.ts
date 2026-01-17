
export type ShotStrategy = '首帧' | '尾帧';
export type SceneNature = '战斗状态' | '平时状态';
export type DurationMode = '6s' | '10s';

export interface ShotData {
  id: number;
  predicted_strategy: ShotStrategy;
  user_override_strategy?: ShotStrategy;
  scene_nature: SceneNature;
  user_override_nature?: SceneNature;
  duration_mode: DurationMode;
  user_override_duration_mode?: DurationMode;
  reasoning: string;
  narrative_context: string; // 新增：小说原文中的剧情连接点
  prompt: string;
  isUpdating: boolean;
}

export interface AnalysisResponse {
  shots: ShotData[];
}

export interface SingleShotResponse {
  predicted_strategy: ShotStrategy;
  scene_nature: SceneNature;
  reasoning: string;
  narrative_context: string;
  prompt: string;
}
