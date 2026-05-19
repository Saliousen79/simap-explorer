/* SIMAP Explorer — UI Components */

const SC = {
  bg:          '#0a0f1e',
  surface:     '#111827',
  surface2:    '#1a2234',
  border:      '#1f2937',
  accent:      '#3b82f6',
  cyan:        '#06b6d4',
  green:       '#10b981',
  red:         '#ef4444',
  purple:      '#8b5cf6',
  text:        '#f9fafb',
  muted:       '#6b7280',
  glass:       'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

/* Count-up animation hook */
const useCountUp = (target, duration) => {
  const dur = duration || 1400;
  const [val, setVal] = React.useState(0);
  const rafRef = React.useRef(null);
  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    let t0 = null;
    const animate = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return val;
};

/* Glass card container */
const GlassCard = ({label, children, style, accent, glow, row}) => (
  <div style={{
    background: SC.glass,
    border: `1px solid ${accent ? 'rgba(59,130,246,0.35)' : SC.glassBorder}`,
    borderRadius: 8, padding: 16,
    boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: row ? 'row' : 'column',
    boxShadow: glow ? '0 0 28px rgba(59,130,246,0.12)' : 'none',
    ...style,
  }}>
    {/* Top accent line */}
    {accent && <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent)'}}/>}
    {label && (
      <div style={{fontFamily:'Space Mono,monospace',fontSize:9,fontWeight:700,color:SC.muted,letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:10,flexShrink:0}}>
        {label}
      </div>
    )}
    {children}
  </div>
);

/* KPI Card with count-up */
const KPICard = ({rawValue, format, label, delta, positive, sparkData, sub}) => {
  const target = rawValue || 0;
  const counted = useCountUp(target);
  const decimals = target > 0 && target < 100 ? 1 : 0;
  const display = format ? format(counted) : SD.fmt(decimals > 0 ? parseFloat(counted.toFixed(decimals)) : Math.round(counted));
  const [hov, setHov] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0, padding: '14px 16px',
        background: SC.glass,
        border: `1px solid ${hov ? 'rgba(59,130,246,0.45)' : SC.glassBorder}`,
        borderRadius: 8, boxSizing: 'border-box', position: 'relative',
        overflow: 'hidden', cursor: 'default',
        boxShadow: hov ? '0 0 32px rgba(59,130,246,0.14)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}>
      {/* Top accent */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)'}}/>
      {sub && <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:4}}>{sub}</div>}
      <div style={{fontFamily:'Space Mono,monospace',fontSize:9,color:SC.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>{label}</div>
      <div style={{fontFamily:'Space Mono,monospace',fontSize:24,fontWeight:700,color:SC.text,lineHeight:1.1,letterSpacing:'-0.02em'}}>{display}</div>
      {delta && (
        <div style={{fontFamily:'Space Mono,monospace',fontSize:9,color:positive===false?SC.red:SC.green,marginTop:4}}>
          {positive === false ? '↓' : '↑'} {delta}
        </div>
      )}
      {sparkData && sparkData.length > 1 && (
        <svg style={{position:'absolute',bottom:8,right:8,opacity:0.55}} width={52} height={20}>
          <polyline
            points={sparkData.map((v,i)=>{
              const mx = Math.max(...sparkData), mn = Math.min(...sparkData);
              const x = i * (52 / (sparkData.length - 1));
              const y = 20 - ((v - mn) / (mx - mn || 1)) * 17;
              return `${x},${y}`;
            }).join(' ')}
            fill="none" stroke={SC.accent} strokeWidth="1.5"/>
        </svg>
      )}
    </div>
  );
};

/* Filter pill button */
const FilterPill = ({label, active, onToggle, removable}) => (
  <button onClick={onToggle} style={{
    padding: '4px 12px', flexShrink: 0,
    border: `1px solid ${active ? SC.accent : SC.border}`,
    borderRadius: 20, cursor: 'pointer',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: active ? SC.accent : SC.muted,
    fontFamily: 'Space Mono,monospace', fontSize: 10,
    whiteSpace: 'nowrap', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 5,
  }}>
    {label}
    {active && removable && <span style={{fontSize:8,lineHeight:1}}>✕</span>}
  </button>
);

