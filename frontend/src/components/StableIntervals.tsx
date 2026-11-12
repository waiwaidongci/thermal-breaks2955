import type {StableInterval} from '../types/domain';
import {number,penalty} from '../utils/format';
import {Table} from './common/Table';

type Props={
 intervals:StableInterval[];
 feasibleMax:number;
 currentPenalty:number;
 activeIndex:number;
 onSelect:(index:number)=>void;
};

function widthOf(iv:StableInterval){
 if(iv.end_penalty===null)return Infinity;
 return iv.end_penalty-iv.start_penalty;
}
function contains(iv:StableInterval,beta:number){
 return beta>=iv.start_penalty&&(iv.end_penalty===null||beta<=iv.end_penalty);
}

export function StableIntervals({intervals,feasibleMax,currentPenalty,activeIndex,onSelect}:Props){
 const skipped=Array.from({length:feasibleMax},(_,i)=>i+1).filter(k=>!intervals.some(i=>i.segments_count===k));
 return <section className="section">
  <div className="section-heading">
   <h2>完整稳定区间：任意非负罚项的最优分段。</h2>
   <span>同一 DP frontier · 切换仅读取已存快照，不重新求解</span>
  </div>
  <p>对所有 β≥0 求目标 RSS+β(K−1) 的下包络，得到每个会成为最优的段数及其完整区间；临界值平局取更少段。区间是参数敏感性，不是断点置信区间。</p>
  <Table headers={['最优段数','稳定区间 β（左闭，右端为临界值）','区间宽度','断点（左段累计样本数）','RSS','核对']}>
   {intervals.map((iv,index)=>{
    const width=widthOf(iv);
    const here=contains(iv,currentPenalty);
    return <tr key={iv.segments_count} className={index===activeIndex?'selected-row':''}>
     <td><strong>{iv.segments_count} 段</strong>{here&&<small className="fire">← 当前 β={penalty(currentPenalty)} 所在</small>}</td>
     <td>{penalty(iv.start_penalty)} — {iv.end_penalty===null?'∞':penalty(iv.end_penalty)}</td>
     <td>{width===Infinity?'∞':penalty(width)}</td>
     <td>{iv.breakpoints.join(' / ')||'无断点'}</td>
     <td>{number(iv.optimal_rss,5)}</td>
     <td><button onClick={()=>onSelect(index)}>{index===activeIndex?'核对中 ✓':'核对断点 / 均温 / 目标 ↗'}</button></td>
     </tr>;
   })}
  </Table>
  <p><small>已跳过从未成为最优的段数：{skipped.length?skipped.join('、'):'无'}。共 {intervals.length} 个稳定区间，覆盖 β∈[0,∞) 且首尾相接。</small></p>
 </section>;
}
