/* SIMAP Explorer — Pure SVG Chart Components (no external deps) */
let _gc = 0;
const ugid = () => `c${++_gc}`;

const lp = (pts) => pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const ap = (pts,H,padB) => `${lp(pts)} L${pts.at(-1).x},${H-padB} L${pts[0].x},${H-padB} Z`;

/* ── Trend Area Chart ───────────────────────────────────── */
const TrendAreaChart = ({data, dataKey, color, height, twoLines, dk2, c2, xKey}) => {
  const dk=dataKey||'count', xk=xKey||'m', col=color||SC.accent, col2=c2||SC.cyan;
  const [tip, setTip] = React.useState(null);
  const gid  = React.useRef(ugid()).current;
  const gid2 = React.useRef(ugid()).current;
  const W=500, H=height||200;
  const P={t:8,r:8,b:28,l:38};
  const iW=W-P.l-P.r, iH=H-P.t-P.b;

  const v1=data.map(d=>d[dk]), v2=twoLines?data.map(d=>d[dk2]):[];
  const all=[...v1,...v2]; const mn=Math.min(...all)*0.92, mx=Math.max(...all)*1.05, rng=mx-mn||1;
  const px=i=>P.l+(i/(data.length-1))*iW;
  const py=v=>P.t+iH-((v-mn)/rng)*iH;
  const pts1=data.map((d,i)=>({x:px(i),y:py(d[dk])}));
  const pts2=twoLines?data.map((d,i)=>({x:px(i),y:py(d[dk2])})):[];
  const gridYs=[0.25,0.5,0.75].map(f=>P.t+iH*(1-f));
  const step=Math.ceil(data.length/6);

  const onMove=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const sx=((e.clientX-r.left)/r.width)*W;
    const idx=Math.round(Math.min(Math.max((sx-P.l)/iW*(data.length-1),0),data.length-1));
    setTip({x:pts1[idx].x,y:pts1[idx].y,v:v1[idx],lbl:data[idx][xk]});
  };

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{overflow:'visible'}} onMouseMove={onMove} onMouseLeave={()=>setTip(null)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.28"/><stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient>
        {twoLines&&<linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col2} stopOpacity="0.12"/><stop offset="100%" stopColor={col2} stopOpacity="0"/>
        </linearGradient>}
      </defs>
      {gridYs.map((y,i)=><line key={i} x1={P.l} y1={y} x2={W-P.r} y2={y} stroke={SC.border} strokeWidth="0.5" strokeDasharray="3,3"/>)}
      <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={SC.border} strokeWidth="0.5"/>
      {data.map((d,i)=>i%step===0&&<text key={i} x={px(i)} y={H-P.b+11} textAnchor="middle"
        fill={SC.muted} fontFamily="Space Mono,monospace" fontSize="7">{d[xk]}</text>)}
      {twoLines&&<path d={ap(pts2,H,P.b)} fill={`url(#${gid2})`}/>}
      <path d={ap(pts1,H,P.b)} fill={`url(#${gid})`}/>
      {twoLines&&<path d={lp(pts2)} fill="none" stroke={col2} strokeWidth="1.5" strokeDasharray="5,3"/>}
      <path d={lp(pts1)} fill="none" stroke={col} strokeWidth="2"/>
      {tip&&<>
        <line x1={tip.x} y1={P.t} x2={tip.x} y2={H-P.b} stroke={SC.border} strokeWidth="1" strokeDasharray="2,2"/>
        <circle cx={tip.x} cy={tip.y} r="3.5" fill={col} stroke={SC.bg} strokeWidth="1.5"/>
        <rect x={Math.min(tip.x-32,W-P.r-68)} y={Math.max(tip.y-30,P.t)} width={68} height={20} rx="3"
          fill="rgba(10,15,30,0.95)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8"/>
        <text x={Math.min(tip.x-32,W-P.r-68)+34} y={Math.max(tip.y-30,P.t)+12} textAnchor="middle"
          fill={SC.text} fontFamily="Space Mono,monospace" fontSize="8">{SD.fmt(tip.v)}</text>
      </>}
    </svg>
  );
};