/* Sidebar with hover expand */
const Sidebar = ({currentPage, onNavigate}) => {
  const [exp, setExp] = React.useState(false);
  const nav = [
    {id:'overview',icon:'◉',label:'Overview'},
    {id:'dashboard',icon:'▦',label:'Dashboard'},
    {id:'trends',icon:'⤴',label:'Trends'},
    {id:'markt',icon:'◈',label:'Markt'},
  ];
  return (
    <div
      onMouseEnter={() => setExp(true)}
      onMouseLeave={() => setExp(false)}
      style={{
        width: exp ? 200 : 52, minWidth: exp ? 200 : 52, height: '100%',
        background: '#080d1a', borderRight: `1px solid ${SC.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.24s cubic-bezier(0.4,0,0.2,1), min-width 0.24s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', flexShrink: 0, zIndex: 20,
      }}>
      <div style={{padding:'18px 16px',borderBottom:`1px solid ${SC.border}`,marginBottom:8,whiteSpace:'nowrap',overflow:'hidden'}}>
        <span style={{fontFamily:'Space Mono,monospace',fontSize:13,fontWeight:700,color:SC.accent,letterSpacing:'0.05em'}}>SIMAP</span>
        <span style={{fontFamily:'Space Mono,monospace',fontSize:10,color:SC.muted,marginLeft:6,opacity:exp?1:0,transition:'opacity 0.15s'}}>Explorer</span>
      </div>
      {nav.map(item => {
        const active = currentPage === item.id;
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 16px', justifyContent:'flex-start',
            background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
            outline:'none', cursor:'pointer',
            width:'100%', textAlign:'left',
            overflow:'hidden', whiteSpace:'nowrap',
            borderTop:'none', borderRight:'none', borderBottom:'none',
            borderLeft: `2px solid ${active ? SC.accent : 'transparent'}`,
            transition:'background 0.15s',
          }}>
            <span style={{fontSize:13,color:active?SC.accent:SC.muted,flexShrink:0}}>{item.icon}</span>
            <span style={{fontFamily:'Space Mono,monospace',fontSize:10,color:active?SC.accent:SC.muted,letterSpacing:'0.04em',opacity:exp?1:0,transition:'opacity 0.12s'}}>
              {item.label}
            </span>
          </button>
        );
      })}
      <div style={{marginTop:'auto',padding:'12px 16px',borderTop:`1px solid ${SC.border}`,overflow:'hidden',whiteSpace:'nowrap'}}>
        {exp
          ? <div style={{background:'rgba(59,130,246,0.1)',border:`1px solid rgba(59,130,246,0.25)`,borderRadius:4,padding:'4px 8px',fontFamily:'Space Mono,monospace',fontSize:8,color:SC.accent,textAlign:'center',letterSpacing:'0.08em'}}>200K AUFTRÄGE</div>
          : <div style={{fontFamily:'Space Mono,monospace',fontSize:7,color:SC.muted,textAlign:'center'}}>200K</div>
        }
      </div>
    </div>
  );
};

/* Top bar */
const TopBar = ({title, subtitle, children}) => (
  <div style={{
    height:54, minHeight:54, borderBottom:`1px solid ${SC.border}`,
    display:'flex', alignItems:'center', padding:'0 24px', gap:16,
    background:'rgba(8,13,26,0.85)', backdropFilter:'blur(10px)',
    boxSizing:'border-box', flexShrink:0, zIndex:10,
  }}>
    <div style={{flex:1, minWidth:0}}>
      <div style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:SC.text,letterSpacing:'-0.01em'}}>{title}</div>
      {subtitle && <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,marginTop:1,letterSpacing:'0.04em'}}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

/* Filter Drawer */
const FilterDrawer = ({state, onChange}) => {
  const opts = {
    year:   ['Alle Jahre','2024','2023','2022','2021'],
    canton: ['Alle Kantone','ZH','BE','VD','AG','SG','LU','TI','VS'],
    cpv:    ['Alle CPV','Bauleistungen','IT-Dienste','Infrastruktur','Medizin'],
    type:   ['Alle Verfahren','Offen','Selektiv','Freihändig','Einladung'],
  };
  const labels = {year:'Jahr', canton:'Kanton', cpv:'CPV-Branche', type:'Vergabetyp'};
  const activeFilters = Object.entries(state).filter(([k,v]) => v && opts[k] && v !== opts[k][0]);
  return (
    <div style={{
      width:196, minWidth:196, background:'#080d1a',
      borderRight:`1px solid ${SC.border}`,
      display:'flex', flexDirection:'column',
      padding:'16px 12px', gap:12, boxSizing:'border-box', overflow:'auto',
    }}>
      <div style={{fontFamily:'Space Mono,monospace',fontSize:8,fontWeight:700,color:SC.muted,letterSpacing:'0.12em'}}>FILTER</div>
      {Object.keys(opts).map(key => (
        <div key={key}>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,marginBottom:5,letterSpacing:'0.06em'}}>{labels[key]}</div>
          <select value={state[key] || opts[key][0]} onChange={e => onChange(key, e.target.value)}
            style={{width:'100%',padding:'6px 8px',background:SC.surface,border:`1px solid ${state[key]&&state[key]!==opts[key][0]?SC.accent:SC.border}`,borderRadius:4,color:SC.text,fontFamily:'Space Mono,monospace',fontSize:9,outline:'none',cursor:'pointer',appearance:'none'}}>
            {opts[key].map(o => <option key={o} value={o} style={{background:SC.surface}}>{o}</option>)}
          </select>
        </div>
      ))}
      {activeFilters.length > 0 && (
        <div>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,letterSpacing:'0.06em',marginBottom:5}}>AKTIV</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {activeFilters.map(([k,v]) => (
              <div key={k} onClick={() => onChange(k, opts[k][0])} style={{
                display:'flex',alignItems:'center',gap:4,padding:'2px 7px',
                background:'rgba(59,130,246,0.15)',border:`1px solid rgba(59,130,246,0.35)`,
                borderRadius:20,color:SC.accent,fontFamily:'Space Mono,monospace',fontSize:8,cursor:'pointer',
              }}>{v} <span style={{fontSize:7,opacity:0.7}}>✕</span></div>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => Object.keys(opts).forEach(k => onChange(k, null))} style={{
        marginTop:'auto',padding:'7px',border:`1px solid ${SC.border}`,borderRadius:4,
        background:'transparent',color:SC.muted,fontFamily:'Space Mono,monospace',
        fontSize:8,cursor:'pointer',letterSpacing:'0.06em',
        transition:'color 0.15s, border-color 0.15s',
      }}>↺ Zurücksetzen</button>
    </div>
  );
};

/* Data table */
const DataTable = ({columns, data, maxHeight}) => {
  const [hov, setHov] = React.useState(null);
  return (
    <div style={{width:'100%',overflow:'auto',maxHeight}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr>{columns.map((col,i) => (
            <th key={i} style={{
              padding:'7px 12px',textAlign:col.align||'left',color:SC.muted,
              fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:8,
              letterSpacing:'0.08em',textTransform:'uppercase',
              borderBottom:`1px solid ${SC.border}`,whiteSpace:'nowrap',
            }}>{col.label}</th>
          ))}</tr>
        </thead>
        <tbody>{data.map((row,ri) => (
          <tr key={ri} onMouseEnter={() => setHov(ri)} onMouseLeave={() => setHov(null)}
            style={{
              background:hov===ri?'rgba(59,130,246,0.06)':ri%2===0?'transparent':'rgba(255,255,255,0.015)',
              borderLeft: hov===ri ? `2px solid ${SC.accent}` : '2px solid transparent',
              transition:'background 0.1s',
            }}>
            {columns.map((col,ci) => (
              <td key={ci} style={{
                padding:'7px 12px',
                color:col.color?col.color(row[col.key],row):SC.text,
                textAlign:col.align||'left',
                borderBottom:`1px solid ${SC.border}`,
                fontFamily:'Space Mono,monospace',fontSize:10,
                whiteSpace:col.wrap?'normal':'nowrap',
                overflow:'hidden',textOverflow:'ellipsis',maxWidth:220,
              }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

Object.assign(window, {
  SC, useCountUp, GlassCard, KPICard, FilterPill,
  Sidebar, TopBar, FilterDrawer, DataTable,
});
