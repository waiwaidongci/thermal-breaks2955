import numpy as np
from .dynamic_program import reconstruct

_EPS=np.finfo(np.longdouble).eps
_TIE=_EPS*64
_TINY=np.finfo(np.longdouble).tiny


def _intersection(old,new):
 # beta where two lines y+beta*x are equal. Points carry (x=k-1, y=rss, k).
 (xp,yp,_),(xq,yq,_)=old,new
 return (yp-yq)/(xq-xp)


def _partition(frontier,costs,k):
 parts=reconstruct(frontier,k)
 segments=[dict(position=i+1,**costs.segment(start,end)) for i,(start,end) in enumerate(parts)]
 return parts,segments


def stability_intervals(frontier,costs):
 """Complete stable intervals of the optimal segment count over beta>=0.

 Lines L_k(beta)=rss_k+beta*(k-1). Their lower envelope is built once from the
 single DP frontier: points are inserted by increasing slope x=k-1 and kept
 while adjacent intersection betas strictly decrease along insertion order.
 A non-decreasing new intersection means the middle line is never uniquely
 minimal, so that segment count is dropped (collinear ties keep fewer segments).
 Never-optimal segment counts therefore never appear in the result.
 """
 n=frontier['n'];K=frontier['feasible_max_segments'];scale2=costs.scale*costs.scale
 rss=[frontier['dp'][k,n]*scale2 for k in range(1,K+1)]
 hull=[]
 for index,r in enumerate(rss):
  current=(np.longdouble(index),r,index+1)
  while len(hull)>=2:
   beta_prev=_intersection(hull[-2],hull[-1])
   beta_new=_intersection(hull[-1],current)
   rscale=max(abs(hull[-2][1]),abs(hull[-1][1]),abs(r),_TINY)
   if beta_new>=beta_prev-_TIE*rscale:
    hull.pop()
   else:
    break
  hull.append(current)
 bounds=[_intersection(hull[i],hull[i+1]) for i in range(len(hull)-1)]
 # Hull runs small k (high beta) -> large k (low beta); reverse for ascending beta.
 rev=list(reversed(hull));rev_bounds=list(reversed(bounds))
 raw=[]
 for i,(x,y,k) in enumerate(rev):
  start=np.longdouble(0) if i==0 else rev_bounds[i-1]
  end=None if i+1==len(rev) else rev_bounds[i]
  raw.append([k,start,end,y])
 # Numeric near-ties can leave a zero-width region; it is never uniquely optimal.
 cleaned=[]
 for k,start,end,y in raw:
  if end is not None and end<=start+_TIE*max(abs(start),abs(end),_TINY):
   continue
  cleaned.append([k,start,end,y])
 intervals=[]
 for i,(k,start,end,y) in enumerate(cleaned):
  lower=np.longdouble(0) if i==0 else cleaned[i-1][2]
  upper=None if i+1==len(cleaned) else cleaned[i+1][1]
  parts,segments=_partition(frontier,costs,k)
  objective_at=lambda beta:float(y+np.longdouble(beta)*(k-1))
  intervals.append({'segments_count':k,
   'start_penalty':float(max(lower,np.longdouble(0))),
   'end_penalty':None if upper is None else float(upper),
   'optimal_rss':float(y),
   'breakpoints':[end_idx for _,end_idx in parts[:-1]],
   'objective_at_start':objective_at(max(lower,np.longdouble(0))),
   'objective_at_end':None if upper is None else objective_at(upper),
   'segments':segments,
   'adjacent_mean_differences':[{'breakpoint':left['end'],'left_mean':left['mean'],'right_mean':right['mean'],'difference':right['mean']-left['mean']} for left,right in zip(segments,segments[1:])]})
 return intervals


def select_partition(frontier,costs,penalty):
 ks=np.arange(1,frontier['feasible_max_segments']+1)
 rss=frontier['dp'][1:,frontier['n']]*costs.scale*costs.scale
 objectives=rss+np.longdouble(penalty)*(ks-1)
 best=np.min(objectives)
 # Relative machine-precision tie only; ascending K selects fewer segments.
 tolerance=_TIE*np.maximum(np.abs(objectives),max(abs(best),_TINY))
 index=int(np.flatnonzero(objectives<=best+tolerance)[0]);k=int(ks[index])
 parts,segments=_partition(frontier,costs,k)
 return {'penalty':float(penalty),'segments_count':k,'breakpoints':[end for _,end in parts[:-1]],'rss':float(rss[index]),'objective':float(objectives[index]),'segments':segments,'adjacent_mean_differences':[{'breakpoint':left['end'],'left_mean':left['mean'],'right_mean':right['mean'],'difference':right['mean']-left['mean']} for left,right in zip(segments,segments[1:])]}


def evaluate_path(frontier,costs,penalties):
 # Preset penalties reuse the single DP frontier via select_partition (no rebuild).
 return [select_partition(frontier,costs,b) for b in sorted(set(penalties))]
