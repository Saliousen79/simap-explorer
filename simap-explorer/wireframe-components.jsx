/* SIMAP Explorer – Wireframe Primitive Components */
const WC = {
  paper:    '#fafaf8',
  border:   '#2d2d2d',
  fill:     '#e8e8e4',
  fillBlue: '#dbeafe',
  fillCyan: '#cffafe',
  accent:   '#3b82f6',
  cyan:     '#06b6d4',
  green:    '#10b981',
  red:      '#ef4444',
  muted:    '#999',
  text:     '#1a1a2e',
  sidebar:  '#f0f0ec',
  topbar:   '#f4f4f1',
};

const WirePill = ({label, active, small}) => (
  <div style={{
    padding: small ? '2px 8px' : '3px 10px', flexShrink: 0,
    border: `1.5px solid ${active ? WC.accent : WC.border}`,
    borderRadius: 20, cursor: 'pointer',
    background: active ? WC.fillBlue : 'transparent',
    fontFamily: 'Caveat, cursive', fontSize: small ? 11 : 12,
    color: active ? WC.accent : WC.text, whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: 4,
  }}>{label}{active && small && <span style={{fontSize:9, opacity:0.7}}>✕</span>}</div>
);

const WireSidebar = ({expanded, activePage = 1}) => (
  <div style={{
    width: expanded ? 200 : 52, minWidth: expanded ? 200 : 52,
    height: '100%', background: WC.sidebar,
    borderRight: `1.5px solid ${WC.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    transition: 'width 0.2s',
  }}>
    <div style={{padding: expanded ? '12px 14px' : '12px 0', textAlign: expanded ? 'left' : 'center', borderBottom: `1px solid #d4d4ce`, marginBottom: 6}}>
      <div style={{fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: WC.accent}}>{expanded ? 'SIMAP' : 'SI'}</div>
      {expanded && <div style={{fontFamily: 'Space Mono, monospace', fontSize: 9, fontWeight: 400, color: WC.muted}}>Explorer</div>}
    </div>
    {[{icon:'◉',label:'Overview'},{icon:'▦',label:'Dashboard'},{icon:'⤴',label:'Trends'},{icon:'◈',label:'Markt'}].map((item, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: expanded ? '8px 14px' : '8px 0',
        justifyContent: expanded ? 'flex-start' : 'center',
        background: i === activePage ? WC.fillBlue : 'transparent',
        borderLeft: i === activePage ? `2.5px solid ${WC.accent}` : '2.5px solid transparent',
      }}>
        <span style={{fontSize: 13, color: i === activePage ? WC.accent : '#666'}}>{item.icon}</span>
        {expanded && <span style={{fontFamily: 'Caveat, cursive', fontSize: 13, color: i === activePage ? WC.accent : WC.text}}>{item.label}</span>}
      </div>
    ))}
    <div style={{marginTop: 'auto', padding: expanded ? '8px 12px' : '6px 4px', borderTop: `1px solid #d4d4ce`, textAlign: 'center'}}>
      {expanded
        ? <div style={{background: WC.fillBlue, border: `1px solid ${WC.accent}`, borderRadius: 3, padding: '2px 6px', fontFamily: 'Space Mono, monospace', fontSize: 8, color: WC.accent}}>200k Aufträge</div>
        : <div style={{fontFamily: 'Space Mono, monospace', fontSize: 7, color: WC.accent}}>200k</div>}
    </div>
  </div>
);

const WireTopBar = ({title, filters, noFilters, subtitle}) => (
  <div style={{
    height: 50, minHeight: 50, background: WC.topbar,
    borderBottom: `1.5px solid ${WC.border}`,
    display: 'flex', alignItems: 'center',
    padding: '0 16px', gap: 10, boxSizing: 'border-box',
  }}>
    <div style={{flex:1}}>
      <div style={{fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: WC.text}}>{title}</div>
      {subtitle && <div style={{fontFamily: 'Caveat, cursive', fontSize: 10, color: WC.muted}}>{subtitle}</div>}
    </div>
    {!noFilters && (
      <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
        {(filters || ['2024', 'Alle Kantone', 'Alle CPV']).map((f, i) => (
          <WirePill key={i} label={typeof f === 'string' ? f : f.label} active={typeof f !== 'string' && f.active} />
        ))}
      </div>
    )}
  </div>
);

