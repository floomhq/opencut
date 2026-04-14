/**
 * CLI: run the AI visual planner on ai-engineer-basics and print the result.
 * Usage: GEMINI_API_KEY=xxx npx ts-node src/cli/run-visual-plan.ts
 */
import { generateVisualPlan } from "../ai/visual-planner";
import { SUBTITLE_SEGMENTS } from "../examples/ai-engineer-basics/subtitles";
import { TIMELINE } from "../examples/ai-engineer-basics/timeline";

(async () => {
  console.error("Running visual planner...");
  const injections = await generateVisualPlan(SUBTITLE_SEGMENTS, TIMELINE);
  console.log(JSON.stringify(injections, null, 2));
  console.error(`Done. ${injections.length} injections.`);
})();
