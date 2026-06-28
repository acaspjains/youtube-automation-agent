const { Logger } = require('../utils/logger');
class ContentStrategyAgent {
  constructor(db, credentials) { this.db=db; this.credentials=credentials; this.logger=new Logger('ContentStrategy'); this.aiService=credentials.aiService; }
  async initialize() { this.logger.info('Initializing Content Strategy Agent...'); return true; }
  async planContent() {
    if(this.aiService){
      try{
        const prompt=`Ek trending real-life story topic chuno middle class Indians ke liye (20-40 age). Sirf Hindi mein. Paise ki takleef, job, family, sapne. Bahut specific aur emotional. Sirf JSON: {"topic":"...","angle":"...","keywords":["...","...","..."],"contentType":"story","targetEmotion":"relatable","estimatedViews":50000}`;
        const r=await this.aiService.generateText(prompt);
        const p=JSON.parse(r.replace(/\`\`\`json|\`\`\`/g,'').trim());
        this.logger.info(`AI topic: ${p.topic}`);
        return {...p,targetAudience:'Middle class Indians aged 20-40',createdAt:new Date().toISOString()};
      }catch(e){this.logger.warn('AI unavailable: '+e.message.slice(0,40));}
    }
    return this.getSmartFallback();
  }
  getSmartFallback(){
    const topics=[
      {topic:'Teen saal mein paanch lakh kaise bachaye chhoti salary par',angle:'Chhoti salary mein bachat',keywords:['bachat','middle class','salary','paisa','India']},
      {topic:'Naukri gayi, EMI thi, ghar waalon ko pata nahi tha',angle:'Naukri jaane ka dard',keywords:['naukri','EMI','parivaar','berozgari','India']},
      {topic:'Chaalis saal mein business band hua, phir se shuru kiya',angle:'Naye sir se shuruat',keywords:['business','asafalta','wapsi','udyami','India']},
      {topic:'Shaadi se pehle ki woh raat jo maine kabhi nahi bataya',angle:'Arranged marriage ki takleef',keywords:['shaadi','parivaar','rishte','India','dard']},
      {topic:'Sheher mein akele rehna — koi nahi puchta khana khaya',angle:'Sheher mein akela pan',keywords:['akela','sheher','mental health','parivaar','India']},
      {topic:'Dus baar UPSC mein fail hua, gyarahwaari mein safal',angle:'UPSC ki sangharsh',keywords:['UPSC','sarkari naukri','asafalta','dhairya','India']},
      {topic:'Meri maa ne sirf meri padhai ke liye apne sapne chod diye',angle:'Maa ki qurbaani',keywords:['maa','qurbaani','padhai','parivaar','India']},
      {topic:'Credit card ka do lakh ka karz aur kaise chukaya',angle:'Karz se mukti',keywords:['credit card','karz','paisa','bachat','India']},
      {topic:'IT sector mein layoff ke baad maine kya seekha',angle:'IT layoff ke baad',keywords:['IT layoff','naukri','technology','career','India']},
      {topic:'Ghar khareedne ka sapna aur sach — middle class ki kahani',angle:'Ghar ka sapna',keywords:['home loan','real estate','middle class','India','EMI']},
      {topic:'Shaadi ke baad paise ka jhagda — jo koi nahi batata',angle:'Paisa aur rishte',keywords:['shaadi','paisa','jhagda','parivaar','India']},
      {topic:'Papa ki retirement ke baad hamare ghar mein kya hua',angle:'Retirement ka dard',keywords:['retirement','parivaar','middle class','papa','India']},
      {topic:'Startup fail hua, bees lakh doob gaye — phir bhi khada hoon',angle:'Startup ki asafalta',keywords:['startup','asafalta','udyami','wapsi','India']},
      {topic:'Naukri chodkar YouTube shuru kiya — ek saal ki sachchi kahani',angle:'Naukri se creator tak',keywords:['YouTube','creator','career','India','jokhim']},
    ];
    const day=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000);
    const t=topics[day%topics.length];
    this.logger.info(`Fallback: ${t.topic}`);
    return {...t,contentType:'story',targetEmotion:'relatable',targetAudience:'Middle class Indians aged 20-40',estimatedViews:5000+Math.floor(Math.random()*15000),createdAt:new Date().toISOString()};
  }
}
module.exports = ContentStrategyAgent;