const WireKPI = ({value, label, delta, sub}) => (
  <div style={{
    flex: 1, minWidth: 0, padding: '10px 12px',
    border: `1.5px solid ${WC.border}`, borderRadius: 4,
    background: WC.paper, position: 'relative', boxSizing: 'border-box',
  }}>
    {sub && <div style={{fontFamily:'Space Mono,monospace', fontSize:7, color:WC.muted, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:3}}>{sub}</div>}
    <div style={{fontFamily: 'Space Mono, monospace', fontSize: 20, fontWeight: 700, color: WC.text, lineHeight: 1.1}}>{value}</div>
    {delta && <div style={{fontFamily: 'Caveat, cursive', fontSize: 10, color: WC.green, marginTop: 1}}>↑ {delta}</div>}
    <div style={{fontFamily: 'Caveat, cursive', fontSize: 11, color: WC.muted, marginTop: 3}}>{label}</div>
    <svg style={{position: 'absolute', bottom: 8, right: 8}} width={48} height={20}>
      <polyline points="0,16 8,12 18,14 28,8 36,10 44,4 48,2" fill="none" stroke={WC.accent} strokeWidth="1.5" opacity="0.6"/>
    </svg>
  </div>
);

/* Bar chart — vertical or horizontal */
const barVals = [0.85, 0.72, 0.68, 0.55, 0.50, 0.45, 0.38, 0.30, 0.62, 0.57, 0.43, 0.35];
const defaultBL = ['ZH','BE','VD','AG','SG','LU','TI','VS','GR','FR','SO','BL'];

const WireBarChart = ({h=160, bars=8, horizontal, labels, accent}) => {
  const lbs = labels || defaultBL;
  if (horizontal) return (
    <div style={{width:'100%', height:h, display:'flex', flexDirection:'column', justifyContent:'space-around', padding:'2px 0', boxSizing:'border-box'}}>
      {barVals.slice(0, bars).map((v, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:5, height:`${90/bars}%`}}>
          <span style={{fontFamily:'Space Mono,monospace', fontSize:7, color:WC.muted, width:14, textAlign:'right', flexShrink:0}}>{lbs[i]}</span>
          <div style={{flex:1, height:'55%', background:'#eee', borderRadius:2, overflow:'hidden'}}>
            <div style={{width:`${v*100}%`, height:'100%', background:accent&&i===0?accent:i===0?WC.accent:`rgba(59,130,246,${0.35+v*0.45})`, borderRadius:2}}/>
          </div>
          <span style={{fontFamily:'Space Mono,monospace', fontSize:7, color:WC.muted, width:28, flexShrink:0}}>{Math.round(v*12400)}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{width:'100%', height:h, display:'flex', alignItems:'flex-end', gap:2, padding:'0 4px', boxSizing:'border-box', borderBottom:`1.5px solid ${WC.border}`}}>
      {barVals.slice(0, bars).map((v, i) => (
        <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end'}}>
          <div style={{width:'76%', height:`${v*86}%`, background:i%2===0?WC.fillBlue:WC.fillCyan, border:`1px solid ${i%2===0?WC.accent:WC.cyan}`, borderRadius:'2px 2px 0 0'}}/>
          <span style={{fontFamily:'Space Mono,monospace', fontSize:6, color:WC.muted, marginTop:2}}>{lbs[i]||`#${i+1}`}</span>
        </div>
      ))}
    </div>
  );
};

/* Line chart — fixed internal viewBox, scales to any h */
const lp1 = "0,130 46,110 91,115 137,90 183,95 228,75 274,80 320,65 365,55 411,68 456,48 502,40";
const la1 = `0,180 ${lp1} 502,180`;
const lp2 = "0,145 46,135 91,140 137,120 183,125 228,110 274,115 320,95 365,88 411,100 456,78 502,70";

