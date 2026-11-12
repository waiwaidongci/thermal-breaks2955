export const number=(v:number,d=3)=>Number.isFinite(v)?v.toLocaleString('zh-CN',{maximumFractionDigits:d}):'—';
// Penalty boundaries can be extremely narrow (1e-17) or large; keep full
// meaningful precision instead of the display-rounded `number` formatter.
export const penalty=(v:number)=>{
 if(!Number.isFinite(v))return '—';
 const a=Math.abs(v);
 if(a!==0&&(a<1e-4||a>=1e12)){
  const [m,e]=v.toExponential(6).split('e');
  return `${m}×10^${parseInt(e,10)}`;
 }
 return v.toLocaleString('zh-CN',{maximumFractionDigits:10});
};
export const date=(v:string)=>new Date(v).toLocaleString('zh-CN',{hour12:false});
