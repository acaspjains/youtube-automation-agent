const { Logger } = require('../utils/logger');
class ScriptWriterAgent {
  constructor(db, credentials) { this.db=db; this.credentials=credentials; this.logger=new Logger('ScriptWriter'); this.aiService=credentials.aiService; }
  async initialize() { this.logger.info('Initializing Script Writer Agent...'); return true; }
  async generateScript(strategy) {
    this.logger.info(`Generating script for: ${strategy.topic}`);
    let fullScript='';
    if(this.aiService){
      try{
        const prompt=`Aap RozKiKahani channel ke liye script writer hain.\nPoora 5-7 minute ka emotional script SIRF HINDI MEIN likho.\nTOPIC: ${strategy.topic}\nBHASHA: Sirf Hindi\nSTYLE: Emotional sachchi kahani, relatable middle class India\nTAGLINE: "Yeh meri bhi kahani hai"\nNIYAM:\n- Pehle 8 second mein powerful hook\n- Asli Indian naam use karo\n- Rupaye ki exact raqam batao\n- Ant mein subscribe ka anurodh\nFORMAT:\nTITLE: (Hindi title 60 se kam characters)\n[0:00] HOOK:\n[0:08] SHURUAT:\n[1:00] MUSHKIL:\n[3:00] TURNING POINT:\n[5:00] SAMADHAN:\n[6:30] SABAK AUR CTA:`;
        fullScript=await this.aiService.generateText(prompt);
        this.logger.info('AI script generated');
      }catch(e){this.logger.warn('AI failed: '+e.message.slice(0,40)); fullScript=this.getFallback(strategy);}
    } else { fullScript=this.getFallback(strategy); }
    const titleMatch=fullScript.match(/TITLE:\s*(.+)/);
    const title=titleMatch?titleMatch[1].trim():strategy.topic.slice(0,60);
    const script={title,fullScript,topic:strategy.topic,language:'Hindi',tone:'emotional',pacing:'dynamic',keywords:strategy.keywords||[],duration:'7:00',metadata:{strategy,generatedAt:new Date().toISOString()}};
    await this.db.saveScript(script);
    this.logger.info(`Script ready: ${script.title}`);
    return script;
  }
  getFallback(strategy){
    const hooks=['Mere paas sirf paanch sau rupaye the aur kiraye ka din aa gaya tha...','Maine apni naukri khoyi thi — aur teen mahine tak ghar waalon ko pata nahi tha.','Jab mera business band hua, log kehte the "hum ne kaha tha".','Dus baar haar gaya. Gyarahwaari mein phir khada hua.'];
    const hook=hooks[Math.floor(Math.random()*hooks.length)];
    return `TITLE: ${strategy.topic.slice(0,58)}\n\n[0:00] HOOK\n${hook}\n\n[0:08] SHURUAT\nYeh kahani hai ek aam Indian ki — bilkul aap jaise, mujh jaise.\n${strategy.topic}\nYeh koi filmi kahani nahi — yeh bilkul sachchi hai.\n\n[1:00] MUSHKIL\nZindagi mein ek waqt aata hai jab sab kuch theek lagta hai.\nAur phir ek din... sab badal jaata hai.\nEMI pending. Ghar ka kharcha. Parivaar ki umeedein.\nRamesh bhai jab Mumbai se wapas aaye, unke haath mein sirf ek bag tha.\nNaukri gayi thi. Account mein sirf teen hajar rupaye the.\n\n[3:00] TURNING POINT\nLekin usi mushkil waqt mein kuch aisa hua jo unhone socha nahi tha.\nEk chhhota sa decision. Ek insaan ki madad.\nUnke padosi ne kaha — "Ek baar aur koshish karo. Main saath hoon."\n\n[5:00] SAMADHAN\nAaj Ramesh bhai wahi jagah khade hain. Wahi sheher, wahi parivaar.\nLekin ekdum alag insaan.\nKyunki mushkil waqt hume todhta nahi — banata hai.\n\n[6:30] SABAK AUR CTA\nDoston — comment mein zaroor batao kya aapki bhi aisi kahani hai.\nSubscribe karo RozKiKahani — roz ek nayi sachchi kahani.\nYeh meri bhi kahani hai.`;
  }
}
module.exports = ScriptWriterAgent;
