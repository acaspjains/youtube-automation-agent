const { Logger } = require('../utils/logger');
class SEOOptimizerAgent {
  constructor(db, credentials) { this.db=db; this.credentials=credentials; this.logger=new Logger('SEOOptimizer'); this.aiService=credentials.aiService; }
  async initialize() { this.logger.info('Initializing SEO Optimizer Agent...'); return true; }
  async optimizeContent(script, strategy) {
    this.logger.info(`Optimizing SEO for: ${script.title}`);
    let title,description,tags;
    if(this.aiService){
      try{
        const prompt=`RozKiKahani YouTube channel ke liye SEO banao.\nTITLE: ${script.title}\nTOPIC: ${strategy.topic}\nSirf JSON (koi markdown nahi):\n{"title":"60 se kam Hindi emotional title","description":"300 shabd ki Hindi description","tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15"]}`;
        const r=await this.aiService.generateText(prompt);
        const p=JSON.parse(r.replace(/\`\`\`json|\`\`\`/g,'').trim());
        title=p.title; description=p.description; tags=p.tags;
        this.logger.info('AI SEO generated');
      }catch(e){this.logger.warn('AI SEO failed: '+e.message.slice(0,40));}
    }
    if(!title)title=script.title.slice(0,60);
    if(!description)description=`${strategy.topic}\n\nKya aapke saath bhi aisa hua hai? Aaj ki kahani bilkul sachchi hai.\n\nHum laate hain un logon ki kahaniyaan jo kabhi akhbaaron mein nahi aatein.\nSachchi kahaniyaan. Sachche log. Asli India.\n\n🔔 Subscribe karo — roz ek nayi kahani!\n💬 Comment mein batao — kya aapki bhi aisi kahani hai?\n\nYeh meri bhi kahani hai.\n\n#RozKiKahani #YehMeriBhiKahaniHai #MiddleClassIndia #SachchiKahani #HindiKahani`;
    if(!tags)tags=['RozKiKahani','Yeh meri bhi kahani hai','middle class India','sachchi kahani','Hindi kahani','real life story India','emotional kahani','motivational Hindi','Indian family story','zindagi ki kahani','asli kahani','Hindi story','RozKiKahanibysp','sachchi zindagi','India ki kahani'];
    const seo={title,description,tags,optimizedAt:new Date().toISOString()};
    await this.db.saveSEOData(seo).catch(()=>{});
    this.logger.info(`SEO: ${title}`);
    return seo;
  }
}
module.exports = SEOOptimizerAgent;
