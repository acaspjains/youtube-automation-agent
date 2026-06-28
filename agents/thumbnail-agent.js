const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
class ThumbnailAgent {
  constructor(db, credentials) { this.db=db; this.outputDir=path.join(__dirname,'..','data','thumbnails'); fs.mkdirSync(this.outputDir,{recursive:true}); }
  async initialize() { return true; }
  getHook(topic) {
    const hooks={'maa':'MAA KI QURBAANI','papa':'PAPA KA RAAZ','naukri':'NAUKRI GAYI','shaadi':'SHAADI SE PEHLE','paisa':'PAISA KHO GAYA','roya':'ROI THI MAIN','bhaaga':'GHAR SE BHAAGA','salary':'PEHLI SALARY','train':'TRAIN MEIN MILA','doctor':'DOCTOR NE BOLA','dost':'DOST NE DHOKA','gaon':'GAON SE SHEHER','interview':'INTERVIEW MEIN ROYA','EMI':'EMI NAHI THI'};
    for(const [k,h] of Object.entries(hooks)){if(topic.toLowerCase().includes(k.toLowerCase()))return h;}
    return topic.split(' ').slice(0,3).join(' ').toUpperCase();
  }
  async generate(script, seo, options={}) {
    const outputPath=path.join(this.outputDir,`thumb_${Date.now()}.jpg`);
    const topic=options.topic||script.title||'Sachchi Kahani';
    const hook=this.getHook(topic);
    const sub=topic.slice(0,35).replace(/'/g,'').replace(/"/g,'');
    try{
      const py=`
from PIL import Image, ImageDraw, ImageFont
W,H=1280,720
img=Image.new('RGB',(W,H),'#0A0A0A')
d=ImageDraw.Draw(img)
for i in range(H//2):
    v=int(40*(1-i/(H//2)))
    d.rectangle([0,i,W,i+1],fill=(v*4,v//2,v//2))
d.rectangle([0,H//2,W,H],fill='#0A0A0A')
d.rectangle([0,0,W,6],fill='#E8A045')
d.rectangle([0,H-6,W,H],fill='#E8A045')
d.rectangle([0,0,6,H],fill='#E8A045')
try:
 f_tag=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',24)
 f_hook=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',78)
 f_sub=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30)
 f_brand=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
except:
 f_tag=f_hook=f_sub=f_brand=ImageFont.load_default()
d.text((30,18),'SACHCHI KAHANI  |  REAL STORY',font=f_tag,fill='#E8A045')
hook='${hook}'
bb=d.textbbox((0,0),hook,font=f_hook)
tx=max(30,(W-(bb[2]-bb[0]))//2)
d.text((tx+4,162),hook,font=f_hook,fill='#000000')
d.text((tx,158),hook,font=f_hook,fill='#FFFFFF')
sub='${sub}'
bb2=d.textbbox((0,0),sub,font=f_sub)
tx2=max(30,(W-(bb2[2]-bb2[0]))//2)
d.text((tx2,258),sub,font=f_sub,fill='#E8A045')
d.text((30,H-115),'"Yeh meri bhi kahani hai..."',font=f_sub,fill='#888888')
d.text((30,H-68),'@RozKiKahanibysp',font=f_brand,fill='#E8A045')
cx,cy,r=W-110,H//2,48
d.ellipse([cx-r,cy-r,cx+r,cy+r],fill='#E8A045')
d.polygon([(cx-14,cy-22),(cx-14,cy+22),(cx+22,cy)],fill='#0A0A0A')
img.save('${outputPath}','JPEG',quality=97)
print('OK')
`;
      const p='/tmp/mkt.py';
      fs.writeFileSync(p,py);
      execSync(`python3 ${p} 2>&1`,{timeout:20000});
      if(fs.existsSync(outputPath)&&fs.statSync(outputPath).size>5000){console.log(`Thumbnail: ${outputPath}`);return outputPath;}
    }catch(e){console.log('Thumbnail error:',e.message);}
    return null;
  }
}
module.exports = ThumbnailAgent;
