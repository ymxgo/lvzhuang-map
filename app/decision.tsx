"use client";
/* eslint-disable @next/next/no-img-element -- original case imagery stays remote */

import { useCallback, useEffect, useRef, useState } from "react";
import { pricePresentation, providerConnected } from "./experience";
import type { CaseItem } from "./experience";

type Sheet="landing"|"compare"|null;
type TransitionDocument=Document&{startViewTransition?:(update:()=>void)=>unknown};

function sourceLabel(source?:string){
  if(!source||source==="not_mentioned")return "尚未确认";
  if(/author_reply/.test(source))return "作者评论回复";
  if(/content|body|caption/.test(source))return "作者正文提到";
  if(/manual/.test(source))return "人工采集待复核";
  if(/account|profile/.test(source))return "账号主页关联";
  return "已采集线索";
}
function completion(item:CaseItem){
  const checks=[Boolean(item.shop&&!/未明确/.test(item.shop)),Boolean(item.photographer),Boolean(item.price),Boolean(item.storeAddress||item.distanceMeters),Boolean(item.shopEvidence),Boolean(item.serviceArrangement&&!/待|unclear/.test(item.serviceArrangement))];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function distanceText(item:CaseItem){return item.distanceMeters?`${item.distanceMeters<1000?`${item.distanceMeters}米`:`${(item.distanceMeters/1000).toFixed(1)}公里`}`:item.distance||"待地图核实";}
function askList(item:CaseItem){
  const items:string[]=[];
  if(!item.price)items.push("当前套餐总价及节假日是否加价");
  if(!item.photographer)items.push("是否包含摄影，还是需要另外预约");
  if(!/服装|衣服|租赁/.test(item.packageText))items.push("服装、饰品、假发和假睫毛是否包含");
  if(!/精修|原片/.test(`${item.packageText}${item.note}`))items.push("原片与精修分别包含多少张");
  if(!/押金|加片|超时|门票/.test(`${item.packageText}${item.note}`))items.push("押金、加片、超时和门票是否另收费");
  if(!item.distanceMeters)items.push("门店地址以及到景点的真实路程");
  return items;
}
function inquiry(item:CaseItem){
  const questions=askList(item);
  return `你好，我想咨询“${item.title}”这篇案例里的${item.style}妆造。请问${questions.join("；")}？我准备去${item.spot}拍摄，也想确认建议几点到店以及目前可预约的日期，谢谢。`;
}

export function DecisionHub({cases}:{cases:CaseItem[]}){
  const [sheet,setSheet]=useState<Sheet>(null);
  const [current,setCurrent]=useState<CaseItem|null>(null);
  const [copied,setCopied]=useState(false);
  const [hash,setHash]=useState(()=>typeof window==="undefined"?"#home":window.location.hash||"#home");
  const [compareIds,setCompareIds]=useState<string[]>(()=>{
    if(typeof window==="undefined")return [];
    try{return (JSON.parse(localStorage.getItem("lvzhuang-compare")||localStorage.getItem("lvzhuang-favorites")||"[]") as string[]).slice(0,4);}catch{return [];}
  });
  const drag=useRef<{y:number;sheet:HTMLElement}|null>(null);

  const transition=useCallback((update:()=>void)=>{const doc=document as TransitionDocument;if(doc.startViewTransition)doc.startViewTransition(update);else update();},[]);
  const open=useCallback((next:Sheet)=>transition(()=>setSheet(next)),[transition]);
  function close(){setSheet(null);setCopied(false);}

  useEffect(()=>{
    function detail(event:Event){const id=(event as CustomEvent<string|null>).detail;setCurrent(id?cases.find((item)=>item.id===id)||null:null);if(!id&&sheet==="landing")setSheet(null);}
    function landing(event:Event){const id=(event as CustomEvent<string>).detail;const item=cases.find((entry)=>entry.id===id);if(item){setCurrent(item);open("landing");}}
    function click(event:MouseEvent){
      const target=event.target as HTMLElement;
      if(target.closest('a[href*="#booking="]'))setSheet(null);
      setTimeout(()=>setHash(window.location.hash||"#home"),0);
    }
    function hashChange(){setHash(window.location.hash||"#home");}
    function pointerDown(event:PointerEvent){
      if(window.innerWidth>760)return;const panel=(event.target as HTMLElement).closest<HTMLElement>(".detail-sheet");if(!panel)return;
      const rect=panel.getBoundingClientRect();if(event.clientY-rect.top>58)return;drag.current={y:event.clientY,sheet:panel};panel.style.transition="none";
    }
    function pointerMove(event:PointerEvent){if(!drag.current)return;const dy=Math.max(0,event.clientY-drag.current.y);drag.current.sheet.style.transform=`translateY(${dy}px)`;}
    function pointerUp(event:PointerEvent){if(!drag.current)return;const {y,sheet:panel}=drag.current;const dy=event.clientY-y;panel.style.transition="";panel.style.transform="";if(dy>110)panel.querySelector<HTMLButtonElement>(".sheet-close")?.click();drag.current=null;}
    window.addEventListener("lvzhuang-case-detail",detail);window.addEventListener("lvzhuang-open-landing",landing);window.addEventListener("hashchange",hashChange);
    document.addEventListener("click",click,true);document.addEventListener("pointerdown",pointerDown);document.addEventListener("pointermove",pointerMove);document.addEventListener("pointerup",pointerUp);
    return()=>{window.removeEventListener("lvzhuang-case-detail",detail);window.removeEventListener("lvzhuang-open-landing",landing);window.removeEventListener("hashchange",hashChange);document.removeEventListener("click",click,true);document.removeEventListener("pointerdown",pointerDown);document.removeEventListener("pointermove",pointerMove);document.removeEventListener("pointerup",pointerUp);};
  },[cases,sheet,open]);
  function showLanding(item:CaseItem){setCurrent(item);open("landing");}
  function toggleCompare(id:string){setCompareIds((ids)=>{const next=ids.includes(id)?ids.filter((entry)=>entry!==id):ids.length>=4?ids:[...ids,id];localStorage.setItem("lvzhuang-compare",JSON.stringify(next));return next;});}
  async function copyInquiry(){if(!current)return;try{await navigator.clipboard.writeText(inquiry(current));setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{setCopied(false);}}

  const compareItems=cases.filter((item)=>compareIds.includes(item.id));
  const alternatives=current?[...cases].filter((item)=>item.id!==current.id&&item.city===current.city).sort((a,b)=>{
    const score=(item:CaseItem)=>(item.spot===current.spot?3:0)+(item.style===current.style?2:0)+(current.price&&item.price?Math.max(0,2-Math.abs(item.price-current.price)/300):0);
    return score(b)-score(a);
  }).slice(0,3):[];

  return <>
    {hash==="#favorites"&&!sheet&&<button className="compare-fab" onClick={()=>open("compare")} type="button"><span>{compareIds.length}</span>对比收藏案例</button>}

    {sheet==="landing"&&current&&<div className="decision-backdrop" role="presentation"><section aria-modal="true" className="decision-sheet landing-sheet" role="dialog"><div className="mobile-handle"/><button aria-label="关闭" className="decision-close" onClick={close} type="button">×</button><div className="landing-title"><span className="decision-kicker">READY-TO-SHOOT</span><h2>同款落地清单</h2><p>{current.title}</p></div><div className="completion-ring" style={{"--score":`${completion(current)*3.6}deg`} as React.CSSProperties}><strong>{completion(current)}%</strong><span>信息完整度</span></div><div className="evidence-ledger"><h3>每条信息从哪里来</h3><article><i className={current.shopEvidence?"known":"unknown"}/><div><span>妆造方</span><strong>{current.shop}</strong><small>{current.shopEvidence||"未保存原文证据，需回到原帖复核"}</small></div><em>{sourceLabel(current.shopEvidenceSource)}</em></article><article><i className={current.photographer?"known":"unknown"}/><div><span>摄影方</span><strong>{current.photographer||"尚未明确"}</strong><small>{current.photographerEvidence||"未在已采集内容中找到摄影方"}</small></div><em>{sourceLabel(current.photographerEvidenceSource)}</em></article><article><i className={current.price?"known":"unknown"}/><div><span>参考价格</span><strong>{pricePresentation(current).value}</strong><small>{current.priceEvidence||pricePresentation(current).note}</small></div><em>{pricePresentation(current).note}</em></article><article><i className={current.distanceMeters?"known":"unknown"}/><div><span>实体与距离</span><strong>{current.storeAddress||distanceText(current)}</strong><small>{current.distanceMeters?`距${current.spot}约${distanceText(current)}`:"没有可靠坐标，不展示虚构米数"}</small></div><em>{current.distanceMeters?"地图数据":"尚未核实"}</em></article></div><div className="execution-list"><h3>出发前还要确认</h3>{askList(current).map((entry,index)=><div key={entry}><span>{String(index+1).padStart(2,"0")}</span><p>{entry}</p><b>待询问</b></div>)}</div><div className="day-plan"><span>建议时间线</span><div><strong>拍摄前2.5小时</strong><small>到店妆造</small></div><div><strong>拍摄前30分钟</strong><small>出发去{current.spot}</small></div><div><strong>按约定时间</strong><small>和摄影方会合</small></div><p>这是倒推工具，不代表门店真实营业时间或路程。</p></div><div className="inquiry-card"><span>一键询价话术</span><p>{inquiry(current)}</p><button onClick={copyInquiry} type="button">{copied?"已复制 ✓":"复制后发给商家"}</button></div><div className="alternative-list"><div><h3>同地点 / 同预算替代</h3><button onClick={()=>toggleCompare(current.id)} type="button">{compareIds.includes(current.id)?"已加入对比":"加入对比"}</button></div>{alternatives.map((item)=><button key={item.id} onClick={()=>showLanding(item)} type="button">{item.image&&<img alt="替代案例" src={item.image}/>}<span><strong>{item.title}</strong><small>{item.spot} · {pricePresentation(item).value} · 完整度{completion(item)}%</small></span><b>›</b></button>)}</div><div className="landing-sticky"><button onClick={()=>open("compare")} type="button">对比方案</button><a href={`#booking=${encodeURIComponent(current.id)}`}>{providerConnected(current,"makeup")?"选择套餐并预约":"查看沟通准备"}</a></div></section></div>}

    {sheet==="compare"&&<div className="decision-backdrop" role="presentation"><section aria-modal="true" className="decision-sheet compare-sheet" role="dialog"><div className="mobile-handle"/><button aria-label="关闭" className="decision-close" onClick={close} type="button">×</button><span className="decision-kicker">DECIDE WITH FACTS</span><h2>把喜欢的放在一起比</h2><p className="decision-lead">最多选择4个真实案例。未知信息不会被默认成“没有费用”。</p><div className="compare-picker">{cases.map((item)=><button className={compareIds.includes(item.id)?"active":""} key={item.id} onClick={()=>toggleCompare(item.id)} type="button">{item.image&&<img alt="案例" src={item.image}/>}<span>{compareIds.includes(item.id)?"✓":"＋"}</span><small>{item.title}</small></button>)}</div>{compareItems.length?<div className="comparison-scroll"><table><thead><tr><th>对比项</th>{compareItems.map((item)=><th key={item.id}>{item.title}</th>)}</tr></thead><tbody><tr><th>妆造店</th>{compareItems.map((item)=><td key={item.id}>{item.shop}</td>)}</tr><tr><th>摄影方</th>{compareItems.map((item)=><td key={item.id}>{item.photographer||"未提及"}</td>)}</tr><tr><th>已知价格</th>{compareItems.map((item)=><td key={item.id}>{item.price?`¥${item.price}`:"需沟通"}</td>)}</tr><tr><th>距景点</th>{compareItems.map((item)=><td key={item.id}>{distanceText(item)}</td>)}</tr><tr><th>服务方式</th>{compareItems.map((item)=><td key={item.id}>{item.serviceArrangement||"待确认"}</td>)}</tr><tr><th>完整度</th>{compareItems.map((item)=><td key={item.id}><b>{completion(item)}%</b></td>)}</tr><tr><th>缺失项</th>{compareItems.map((item)=><td key={item.id}>{askList(item).length}项待问</td>)}</tr></tbody></table></div>:<div className="compare-empty">先选2—4个案例，才能看出哪一个真正更容易落地。</div>}</section></div>}
  </>;
}
