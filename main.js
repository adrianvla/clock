const ws281x = require('rpi-ws281x-native');
const options = {
  dma: 10,
  freq: 800000,
  gpio: 18,
  invert: false,
  brightness: 255,
  stripType: ws281x.stripType.WS2812
};

const channel = ws281x(256, options);
const colors = channel.array;

function placepixel(x,y,c){
  x++;
  colors[x%2==0 ? (x<<3)-y-1 : ((x-1)<<3) + y] = c;
}
function toHex(r,g,b){
    return (r<<16) | (g<<8) | b;
}
//ws281x.render();
//let p = 0;


const express = require('express');
const ws = require('ws');
const app = express();
app.get('/', (req,res) =>{
  //res.sendfile(__dirname + '/ws.html');
});
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', message => console.log(message));
});
const server = app.listen(80, ()=>{});
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});


let t = 0xffffff;
let font = {"0":[[t,t,t],[t,0,t],[t,0,t],[t,0,t],[t,t,t]],"1":[[0,t,0],[t,t,0],[0,t,0],[0,t,0],[t,t,t]],"2":[[t,t,t],[0,0,t],[t,t,t],[t,0,0],[t,t,t]],"3":[[t,t,t],[0,0,t],[t,t,t],[0,0,t],[t,t,t]],"4":[[t,0,t],[t,0,t],[t,t,t],[0,0,t],[0,0,t]],"5":[[t,t,t],[t,0,0],[t,t,t],[0,0,t],[t,t,t]],"6":[[t,t,t],[t,0,0],[t,t,t],[t,0,t],[t,t,t]],"7":[[t,t,t],[0,0,t],[0,0,t],[0,0,t],[0,0,t]],"8":[[t,t,t],[t,0,t],[t,t,t],[t,0,t],[t,t,t]],"9":[[t,t,t],[t,0,t],[t,t,t],[0,0,t],[t,t,t]]};
let r = 0x080000,w = 0x080808;
let calendar = [[r,r,r,r,r,r,r,r],[r,r,r,r,r,r,r,r],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w]];



class Image{
  constructor(img, x, y, c){
    this.img = img;
    this.x=x;
    this.y=y;
    this.c=c;
  }
  draw(){
    let img = this.img, x=this.x, y=this.y, c=this.c;
    let w = img[0].length,h = img.length;
    for(let yy=0;yy<h;yy++){
      for(let xx=0;xx<w;xx++){
        placepixel(xx+x,yy+y,img[yy][xx] & c);
      }
    }
    return this;
  }
  drawAbsolute(){
    let img = this.img, x=this.x, y=this.y, c=this.c;
    let w = img[0].length,h = img.length;
    for(let yy=0;yy<h;yy++){
      for(let xx=0;xx<w;xx++){
        placepixel(xx+x,yy+y,img[yy][xx]);
      }
    }
    return this;
  }
  drawHole(){
    let img = this.img, x=this.x, y=this.y, c=this.c;
    let w = img[0].length,h = img.length;
    for(let yy=0;yy<h;yy++){
      for(let xx=0;xx<w;xx++){
        if(img[yy][xx])
          placepixel(xx+x,yy+y,0);
      }
    }
    return this;
  }
}
class Text{
  constructor(txt,gap=1){
    this.txt=txt;
    this.gap=gap;
  }
  set(txt){
    this.txt=txt;
    return this;
  }
  draw(x,y,c){
    let txt = this.txt.split('');
    let gap = this.gap;
    for(let i = 0;i < txt.length;i++){
      if(txt[i]==" "){
        x+=2;
      }else{
        let o = new Image(font[txt[i]],x,y,c);
        o.draw();
        x+=(gap+3);
      }
    }
    return this;
  }
  drawHole(x,y){
    let txt = this.txt.split('');
    let gap = this.gap;
    for(let i = 0;i < txt.length;i++){
      if(txt[i]==" "){
        x+=2;
      }else{
        let o = new Image(font[txt[i]],x,y);
        o.drawHole();
        x+=(gap+3);
      }
    }
    return this;
  }
}

let p = 0;

let alarmClock = [{type:"image",data:calendar,x:0,y:0,imageType:"absolute"},{type:"text",indicator:"d",textType:"negative",x:1,y:2},{type:"text",indicator:"h m",textType:"color",color:0x101010,x:11,y:1},{type:"image",data:[[0],[0xffffff],[0],[0xffffff],[0]],imageType:"normal",color:0x101010,x:19,y:1,active:0.5},{type:"weekday",gap:1,w:2,x:10,y:7},{type:"secondsbar",x:9,color:0x100000,w:22,y:0}];


setInterval(()=>{
  let d = new Date();
  let h = String(d.getHours());
  let m = String(d.getMinutes());
  let s = String(d.getSeconds());
  let day = String(d.getDate());
  let dofw =d.getDay();
  
  for(let i = 0; i<channel.count;i++){
    colors[i] = 0x000000;
  }
  let calendarImg = new Image(calendar,0,0,0);
  calendarImg.drawAbsolute();

  if(h.length == 1)
    h = "0"+h;
  if(m.length == 1)
    m = "0"+m;
  if(day.length == 1)
    day = "0"+day;

  //drawImage(font[h[0]],O,1,0x101010);
  //drawImage(font[h[1]],O+4,1,0x101010);
  //drawImage(font[m[0]],O+10,1,0x101010);
  //drawImage(font[m[1]],O+14,1,0x101010);
  
  let timetext = new Text(`${h} ${m}`);
  timetext.draw(11,1,0x101010);

  let O = 11;

  if(p%2==0){
    placepixel(O+8,2,0x101010);
    placepixel(O+8,4,0x101010);
  }else{
    placepixel(O+8,2,0x050505);
    placepixel(O+8,4,0x050505);
  }
  
  for(let i = 0;i<22;i++){
    placepixel(i+9,0,0x020202);
  }
  placepixel(Math.floor(Number(s)*(22/60))+9,0,0x100000);

  let calendarHole = new Text(day,0);
  calendarHole.drawHole(1,2);

  for(let i = 0;i<7;i++){
    let Q = (i*3)+10;
    if(i+1 == dofw){
      placepixel(Q,7,0x202005);
      placepixel(Q+1,7,0x202005);
      //placepixel(Q+2,7,0x101005);
    }else{
      placepixel(Q,7,0x020202);
      placepixel(Q+1,7,0x020202);
      //placepixel(Q+2,7,0x050505);
    }
  }

  ws281x.render();
  p++;
},500);