/* ── Horizontal Bar Chart ───────────────────────────────── */
const HBarChart = ({data, dataKey, nameKey, height, fmtTip}) => {
  const dk=dataKey||'amount', nk=nameKey||'canton';
  const [hov,setHov]=React.useState(null);
  const gid=React.useRef(ugid()).current;
  const W=500, H=height||240, P={t:2,r:72,b:2,l:28};
  const iW=W-P.l-P.r, rowH=(H-P.t-P.b)/data.length;
  const bH=rowH*0.56, bPad=(rowH-bH)/2;
  const maxV=Math.max(...data.map(d=>d[dk]));

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={SC.accent}/><stop offset="100%" stopColor={SC.cyan}/>
        </linearGradient>
      </defs>
      {data.map((d,i)=>{
        const bw=(d[dk]/maxV)*iW, y=P.t+i*rowH, h=hov===i;
        return <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
          <rect x={P.l} y={y+bPad} width={iW} height={bH} fill={SC.border} opacity="0.25" rx="2"/>
          <rect x={P.l} y={y+bPad} width={bw} height={bH} fill={`url(#${gid})`} opacity={h?1:0.72} rx="2"/>
          <text x={P.l-4} y={y+rowH/2+1} textAnchor="end" dominantBaseline="middle"
            fill={h?SC.text:SC.muted} fontFamily="Space Mono,monospace" fontSize="8">{d[nk]}</text>
          <text x={P.l+bw+4} y={y+rowH/2+1} dominantBaseline="middle"
            fill={h?SC.accent:SC.muted} fontFamily="Space Mono,monospace" fontSize="8">
            {fmtTip?fmtTip(d[dk]):`${SD.fmt(d[dk])} Mio.`}
          </text>
        </g>;
      })}
    </svg>
  );
};

/* ── Process Donut ──────────────────────────────────────── */
const ProcessDonut = ({data, size}) => {
  const sz=size||170, cx=sz/2, cy=sz/2, R=sz*.42, r=sz*.27;
  const [hov,setHov]=React.useState(null);
  const total=data.reduce((s,d)=>s+d.value,0);
  let angle=-Math.PI/2;
  const slices=data.map((d,i)=>{
    const sw=(d.value/total)*2*Math.PI, a0=angle, a1=angle+sw; angle=a1;
    const [c0,s0,c1,s1]=[Math.cos(a0),Math.sin(a0),Math.cos(a1),Math.sin(a1)];
    const lg=sw>Math.PI?1:0;
    const path=`M${(cx+r*c0).toFixed(2)},${(cy+r*s0).toFixed(2)} L${(cx+R*c0).toFixed(2)},${(cy+R*s0).toFixed(2)} A${R},${R} 0 ${lg} 1 ${(cx+R*c1).toFixed(2)},${(cy+R*s1).toFixed(2)} L${(cx+r*c1).toFixed(2)},${(cy+r*s1).toFixed(2)} A${r},${r} 0 ${lg} 0 ${(cx+r*c0).toFixed(2)},${(cy+r*s0).toFixed(2)} Z`;
    const mid=a0+sw/2, lr=(R+r)/2;
    return {path,fill:d.fill,value:d.value,lx:cx+lr*Math.cos(mid),ly:cy+lr*Math.sin(mid),pct:d.value/total};
  });
  return (
    <svg width={sz} height={sz}>
      {slices.map((s,i)=>(
        <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
          <path d={s.path} fill={s.fill} opacity={hov===null||hov===i?1:0.4} stroke={SC.bg} strokeWidth="2"/>
          {s.pct>0.08&&<text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.9)" fontFamily="Space Mono,monospace" fontSize="9">{s.value}%</text>}
        </g>
      ))}
    </svg>
  );
};

/* ── CPV Treemap ────────────────────────────────────────── */
const CPVTreemap = ({data, height}) => {
  const H=height||220, W=500;
  const palette=[SC.accent,SC.cyan,SC.green,SC.purple,'#f59e0b','#ec4899','#6366f1',SC.muted];
  const total=data.reduce((s,d)=>s+d.size,0);
  let acc=0; const row1=[], row2=[];
  for(const d of data){(acc<total/2?row1:row2).push(d); if(acc<total/2)acc+=d.size;}
  const layoutRow=(items,ry,rh)=>{
    const rt=items.reduce((s,d)=>s+d.size,0); let rx=0;
    return items.map(d=>{const bw=(d.size/rt)*W; const b={x:rx,y:ry,w:bw,h:rh,name:d.name,size:d.size}; rx+=bw; return b;});
  };
  const boxes=[...layoutRow(row1,0,H/2),...layoutRow(row2,H/2,H/2)];
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {boxes.map((b,i)=>(
        <g key={i}>
          <rect x={b.x+1} y={b.y+1} width={b.w-2} height={b.h-2}
            fill={palette[i%palette.length]} fillOpacity="0.14"
            stroke={palette[i%palette.length]} strokeWidth="1" strokeOpacity="0.5" rx="3"/>
          {b.w>50&&b.h>20&&<text x={b.x+7} y={b.y+15} fill={palette[i%palette.length]}
            fontFamily="Space Mono,monospace" fontSize={Math.min(10,b.w/9)}>{b.name}</text>}
          {b.w>60&&b.h>34&&<text x={b.x+7} y={b.y+27} fill="rgba(255,255,255,0.32)"
            fontFamily="Space Mono,monospace" fontSize="8">{SD.fmt(b.size)} Mio.</text>}
        </g>
      ))}
    </svg>
  );
};

