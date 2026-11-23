// Render delle stesse letture della prova in due ritagli tecnici per il certificato A4.
// Il PDF ordinario e gli archivi non vengono modificati.
const asNumber = value => value === '' || value == null ? null : Number(String(value).replace(',', '.'));
const formatted = (value, digits=2) => {
  const n=asNumber(value);
  return n === null || !Number.isFinite(n) ? '—' : n.toLocaleString('it-IT',{minimumFractionDigits:digits,maximumFractionDigits:digits});
};
const C={ink:'#292929',faint:'#d9dcdf',pale:'#f0f1f3',dark:'#505050',blue:'#416b9f',green:'#469a55'};
const canvas=(w,h)=>{const el=document.createElement('canvas');el.width=w;el.height=h;return [el,el.getContext('2d',{alpha:false})];};
function text(ctx,value,x,y,font='18px Arial',color=C.ink){
  ctx.font=font;ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(String(value??''),x,y);
}
function section(ctx,label,x,y,w){
  ctx.fillStyle=C.pale;ctx.fillRect(x,y,w,33);
  text(ctx,label,x+10,y+23,'bold 17px Arial');
}
export function capturePaloTable(result){
  const rows=result?.rows||[];
  const [el,ctx]=canvas(1200,1570);
  ctx.fillStyle='white';ctx.fillRect(0,0,el.width,el.height);
  section(ctx,'RISULTATI - LETTURE E CEDIMENTI',10,10,1180);
  const cols=[46,159,148,119,135,115,115,115,128];
  const heads=['N','Ciclo','% / min','bar','kN','C1 mm','C2 mm','C3 mm','Ced. mm'];
  let xx=12;ctx.fillStyle='#e4e7ea';ctx.fillRect(12,55,1170,40);
  heads.forEach((v,i)=>{text(ctx,v,xx+5,81,'bold 17px Arial');xx+=cols[i]});
  const rowH=42;
  rows.forEach((r,i)=>{
    const y=95+i*rowH;
    if(i%2===0){ctx.fillStyle='#f7f7f7';ctx.fillRect(12,y,1170,rowH);}
    ctx.strokeStyle='#dedede';ctx.beginPath();ctx.moveTo(12,y+rowH);ctx.lineTo(1182,y+rowH);ctx.stroke();
    let name=({esercizio:'Esercizio',scarico_esercizio:'Scarico es.',collaudo:'Collaudo',scarico_collaudo:'Scarico col.'})[r.cycle]||r.cycleLabel||'';
    const vals=[r.stepNo||i+1,name,(r.unload?'S':'')+r.percent+'% '+(r.waitMinutes||0)+'m',formatted(r.pressure),formatted(r.load),formatted(r.comparatorValues?.c1,3),formatted(r.comparatorValues?.c2,3),formatted(r.comparatorValues?.c3,3),formatted(r.meanSettlement,3)];
    let pos=12;vals.forEach((v,k)=>{text(ctx,v,pos+5,y+28,'17px Arial');pos+=cols[k]});
  });
  return el.toDataURL('image/png');
}
function loadPhoto(source){
  return new Promise(resolve=>{
    if(!source || typeof source!=='string' || !source.startsWith('data:image/'))return resolve(null);
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>resolve(null);
    image.src=source;
  });
}
export async function capturePaloRight(result,photo,data){
  const [el,ctx]=canvas(900,1510);
  ctx.fillStyle='white';ctx.fillRect(0,0,900,1510);
  section(ctx,'CURVA CARICO - SPOSTAMENTO MEDIO',12,10,876);
  const points=(result?.rows||[]).filter(r=>asNumber(r.meanSettlement)!==null&&asNumber(r.load)!==null);
  const exercise=points.filter(r=>['esercizio','scarico_esercizio'].includes(r.cycle));
  const collaudo=points.filter(r=>['collaudo','scarico_collaudo'].includes(r.cycle));
  const x0=92,y0=106,pw=728,ph=650;
  const maxLoad=Math.max(1,...points.map(r=>Number(r.load)||0));
  const maxSettlement=Math.max(0.25,...points.map(r=>Number(r.meanSettlement)||0));
  const plotLoad=Math.ceil(maxLoad/50)*50;
  const plotSettlement=Math.ceil(maxSettlement*4)/4;
  ctx.strokeStyle='#cbd0d5';ctx.lineWidth=1;
  for(let i=0;i<=5;i++){
    let x=x0+i*pw/5, y=y0+i*ph/5;
    ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+ph);ctx.moveTo(x0,y);ctx.lineTo(x0+pw,y);ctx.stroke();
    text(ctx,formatted(i*plotLoad/5,0),x-8,y0-15,'16px Arial');
    text(ctx,formatted(i*plotSettlement/5,2),15,y+6,'16px Arial');
  }
  text(ctx,'Carico applicato [kN]',365,79,'19px Arial');
  text(ctx,'Cedimento [mm]',14,94,'17px Arial');
  function plot(series,color){
    let previous=null;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=4;
    series.forEach(r=>{
      const x=x0+(Number(r.load)/plotLoad)*pw;
      const y=y0+(Number(r.meanSettlement)/plotSettlement)*ph;
      if(previous){ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(x,y);ctx.stroke();}
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();previous={x,y};
    });
  }
  plot(exercise,C.blue);plot(collaudo,C.green);
  ctx.fillStyle=C.blue;ctx.fillRect(200,793,24,5);text(ctx,'Esercizio / scarico',236,801,'20px Arial');
  ctx.fillStyle=C.green;ctx.fillRect(515,793,24,5);text(ctx,'Collaudo / scarico',550,801,'20px Arial');
  section(ctx,'DOCUMENTAZIONE FOTOGRAFICA',12,830,876);
  ctx.strokeStyle='#bebebe';ctx.lineWidth=2;ctx.strokeRect(22,877,856,584);
  const all=Array.isArray(photo)?photo:(photo?.dataUrl?[photo]:[]);
  const item=all.find(p=>p?.dataUrl);
  const image=await loadPhoto(item?.dataUrl);
  if(image){
    const box={x:48,y:896,w:804,h:507};
    const k=Math.min(box.w/image.width,box.h/image.height);
    const w=image.width*k,h=image.height*k;
    ctx.drawImage(image,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);
  }else text(ctx,'Fotografia non presente',315,1110,'22px Arial');
  text(ctx,item?.name||data?.photoCaption||'Foto 1',35,1444,'18px Arial');
  return el.toDataURL('image/png');
}
