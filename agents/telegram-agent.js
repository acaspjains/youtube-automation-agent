const axios = require('axios');
class TelegramAgent {
  constructor(db) { this.db = db; this.botToken = process.env.TELEGRAM_BOT_TOKEN; this.chatId = process.env.TELEGRAM_CHAT_ID; this.enabled = !!(this.botToken && this.chatId && this.botToken.length > 5); }
  async initialize() { return true; }
  async send(message) {
    if (!this.enabled) { console.log('Telegram: not configured (add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)'); return false; }
    try { await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, { chat_id: this.chatId, text: message, parse_mode: 'HTML' }); return true; } catch(e) { console.log('Telegram failed:', e.message); return false; }
  }
  async sendVideoUploaded(data) { return this.send(`🎬 <b>New Video!</b>\n\n📌 ${data.title}\n🔗 https://youtube.com/watch?v=${data.youtubeId}\n\n<i>RozKiKahani - Yeh meri bhi kahani hai</i>`); }
  async sendError(error, ctx) { return this.send(`❌ <b>Error in ${ctx}</b>\n\n${error.message}`); }
}
module.exports = TelegramAgent;
