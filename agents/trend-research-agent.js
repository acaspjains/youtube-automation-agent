const axios = require('axios');
class TrendResearchAgent {
  constructor(db, credentials) { this.db=db; this.aiService=credentials.aiService; }
  async initialize() { return true; }
  async fetchTrends() {
    const topics = [];
    try {
      const ytKey = process.env.YOUTUBE_API_KEY;
      if(ytKey){
        for(const q of ['sachchi kahani middle class India','real life story Hindi emotional','zindagi ki kahani India viral']){
          const res=await axios.get('https://www.googleapis.com/youtube/v3/search',{params:{part:'snippet',q,type:'video',regionCode:'IN',relevanceLanguage:'hi',order:'viewCount',maxResults:5,key:ytKey,publishedAfter:new Date(Date.now()-7*24*60*60*1000).toISOString()}});
          for(const item of (res.data.items||[])){
            const title=item.snippet.title;
            const isCeleb=/tamannaah|bollywood|actor|actress|film|movie|song|cricket|modi|rahul|bjp|congress|beetroot|pesto|jewellery/i.test(title);
            if(!isCeleb&&title.length>10) topics.push({topic:title,source:'youtube_search',searchVolume:50000,competition:'low'});
          }
        }
      }
    }catch(e){}
    if(this.aiService&&topics.length<3){
      try{
        const r=await this.aiService.generateText('Generate 5 VIRAL Hindi story topics for middle class Indians. NO celebrities. ONLY real struggles, money, family, jobs. JSON array: [{"topic":"...","searchVolume":80000,"competition":"low"}]');
        const p=JSON.parse(r.replace(/```json|```/g,'').trim());
        topics.push(...p.map(t=>({...t,source:'ai_viral'})));
      }catch(e){}
    }
    const fallbacks=[
      {topic:'Naukri gayi thi, 3 mahine chhupaya — ghar waale aaj bhi nahi jaante',searchVolume:150000,competition:'low'},
      {topic:'Meri maa ne kabhi nahi bataya ki unke sapne kya the',searchVolume:200000,competition:'low'},
      {topic:'Jab main sab kuch haar gaya tha — ek raat ki kahani',searchVolume:120000,competition:'low'},
      {topic:'Maine apne papa se pehli baar 1000 rupaye maange the',searchVolume:180000,competition:'low'},
      {topic:'Shahar mein 5 saal — ghar kabhi nahi bhula',searchVolume:160000,competition:'low'},
      {topic:'Woh interview jisme main roya tha bahar aake',searchVolume:140000,competition:'low'},
      {topic:'Jab doctor ne bola 3 mahine — papa ne kuch nahi kaha',searchVolume:250000,competition:'low'},
      {topic:'Maine pehli salary se kya kharida — aur kyun roya',searchVolume:300000,competition:'low'},
      {topic:'Beti ki shaadi ke liye papa ne kya becha — kabhi nahi bataya',searchVolume:220000,competition:'low'},
      {topic:'Train mein milne wala ek insaan jo zindagi badal gaya',searchVolume:190000,competition:'low'},
      {topic:'12 baje raat ko maa ka phone aaya — aur sab badal gaya',searchVolume:280000,competition:'low'},
      {topic:'Jis dost par sabse zyada bharosa tha usne hi dhoka diya',searchVolume:210000,competition:'low'},
      {topic:'Gaon se sheher aaya tha — 10 saal mein kya paya kya khoya',searchVolume:320000,competition:'low'},
      {topic:'Woh din jab main ghar se bhaaga tha — sachchi kahani',searchVolume:170000,competition:'low'},
    ];
    if(topics.length<3)topics.push(...fallbacks);
    for(const t of topics.slice(0,5))await this.db.saveTrend(t).catch(()=>{});
    return topics;
  }
  async getBestTopic(usedTopics=[]) {
    const trends=await this.fetchTrends();
    const filtered=trends.filter(t=>{
      const isCeleb=/tamannaah|bollywood|actor|actress|film|movie|song|cricket|modi|rahul|bjp|congress|beetroot|pesto|jewellery/i.test(t.topic);
      return !isCeleb&&!usedTopics.includes(t.topic);
    });
    filtered.sort((a,b)=>(b.searchVolume||0)-(a.searchVolume||0));
    const best=filtered[0]||trends[0];
    console.log(`Viral topic: ${best.topic}`);
    return best;
  }
}
module.exports = TrendResearchAgent;