const WireLineChart = ({h=180, multi, showMonths}) => (
  <div style={{width:'100%'}}>
    <svg width="100%" height={h} viewBox="0 0 510 180" preserveAspectRatio="none">
      {[0.25,0.5,0.75].map(f => <line key={f} x1={0} y1={180*f} x2={510} y2={180*f} stroke="#d4d4ce" strokeWidth="0.5" strokeDasharray="4,4"/>)}
      <polygon points={la1} fill="rgba(59,130,246,0.1)"/>
      <polyline points={lp1} fill="none" stroke={WC.accent} strokeWidth="2"/>
      {multi && <polyline points={lp2} fill="none" stroke={WC.cyan} strokeWidth="1.5" strokeDasharray="5,3"/>}
      {multi && <polyline points="0,155 46,148 91,152 137,132 183,138 228,125 274,130 320,108 365,100 411,114 456,90 502,82" fill="none" stroke={WC.green} strokeWidth="1.5" strokeDasharray="3,5"/>}
      <line x1={0} y1={180} x2={510} y2={180} stroke={WC.border} strokeWidth="1"/>
    </svg>
    {showMonths && (
      <div style={{display:'flex', justifyContent:'space-between', padding:'2px 4px'}}>
        {['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'].map(m => (
          <span key={m} style={{fontFamily:'Space Mono,monospace', fontSize:6, color:WC.muted}}>{m}</span>
        ))}
      </div>
    )}
  </div>
);

