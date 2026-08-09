"use client";
/* eslint-disable @next/next/no-img-element -- case images are remote originals */

import { useEffect, useMemo, useState } from "react";
import { pricePresentation, providerConnected } from "./experience";
import type { CaseItem } from "./experience";

type ProviderKind="makeup"|"photo";
type BookingStep="store"|"form"|"success";
type BookingStatus="pending"|"proposal"|"confirmed"|"rejected"|"cancelled"|"completed";

type BookingRequest={
  id:string; caseId:string; caseTitle:string; image?:string; city:string; spot:string;
  provider:string; providerKind:ProviderKind; services:string[]; date:string; period:string;
  people:number; budget:string; size:string; skin:string; contact:string; note:string;
  status:BookingStatus; createdAt:string; quotedPrice?:number;
};

const bookingKey="lvzhuang-bookings";
const services={
  makeup:["妆发造型","汉服/唐装租赁","首饰与发饰","假发与发包","陪同换装"],
  photo:["摄影跟拍","原片全送","精修照片","夜景补光","景区陪拍"],
};
const statusLabel:Record<BookingStatus,string>={
  pending:"等待商家确认",proposal:"商家修改方案",confirmed:"预约已确认",
  rejected:"商家无法接单",cancelled:"用户已取消",completed:"服务已完成",
};

function loadBookings():BookingRequest[]{
  if(typeof window==="undefined")return [];
  try{return JSON.parse(localStorage.getItem(bookingKey)||"[]") as BookingRequest[];}catch{return [];}
}
function saveBookings(rows:BookingRequest[]){
  localStorage.setItem(bookingKey,JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("lvzhuang-booking-updated"));
}
function mapUrl(item:CaseItem){
  if(item.storeLatitude&&item.storeLongitude)return `https://uri.amap.com/marker?position=${item.storeLongitude},${item.storeLatitude}&name=${encodeURIComponent(item.shop)}&src=lvzhuang&coordinate=gaode&callnative=1`;
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${item.city} ${item.shop}`)}&city=${encodeURIComponent(item.city)}&src=lvzhuang&callnative=1`;
}
function arrangement(item:CaseItem){
  if(item.photographer&&/一体|全包|同店/.test(item.serviceArrangement||""))return "妆造摄影一体";
  if(item.photographer)return "妆造与摄影分别预约";
  return "妆造 / 服装服务";
}
function futureDate(days:number){const value=new Date();value.setHours(12,0,0,0);value.setDate(value.getDate()+days);return value.toISOString().slice(0,10);}
function providerIdentified(item:CaseItem,kind:ProviderKind){
  const name=kind==="photo"?item.photographer:item.shop;
  const evidence=kind==="photo"?item.photographerEvidence:item.shopEvidence;
  const account=kind==="photo"?item.photographerProfileUrl:item.shopProfileUrl;
  const status=kind==="photo"?item.photographerStatus:item.storeStatus;
  if(/not_mentioned/.test(status||""))return false;
  if(!name||/未明确|未提及|那家店|某家店|喜欢的那家|原帖.*方/.test(name))return false;
  return Boolean(evidence||account||(kind==="makeup"&&(item.storeAddress||item.storeUrl||item.storeLatitude)));
}

