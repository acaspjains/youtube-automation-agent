const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
class ThumbnailAgent {
  constructor(db, credentials) { this.db = db; this.outputDir = path.join(__dirname, '..', 'data', 'thumbnails'); fs.mkdirSync(this.outputDir, { recursive: true }); }
  async initialize() { return true; }
  async generate(script, seo, options = {}) {
    const outputPath = path.join(this.outputDir, `thumb_${Date.now()}.jpg`);
    const hook = (options.topic || script.title || 'Zindagi ki kahani').slice(0, 35).replace(/'/g, '').replace(/[:"]/g, ' ');
    const line1 = hook.slice(0, 18);
    const line2 = hook.slice(18, 35);
    try {
      execSync(`python3 -c "
from PIL import Image, ImageDraw, ImageFont
import os
W,H=1280,720
img=Image.new('RGB',(W,H),'#1E0E02')
d=ImageDraw.Draw(img)
d.rectangle([0,0,W,8],fill='#E8A045')
d.rectangle([0,H-8,W,H],fill='#E8A045')
d.rectangle([0,0,700,H],fill='#251205')
d.rectangle([700,0,704,H],fill='#E8A045')
try:
 fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',22)
 fh=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',44)
 fs=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
 fr=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
except:
 fb=fh=fs=fr=ImageFont.load_default()
d.text((40,60),'TRUE STORY',font=fb,fill='#E8A045')
d.text((40,130),'${line1}',font=fh,fill='white')
d.text((40,185),'${line2}',font=fh,fill='white')
d.text((40,580),'Yeh meri bhi kahani hai',font=fs,fill='#E8A045')
d.text((760,320),'RozKi',font=fr,fill='#E8A045')
d.text((760,365),'Kahani',font=fr,fill='white')
img.save('${outputPath}','JPEG',quality=95)
print('OK')
"`, { timeout: 15000 });
      console.log(`Thumbnail: ${outputPath}`);
      return outputPath;
    } catch(e) { console.log('Thumbnail failed:', e.message); return null; }
  }
}
module.exports = ThumbnailAgent;