/* Donut chart */
const WireDonut = ({size=130}) => {
  const cx=size/2, cy=size/2, r=size*.39, ir=size*.24;
  const segs=[{v:.35,c:WC.accent},{v:.25,c:WC.cyan},{v:.20,c:WC.green},{v:.12,c:WC.fill},{v:.08,c:'#c4c4c0'}];
  let a=-Math.PI/2;
  return (
    <svg width={size} height={size}>
      {segs.map((s,i)=>{
        const s0=a, e=a+s.v*2*Math.PI; a=e;
        const lg=s.v>.5?1:0;
        const x1=cx+r*Math.cos(s0),y1=cy+r*Math.sin(s0),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e);
        const xi1=cx+ir*Math.cos(s0),yi1=cy+ir*Math.sin(s0),xi2=cx+ir*Math.cos(e),yi2=cy+ir*Math.sin(e);
        return <path key={i} d={`M${xi1},${yi1}L${x1},${y1}A${r},${r} 0 ${lg} 1 ${x2},${y2}L${xi2},${yi2}A${ir},${ir} 0 ${lg} 0 ${xi1},${yi1}`} fill={s.c} stroke={WC.paper} strokeWidth="2"/>;
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily="Space Mono,monospace" fontSize="9" fill={WC.text}>Typ</text>
    </svg>
  );
};

/* Data table */
const tblW = [[82,68,42,72,62],[70,75,48,80,55],[90,60,70,65,48],[75,72,62,56,74],[66,84,52,70,58]];
const WireTable = ({rows=5, cols}) => {
  const c = cols || ['Titel','Auftraggeber','Kanton','Betrag CHF','Datum'];
  return (
    <div style={{width:'100%', border:`1.5px solid ${WC.border}`, borderRadius:3, overflow:'hidden'}}>
      <div style={{display:'grid', gridTemplateColumns:c.map(()=>'1fr').join(' '), background:WC.fill, borderBottom:`1.5px solid ${WC.border}`}}>
        {c.map((col,ci)=><div key={ci} style={{padding:'4px 7px', fontFamily:'Space Mono,monospace', fontSize:7, color:WC.text, fontWeight:700, borderRight:ci<c.length-1?`1px solid #d4d4ce`:'none'}}>{col}</div>)}
      </div>
      {Array.from({length:rows}).map((_,ri)=>(
        <div key={ri} style={{display:'grid', gridTemplateColumns:c.map(()=>'1fr').join(' '), borderBottom:`1px solid #e4e4e0`, background:ri%2===0?'transparent':'rgba(0,0,0,0.015)'}}>
          {c.map((_col,ci)=>(
            <div key={ci} style={{padding:'4px 7px', borderRight:ci<c.length-1?`1px solid #e8e8e4`:'none'}}>
              <div style={{height:7, background:'#d4d4ce', borderRadius:2, width:`${tblW[ri%5][ci%5]}%`, marginTop:2}}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* Treemap */
const WireTreemap = ({w=300, h=200}) => {
  const b=[
    {x:0,     y:0,      w:w*.55, h:h*.55, l:'Bauleistungen 45%', f:WC.fillBlue},
    {x:w*.55, y:0,      w:w*.45, h:h*.35, l:'IT 22%',            f:WC.fillCyan},
    {x:w*.55, y:h*.35,  w:w*.28, h:h*.65, l:'Dienst.',           f:'#dcfce7'},
    {x:w*.83, y:h*.35,  w:w*.17, h:h*.35, l:'Med',               f:WC.fill},
    {x:w*.83, y:h*.70,  w:w*.17, h:h*.30, l:'…',                 f:'#fce7f3'},
    {x:0,     y:h*.55,  w:w*.55, h:h*.45, l:'Infrastruktur 18%', f:'#e0e7ff'},
  ];
  return (
    <svg width={w} height={h}>
      {b.map((bl,i)=>(
        <g key={i}>
          <rect x={bl.x+1} y={bl.y+1} width={bl.w-2} height={bl.h-2} fill={bl.f} stroke={WC.border} strokeWidth="1"/>
          {bl.h>26&&<text x={bl.x+bl.w/2} y={bl.y+bl.h/2} textAnchor="middle" dominantBaseline="middle" fontFamily="Caveat,cursive" fontSize={Math.min(13,bl.h/3.5)} fill={WC.text}>{bl.l}</text>}
        </g>
      ))}
    </svg>
  );
};

/* Generic card container */
const WireCard = ({label, children, accent, flex, style={}, row}) => (
  <div style={{
    border:`1.5px solid ${accent?WC.accent:WC.border}`,
    borderRadius:4, padding:10,
    background:accent?WC.fillBlue:WC.paper,
    flex, overflow:'hidden', position:'relative',
    boxSizing:'border-box',
    display:'flex', flexDirection: row ? 'row' : 'column',
    gap: row ? 12 : 0,
    ...style,
  }}>
    {label&&<div style={{fontFamily:'Space Mono,monospace', fontSize:7, color:WC.muted, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:6, flexShrink:0}}>{label}</div>}
    {children}
  </div>
);

/* Full page shell */
const WireFrame = ({title, filters, sidebarExpanded, noFilters, activePage, children}) => (
  <div style={{width:1280, height:800, background:WC.paper, display:'flex', overflow:'hidden', border:`1px solid ${WC.border}`}}>
    <WireSidebar expanded={sidebarExpanded} activePage={activePage||0}/>
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0}}>
      <WireTopBar title={title} filters={filters} noFilters={noFilters}/>
      <div style={{flex:1, overflow:'hidden', padding:12, boxSizing:'border-box', display:'flex', flexDirection:'column', gap:8}}>
        {children}
      </div>
    </div>
  </div>
);

const DonutLegend = ({items}) => (
  <div style={{display:'flex', flexDirection:'column', gap:5}}>
    {items.map((t,i)=>(
      <div key={i} style={{display:'flex', alignItems:'center', gap:5}}>
        <div style={{width:8, height:8, background:[WC.accent,WC.cyan,WC.green,WC.fill,'#c4c4c0'][i], borderRadius:1, flexShrink:0}}/>
        <span style={{fontFamily:'Caveat,cursive', fontSize:11, color:WC.muted}}>{t}</span>
      </div>
    ))}
  </div>
);

Object.assign(window, {
  WC, WireFrame, WireCard, DonutLegend,
  WireTopBar, WireSidebar, WirePill,
  WireKPI, WireBarChart, WireLineChart,
  WireDonut, WireTable, WireTreemap,
});
