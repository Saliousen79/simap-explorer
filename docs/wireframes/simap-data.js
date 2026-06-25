/* SIMAP Explorer — Mock Data (representative Swiss procurement values) */
window.SD = (function () {
  const d = {};

  // Monthly trend Jan 2022 – Dec 2024 (36 points)
  d.monthlyTrend = [
    {m:'J\'22',count:1180,amount:289},{m:'F\'22',count:980,amount:241},
    {m:'M\'22',count:1340,amount:312},{m:'A\'22',count:1280,amount:298},
    {m:'M\'22',count:1520,amount:358},{m:'J\'22',count:1410,amount:334},
    {m:'J\'22',count:890,amount:201},{m:'A\'22',count:920,amount:213},
    {m:'S\'22',count:1480,amount:345},{m:'O\'22',count:1620,amount:378},
    {m:'N\'22',count:1710,amount:401},{m:'D\'22',count:1340,amount:312},
    {m:'J\'23',count:1240,amount:298},{m:'F\'23',count:1050,amount:259},
    {m:'M\'23',count:1450,amount:342},{m:'A\'23',count:1390,amount:325},
    {m:'M\'23',count:1680,amount:394},{m:'J\'23',count:1560,amount:367},
    {m:'J\'23',count:940,amount:218},{m:'A\'23',count:980,amount:229},
    {m:'S\'23',count:1590,amount:378},{m:'O\'23',count:1740,amount:412},
    {m:'N\'23',count:1820,amount:428},{m:'D\'23',count:1410,amount:332},
    {m:'J\'24',count:1320,amount:312},{m:'F\'24',count:1120,amount:274},
    {m:'M\'24',count:1580,amount:371},{m:'A\'24',count:1470,amount:349},
    {m:'M\'24',count:1790,amount:421},{m:'J\'24',count:1640,amount:387},
    {m:'J\'24',count:1020,amount:239},{m:'A\'24',count:1060,amount:249},
    {m:'S\'24',count:1680,amount:398},{m:'O\'24',count:1890,amount:445},
    {m:'N\'24',count:1940,amount:458},{m:'D\'24',count:1480,amount:349},
  ];

  // Canton data: SUM(award_amount) CHF Mio, COUNT(*)
  d.cantonData = [
    {canton:'ZH',amount:842,count:18432},{canton:'BE',amount:621,count:9210},
    {canton:'VD',amount:534,count:7890},{canton:'AG',amount:412,count:6240},
    {canton:'SG',amount:356,count:5180},{canton:'LU',amount:298,count:4320},
    {canton:'TI',amount:267,count:3890},{canton:'VS',amount:234,count:3210},
    {canton:'GR',amount:198,count:2840},{canton:'FR',amount:187,count:2650},
    {canton:'SO',amount:162,count:2340},{canton:'BL',amount:148,count:2120},
  ];

  // CPV branches (cpv_code_main)
  d.cpvData = [
    {name:'Bauleistungen',amount:1840,size:1840},{name:'IT-Dienste',amount:1120,size:1120},
    {name:'Infrastruktur',amount:780,size:780},{name:'Medizinbedarf',amount:420,size:420},
    {name:'Beratung',amount:310,size:310},{name:'Planung',amount:210,size:210},
    {name:'Transport',amount:120,size:120},{name:'Sonstiges',amount:98,size:98},
  ];

  // Process types
  d.processTypes = [
    {name:'Offenes Verf.',value:45,fill:'#3b82f6'},
    {name:'Selektives',   value:22,fill:'#06b6d4'},
    {name:'Freihändig',   value:18,fill:'#10b981'},
    {name:'Einladung',    value:15,fill:'#8b5cf6'},
  ];

  // Recent awards
  d.recentAwards = [
    {title:'ICT-Infrastruktur Kanton Zürich',proc:'Kt. ZH, Direktion Justiz',canton:'ZH',amount:2400000,date:'14.12.2024',winner:'Abraxas Informatik AG',subs:4},
    {title:'Strassensanierung A1 West',proc:'ASTRA Bundesamt f. Strassen',canton:'BE',amount:8900000,date:'12.12.2024',winner:'Implenia Schweiz AG',subs:3},
    {title:'Reinigung Bundeshaus Bern',proc:'BBL Bundesamt f. Bauten',canton:'BE',amount:890000,date:'11.12.2024',winner:'ISS Facility Services AG',subs:6},
    {title:'ERP-System Kantonsverwaltung VD',proc:'Kanton Vaud, DSI',canton:'VD',amount:3200000,date:'10.12.2024',winner:'SAP Schweiz AG',subs:2},
    {title:'Sicherheitsdienste SBB',proc:'SBB AG Infrastruktur',canton:'ZH',amount:4100000,date:'09.12.2024',winner:'Securitas AG',subs:5},
    {title:'Laborausstattung Kantonsspital',proc:'Kantonsspital Aarau AG',canton:'AG',amount:1200000,date:'08.12.2024',winner:'Roche Diagnostics AG',subs:3},
  ];

  // Top winners
  d.topWinners = [
    {name:'Implenia Schweiz AG',canton:'ZH',awards:142,total:89400000,avg:629577},
    {name:'Strabag AG',canton:'ZH',awards:98,total:67200000,avg:686122},
    {name:'Abraxas Informatik AG',canton:'SG',awards:87,total:42100000,avg:483908},
    {name:'ISS Facility Services AG',canton:'ZH',awards:234,total:38900000,avg:166239},
    {name:'SAP Schweiz AG',canton:'ZH',awards:56,total:34800000,avg:621428},
    {name:'Securitas AG',canton:'ZH',awards:189,total:31200000,avg:165079},
  ];

  // Kanton multi-line trends (24 months Jan 23 – Dec 24)
  const raw = {
    ZH:[1820,1540,1940,1710,2080,1940,1180,1280,2020,2190,2310,1820,1890,1620,2050,1830,2190,2080,1270,1370,2130,2280,2410,1920],
    BE:[890,750,940,820,1020,950,580,620,980,1060,1130,890,920,780,980,870,1040,980,620,660,1020,1090,1150,920],
    VD:[720,610,760,660,820,780,460,500,800,860,920,730,750,630,790,700,840,790,490,530,820,880,940,750],
    AG:[540,460,580,510,620,590,360,390,610,660,700,550,570,480,600,540,640,600,380,400,620,670,720,580],
    SG:[420,350,450,390,480,460,280,300,470,510,550,430,440,370,460,410,490,460,290,310,480,520,560,440],
    LU:[380,320,410,360,440,420,250,280,430,470,500,390,400,340,420,380,450,420,270,290,440,480,510,400],
  };
  const mo24 = ['Jan 23','Feb 23','Mär 23','Apr 23','Mai 23','Jun 23','Jul 23','Aug 23','Sep 23','Okt 23','Nov 23','Dez 23','Jan 24','Feb 24','Mär 24','Apr 24','Mai 24','Jun 24','Jul 24','Aug 24','Sep 24','Okt 24','Nov 24','Dez 24'];
  d.kantonTrends = mo24.map((m, i) => ({month:m, ZH:raw.ZH[i], BE:raw.BE[i], VD:raw.VD[i], AG:raw.AG[i], SG:raw.SG[i], LU:raw.LU[i]}));

  // Kanton colors
  d.kantonColors = {ZH:'#3b82f6',BE:'#06b6d4',VD:'#10b981',AG:'#8b5cf6',SG:'#f59e0b',LU:'#ec4899'};

  // Number formatter (Swiss apostrophe style)
  d.fmt = (n) => {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' Mrd.';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' Mio.';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };

  return d;
})();
