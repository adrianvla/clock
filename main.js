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
const app = express();
app.get('/', (req,res) =>{
  
});
app.listen(80, ()=>{});

let t = 0xffffff;
let font = {"0":[[t,t,t],[t,0,t],[t,0,t],[t,0,t],[t,t,t]],"1":[[0,t,0],[t,t,0],[0,t,0],[0,t,0],[t,t,t]],"2":[[t,t,t],[0,0,t],[t,t,t],[t,0,0],[t,t,t]],"3":[[t,t,t],[0,0,t],[t,t,t],[0,0,t],[t,t,t]],"4":[[t,0,t],[t,0,t],[t,t,t],[0,0,t],[0,0,t]],"5":[[t,t,t],[t,0,0],[t,t,t],[0,0,t],[t,t,t]],"6":[[t,t,t],[t,0,0],[t,t,t],[t,0,t],[t,t,t]],"7":[[t,t,t],[0,0,t],[0,0,t],[0,0,t],[0,0,t]],"8":[[t,t,t],[t,0,t],[t,t,t],[t,0,t],[t,t,t]],"9":[[t,t,t],[t,0,t],[t,t,t],[0,0,t],[t,t,t]]};
let r = 0x080000,w = 0x080808;
let calendar = [[r,r,r,r,r,r,r,r],[r,r,r,r,r,r,r,r],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w]];

function drawImage(img,x,y,c){
  let w = img[0].length,h = img.length;
  for(let yy=0;yy<h;yy++){
    for(let xx=0;xx<w;xx++){
      placepixel(xx+x,yy+y,img[yy][xx] & c);
    }
  }
}

function drawAImage(img,x,y){
  let w = img[0].length,h = img.length;
  for(let yy=0;yy<h;yy++){
    for(let xx=0;xx<w;xx++){
      placepixel(xx+x,yy+y,img[yy][xx]);
    }
  }
}

function drawHoleImage(img,x,y){
  let w = img[0].length,h = img.length;
  for(let yy=0;yy<h;yy++){
    for(let xx=0;xx<w;xx++){
      if(img[yy][xx])
        placepixel(xx+x,yy+y,0);
    }
  }
}

let p = 0;

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
  drawAImage(calendar,0,0,0);
  let O = 11;

  if(h.length == 1)
    h = "0"+h;
  if(m.length == 1)
    m = "0"+m;
  if(day.length == 1)
    day = "0"+day;

  drawImage(font[h[0]],O,1,0x101010);
  drawImage(font[h[1]],O+4,1,0x101010);
  drawImage(font[m[0]],O+10,1,0x101010);
  drawImage(font[m[1]],O+14,1,0x101010);
  
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

  drawHoleImage(font[day[0]],1,2);
  drawHoleImage(font[day[1]],4,2);

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