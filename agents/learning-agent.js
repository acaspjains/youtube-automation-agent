class LearningAgent {
  constructor(db, credentials) { this.db = db; this.aiService = credentials.aiService; }
  async initialize() { return true; }
  async learnFromVideo(videoId, metrics) {
    const insights = [];
    if (metrics.ctr > 5) insights.push({ metric: 'ctr', value: metrics.ctr, insight: 'High CTR - replicate thumbnail style' });
    if (metrics.views > 10000) insights.push({ metric: 'views', value: metrics.views, insight: 'Viral - analyze topic angle' });
    for (const i of insights) await this.db.saveLearning(videoId, i.metric, i.value, i.insight).catch(() => {});
    return insights;
  }
  async getBestStrategy() {
    try {
      const best = await this.db.getBestStrategies();
      if (best.length === 0 || !this.aiService) return null;
      const topics = best.map(b => b.topic).join(', ');
      const res = await this.aiService.generateText(`Based on these best performing topics: ${topics}\nSuggest next story topic for middle class Indians.\nReturn JSON only: {"topic":"...","angle":"...","reason":"..."}`);
      return JSON.parse(res.replace(/```json|```/g,'').trim());
    } catch(e) { return null; }
  }
  async getInsights() { return this.db.getAllRows('SELECT * FROM learning ORDER BY created_at DESC LIMIT 20').catch(() => []); }
}
module.exports = LearningAgent;
