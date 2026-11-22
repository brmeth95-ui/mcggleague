/** Screenshot recognition is intentionally best-effort and always requires review. */
export type RecognizedScreen={levels:(number|null)[];medals:(string|null)[];ocr:string;warnings:string[]};
type Ref={file:string;label:string;side:number};
const refs:Ref[]=[
 {file:"mvp-blue",label:"MVP",side:0},{file:"mvp-red",label:"MVP",side:1},
 {file:"mvp-purple",label:"MVP",side:0},{file:"mvp-gold",label:"MVP",side:1},
 {file:"carry-blue",label:"CARRY",side:0},{file:"carry-red",label:"CARRY",side:1},
 {file:"tank-blue",label:"TANK",side:0},{file:"tank-red",label:"TANK",side:1},
 {file:"mvp-blue-extra",label:"MVP",side:0},{file:"mvp-red-extra",label:"MVP",side:1},{file:"mvp-red-alt",label:"MVP",side:1}
];
const dim=54;
async function imgFrom(file:File):Promise<ImageBitmap>{return createImageBitmap(file);}
async function reference(file:string):Promise<Uint8ClampedArray>{
 const response=await fetch("/assets/medal-"+file+".webp");
 if(!response.ok)throw Error("Missing badge reference "+file);
 const blob=await response.blob(),img=await createImageBitmap(blob);
 const c=document.createElement("canvas");c.width=dim;c.height=dim;
 const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unsupported");
 ctx.drawImage(img,0,0,dim,dim);img.close();
 return ctx.getImageData(0,0,dim,dim).data;
}
function difference(a:Uint8ClampedArray,b:Uint8ClampedArray):number{
 let sum=0,n=0;
 for(let y=5;y<49;y+=2)for(let x=4;x<50;x+=2){
  const i=(y*dim+x)*4;
  // RGB, central badge (avoid outer border and background)
  sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);n+=3;
 }
 return sum/n;
}
function crop(ctx:CanvasRenderingContext2D,x:number,y:number):Uint8ClampedArray{return ctx.getImageData(x-27,y-27,dim,dim).data;}
function badges(ctx:CanvasRenderingContext2D,refImgs:{ref:Ref;data:Uint8ClampedArray}[]):(string|null)[]{
 const result:(string|null)[]=[];
 for(let side=0;side<2;side++)for(let row=0;row<4;row++){
  const xc=side===0?588:687,yc=120+104*row;
  let best=Infinity,bestLabel="",second=Infinity;
  for(const {ref,data} of refImgs.filter(t=>t.ref.side===side)){
   let score=Infinity;
   for(const dx of [-3,0,3])for(const dy of [-3,0,3]){
    score=Math.min(score,difference(crop(ctx,xc+dx,yc+dy),data));
   }
   if(score<best){if(ref.label!==bestLabel)second=best;best=score;bestLabel=ref.label;}
   else if(ref.label!==bestLabel)second=Math.min(second,score);
  }
  result[side*4+row]=best<26&&second-best>5?bestLabel:null;
 }
 return result;
}
function numericCrop(ctx:CanvasRenderingContext2D,side:number,row:number):HTMLCanvasElement{
 const x=side===0?350:832,y=97+104*row,w=80,h=55;
 const source=ctx.getImageData(x,y,w,h);
 const c=document.createElement("canvas");c.width=w*4;c.height=h*4;
 const output=c.getContext("2d");if(!output)throw Error("Canvas unsupported");
 const p=document.createElement("canvas");p.width=w;p.height=h;
 const pc=p.getContext("2d");if(!pc)throw Error("Canvas unsupported");
 const d=source.data;
 for(let i=0;i<d.length;i+=4){
  const white=Math.min(d[i],d[i+1],d[i+2])>167;
  d[i]=d[i+1]=d[i+2]=white?0:255;d[i+3]=255;
 }
 pc.putImageData(source,0,0);output.imageSmoothingEnabled=false;output.drawImage(p,0,0,w*4,h*4);
 return c;
}
export async function recognizeScreenshot(file:File,progress?:(state:string)=>void):Promise<RecognizedScreen>{
 const warnings:string[]=[];
 const image=await imgFrom(file);
 // Normalization is for full 16:9 MCGG result screens, not partial screenshots.
 const c=document.createElement("canvas");c.width=1280;c.height=576;
 const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unsupported");
 ctx.drawImage(image,0,0,1280,576);image.close();
 progress?.("Распознаю медали по изображениям…");
 let medalValues:(string|null)[]=Array(8).fill(null);
 try{
  const templates=await Promise.all(refs.map(async ref=>({ref,data:await reference(ref.file)})));
  medalValues=badges(ctx,templates);
 }catch(err){warnings.push("Автоопределение медалей недоступно: "+String(err));}
 progress?.("Считываю уровни командиров…");
 let levels:(number|null)[]=Array(8).fill(null),ocr="";
 try{
  const {createWorker,PSM}=await import("tesseract.js");
  const worker=await createWorker("eng");
  try{
   await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE,tessedit_char_whitelist:"0123456789"});
   for(let side=0;side<2;side++)for(let row=0;row<4;row++){
    const index=side*4+row;
    const r=await worker.recognize(numericCrop(ctx,side,row));
    const candidates=(r.data.text||"").match(/\d{1,3}/g)||[];
    const value=candidates.map(Number).find(v=>v>=1&&v<=300);
    levels[index]=value??null;
   }
   progress?.("Считываю ники и текст скриншота…");
   await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,tessedit_char_whitelist:""});
   const result=await worker.recognize(file);ocr=result.data.text||"";
  }finally{await worker.terminate();}
 }catch(err){warnings.push("OCR недоступен ("+String(err)+"). Уровни можно внести вручную.");}
 if(!ocr.trim())warnings.push("Ники распознаны не полностью. Проверь состав вручную.");
 return {levels,medals:medalValues,ocr,warnings};
}
