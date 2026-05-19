/* SIMAP Explorer — Page Components (all V2 layouts) */

const kpiSpark = [980,1020,1180,1050,1340,1280,1520,1410,890,920,1480,1620];

/* ── OVERVIEW V2 ─────────────────────────────────────────────── */
const OverviewPage = () => (
  <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,padding:'16px 20px',overflow:'auto',boxSizing:'border-box'}}>
    {/* KPI row */}
    <div style={{display:'flex',gap:12,flexShrink:0}}>
      <KPICard rawValue={187432}  label="Ausschreibungen"          delta="+8.4% YoY"  sparkData={kpiSpark}/>
      <KPICard rawValue={4.8}     label="Auftragswert CHF Mrd."    delta="+12.1% YoY"
        format={v=>`${v.toFixed(1)} Mrd.`}  sparkData={kpiSpark.map(v=>v*3.1)}/>
      <KPICard rawValue={3.2}     label="Angebote / Ausschreibung"
        format={v=>`Ø ${v.toFixed(1)}`}     sparkData={[3.1,2.9,3.0,3.2,3.1,3.3,3.2,3.4,3.1,3.2,3.3,3.2]}/>
      <KPICard rawValue={12430}   label="Auftraggeber"             delta="+3.1% YoY"  sparkData={kpiSpark.map(v=>v*0.08)}/>
    </div>

    {/* 3-column chart grid */}
    <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,minHeight:0}}>
      <GlassCard label="Kantone — SUM(award_amount) CHF Mio.">
        <HBarChart data={SD.cantonData} height={230}/>
      </GlassCard>
      <GlassCard label="Ausschreibungen / Monat (publication_date)">
        <TrendAreaChart data={SD.monthlyTrend} height={230}/>
      </GlassCard>
      <GlassCard label="Top CPV Branchen (cpv_code_main)">
        <HBarChart data={SD.cpvData} nameKey="name" height={230} fmtTip={v=>`CHF ${SD.fmt(v)} Mio.`}/>
      </GlassCard>
    </div>

    {/* Recent awards */}
    <GlassCard label="Neueste Vergaben — ORDER BY award_decision_date DESC" style={{flexShrink:0}}>
      <DataTable
        maxHeight={185}
        columns={[
          {label:'Titel',     key:'title',  wrap:true},
          {label:'Auftraggeber', key:'proc'},
          {label:'KT',        key:'canton', align:'center'},
          {label:'Betrag CHF',key:'amount', align:'right',
            render:v=>`CHF ${SD.fmt(v)}`, color:()=>SC.accent},
          {label:'Datum',     key:'date',   color:()=>SC.muted},
          {label:'Gewinner',  key:'winner'},
          {label:'Angebote',  key:'subs',   align:'center',
            color:(v)=>v<=1?SC.red:SC.green},
        ]}
        data={SD.recentAwards}
      />
    </GlassCard>
  </div>
);

/* ── DASHBOARD V2 ─────────────────────────────────────────────── */
const DashboardPage = () => {
  const [filters, setFilters] = React.useState({year:null,canton:null,cpv:null,type:null});
  const setFilter = (k, v) => setFilters(f => ({...f, [k]: v}));

  const mult    = filters.year==='2023' ? 0.92 : filters.year==='2022' ? 0.84 : 1;
  const ctMult  = filters.canton && filters.canton !== 'Alle Kantone' ? 0.13 : 1;
  const fCount  = Math.round(187432 * mult * ctMult);
  const fAmount = parseFloat((4.8 * mult * ctMult).toFixed(1));

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden'}}>
      <FilterDrawer state={filters} onChange={setFilter}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{flex:1,padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,overflow:'auto',boxSizing:'border-box'}}>
          {/* KPIs — re-animate on filter change via key */}
          <div style={{display:'flex',gap:12,flexShrink:0}} key={`${fCount}-${fAmount}`}>
            <KPICard rawValue={fCount}  label="Ausschreibungen"         sparkData={kpiSpark}/>
            <KPICard rawValue={fAmount} label="Auftragswert CHF Mrd."
              format={v=>`${v.toFixed(1)} Mrd.`}                        sparkData={kpiSpark.map(v=>v*3)}/>
            <KPICard rawValue={2.8}    label="Angebote / Ausschreibung"
              format={v=>`Ø ${v.toFixed(1)}`}                           sparkData={[2.8,2.9,2.7,2.8,3.0,2.8,2.7,2.9,2.8,3.1,2.8,2.9]}/>
            <KPICard rawValue={3840}   label="Auftraggeber"             sparkData={kpiSpark.map(v=>v*0.02)}/>
          </div>

          <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,minHeight:0}}>
            <GlassCard label="Ausschreibungen / Monat">
              <TrendAreaChart data={SD.monthlyTrend} height={190}/>
            </GlassCard>
            <GlassCard label="Kantone — Auftragswert CHF Mio.">
              <HBarChart data={SD.cantonData} height={190}/>
            </GlassCard>
          </div>

          <GlassCard label="Top Gewinner — winner_name / winner_id" style={{flexShrink:0}}>
            <DataTable
              maxHeight={190}
              columns={[
                {label:'Unternehmen', key:'name',  wrap:true},
                {label:'KT',          key:'canton', align:'center'},
                {label:'Aufträge',    key:'awards', align:'right'},
                {label:'Total CHF',   key:'total',  align:'right',
                  render:v=>`CHF ${SD.fmt(v)}`, color:()=>SC.accent},
                {label:'Ø CHF',       key:'avg',    align:'right',
                  render:v=>SD.fmt(v), color:()=>SC.muted},
              ]}
              data={SD.topWinners}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

