const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
class VoiceAgent {
  constructor(db, credentials) { this.db=db; }
  async initialize() { return true; }
  cleanText(text) {
    return text.replace(/\[.*?\]/g,'').replace(/==+/g,'').replace(/TITLE:.*\n/g,'').replace(/HOOK|SETUP|SHURUAT|MUSHKIL|TURNING POINT|SAMADHAN|SABAK|CTA/g,'').replace(/[#*_~`]/g,'').replace(/\n{3,}/g,'\n').replace(/http\S+/g,'').trim().slice(0,2000);
  }
  async generateVoice(text, outputPath) {
    fs.mkdirSync(path.dirname(outputPath),{recursive:true});
    const clean=this.cleanText(text);
    const elevenKey=process.env.ELEVENLABS_API_KEY;
    if(elevenKey&&elevenKey.length>10&&!elevenKey.includes('your-')){
      try{
        const voiceId=process.env.ELEVENLABS_VOICE_ID||'pNInz6obpgDQGcFmaJgB';
        const r=await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,{text:clean.slice(0,5000),model_id:'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.75}},{headers:{'xi-api-key':elevenKey},responseType:'arraybuffer',timeout:60000});
        fs.writeFileSync(outputPath,r.data);
        console.log('Voice: ElevenLabs OK');
        return {path:outputPath,provider:'elevenlabs',duration:clean.length/12};
      }catch(e){console.log('ElevenLabs failed:',e.message);}
    }
    try{
      const escaped=clean.slice(0,800).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,' ');
      const py=`from gtts import gTTS\ntts=gTTS(text="""${escaped}""",lang='hi',slow=True)\ntts.save('${outputPath}')\nprint('OK')`;
      fs.writeFileSync('/tmp/tts.py',py);
      execSync('python3 /tmp/tts.py 2>&1',{timeout:60000});
      if(fs.existsSync(outputPath)&&fs.statSync(outputPath).size>1000){
        console.log('Voice: gTTS Hindi OK');
        return {path:outputPath,provider:'gtts',duration:Math.max(60,Math.floor(clean.length/12))};
      }
    }catch(e){console.log('gTTS failed:',e.message);}
    try{
      const dur=Math.max(120,Math.floor(clean.length/12));
      execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t ${dur} -q:a 9 -acodec libmp3lame "${outputPath}" -y 2>/dev/null`);
      console.log('Voice: silent fallback');
      return {path:outputPath,provider:'silent',duration:dur};
    }catch(e){}
    fs.writeFileSync(outputPath,Buffer.alloc(100));
    return {path:outputPath,provider:'none',duration:120};
  }
}
module.exports = VoiceAgent;