/* ── Competition Histogram ──────────────────────────────── */
const CompHistogram = ({height}) => {
  const H=height||130, W=500, P={t:8,r:8,b:26,l:32};
  const iW=W-P.l-P.r, iH=H-P.t-P.b;
  const hist=[{n:'1',v:5240,f:SC.red},{n:'2',v:4820,f:SC.purple},{n:'3',v:5890,f:SC.cyan},{n:'4',v:4100,f:SC.accent},{n:'5',v:2340,f:SC.green},{n:'6+',v:1240,f:SC.green}];
  const [hov,setHov]=React.useState(null);
  const maxV=Math.max(...hist.map(d=>d.v));
  const bW=iW/hist.length;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0.25,0.5,0.75].map((f,i)=><line key={i} x1={P.l} y1={P.t+iH*(1-f)} x2={W-P.r} y2={P.t+iH*(1-f)} stroke={SC.border} strokeWidth="0.5" strokeDasharray="3,3"/>)}
      <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={SC.border} strokeWidth="0.5"/>
      {hist.map((d,i)=>{
        const bh=(d.v/maxV)*iH, x=P.l+i*bW+bW*.1, w=bW*.8, h=hov===i;
        return <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
          <rect x={x} y={H-P.b-bh} width={w} height={bh} fill={d.f} opacity={h?.85:.62} rx="2"/>
          <text x={x+w/2} y={H-P.b+10} textAnchor="middle" fill={SC.muted} fontFamily="Space Mono,monospace" fontSize="8">{d.n}</text>
          {h&&<text x={x+w/2} y={H-P.b-bh-5} textAnchor="middle" fill={d.f} fontFamily="Space Mono,monospace" fontSize="8">{SD.fmt(d.v)}</text>}
        </g>;
      })}
    </svg>
  );
};

/* ── Kanton Compare ─────────────────────────────────────── */
const KantonCompareChart = ({data, selected, height}) => {
  const H=height||250, W=500, P={t:8,r:8,b:28,l:38};
  const [tip,setTip]=React.useState(null);
  const gradsRef=React.useRef({});
  selected.forEach(k=>{if(!gradsRef.current[k])gradsRef.current[k]=ugid();});
  const grads=gradsRef.current;
  const iW=W-P.l-P.r, iH=H-P.t-P.b;
  const all=selected.flatMap(k=>data.map(d=>d[k]));
  const mn=Math.min(...all)*0.9, mx=Math.max(...all)*1.05, rng=mx-mn||1;
  const px=i=>P.l+(i/(data.length-1))*iW;
  const py=v=>P.t+iH-((v-mn)/rng)*iH;
  const step=Math.ceil(data.length/6);

  const onMove=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const sx=((e.clientX-r.left)/r.width)*W;
    const idx=Math.round(Math.min(Math.max((sx-P.l)/iW*(data.length-1),0),data.length-1));
    setTip({idx,x:px(idx)});
  };
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{overflow:'visible'}} onMouseMove={onMove} onMouseLeave={()=>setTip(null)}>
      <defs>{selected.map(k=>(
        <linearGradient key={k} id={grads[k]} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SD.kantonColors[k]} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={SD.kantonColors[k]} stopOpacity="0"/>
        </linearGradient>
      ))}</defs>
      {[0.25,0.5,0.75].map((f,i)=><line key={i} x1={P.l} y1={P.t+iH*(1-f)} x2={W-P.r} y2={P.t+iH*(1-f)} stroke={SC.border} strokeWidth="0.5" strokeDasharray="3,3"/>)}
      <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={SC.border} strokeWidth="0.5"/>
      {data.map((d,i)=>i%step===0&&<text key={i} x={px(i)} y={H-P.b+11} textAnchor="middle"
        fill={SC.muted} fontFamily="Space Mono,monospace" fontSize="7">{d.month}</text>)}
      {selected.map(k=>{
        const pts=data.map((d,i)=>({x:px(i),y:py(d[k])}));
        const col=SD.kantonColors[k];
        return <g key={k}>
          <path d={ap(pts,H,P.b)} fill={`url(#${grads[k]})`}/>
          <path d={lp(pts)} fill="none" stroke={col} strokeWidth="2"/>
        </g>;
      })}
      {tip&&<>
        <line x1={tip.x} y1={P.t} x2={tip.x} y2={H-P.b} stroke={SC.border} strokeWidth="1" strokeDasharray="2,2"/>
        {selected.map(k=><circle key={k} cx={tip.x} cy={py(data[tip.idx][k])} r="3"
          fill={SD.kantonColors[k]} stroke={SC.bg} strokeWidth="1.5"/>)}
      </>}
    </svg>
  );
};

Object.assign(window, {
  TrendAreaChart, HBarChart, ProcessDonut, CPVTreemap,
  CompHistogram, KantonCompareChart,
});
