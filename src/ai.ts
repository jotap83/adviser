import { extractBriefing } from "./domain.mjs";
import type { AIResult } from "./types";
// Contract kept independent from UI. Production implementations run server-side.
export interface BriefingAI {
  organize(text: string): Promise<AIResult>;
}
export class DemoBriefingAI implements BriefingAI {
  constructor(private offline = false) {}
  async organize(text: string): Promise<AIResult> {
    await new Promise((r) => setTimeout(r, 850));
    if (this.offline)
      throw new Error(
        "A IA está indisponível nesta simulação. Seu texto foi preservado. Preencha o briefing manualmente ou tente novamente.",
      );
    if (text.trim().length < 20)
      throw new Error(
        "Inclua mais detalhes na mensagem antes de organizar o briefing.",
      );
    return extractBriefing(text);
  }
}
