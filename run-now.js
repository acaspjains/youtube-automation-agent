require('dotenv').config();
const { Database } = require('./database/db');
const { AITextService } = require('./utils/ai-text-service');
const TrendResearchAgent = require('./agents/trend-research-agent');
const ContentStrategyAgent = require('./agents/content-strategy-agent');
const ScriptWriterAgent = require('./agents/script-writer-agent');
const SEOOptimizerAgent = require('./agents/seo-optimizer-agent');
const VoiceAgent = require('./agents/voice-agent');
const VideoAssemblyAgent = require('./agents/video-assembly-agent');
const ThumbnailAgent = require('./agents/thumbnail-agent');
const TelegramAgent = require('./agents/telegram-agent');
const LearningAgent = require('./agents/learning-agent');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
function log(m) { console.log(`[${new Date().toISOString()}] ${m}`); }
async function main() {
  log('=== RozKiKahani Pipeline Starting ===');
  const db = new Database();
  await db.initialize();
  const aiService = new AITextService({ gemini: { apiKey: process.env.GEMINI_API_KEY, model: 'gemini-1.5-flash-latest' } });
  const creds = { aiService, db };
  const telegram = new TelegramAgent(db);
  ['data/scripts','data/audio','data/videos','data/thumbnails'].forEach(d => fs.mkdirSync(path.join(__dirname,d),{recursive:true}));
  try {
    log('1/9 Trend research...');
    const trendAgent = new TrendResearchAgent(db, creds);
    const trend = await trendAgent.getBestTopic();
    log('Topic: ' + trend.topic);
    log('2/9 Learning...');
    const learningAgent = new LearningAgent(db, creds);
    log('3/9 Strategy...');
    const strategyAgent = new ContentStrategyAgent(db, creds);
    await strategyAgent.initialize();
    const strategy = await strategyAgent.planContent();
    if (trend.topic) strategy.topic = trend.topic;
    const strategyId = await db.saveContentStrategy(strategy);
    log('4/9 Script...');
    const scriptAgent = new ScriptWriterAgent(db, creds);
    await scriptAgent.initialize();
    const script = await scriptAgent.generateScript(strategy);
    script.strategyId = strategyId;
    const scriptId = await db.saveScript(script);
    log('Script: ' + script.title);
    log('5/9 SEO...');
    const seoAgent = new SEOOptimizerAgent(db, creds);
    await seoAgent.initialize();
    const seo = await seoAgent.optimizeContent(script, strategy);
    log('Title: ' + seo.title);
    log('6/9 Voice...');
    const voiceAgent = new VoiceAgent(db, creds);
    const audioPath = path.join(__dirname,'data','audio','voice_'+Date.now()+'.mp3');
    const ttsText = (script.fullScript||strategy.topic).replace(/\[.*?\]/g,'').replace(/==+/g,'').slice(0,4500);
    const voice = await voiceAgent.generateVoice(ttsText, audioPath);
    log('Voice: ' + voice.provider);
    log('7/9 Video...');
    const videoAgent = new VideoAssemblyAgent(db, creds);
    await videoAgent.initialize();
    const videoPath = path.join(__dirname,'data','videos','video_'+Date.now()+'.mp4');
    const video = await videoAgent.assembleMp4(script, audioPath, videoPath, { topic: strategy.topic, title: seo.title });
    log('Video done');
    log('8/9 Thumbnail...');
    const thumbAgent = new ThumbnailAgent(db, creds);
    const thumbnailPath = await thumbAgent.generate(script, seo, { topic: strategy.topic });
    log('Thumb: ' + thumbnailPath);
    const videoId = await db.saveVideo({ scriptId, title: seo.title||script.title, description: seo.description, tags: seo.tags, videoPath: video.path, thumbnailPath, status: 'ready', privacy: process.env.DEFAULT_PRIVACY_STATUS||'public' });
    log('9/9 YouTube upload...');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const tokenSecret = process.env.YOUTUBE_OAUTH_TOKEN;
    let youtubeId = null;
    if (clientId && clientSecret && tokenSecret && fs.existsSync(video.path) && fs.statSync(video.path).size > 1000) {
      try {
        let tokens;
        try {
          const cleaned = tokenSecret.trim().replace(/\n/g, '').replace(/\r/g, '');
          tokens = JSON.parse(cleaned);
          tokens = tokens.youtube || tokens;
        } catch(e2) {
          // Try extracting access_token directly
          const match = tokenSecret.match(/"access_token"\s*:\s*"([^"]+)"/);
          const refresh = tokenSecret.match(/"refresh_token"\s*:\s*"([^"]+)"/);
          if (match) {
            tokens = { access_token: match[1], refresh_token: refresh ? refresh[1] : null, token_type: 'Bearer' };
          } else { throw new Error('Cannot parse OAuth token: ' + e2.message); }
        }
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3456/auth/callback');
        oauth2Client.setCredentials(tokens);
        const yt = google.youtube({ version: 'v3', auth: oauth2Client });
        const res = await yt.videos.insert({ part: ['snippet','status'], requestBody: { snippet: { title: (seo.title||script.title).slice(0,100), description: (seo.description||'').slice(0,5000), tags: (seo.tags||[]).slice(0,15), categoryId: '22', defaultLanguage: 'hi', defaultAudioLanguage: 'hi' }, status: { privacyStatus: process.env.DEFAULT_PRIVACY_STATUS||'public', selfDeclaredMadeForKids: false, madeForKids: false } }, media: { body: fs.createReadStream(video.path) } });
        youtubeId = res.data.id;
        log('UPLOADED: https://youtube.com/watch?v=' + youtubeId);
        if (thumbnailPath && fs.existsSync(thumbnailPath)) { try { await yt.thumbnails.set({ videoId: youtubeId, media: { body: fs.createReadStream(thumbnailPath) } }); log('Thumbnail set'); } catch(e) { log('Thumb skip: '+e.message); } }
        await db.updateVideoYouTubeId(videoId, youtubeId);
        await telegram.sendVideoUploaded({ title: seo.title, youtubeId });
      } catch(e) { log('Upload failed: '+e.message); await telegram.sendError(e,'YouTube'); }
    } else { log('Upload skipped - video file too small or missing OAuth'); }
    fs.writeFileSync('data/scripts/latest_script.txt', 'TITLE: '+(seo.title||'')+'\nYOUTUBE: '+(youtubeId?'https://youtube.com/watch?v='+youtubeId:'Not uploaded')+'\n\n'+(seo.description||'')+'\n\n'+(script.fullScript||''));
    log('=== COMPLETE ===');
    log('YouTube: ' + (youtubeId ? 'https://youtube.com/watch?v='+youtubeId : 'Not uploaded'));
    await db.close();
    process.exit(0);
  } catch(e) { log('FAILED: '+e.message+'\n'+e.stack); await telegram.sendError(e,'Pipeline').catch(()=>{}); await db.close(); process.exit(1); }
}
main();