export function BookingPortal({cases}:{cases:CaseItem[]}){
  const [item,setItem]=useState<CaseItem|null>(null);
  const [kind,setKind]=useState<ProviderKind>("makeup");
  const [step,setStep]=useState<BookingStep>("store");
  const [chosen,setChosen]=useState<string[]>(["妆发造型","汉服/唐装租赁"]);
  const [date,setDate]=useState("");
  const [minDate,setMinDate]=useState("");
  const [maxDate,setMaxDate]=useState("");
  const [period,setPeriod]=useState("下午 · 16:00左右开拍");
  const [people,setPeople]=useState(1);
  const [budget,setBudget]=useState("500—800元");
  const [size,setSize]=useState("");
  const [skin,setSkin]=useState("无特殊说明");
  const [contact,setContact]=useState("");
  const [note,setNote]=useState("");
  const [created,setCreated]=useState<BookingRequest|null>(null);

  function open(next:CaseItem,nextKind:ProviderKind){
    setItem(next);setKind(nextKind);setStep("store");setCreated(null);
    setChosen(nextKind==="photo"?["摄影跟拍","精修照片"]:["妆发造型","汉服/唐装租赁"]);
    const tomorrow=futureDate(1);setMinDate(tomorrow);setMaxDate(futureDate(92));setDate(tomorrow);setContact("");setNote("");
  }
  function close(){setItem(null);setStep("store");}

  useEffect(()=>{
    function handleClick(event:MouseEvent){
      const target=event.target as HTMLElement;
      const link=target.closest<HTMLAnchorElement>('a[href*="#booking="]');
      const provider=target.closest<HTMLElement>(".provider-card");
      let id="";
      if(link)id=decodeURIComponent(link.getAttribute("href")?.split("#booking=")[1]||"");
      if(provider){
        const related=provider.parentElement?.querySelector<HTMLAnchorElement>('a[href*="#booking="]');
        id=decodeURIComponent(related?.getAttribute("href")?.split("#booking=")[1]||"");
      }
      if(!id)return;
      const found=cases.find((entry)=>entry.id===id);if(!found)return;
      event.preventDefault();event.stopPropagation();
      open(found,provider?.classList.contains("photo-provider")?"photo":"makeup");
    }
    document.addEventListener("click",handleClick,true);
    return()=>document.removeEventListener("click",handleClick,true);
  },[cases]);

  useEffect(()=>{
    document.body.style.overflow=item?"hidden":"";
    return()=>{document.body.style.overflow="";};
  },[item]);

  const providerName=kind==="photo"?(item?.photographer||"原帖摄影方"):(item?.shop||"原帖妆造方");
  const available=kind==="photo"?services.photo:services.makeup;
  const completion=[item?.storeAddress,item?.storeUrl,item?.price,item?.shopProfileUrl].filter(Boolean).length;
  const price=item?pricePresentation(item):null;

  function toggle(value:string){setChosen((values)=>values.includes(value)?values.filter((entry)=>entry!==value):[...values,value]);}
  function submit(){
    if(!item||!providerIdentified(item,kind)||!providerConnected(item,kind)||!date||date<minDate||date>maxDate||!contact.trim()||!chosen.length)return;
    const request:BookingRequest={
      id:crypto.randomUUID(),caseId:item.id,caseTitle:item.title,image:item.image,city:item.city,spot:item.spot,
      provider:providerName,providerKind:kind,services:chosen,date,period,people,budget,size,skin,
      contact:contact.trim(),note:note.trim(),status:"pending",createdAt:new Date().toISOString(),
    };
    const rows=loadBookings();saveBookings([request,...rows]);setCreated(request);setStep("success");
  }

  if(!item)return null;
  if(!providerIdentified(item,kind))return <div aria-label="商家待核实" aria-modal="true" className="booking-backdrop" role="dialog"><section className="booking-sheet unresolved-booking"><button aria-label="关闭" className="booking-close" onClick={close} type="button">×</button><span>?</span><small>暂时不能预约</small><h2>原帖没有确认具体{kind==="photo"?"摄影方":"妆造店"}</h2><p>目前只采集到“{providerName}”这样的描述，无法证明它对应哪一家真实商户。为了避免把预约发给错误店铺，这里不会显示套餐、日期和选购项。</p><div><strong>需要补齐</strong><i>作者明确回复的店名或账号</i><i>能够对应的实体地址</i><i>当前价格和服务范围</i></div>{item.sourceUrl&&<a href={item.sourceUrl} rel="noreferrer" target="_blank">回原帖继续核实</a>}<button onClick={close} type="button">知道了</button></section></div>;
  if(!providerConnected(item,kind)){
    const profile=kind==="photo"?item.photographerProfileUrl:item.shopProfileUrl;
    return <div aria-label="商家尚未接入" aria-modal="true" className="booking-backdrop" role="dialog"><section className="booking-sheet unresolved-booking not-connected"><button aria-label="关闭" className="booking-close" onClick={close} type="button">×</button><span>沟</span><small>信息已识别 · 商家尚未接入</small><h2>{providerName}</h2><p>这篇帖子已经提供了{kind==="photo"?"摄影方":"妆造方"}线索，但商家还没有绑定旅妆地图的预约后台。这里不会假装已经为你下单，也不会展示虚构档期。</p><div className="contact-ready"><strong>{price?.value}</strong><i>{price?.note}</i><i>{item.serviceArrangement||"具体包含项目需要沟通"}</i><i>准备确认套餐、日期、加价项与退款规则</i></div><div className="unresolved-actions"><button onClick={()=>{close();window.dispatchEvent(new CustomEvent("lvzhuang-open-landing",{detail:item.id}));}} type="button">查看价格与询问清单</button>{profile&&<a href={profile} rel="noreferrer" target="_blank">查看{kind==="photo"?"摄影师":"商家"}账号</a>}{item.sourceUrl&&<a href={item.sourceUrl} rel="noreferrer" target="_blank">查看原始帖子</a>}</div></section></div>;
  }
  return <div aria-label="预约中心" aria-modal="true" className="booking-backdrop" role="dialog">
    <section className="booking-sheet">
      <button aria-label="关闭预约" className="booking-close" onClick={close} type="button">×</button>
      {step==="store"&&<>
        <div className="store-cover">
          {item.image&&<img alt={`${providerName}真实案例`} src={item.image}/>}<i/>
          <div><span>{kind==="photo"?"摄影方":"妆造 / 服装方"}</span><h2>{providerName}</h2><p>{item.city} · {item.spot}</p></div>
        </div>
        <div className="store-content">
          <div className="store-trust"><span>{completion>=3?"资料较完整":"等待补充资料"}</span><strong>{arrangement(item)}</strong><p>当前资料来自原帖、作者回复及已采集的公开信息；没有确认的内容会明确标出。</p></div>
          <div className="store-facts">
            <article><span>参考价格</span><strong>{price?.value}</strong><small>{price?.note}</small></article>
            <article><span>实体位置</span><strong>{item.storeAddress||"等待核实"}</strong><small>{item.storeAddress?"已有地址信息":"不会虚构距离和门牌"}</small></article>
            <article><span>服务关系</span><strong>{arrangement(item)}</strong><small>{item.photographer?`摄影：${item.photographer}`:"摄影方尚未识别"}</small></article>
          </div>
          <div className="service-preview"><div><span>本次可提交的需求模块</span><small>商家入驻后可自行开启、关闭和定价</small></div><p>{available.map((entry)=><i key={entry}>{entry}</i>)}</p></div>
          <div className="store-case"><img alt="参考案例" src={item.image}/><div><small>从这个真实案例发起</small><strong>{item.title}</strong><span>@{item.author} · {item.platform}</span></div></div>
          <div className="store-actions">{kind==="makeup"?<a href={mapUrl(item)} rel="noreferrer" target="_blank">查看地图</a>:item.photographerProfileUrl?<a href={item.photographerProfileUrl} rel="noreferrer" target="_blank">摄影师主页</a>:<a href={item.sourceUrl} rel="noreferrer" target="_blank">查看原帖</a>}<button onClick={()=>setStep("form")} type="button">选择套餐并预约</button></div>
          <p className="booking-honesty">该商家尚未在平台确认实时档期。提交的是预约需求，只有商家确认后才算预约成功。</p>
        </div>
      </>}
      {step==="form"&&<div className="booking-form-page">
        <button className="booking-back" onClick={()=>setStep("store")} type="button">← 返回店铺</button>
        <span className="eyebrow">STANDARD BOOKING</span><h2>把想拍的，变成一张清楚的预约单</h2>
        <div className="booking-reference">{item.image&&<img alt="预约参考案例" src={item.image}/>}<div><small>预约对象</small><strong>{providerName}</strong><span>{item.title}</span></div></div>
        <fieldset><legend>选择服务模块</legend><div className="service-options">{available.map((entry)=><button className={chosen.includes(entry)?"active":""} key={entry} onClick={()=>toggle(entry)} type="button"><span>{chosen.includes(entry)?"✓":"＋"}</span>{entry}</button>)}</div></fieldset>
        <div className="booking-fields">
          <label>希望日期 *<input max={maxDate} min={minDate} onChange={(event)=>setDate(event.target.value)} type="date" value={date}/><small>从明天开始，可选择未来约3个月</small></label>
          <label>希望拍摄时间<select onChange={(event)=>setPeriod(event.target.value)} value={period}><option>清晨 · 08:00左右开拍</option><option>上午 · 10:00左右开拍</option><option>下午 · 16:00左右开拍</option><option>蓝调 · 18:00左右开拍</option><option>夜景 · 20:00左右开拍</option></select></label>
          <label>同行人数<input max="8" min="1" onChange={(event)=>setPeople(Number(event.target.value))} type="number" value={people}/></label>
          <label>整体预算<select onChange={(event)=>setBudget(event.target.value)} value={budget}><option>300—500元</option><option>500—800元</option><option>800—1200元</option><option>1200—2000元</option><option>预算待沟通</option></select></label>
          <label>服装尺码 / 身高<input onChange={(event)=>setSize(event.target.value)} placeholder="例如：160cm，平时穿M码" value={size}/></label>
          <label>肤质说明<select onChange={(event)=>setSkin(event.target.value)} value={skin}><option>无特殊说明</option><option>敏感肌</option><option>痘肌</option><option>自带底妆产品</option><option>需要提前沟通</option></select></label>
          <label className="wide">联系方式 *<input onChange={(event)=>setContact(event.target.value)} placeholder="微信号或手机号，仅用于本次预约沟通" value={contact}/></label>
          <label className="wide">补充要求<textarea onChange={(event)=>setNote(event.target.value)} placeholder="例如：想在16:00前完成妆造；可以接受相近服装替代；摄影需要夜景补光。" value={note}/></label>
        </div>
        <div className="booking-timeline"><div><i>1</i><strong>提前约2小时</strong><span>到店妆造</span></div><div><i>2</i><strong>预留30分钟</strong><span>前往{item.spot}</span></div><div><i>3</i><strong>{period.split(" · ")[0]}</strong><span>与摄影方会合</span></div></div>
        <div className="price-disclosure"><span>价格状态</span><strong>{price?.value}</strong><p>{price?.note}。提交后商家可以确认原方案、调整时间或重新报价；你再次确认后才形成正式预约。</p></div>
        <button className="submit-booking" disabled={!date||date<minDate||date>maxDate||!contact.trim()||!chosen.length} onClick={submit} type="button">提交预约需求</button>
      </div>}
      {step==="success"&&created&&<div className="booking-success"><span>✓</span><small>预约状态</small><h2>需求已经保存，等待商家确认</h2><p>这不是虚假的“预约成功”。商家确认时间、服务和报价后，你还需要再确认一次。</p><div><strong>{created.provider}</strong><span>{created.date} · {created.period}</span><span>{created.services.join("、")}</span></div><button onClick={close} type="button">完成</button></div>}
    </section>
  </div>;
}

