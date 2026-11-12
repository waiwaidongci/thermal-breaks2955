import {number,penalty} from '../utils/format';
import type {StableInterval} from '../types/domain';
export function RunSummary({result,interval}:{result:any;interval?:StableInterval|null}){
 if(interval){
  return <div className="run-summary">
   <div><small>样本 / 最小段长</small><strong>{result.n}<em> / {result.min_size}</em></strong></div>
   <div><small>核对段数 / 可行上界</small><strong>{interval.segments_count}<em> / {result.feasible_max_segments}</em></strong></div>
   <div><small>RSS</small><strong>{number(interval.optimal_rss,3)}</strong></div>
   <div><small>稳定区间 β / 端目标</small><strong>{penalty(interval.start_penalty)}–{interval.end_penalty===null?'∞':penalty(interval.end_penalty)}<em> / {number(interval.objective_at_start,2)} → {interval.objective_at_end===null?'∞':number(interval.objective_at_end,2)}</em></strong></div>
  </div>;
 }
 return <div className="run-summary"><div><small>样本 / 最小段长</small><strong>{result.n}<em> / {result.min_size}</em></strong></div><div><small>选中段数 / 可行上界</small><strong>{result.segments_count}<em> / {result.feasible_max_segments}</em></strong></div><div><small>RSS</small><strong>{number(result.rss,3)}</strong></div><div><small>罚项 β / 总目标</small><strong>{number(result.penalty,2)}<em> / {number(result.objective,2)}</em></strong></div></div>;}
