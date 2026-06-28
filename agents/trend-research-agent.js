const axios = require('axios');
class TrendResearchAgent {
  constructor(db, credentials) { this.db = db; this.aiService = credentials.aiService; }
  async initialize() { return true; }
  async fetchTrends() {
    const topics = [];
    try {
      const ytKey = process.env.YOUTUBE_API_KEY;
      if (ytKey) {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params: { part: 'snippet,statistics', chart: 'mostPopular', regionCode: 'IN', maxResults: 10, key: ytKey, videoCategoryId: '22' } });
        for (const item of (res.data.items || [])) topics.push({ topic: item.snippet.title, source: 'youtube', searchVolume: parseInt(item.statistics.viewCount) || 0, competition: 'high' });
      }
    } catch(e) {}
    if (this.aiService && topics.length < 3) {
      try {
        const prompt = `Generate 5 trending real-life story topics for middle class Indians in 2026. Focus on: money struggles, job market, family issues. Return JSON array only: [{"topic":"...","searchVolume":50000,"competition":"medium"}]`;
        const response = await this.aiService.generateText(prompt);
        const parsed = JSON.parse(response.replace(/```json|```/g,'').trim());
        topics.push(...parsed.map(t => ({ ...t, source: 'ai' })));
      } catch(e) {}
    }
    const fallbacks = [
      { topic: 'Job layoffs India 2026 — real middle class stories', source: 'fallback', searchVolume: 80000, competition: 'medium' },
      { topic: 'EMI trap — how Indians are drowning in debt silently', source: 'fallback', searchVolume: 75000, competition: 'medium' },
      { topic: 'Parents vs career — Indian millennials real dilemma', source: 'fallback', searchVolume: 95000, competition: 'low' },
      { topic: 'Cost of living crisis middle class India 2026', source: 'fallback', searchVolume: 120000, competition: 'low' },
      { topic: 'Marriage pressure vs financial independence Indian women', source: 'fallback', searchVolume: 110000, competition: 'low' },
    ];
    if (topics.length < 3) topics.push(...fallbacks);
    for (const t of topics.slice(0, 5)) { await this.db.saveTrend(t).catch(() => {}); }
    return topics;
  }
  async getBestTopic() {
    const trends = await this.fetchTrends();
    trends.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
    return trends[0] || { topic: 'Job gayi EMI thi phir bhi nahi haara — real story', source: 'default', searchVolume: 50000 };
  }
}
module.exports = TrendResearchAgent;