export function BookingCenter({cases}:{cases:CaseItem[]}){
  const [visible,setVisible]=useState(()=>typeof window!=="undefined"&&window.location.hash==="#profile");
  const [rows,setRows]=useState<BookingRequest[]>(loadBookings);
  const [merchant,setMerchant]=useState(false);

  useEffect(()=>{
    function refresh(){
      setVisible(window.location.hash==="#profile");setRows(loadBookings());
      try{setMerchant(JSON.parse(localStorage.getItem("lvzhuang-trial-account")||"null")?.role==="merchant");}catch{setMerchant(false);}
    }
    function afterClick(){setTimeout(refresh,0);}
    window.addEventListener("hashchange",refresh);window.addEventListener("lvzhuang-booking-updated",refresh);
    document.addEventListener("click",afterClick,true);refresh();
    return()=>{window.removeEventListener("hashchange",refresh);window.removeEventListener("lvzhuang-booking-updated",refresh);document.removeEventListener("click",afterClick,true);};
  },[]);

  const enriched=useMemo(()=>rows.map((row)=>({row,item:cases.find((entry)=>entry.id===row.caseId)})),[rows,cases]);
  function status(id:string,next:BookingStatus){const updated=rows.map((row)=>row.id===id?{...row,status:next}:row);setRows(updated);saveBookings(updated);}
  if(!visible||!rows.length)return null;
  return <section className="booking-center">
    <div className="booking-center-head"><div><span className="eyebrow">BOOKING DESK</span><h2>{merchant?"预约确认台":"我的预约"}</h2><p>{merchant?"统一处理游客提交的时间、服务和报价需求。":"从需求提交到商家确认，每一步都有明确状态。"}</p></div><strong>{rows.filter((row)=>row.status==="pending").length} 条待确认</strong></div>
    <div className="booking-list">{enriched.map(({row,item})=><article key={row.id}>{row.image&&<img alt="预约案例" src={row.image}/>}<div><span className={`booking-status ${row.status}`}>{statusLabel[row.status]}</span><h3>{row.provider}</h3><p>{row.date} · {row.period} · {row.people}人</p><small>{row.services.join("、")}</small>{item&&<em>{item.city} · {item.spot}</em>}</div>{merchant&&row.status==="pending"?<div className="merchant-booking-actions"><button onClick={()=>status(row.id,"confirmed")} type="button">确认档期</button><button onClick={()=>status(row.id,"proposal")} type="button">调整方案</button><button onClick={()=>status(row.id,"rejected")} type="button">无法接单</button></div>:!merchant&&row.status==="pending"?<button className="cancel-booking" onClick={()=>status(row.id,"cancelled")} type="button">取消需求</button>:null}</article>)}</div>
  </section>;
}
