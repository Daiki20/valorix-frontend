import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{n as t,r as n}from"./vendor-markdown-Brx7mT9r.js";import{N as r,T as i,b as a,c as o,d as s,t as c}from"./vendor-ui-Duu_5DfT.js";import{r as l}from"./authApi-DW_F5VOk.js";import{n as u,r as d}from"./index-BYs5VP3r.js";var f=e(n(),1),p=t(),m=`#00cfff`,h=`#7b5ea7`,g=`rgba(0,180,255,0.14)`,_=`#d8eeff`,v=`#4a6a8a`,y=`rgba(0,15,35,0.7)`,b={standard:{cost:99,discount:28,label:`Экспресс дня`,sublabel:`Надёжный`,icon:(0,p.jsx)(s,{size:14,color:`#030b18`,fill:`#030b18`}),gradient:`linear-gradient(135deg, #00cfff, #7b5ea7)`,accentLine:`linear-gradient(90deg, #00cfff, #7b5ea7)`,border:`rgba(0,207,255,0.2)`,bg:`rgba(0,25,60,0.5)`,numberBg:`rgba(0,207,255,0.12)`,numberColor:m,oddsColor:m},high:{cost:149,discount:19,label:`Экспресс дня`,sublabel:`Высокодоходный`,icon:(0,p.jsx)(i,{size:14,color:`#030b18`,fill:`#030b18`}),gradient:`linear-gradient(135deg, #f97316, #ef4444)`,accentLine:`linear-gradient(90deg, #f97316, #ef4444)`,border:`rgba(249,115,22,0.25)`,bg:`rgba(30,10,5,0.5)`,numberBg:`rgba(249,115,22,0.12)`,numberColor:`#fb923c`,oddsColor:`#fb923c`}},x=`
  .express-grid {
    display: flex;
    flex-direction: row;
    gap: 16px;
    margin-bottom: 24px;
    align-items: flex-start;
  }
  .express-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .express-pick-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .express-pick-right {
    flex-shrink: 0;
    text-align: right;
    max-width: 90px;
    word-break: break-word;
  }
  .express-team-name {
    font-weight: 700;
    font-size: 13px;
    color: #d8eeff;
    line-height: 1.3;
    word-break: break-word;
  }
  .express-league {
    font-size: 11px;
    color: #4a6a8a;
    margin-top: 2px;
    word-break: break-word;
  }
  .express-footer {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .express-summary {
    font-size: 12px;
    color: #4a6a8a;
    max-width: 180px;
    text-align: right;
    word-break: break-word;
  }
  @media (max-width: 640px) {
    .express-grid {
      flex-direction: column;
      gap: 24px;
    }
    .express-col {
      width: 100%;
    }
    .express-summary {
      max-width: 100%;
      text-align: left;
    }
    .express-footer {
      flex-direction: column;
      gap: 6px;
    }
    .express-pick-right {
      max-width: 80px;
    }
    .express-team-name {
      font-size: 12px;
    }
  }
`;function S({text:e,color1:t,color2:n,border:r,bg:i}){let a=e.replace(/[\s·]/g,``);return(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`center`,gap:8},children:[(0,p.jsx)(`div`,{style:{flex:1,height:1,background:`linear-gradient(90deg, transparent, ${r})`}}),(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:6,background:i,border:`1.5px dashed ${r}`,borderRadius:20,padding:`5px 14px`,fontSize:11,fontWeight:700,letterSpacing:.8,animation:`labelPulse_${a} 2s ease-in-out infinite`,whiteSpace:`nowrap`},children:[(0,p.jsx)(`style`,{children:`
          @keyframes labelPulse_${a} {
            0%, 100% { color: ${t}; border-color: ${r}; }
            50% { color: ${n}; border-color: ${n}40; }
          }
        `}),(0,p.jsx)(`span`,{style:{width:6,height:6,borderRadius:`50%`,background:`currentColor`,display:`inline-block`,flexShrink:0}}),e]}),(0,p.jsx)(`div`,{style:{flex:1,height:1,background:`linear-gradient(90deg, ${r}, transparent)`}})]})}function C({data:e,type:t,sport:n=`football`,onAuthRequired:i,onUpdate:s}){let{user:m,updateCoins:h}=d(),x=u(),[S,C]=(0,f.useState)(!1),[w,T]=(0,f.useState)(!1),E=b[t];if(!e)return(0,p.jsxs)(`div`,{className:`card`,style:{padding:`20px 24px`},children:[(0,p.jsx)(`div`,{className:`skeleton`,style:{height:18,width:160,marginBottom:16}}),(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:10},children:[1,2].map(e=>(0,p.jsx)(`div`,{className:`skeleton`,style:{height:52,borderRadius:10}},e))})]});let D=e.purchased;async function O(){if(!m){i?.();return}C(!0);try{let r=await l.purchase(t,n,e.date);if(r.error){x.error(r.error);return}s(t,r),r.coins!==void 0&&h(r.coins)}catch(e){x.error(e.message||`Ошибка при открытии экспресса`)}finally{C(!1)}}return(0,p.jsxs)(`div`,{className:`card`,style:{padding:`20px 20px`,flex:1,minWidth:0,border:`1.5px solid ${E.border}`,background:E.bg,position:`relative`,overflow:`hidden`,display:`flex`,flexDirection:`column`,boxSizing:`border-box`},children:[(0,p.jsx)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:3,background:E.accentLine}}),(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,marginBottom:14,gap:8,flexWrap:`wrap`},children:[(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8,minWidth:0},children:[(0,p.jsx)(`div`,{style:{width:28,height:28,borderRadius:8,flexShrink:0,background:E.gradient,display:`flex`,alignItems:`center`,justifyContent:`center`},children:E.icon}),(0,p.jsxs)(`div`,{style:{minWidth:0},children:[(0,p.jsx)(`div`,{style:{fontWeight:900,fontSize:14,color:_,letterSpacing:-.3},children:E.label}),(0,p.jsxs)(`div`,{style:{fontSize:11,color:E.numberColor,fontWeight:700,marginTop:2},children:[E.sublabel,e.generated_at&&(0,p.jsxs)(`span`,{style:{color:v,fontWeight:500,marginLeft:6},children:[`· `,new Date(e.generated_at+`Z`).toLocaleTimeString(`ru-RU`,{hour:`2-digit`,minute:`2-digit`,timeZone:`Europe/Moscow`}),` мск`]})]}),e.date&&(()=>{let t=new Date().toISOString().slice(0,10),n=new Date(Date.now()+864e5).toISOString().slice(0,10),r=new Date(e.date+`T12:00:00`),i=e.date===t?`Сегодня`:e.date===n?`Завтра`:r.toLocaleDateString(`ru-RU`,{day:`numeric`,month:`short`}),a=e.date!==n;return(0,p.jsxs)(`div`,{style:{display:`inline-flex`,alignItems:`center`,gap:4,marginTop:4,fontSize:11,fontWeight:700,color:a?`#f59e0b`:v,background:a?`rgba(245,158,11,0.1)`:`transparent`,border:a?`1px solid rgba(245,158,11,0.25)`:`none`,borderRadius:20,padding:a?`1px 8px`:`0`},children:[`📅 `,i]})})()]})]}),D?(0,p.jsxs)(`div`,{style:{background:`rgba(34,197,94,0.1)`,color:`#22c55e`,fontSize:12,fontWeight:700,padding:`3px 10px`,borderRadius:20,border:`1px solid rgba(34,197,94,0.25)`,display:`flex`,alignItems:`center`,gap:4,flexShrink:0},children:[(0,p.jsx)(o,{size:11}),` Открыт`]}):(0,p.jsx)(`div`,{style:{fontWeight:900,fontSize:24,color:E.oddsColor,letterSpacing:-1,flexShrink:0},children:`×${e.total_odds?.toFixed(2)||`—`}`})]}),(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:8,marginBottom:14},children:e.picks?.map((e,t)=>(0,p.jsx)(`div`,{style:{background:y,borderRadius:10,padding:`10px 12px`,border:`1px solid ${g}`,boxSizing:`border-box`},children:(0,p.jsxs)(`div`,{className:`express-pick-row`,children:[(0,p.jsx)(`div`,{style:{width:24,height:24,borderRadius:`50%`,flexShrink:0,background:E.numberBg,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:11,fontWeight:800,color:E.numberColor},children:t+1}),(0,p.jsxs)(`div`,{style:{flex:1,minWidth:0,overflow:`hidden`},children:[(0,p.jsxs)(`div`,{className:`express-team-name`,style:D?{}:{filter:`blur(4px)`,userSelect:`none`},children:[e.home,` — `,e.away]}),(0,p.jsx)(`div`,{className:`express-league`,style:D?{}:{filter:`blur(3px)`,userSelect:`none`},children:e.league})]}),(0,p.jsx)(`div`,{className:`express-pick-right`,children:D?(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`div`,{style:{fontWeight:800,fontSize:12,color:E.oddsColor,wordBreak:`break-word`},children:e.prediction}),(0,p.jsxs)(`div`,{style:{fontSize:12,color:`#22c55e`,fontWeight:700},children:[`× `,e.odds]})]}):(0,p.jsx)(`div`,{style:{filter:`blur(5px)`,userSelect:`none`,fontWeight:800,fontSize:12,color:E.oddsColor,background:E.numberBg,borderRadius:6,padding:`2px 6px`},children:`П1 × 1.55`})})]})},t))}),(0,p.jsx)(`div`,{style:{marginTop:`auto`},children:D?(0,p.jsx)(`div`,{style:{background:E.numberBg,border:`1px solid ${E.border}`,borderRadius:10,padding:`10px 14px`},children:(0,p.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:12},children:(0,p.jsxs)(`div`,{children:[(0,p.jsx)(`div`,{style:{fontSize:11,color:v,fontWeight:600},children:`Итоговый коэф.`}),(0,p.jsxs)(`div`,{style:{fontSize:20,fontWeight:900,color:E.oddsColor},children:[`×`,e.total_odds?.toFixed(2)]})]})})}):(0,p.jsxs)(p.Fragment,{children:[E.discount&&(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`center`,gap:8,marginBottom:8},children:[(0,p.jsxs)(`span`,{style:{fontSize:12,color:v,textDecoration:`line-through`},children:[Math.round(E.cost/(1-E.discount/100)),` монет`]}),(0,p.jsxs)(`span`,{style:{fontSize:12,fontWeight:800,color:`#22c55e`,background:`rgba(34,197,94,0.15)`,border:`1px solid rgba(34,197,94,0.35)`,borderRadius:20,padding:`2px 10px`},children:[`−`,E.discount,`% скидка`]})]}),(0,p.jsx)(`button`,{onClick:O,disabled:S,style:{width:`100%`,padding:`11px`,background:S?`rgba(0,207,255,0.3)`:E.gradient,color:S?`rgba(255,255,255,0.4)`:`#030b18`,border:`none`,borderRadius:10,fontWeight:700,fontSize:14,cursor:S?`not-allowed`:`pointer`,display:`flex`,alignItems:`center`,justifyContent:`center`,gap:6,flexWrap:`wrap`,boxSizing:`border-box`,boxShadow:S?`none`:`0 4px 20px ${E.border}`,transition:`opacity 0.2s`},children:S?`Открываем...`:(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(a,{size:14}),`Открыть экспресс`,(0,p.jsxs)(`span`,{style:{opacity:.85,display:`flex`,alignItems:`center`,gap:4,whiteSpace:`nowrap`},children:[`— `,(0,p.jsx)(c,{size:13,fill:`#030b18`,color:`#030b18`}),` `,E.cost,` монет`]}),(0,p.jsx)(r,{size:14})]})})]})})]})}var w=[{id:`football`,label:`Футбол`,emoji:`⚽`,grad:`linear-gradient(135deg, #00cfff, #7b5ea7)`,glow:`rgba(0,207,255,0.3)`},{id:`hockey`,label:`Хоккей`,emoji:`🏒`,grad:`linear-gradient(135deg, #0ea5e9, #00cfff)`,glow:`rgba(14,165,233,0.3)`},{id:`cs2`,label:`CS2`,emoji:`🔫`,grad:`linear-gradient(135deg, #f59e0b, #ef4444)`,glow:`rgba(245,158,11,0.3)`},{id:`dota2`,label:`Dota 2`,emoji:`🎮`,grad:`linear-gradient(135deg, #a855f7, #7c3aed)`,glow:`rgba(168,85,247,0.3)`}],T={football:{color1:m,color2:h,border:`rgba(0,207,255,0.3)`,bg:`rgba(0,207,255,0.06)`},hockey:{color1:`#0ea5e9`,color2:m,border:`rgba(14,165,233,0.3)`,bg:`rgba(14,165,233,0.06)`},cs2:{color1:`#f59e0b`,color2:`#ef4444`,border:`rgba(245,158,11,0.3)`,bg:`rgba(245,158,11,0.06)`},dota2:{color1:`#a855f7`,color2:`#7c3aed`,border:`rgba(168,85,247,0.3)`,bg:`rgba(168,85,247,0.06)`}};function E({onAuthRequired:e}){let{user:t}=d(),[n,r]=(0,f.useState)(`football`),[i,a]=(0,f.useState)(null),[o,s]=(0,f.useState)(null),[c,u]=(0,f.useState)(!1),[m,h]=(0,f.useState)(null);function b(e){r(e),u(!0),h(null),a(null),s(null),l.today(e).then(e=>{if(e.error){h(e.error);return}a(e.standard||null),s(e.high||null)}).catch(()=>h(`Не удалось загрузить экспресс`)).finally(()=>u(!1))}(0,f.useEffect)(()=>{b(`football`)},[]);function E(e,t){e===`standard`?a(t):s(t)}let D=w.find(e=>e.id===n),O=T[n]||T.football,k=()=>(0,p.jsx)(`div`,{style:{display:`flex`,gap:8,marginBottom:20,overflowX:`auto`,WebkitOverflowScrolling:`touch`,scrollbarWidth:`none`,msOverflowStyle:`none`,padding:`4px 2px`,justifyContent:`center`},children:w.map(e=>{let t=n===e.id;return(0,p.jsxs)(`button`,{onClick:()=>b(e.id),style:{display:`flex`,alignItems:`center`,gap:6,padding:`9px 16px`,borderRadius:50,border:`none`,cursor:`pointer`,fontWeight:700,fontSize:13,flexShrink:0,whiteSpace:`nowrap`,background:t?e.grad:`rgba(0,25,60,0.5)`,color:t?`#030b18`:v,boxShadow:t?`0 4px 16px ${e.glow}`:`none`,transform:t?`translateY(-1px)`:`none`,transition:`all 0.2s ease`,border:t?`none`:`1.5px solid ${g}`},children:[(0,p.jsx)(`span`,{style:{fontSize:15},children:e.emoji}),e.label]},e.id)})});if(c)return(0,p.jsxs)(`div`,{style:{marginBottom:24},children:[(0,p.jsx)(`style`,{children:x}),(0,p.jsx)(k,{}),(0,p.jsx)(`div`,{className:`express-grid`,children:[1,2].map(e=>(0,p.jsx)(`div`,{className:`express-col`,children:(0,p.jsxs)(`div`,{className:`card`,style:{padding:`20px 24px`},children:[(0,p.jsx)(`div`,{className:`skeleton`,style:{height:18,width:160,marginBottom:16}}),(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:10},children:[1,2,3].map(e=>(0,p.jsx)(`div`,{className:`skeleton`,style:{height:52,borderRadius:10}},e))}),(0,p.jsx)(`div`,{className:`skeleton`,style:{height:44,borderRadius:10,marginTop:16}})]})},e))})]});if(m||!i&&!o){let e=w.find(e=>e.id!==n),t=!m||m.toLowerCase().includes(`нет`)||m.toLowerCase().includes(`not found`)||m.toLowerCase().includes(`no `),r=`На завтра нет матчей по виду спорта «${D?.label||n}», в которых AI достаточно уверен для сборки экспресса — попробуйте другой вид спорта.`;return(0,p.jsxs)(`div`,{style:{marginBottom:24},children:[(0,p.jsx)(`style`,{children:x}),(0,p.jsx)(k,{}),(0,p.jsxs)(`div`,{style:{textAlign:`center`,padding:`40px 24px`,background:y,borderRadius:16,border:`1.5px dashed ${g}`},children:[(0,p.jsx)(`div`,{style:{fontSize:40,marginBottom:14},children:D?.emoji||`📅`}),(0,p.jsx)(`div`,{style:{fontWeight:800,fontSize:16,color:_,marginBottom:10},children:t?`Экспресс недоступен`:`Экспресс ещё не готов`}),(0,p.jsx)(`div`,{style:{fontSize:13,color:v,maxWidth:340,margin:`0 auto`,lineHeight:1.65},children:t?r:m||`Генерация запланирована. Попробуйте позже.`}),(0,p.jsxs)(`div`,{style:{display:`flex`,gap:10,justifyContent:`center`,marginTop:18,flexWrap:`wrap`},children:[(0,p.jsx)(`button`,{onClick:()=>b(n),style:{padding:`8px 18px`,borderRadius:10,background:`rgba(255,255,255,0.04)`,color:v,border:`1.5px solid ${g}`,fontWeight:600,fontSize:13,cursor:`pointer`},children:`Обновить`}),t&&e&&(0,p.jsxs)(`button`,{onClick:()=>b(e.id),style:{padding:`8px 20px`,borderRadius:10,background:e.grad,color:`#030b18`,border:`none`,fontWeight:700,fontSize:13,cursor:`pointer`,display:`flex`,alignItems:`center`,gap:6},children:[(0,p.jsx)(`span`,{children:e.emoji}),`Экспресс на `,e.label]})]})]})]})}return(0,p.jsxs)(`div`,{style:{marginBottom:24},children:[(0,p.jsx)(`style`,{children:x}),(0,p.jsx)(k,{}),(0,p.jsxs)(`div`,{className:`express-grid`,children:[(0,p.jsxs)(`div`,{className:`express-col`,children:[(0,p.jsx)(S,{text:`AI ЭКСПРЕСС ${D?.emoji||``} · LITE`,color1:O.color1,color2:O.color2,border:O.border,bg:O.bg}),(0,p.jsx)(C,{data:i,type:`standard`,sport:n,onAuthRequired:e,onUpdate:E})]}),(0,p.jsxs)(`div`,{className:`express-col`,children:[(0,p.jsx)(S,{text:`AI ЭКСПРЕСС ${D?.emoji||``} · HARD`,color1:`#f97316`,color2:`#ef4444`,border:`rgba(249,115,22,0.3)`,bg:`rgba(249,115,22,0.06)`}),(0,p.jsx)(C,{data:o,type:`high`,sport:n,onAuthRequired:e,onUpdate:E})]})]})]})}export{E as t};