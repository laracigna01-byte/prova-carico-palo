import ExcelJS from 'exceljs';
import {capturePaloTable,capturePaloChart,capturePaloPhoto} from './paloCapture.js';
import {certificateRows,firmaLaboratorioLabel,firmaLaboratorioNome} from '../office/paloCertificateFields.js';

// La minuta tecnica si inserisce come immagine, come nella Piastra.
// I dati del certificato restano celle Excel editabili.
const clean=v=>String(v??'');
const safeNumber=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null;};
function box(sheet,from,to,label,value){
  sheet.mergeCells(from);sheet.mergeCells(to);
  const l=sheet.getCell(from.split(':')[0]),v=sheet.getCell(to.split(':')[0]);
  l.value=label;v.value=clean(value);
  l.font={name:'Arial',size:8,bold:true,color:{argb:'FF4D4D4D'}};
  v.font={name:'Arial',size:8,color:{argb:'FF292929'}};
  l.alignment={vertical:'middle'};v.alignment={vertical:'middle',wrapText:true};
  v.border={bottom:{style:'hair',color:{argb:'FFBBBBBB'}}};
}
function fill(sheet,range,caption){
  sheet.mergeCells(range);
  const c=sheet.getCell(range.split(':')[0]);c.value=caption;c.font={name:'Arial',size:8,bold:true,color:{argb:'FF292929'}};
  c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8EAED'}};
  c.alignment={vertical:'middle'};
}
function imageDataUrl(workbook,uri){
  if(!uri?.startsWith('data:image/'))return null;
  const m=/^data:image\/(png|jpe?g);base64,(.+)$/i.exec(uri);
  if(!m)return null;
  return workbook.addImage({base64:uri,extension:m[1].toLowerCase()==='png'?'png':'jpeg'});
}
export async function buildPaloExcel({data={},result={},photo=[],office={}}){
  const book=new ExcelJS.Workbook();book.creator='DISMAT Elaborazioni Palo';
  const ws=book.addWorksheet('CERTIFICATO',{views:[{showGridLines:false}]});
  // Griglia fitta per rispettare il modello storico del laboratorio.
  for(let i=1;i<=41;i++)ws.getColumn(i).width=621/256;
  ws.getColumn(1).width=146/256;
  ws.getColumn(42).width=1206/256;
  for(let i=1;i<=61;i++)ws.getRow(i).height=12.95;
  ws.getRow(1).height=76;
  ws.pageSetup={paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,
    margins:{left:0.16,right:0.16,top:0.17,bottom:0.17,header:0,footer:0},
    printArea:'A1:AN61'};
  ws.properties.pageSetUpPr={fitToPage:true};
  const logoRes=await fetch('/logo-dismat.jpg');
  if(logoRes.ok){
    const logo=book.addImage({buffer:await logoRes.arrayBuffer(),extension:'jpeg'});
    ws.addImage(logo,{tl:{col:1,row:0.2},ext:{width:76,height:66}});
  }
  ws.mergeCells('G1:AN1');
  const title=ws.getCell('G1');
  title.value="L A B O R A T O R I O\nD I S M A T\nSperimentazione sulle Strutture e sui Materiali da Costruzione\nAutorizzato ai sensi dell'art. 20 Legge 1086/71 con D.M. 415 del 01/12/2020\nc/da Andolina S.S. 122 Km 28 92024 CANICATTI' (AG)\nPI/CF 04534491008 - Reg. Imprese di Agrigento - Cap. Sociale € 280.300 i.v.\ntel. 0922 859406 - info.dismat@gmail.com - www.dismat.it";
  title.font={name:'Arial',size:7,bold:true,color:{argb:'FF292929'}};
  title.alignment={horizontal:'right',vertical:'middle',wrapText:true};
  box(ws,'B2:F2','G2:N2','Certificato nr.',office.numeroDocumento);
  box(ws,'O2:R2','S2:Z2','Data',office.dataDocumento);
  box(ws,'AA2:AF2','AG2:AN2','Natura campioni',office.naturaCampioni||'Palo');
  box(ws,'B3:F3','G3:N3','Protocollo',office.protocollo);
  box(ws,'O3:R3','S3:Z3','Data',office.dataProtocollo);
  box(ws,'AA3:AF3','AG3:AN3','Data prova',office.dataProva||data.dataProva);
  box(ws,'B4:F4','G4:N4','Verbale accett.',office.verbaleAccettazione);
  box(ws,'O4:R4','S4:Z4','Data',office.dataAccettazione);
  const adminRows=certificateRows(data,office);
  adminRows.forEach(({label,value},i)=>{
    const row=i+5;
    box(ws,`B${row}:N${row}`,`O${row}:AN${row}`,label,value);
  });
  // Testi lunghi: Oggetto dei lavori visibile su piu righe, senza tagliare il contenuto.
  ws.getRow(5).height=37;
  ws.getCell('O5').alignment={vertical:'middle',wrapText:true};
  ws.getRow(15).height=16;
  const docTitle=office.tipoDocumento==='RAPPORTO DI PROVA'?'RAPPORTO DI PROVA':'CERTIFICATO DI PROVA';
  fill(ws,'B15:AN15',docTitle+' - CARICO STATICO ASSIALE SU PALO');

  // La tabella resta nella posizione approvata, senza rimpicciolire le letture.
  const table=await capturePaloTable(result);
  // Grafico orizzontale e fotografia sono due immagini separate per
  // mantenere sempre le proporzioni, anche dopo apertura/stampa in Excel.
  const chart=capturePaloChart(result);
  const picture=await capturePaloPhoto(photo,data);
  const tid=imageDataUrl(book,table);
  const cid=imageDataUrl(book,chart);
  const pid=imageDataUrl(book,picture);
  if(tid!==null)ws.addImage(tid,{tl:{col:1,row:16},br:{col:21,row:55}});
  // Ventaglio completo sulla destra: la larghezza lascia un margine di stampa
  // e l'altezza e calcolata dal rapporto originale, mai stirata.
  const chartWidth=410;
  if(cid!==null)ws.addImage(cid,{
    tl:{col:21,row:16},
    ext:{width:chartWidth,height:Math.round(chartWidth*740/1200)}
  });
  if(pid!==null)ws.addImage(pid,{
    tl:{col:21,row:33},
    ext:{width:chartWidth,height:Math.round(chartWidth*860/1200)}
  });
  ws.mergeCells('B58:T58');ws.getCell('B58').value='Lo Sperimentatore';
  ws.mergeCells('V58:AN58');ws.getCell('V58').value=firmaLaboratorioLabel(office);
  ws.mergeCells('B59:T59');ws.getCell('B59').value=office.nomeSperimentatore||data.tecnico||'';
  ws.mergeCells('V59:AN59');ws.getCell('V59').value=firmaLaboratorioNome(office);
  for(const ref of ['B58','B59','V58','V59']){ws.getCell(ref).alignment={horizontal:'center'};ws.getCell(ref).font={name:'Arial',size:8,bold:ref.endsWith('59')}}
  const detail=book.addWorksheet('LETTURE',{views:[{state:'frozen',ySplit:1}]});
  detail.columns=[{header:'N',key:'n',width:7},{header:'Ciclo',key:'cycle',width:21},{header:'% carico',key:'pct',width:13},{header:'Min',key:'min',width:10},{header:'Pressione bar',key:'bar',width:17},{header:'Carico kN',key:'load',width:17},{header:'C1 mm',key:'c1',width:14},{header:'C2 mm',key:'c2',width:14},{header:'C3 mm',key:'c3',width:14},{header:'Cedimento medio mm',key:'avg',width:23}];
  (result.rows||[]).forEach(r=>detail.addRow({n:r.stepNo,cycle:r.cycleLabel,pct:r.percent,min:r.waitMinutes,bar:safeNumber(r.pressure),load:safeNumber(r.load),c1:safeNumber(r.comparatorValues?.c1),c2:safeNumber(r.comparatorValues?.c2),c3:safeNumber(r.comparatorValues?.c3),avg:safeNumber(r.meanSettlement)}));
  detail.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
  detail.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF303030'}};
  const raw=book.addWorksheet('LETTURE ORIGINALI');
  raw.columns=[{header:'Gradino',key:'step',width:14},{header:'Ciclo',key:'cycle',width:24},{header:'Comparatore',key:'comp',width:17},...Array.from({length:9},(_,i)=>({header:'Lettura '+(i+1),key:'r'+i,width:15}))];
  for(const step of result.rows||[]){
    for(const comp of ['c1','c2','c3']){
      const values=step.readings?.[comp]||[];
      raw.addRow({step:step.stepNo,cycle:step.cycleLabel,comp,...Object.fromEntries(Array.from({length:9},(_,i)=>['r'+i,safeNumber(values[i])]))});
    }
  }
  return book;
}
export async function exportPaloExcel(payload){
  const book=await buildPaloExcel(payload);
  const bytes=await book.xlsx.writeBuffer();
  const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`CERTIFICATO-PALO-${clean(payload.data?.pileId||payload.data?.reportId||'PROVA').replace(/[^a-z0-9_-]+/gi,'_')}.xlsx`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