/* ── TRENDS V2 ────────────────────────────────────────────────── */
const KANTON_ALL = ['ZH','BE','VD','AG','SG','LU'];

const TrendsPage = () => {
  const [selected, setSelected] = React.useState(['ZH','BE','VD']);
  const toggle = k => setSelected(s =>
    s.includes(k) ? (s.length > 1 ? s.filter(x => x !== k) : s)
                  : [...s, k].slice(0, 5)
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,padding:'16px 20px',overflow:'auto',boxSizing:'border-box'}}>
      {/* Kanton selector cards */}
      <div style={{display:'flex',gap:10,flexShrink:0}}>
        {selected.map(k => {
          const col  = SD.kantonColors[k];
          const vals = SD.kantonTrends.map(d => d[k]);
          const last = vals[vals.length - 1];
          const prev = vals[vals.length - 13] || vals[0];
          const chg  = ((last - prev) / prev * 100).toFixed(1);
          return (
            <div key={k} onClick={() => toggle(k)} style={{
              flex:1, padding:'12px 14px',
              background:SC.glass, border:`1px solid ${col}44`,
              borderRadius:8, cursor:'pointer', position:'relative', overflow:'hidden',
              transition:'border-color 0.2s, box-shadow 0.2s',
            }}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${col},transparent)`}}/>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:col,letterSpacing:'0.1em',marginBottom:4}}>KT. {k}</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:20,fontWeight:700,color:SC.text}}>{SD.fmt(last)}</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:parseFloat(chg)>=0?SC.green:SC.red,marginTop:2}}>
                {parseFloat(chg) >= 0 ? '↑' : '↓'} {Math.abs(chg)}% YoY
              </div>
              <svg style={{position:'absolute',bottom:8,right:8,opacity:0.55}} width={56} height={22}>
                {(() => {
                  const sl = vals.slice(-12);
                  const mx = Math.max(...sl), mn = Math.min(...sl);
                  const pts = sl.map((v,i) => `${i*(56/11)},${22-((v-mn)/(mx-mn||1))*18}`).join(' ');
                  return <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5"/>;
                })()}
              </svg>
            </div>
          );
        })}
        {/* Add kanton button */}
        <div style={{width:52,border:`1px dashed ${SC.border}`,borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'6px 4px'}}>
          {KANTON_ALL.filter(k => !selected.includes(k)).slice(0, 3).map(k => (
            <div key={k} onClick={() => toggle(k)} style={{
              fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,
              padding:'2px 5px',borderRadius:2,border:`1px solid ${SC.border}`,
              background:'rgba(255,255,255,0.02)',cursor:'pointer',
              transition:'color 0.15s, border-color 0.15s',
            }}>{k}</div>
          ))}
        </div>
      </div>

      {/* Big comparison chart */}
      <GlassCard label="Ausschreibungsvolumen — Kantonvergleich (Jan 2023 – Dez 2024)" style={{flexShrink:0,height:290}}>
        <KantonCompareChart data={SD.kantonTrends} selected={selected} height={228}/>
        <div style={{display:'flex',gap:14,marginTop:4}}>
          {selected.map(k => (
            <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:14,height:2,background:SD.kantonColors[k],borderRadius:1}}/>
              <span style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted}}>{k}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Individual sparklines */}
      <div style={{flex:1,display:'flex',gap:12,minHeight:0}}>
        {selected.map(k => (
          <GlassCard key={k} label={`${k} — Monatsverlauf 2023–2024`} style={{flex:1}}>
            <TrendAreaChart
              data={SD.kantonTrends} dataKey={k} xKey="month"
              color={SD.kantonColors[k]} height={100}/>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

/* ── MARKT V2 ─────────────────────────────────────────────────── */
const MarktPage = () => (
  <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:12,padding:'16px 20px',overflow:'hidden',boxSizing:'border-box'}}>

    {/* TL: Competition */}
    <GlassCard label="Wettbewerbsintensität — AVG(number_of_submissions)">
      <div style={{display:'flex',gap:16,alignItems:'flex-start',flex:1}}>
        <div style={{flexShrink:0}}>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:34,fontWeight:700,color:SC.accent,lineHeight:1}}>Ø 3.2</div>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted,marginTop:4,letterSpacing:'0.05em'}}>Angebote / Ausschr.</div>
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
            <div style={{
              padding:'6px 8px',border:`1px solid ${SC.red}33`,borderLeft:`3px solid ${SC.red}`,
              borderRadius:3,background:`${SC.red}08`,
            }}>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:9,color:SC.red}}>⚠ 28.4%</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:7,color:SC.muted,marginTop:2}}>nur 1 Angebot</div>
            </div>
            <div style={{
              padding:'6px 8px',border:`1px solid ${SC.green}33`,borderLeft:`3px solid ${SC.green}`,
              borderRadius:3,background:`${SC.green}08`,
            }}>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:9,color:SC.green}}>✓ 71.6%</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:7,color:SC.muted,marginTop:2}}>Wettbewerb aktiv</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,alignSelf:'stretch',display:'flex',alignItems:'center'}}>
          <div style={{width:'100%'}}>
            <div style={{fontFamily:'Space Mono,monospace',fontSize:7,color:SC.muted,letterSpacing:'0.08em',marginBottom:6}}>VERTEILUNG NACH ANZAHL ANGEBOTE</div>
            <CompHistogram height={140}/>
          </div>
        </div>
      </div>
    </GlassCard>

    {/* TR: Process type donut */}
    <GlassCard label="Vergabeverfahren — process_type Verteilung" style={{alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',gap:20,alignItems:'center',justifyContent:'center',flex:1}}>
        <ProcessDonut data={SD.processTypes} size={170}/>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {SD.processTypes.map((t,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,background:t.fill,borderRadius:2,flexShrink:0}}/>
              <div>
                <div style={{fontFamily:'Space Mono,monospace',fontSize:9,color:SC.text}}>{t.name}</div>
                <div style={{fontFamily:'Space Mono,monospace',fontSize:8,color:SC.muted}}>{t.value}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>

    {/* BL: CPV Treemap */}
    <GlassCard label="CPV Branchen — SUM(award_amount) Treemap">
      <CPVTreemap data={SD.cpvData} height={210}/>
    </GlassCard>

    {/* BR: Insights */}
    <GlassCard label="Markt-Insights">
      <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
        {[
          [SC.red,    '⚠', 'Strassenbau: 41% Aufträge mit nur 1 Angebot'],
          [SC.green,  '↑', 'IT-Dienstleistungen: +18.4% YoY Wachstum'],
          [SC.accent, '●', 'Freihändige Vergaben: 15% des Gesamtvolumens'],
          [SC.cyan,   '○', 'TED-Publikationen: 12% aller Ausschreibungen'],
          [SC.purple, '◆', 'Ø Auftragswert CHF 198k (+6.2% vs. Vorjahr)'],
        ].map(([col, icon, text], i) => (
          <div key={i} style={{
            padding:'8px 10px',
            border:`1px solid ${col}22`,borderLeft:`3px solid ${col}`,
            borderRadius:3,background:`${col}08`,
            display:'flex',gap:8,alignItems:'flex-start',
          }}>
            <span style={{color:col,fontSize:11,flexShrink:0}}>{icon}</span>
            <span style={{fontFamily:'Space Mono,monospace',fontSize:9,color:SC.text,lineHeight:1.55}}>{text}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

Object.assign(window, { OverviewPage, DashboardPage, TrendsPage, MarktPage });
