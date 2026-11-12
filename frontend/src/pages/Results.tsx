import {useState,useEffect} from 'react';
import {PageTitle} from '../components/common/PageTitle';
import {Empty} from '../components/common/Empty';
import {Badge} from '../components/common/Badge';
import {ThermalChart} from '../components/ThermalChart';
import {RunSummary} from '../components/RunSummary';
import {PenaltyPath} from '../components/PenaltyPath';
import {SegmentTable} from '../components/SegmentTable';
import {StableIntervals} from '../components/StableIntervals';
import type {StableInterval} from '../types/domain';

export function ResultsPage({runs,selectedId,select}:any){
 const run=runs.find((r:any)=>r.id===selectedId)||runs[0];
 const result=run?.result;
 // -1 = the run's current-penalty partition; >=0 = a stored stability interval snapshot.
 const [activeIndex,setActiveIndex]=useState(-1);
 useEffect(()=>{setActiveIndex(-1);},[run?.id]);
 const intervals:StableInterval[]|undefined=result?.penalty_stability;
 const interval:StableInterval|null=activeIndex>=0&&intervals?intervals[activeIndex]:null;
 // The active view is always a stored snapshot; selecting an interval never calls the API.
 const view=interval??result;
 return <>
  <PageTitle index="04" title="把断点放回整段热程。" description="断点 b = 左侧累计样本数；样本 b 仍在左段，b+1 开始右段。"/>
  <label>归档运行
   <select value={run?.id||''} onChange={e=>select(runs.find((r:any)=>r.id===+e.target.value))}>
    {runs.map((r:any)=><option key={r.id} value={r.id}>#{r.id} {r.name}</option>)}
   </select>
  </label>
  {run&&<p><Badge status={run.status}/>　{run.error}</p>}
  {!result
   ? <Empty title={run?.status==='failed'?'本次分段未完成':'等待真实 worker 求解'} help={run?.error||'短任务每3秒刷新；请先在配置页建立运行。'}/>
   : <>
    <RunSummary result={result} interval={interval}/>
    {interval&&<p className="interval-banner">正在核对稳定区间（{interval.segments_count} 段，β {interval.start_penalty}–{interval.end_penalty===null?'∞':interval.end_penalty}）；分段取自本次运行的已存快照，未重新求解。
     <button className="text-link" onClick={()=>setActiveIndex(-1)}>← 返回当前 β={result.penalty} 的分段</button></p>}
    <ThermalChart series={result.series} segments={view.segments}/>
    <div className="interpretation"><strong>断点是离线近似的切分位置。</strong><p>平滑漂移也可能被表示为多段常值；相邻均值差不是置信区间、显著性检验或工艺原因。巡查前请核对采样和仪器记录。</p></div>
    <SegmentTable view={view}/>
    {intervals&&intervals.length>0
      ? <StableIntervals intervals={intervals} feasibleMax={result.feasible_max_segments} currentPenalty={result.penalty} activeIndex={activeIndex} onSelect={setActiveIndex}/>
      : <div className="section"><p><small>该历史运行生成于稳定区间分析上线之前，仅保留当时的预设罚项路径；原研究与巡查说明仍可在本页与“巡查审阅”查看。</small></p></div>}
    <PenaltyPath result={result}/>
    <details className="provenance"><summary>冻结输入指纹、精度与规则</summary><p className="fingerprint">{result.fingerprint}</p><p>origin={result.numeric_stability.origin} / scale={result.numeric_stability.scale} / {result.numeric_stability.prefix_precision}</p><p>{result.tie_rule}</p><p>{result.stability_definition||'目标 RSS + β(K−1)。'}</p><p>目标 RSS + β(K−1)，预设上界 {result.requested_max_segments}，实际可行上界 {result.feasible_max_segments}。</p></details>
    <a className="text-link" href="#notes">形成可审阅的巡查说明 →</a>
   </>}
 </>;
}
