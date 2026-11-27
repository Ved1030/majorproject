import RecommendedToolCard from "@/components/recommendations/RecommendedToolCard";
import { RECOMMENDATION_COUNT, getRecommendedTools } from "@/utils/toolRecommendations";

export interface RecommendedToolsProps {
  toolId: string;
  limit?: number;
}

export default function RecommendedTools({
  toolId,
  limit = RECOMMENDATION_COUNT,
}: RecommendedToolsProps) {
  const tools = getRecommendedTools(toolId, limit);
  if (tools.length === 0) return null;

  return (
    <section className="zd-recommendations" aria-labelledby="recommended-tools-heading">
      <div className="zd-rec-heading">
        <h2 id="recommended-tools-heading">Recommended Tools</h2>
        <p>Continue working with your files using these related tools.</p>
      </div>
      <div className="zd-rec-grid">
        {tools.map((tool) => (
          <RecommendedToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
