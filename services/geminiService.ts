
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ShotStrategy, ShotData, SingleShotResponse, SceneNature, DurationMode } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeFullGrid = async (imageBase64: string, novelText: string, durationMode: DurationMode, styleAnchor: string): Promise<ShotData[]> => {
  const ai = getAIClient();
  
  const promptText = `
    任务：将这组3x3九宫格分镜解析为一个【连续的9镜头故事序列】。
    
    【小说参考脚本】：
    """
    ${novelText}
    """
    
    【核心要求】：
    1. **连续性推理**：根据小说情节，推导 1 号到 9 号分镜的动作演进逻辑。Prompt 必须体现出动作的连贯性和上下文呼应。
    2. **强制稳定性策略**：视觉上只要无法看清正脸（如背影、远景），一律强制设为【尾帧驱动】并在 reasoning 中说明原因。
    3. **动态指令**：为每一格生成具备高度叙事感的视频提示词，末尾统一追加风格："""${styleAnchor}"""。
    
    请输出 9 个分镜的 JSON 数据。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } },
        { text: promptText }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                scene_nature: { type: Type.STRING },
                predicted_strategy: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                narrative_context: { type: Type.STRING },
                prompt: { type: Type.STRING }
              },
              required: ["id", "scene_nature", "predicted_strategy", "reasoning", "narrative_context", "prompt"]
            }
          }
        },
        required: ["shots"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return (data.shots || []).map((shot: any) => ({
    ...shot,
    isUpdating: false,
    duration_mode: durationMode
  }));
};

export const refreshSingleShot = async (
  imageBase64: string, 
  novelText: string, 
  shotId: number, 
  targetStrategy: ShotStrategy,
  targetNature: SceneNature,
  durationMode: DurationMode,
  styleAnchor: string
): Promise<SingleShotResponse> => {
  const ai = getAIClient();

  const promptText = `
    针对连续序列中的第 #${shotId} 个分镜进行局部重构。
    必须参考前后文逻辑："""${novelText}"""
    
    强制参数：
    - 策略：【${targetStrategy}驱动】
    - 状态：【${targetNature}】
    
    请在保持全序列叙事连贯的基础上，重新生成该分镜的指令。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } },
        { text: promptText }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scene_nature: { type: Type.STRING },
          predicted_strategy: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          narrative_context: { type: Type.STRING },
          prompt: { type: Type.STRING }
        },
        required: ["scene_nature", "predicted_strategy", "reasoning", "narrative_context", "prompt"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
