const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
class VideoAssemblyAgent {
  constructor(db, credentials) { this.db = db; this.outputDir = path.join(__dirname, '..', 'data', 'videos'); fs.mkdirSync(this.outputDir, { recursive: true }); }
  async initialize() { try { execSync('ffmpeg -version', { stdio: 'pipe' }); return true; } catch(e) { return false; } }
  splitToSentences(text, maxChars = 40) {
    const clean = text.replace(/\[.*?\]/g,'').replace(/==+/g,'').replace(/TITLE:.*\n/g,'').replace(/HOOK|SETUP|SHURUAT|MUSHKIL|TURNING POINT|SAMADHAN|SABAK|CTA/g,'').replace(/\n{3,}/g,'\n').trim();
    const lines = [];
    for (const para of clean.split('\n').filter(l=>l.trim().length>3)) {
      const parts = para.split(/[।|—|\.\.\.|?|!]/).filter(p=>p.trim().length>2);
      for (const part of parts) {
        const words = part.trim().split(' ');
        let cur = '';
        for (const w of words) {
          if ((cur+' '+w).length>maxChars) { if(cur.trim())lines.push(cur.trim()); cur=w; }
          else cur = cur ? cur+' '+w : w;
        }
        if(cur.trim())lines.push(cur.trim());
      }
    }
    return lines.filter(l=>l.length>2).slice(0,80);
  }
  async assembleMp4(script, audioPath, outputPath, options={}) {
    const tempDir = path.join(__dirname,'..','data','temp_'+Date.now());
    fs.mkdirSync(tempDir,{recursive:true});
    try {
      let audioDuration = 300; // minimum 5 minutes
      if(fs.existsSync(audioPath)&&fs.statSync(audioPath).size>1000){
        try{ audioDuration=parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}" 2>/dev/null`).toString().trim())||120; }catch(e){}
      }
      const sentences = this.splitToSentences(script.fullScript||options.topic||'');
      const total = Math.max(sentences.length,1);
      const secPer = Math.max(2.5, audioDuration/total);
      const W=1920,H=1080;
      const filters=[];
      filters.push(`drawbox=x=0:y=0:w=${W}:h=8:color=#E8A045@1:t=fill`);
      filters.push(`drawbox=x=0:y=${H-8}:w=${W}:h=8:color=#E8A045@1:t=fill`);
      filters.push(`drawbox=x=0:y=60:w=6:h=${H-120}:color=#E8A045@0.8:t=fill`);
      filters.push(`drawtext=text='RozKiKahani':fontsize=36:fontcolor=#E8A045@0.6:x=${W}-320:y=${H}-70:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`);
      filters.push(`drawtext=text='Yeh meri bhi kahani hai':fontsize=28:fontcolor=#E8A045@0.5:x=(w-text_w)/2:y=20:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf`);
      for(let i=0;i<Math.min(sentences.length,60);i++){
        const st=(i*secPer).toFixed(1), et=((i+1)*secPer).toFixed(1);
        const safe=sentences[i].replace(/'/g,'').replace(/:/g,' ').replace(/"/g,'').replace(/\\/g,'').replace(/[&<>]/g,' ').slice(0,45);
        if(!safe.trim())continue;
        filters.push(`drawtext=text='${safe}':fontsize=58:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:enable='between(t,${st},${et})':box=1:boxcolor=#0D0D0D@0.85:boxborderw=18`);
        filters.push(`drawtext=text='${i+1}/${total}':fontsize=20:fontcolor=#E8A045@0.4:x=30:y=${H}-50:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,${st},${et})'`);
      }
      const videoOnly=path.join(tempDir,'v.mp4');
      console.log(`Building text video (${total} sentences, ${Math.round(audioDuration)}s)...`);
      execSync(`ffmpeg -f lavfi -i "color=c=#0D0D0D:size=${W}x${H}:rate=24" -t ${audioDuration} -vf "${filters.join(',')}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${videoOnly}" -y 2>/dev/null`,{timeout:300000});
      if(fs.existsSync(audioPath)&&fs.statSync(audioPath).size>1000){
        execSync(`ffmpeg -i "${videoOnly}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}" -y 2>/dev/null`,{timeout:60000});
      } else { fs.copyFileSync(videoOnly,outputPath); }
      console.log(`Video: ${outputPath} (${(fs.statSync(outputPath).size/1024/1024).toFixed(1)}MB)`);
      return {path:outputPath,duration:audioDuration};
    } catch(e) {
      console.log('Video error:',e.message);
      try{execSync(`ffmpeg -f lavfi -i "color=c=#0D0D0D:size=1920x1080:rate=24" -t 60 -c:v libx264 -preset ultrafast "${outputPath}" -y 2>/dev/null`);}catch(e2){}
      return {path:outputPath,duration:60};
    } finally { try{fs.rmSync(tempDir,{recursive:true,force:true});}catch(e){} }
  }
}
module.exports = VideoAssemblyAgent;
