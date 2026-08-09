"use client";
/* eslint-disable @next/next/no-img-element -- original post images and local user previews stay unmodified */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- modal backdrops are pointer-only conveniences; every sheet also has a real close button */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import bundledXhsData from "./data/lvzhuang_xhs_cases.json";
import galleryStyles from "./detail-gallery.module.css";
import ExploreSandbox from "./explore-sandbox";
import QuickCreateMenu from "./quick-create-menu";

type City = "西安" | "洛阳" | "延吉" | "杭州";
type View = "home" | "explore" | "favorites" | "profile";
type StudioTab = "match" | "diy";
type TrialRole = "visitor" | "merchant";

export type CaseItem = {
  id:string; city:City; spot:string; title:string; style:string; mood:string;
  platform:"小红书"|"抖音"; author:string; shop:string; photographer?:string;
  serviceArrangement?:string; priceStatus?:string; price:number; packageText:string;
  distance:string; note:string; tags:string[]; image?:string; images:string[];
  sourceUrl?:string; shopProfileUrl?:string; photographerProfileUrl?:string;
  storeUrl?:string; storeAddress?:string; storePhone?:string; storeStatus?:string;
  photographerStatus?:string; shopBookingEnabled?:boolean; photographerBookingEnabled?:boolean;
  storeLatitude?:number; storeLongitude?:number; collectedAt?:string;
  shopEvidence?:string; shopEvidenceSource?:string; photographerEvidence?:string;
  photographerEvidenceSource?:string; priceEvidence?:string; distanceMeters?:number;
};

type TrialAccount = {role:TrialRole; name:string; city:City; shopName?:string};
type StickerItem = {id:number; sprite:number; x:number; y:number; size:number};

const cities:City[]=["西安","洛阳","延吉","杭州"];
const styles=["全部风格","唐妆","宋制","朝鲜族","新中式"];
const cityInfo:Record<City,{scene:string;note:string}>={
  西安:{scene:"盛唐入夜",note:"7 篇真实案例已收录"},
  洛阳:{scene:"神都灯影",note:"城市入口 · 等待真实采集"},
  延吉:{scene:"民族写真",note:"城市入口 · 等待真实采集"},
  杭州:{scene:"江南宋韵",note:"城市入口 · 等待真实采集"},
};
const stickerNames=["凤冠","牡丹簪花","珍珠额链","玉簪","云肩","红披帛","唐风团扇","花钿","流苏耳饰","玉佩","绣花护腕","金红飘带"];

function publicAsset(path:string){
  const clean=path.replace(/^\/+/,"");
  if(typeof document==="undefined")return `/${clean}`;
  return new URL(clean,document.baseURI).href;
}

function textValue(record:Record<string,unknown>,...keys:string[]){for(const key of keys){const value=record[key];if(typeof value==="string"&&value.trim())return value.trim();}return "";}
function arrayValue(record:Record<string,unknown>,...keys:string[]){for(const key of keys){const value=record[key];if(Array.isArray(value))return value;}return [];}
function objectValue(record:Record<string,unknown>,...keys:string[]){for(const key of keys){const value=record[key];if(value&&typeof value==="object"&&!Array.isArray(value))return value as Record<string,unknown>;}return {};}
function numberValue(record:Record<string,unknown>,...keys:string[]){for(const key of keys){const value=Number(record[key]);if(Number.isFinite(value)&&value!==0)return value;}return undefined;}
function booleanValue(record:Record<string,unknown>,...keys:string[]){for(const key of keys){const value=record[key];if(value===true||value===1||value==="true"||value==="enabled")return true;if(value===false||value===0||value==="false"||value==="disabled")return false;}return undefined;}
function inferStyle(value:string){if(/宋/.test(value))return "宋制";if(/朝鲜|民族/.test(value))return "朝鲜族";if(/新中式/.test(value))return "新中式";return "唐妆";}
function inferMood(value:string){if(/夜|灯|不夜城|钟楼/.test(value))return "夜景氛围";if(/侠|英气/.test(value))return "英气电影感";return "宫廷华贵";}
function imageUrls(record:Record<string,unknown>){
  const list=arrayValue(record,"images","imageUrls","pics","photos");
  const entries=list.map((item)=>typeof item==="string"?{url:item,cover:false}:{url:textValue(item as Record<string,unknown>,"url","src","original","originUrl"),cover:Boolean((item as Record<string,unknown>).is_cover)}).filter((item)=>item.url&&!/sns-avatar/i.test(item.url));
  return [...new Set([...entries.filter((item)=>item.cover),...entries.filter((item)=>!item.cover)].map((item)=>item.url.replace(/^http:\/\//i,"https://")))];
}
function normalizeCases(value:unknown):CaseItem[]{
  const root=value as Record<string,unknown>;
  const rows=Array.isArray(value)?value:arrayValue(root,"cases","items","records","data","notes");
  return rows.flatMap((entry,index)=>{
    if(!entry||typeof entry!=="object")return [];
    const row=entry as Record<string,unknown>;
    const author=objectValue(row,"author","creator");
    const shop=objectValue(row,"shop","store","merchant");
    const shopAccount=objectValue(shop,"account");
    const photographer=objectValue(row,"photographer","photography");
    const photographerAccount=objectValue(photographer,"account");
    const photographerStatus=textValue(photographer,"match_status");
    const location=objectValue(shop,"location","geo","coordinates");
    const packageRecord=(arrayValue(row,"packages")[0]??{}) as Record<string,unknown>;
    const tags=arrayValue(row,"style_tags","tags","styles").filter((tag):tag is string=>typeof tag==="string");
    const images=imageUrls(row);
    const copy=`${textValue(row,"title")} ${textValue(row,"content_snippet","note","description")} ${tags.join(" ")}`;
    const rawCity=textValue(row,"city","destination")||"西安";
    const city=(cities.find((item)=>rawCity.includes(item))??"西安") as City;
    const rawPrice=row.price??packageRecord.price;
    const price=Number(String(rawPrice??0).replace(/[^\d.]/g,""))||0;
    return [{
      id:textValue(row,"case_id","id")||`case-${index}`,city,spot:textValue(row,"scenic_spot","spot","poi")||"待补充景区",
      title:textValue(row,"title","name")||"未命名旅拍案例",style:textValue(row,"style","category")||inferStyle(copy),mood:textValue(row,"mood")||inferMood(copy),
      platform:/抖音|douyin/i.test(textValue(row,"platform","source"))?"抖音":"小红书",author:textValue(author,"name","nickname")||"未知作者",
      shop:textValue(shop,"name","mention_text")||"原帖未明确妆造店",photographer:textValue(photographer,"name","mention_text"),
      serviceArrangement:textValue(row,"service_arrangement_label","service_arrangement"),priceStatus:textValue(row,"price_status"),price,
      packageText:textValue(packageRecord,"name")||"套餐内容需沟通",distance:textValue(row,"distance")||"距离待核实",
      note:textValue(row,"content_snippet","note","description")||"信息来自真实采集记录。",tags:tags.length?tags:[inferStyle(copy)],images,image:images[0],
      sourceUrl:textValue(row,"note_url","canonical_url","sourceUrl"),shopProfileUrl:textValue(shopAccount,"profile_url"),photographerProfileUrl:photographerStatus!=="not_mentioned"?textValue(photographerAccount,"profile_url"):"",
      storeUrl:textValue(shop,"map_url","url"),storeAddress:textValue(shop,"address"),storePhone:textValue(shop,"phone"),storeStatus:textValue(shop,"match_status"),photographerStatus,
      shopBookingEnabled:booleanValue(shop,"booking_enabled","platform_booking_enabled")??booleanValue(row,"shop_booking_enabled"),
      photographerBookingEnabled:booleanValue(photographer,"booking_enabled","platform_booking_enabled")??booleanValue(row,"photographer_booking_enabled"),
      storeLatitude:numberValue(shop,"latitude")||numberValue(location,"latitude"),storeLongitude:numberValue(shop,"longitude")||numberValue(location,"longitude"),collectedAt:textValue(row,"collected_at"),
      shopEvidence:textValue(shop,"mention_evidence"),shopEvidenceSource:textValue(shop,"mention_source"),photographerEvidence:textValue(photographer,"mention_evidence"),
      photographerEvidenceSource:textValue(photographer,"mention_source"),priceEvidence:textValue(row,"price_evidence","price_note"),distanceMeters:numberValue(row,"distance_meters"),
    }];
  });
}

export const allCases=normalizeCases(bundledXhsData);

function useLocalState<T>(key:string,initial:T){
  const [value,setValue]=useState<T>(()=>{if(typeof window==="undefined")return initial;try{const saved=localStorage.getItem(key);return saved?JSON.parse(saved) as T:initial;}catch{return initial;}});
  useEffect(()=>{localStorage.setItem(key,JSON.stringify(value));},[key,value]);
  return [value,setValue] as const;
}

type DetectorResult={boundingBox:{x:number;y:number;width:number;height:number}};
type FaceDetectorCtor=new(options?:{fastMode?:boolean;maxDetectedFaces?:number})=>{detect:(source:CanvasImageSource)=>Promise<DetectorResult[]>};

function SmartImage({src,alt,fit="cover",className=""}:{src:string;alt:string;fit?:"cover"|"contain";className?:string}){
  const [position,setPosition]=useState(fit==="contain"?"50% 50%":"50% 38%");
  async function focus(event:React.SyntheticEvent<HTMLImageElement>){
    const image=event.currentTarget;
    if(fit==="contain")return;
    setPosition(image.naturalHeight>image.naturalWidth?"50% 36%":"50% 44%");
    try{
      const Detector=(window as unknown as {FaceDetector?:FaceDetectorCtor}).FaceDetector;
      if(!Detector)return;
      const faces=await new Detector({fastMode:true,maxDetectedFaces:4}).detect(image);
      if(!faces.length)return;
      const face=faces.sort((a,b)=>b.boundingBox.width*b.boundingBox.height-a.boundingBox.width*a.boundingBox.height)[0].boundingBox;
      const x=Math.max(18,Math.min(82,(face.x+face.width/2)/image.naturalWidth*100));
      const y=Math.max(20,Math.min(72,(face.y+face.height*1.35)/image.naturalHeight*100));
      setPosition(`${x}% ${y}%`);
    }catch{/* Native face detection is optional; the portrait-safe fallback remains. */}
  }
  return <img alt={alt} className={className} onError={(event)=>{event.currentTarget.style.display="none";}} onLoad={focus} referrerPolicy="no-referrer" src={src} style={{objectFit:fit,objectPosition:position}}/>;
}

function CaseVisual({item,index=0,className=""}:{item:CaseItem;index?:number;className?:string}){
  return <div className={`case-visual visual-${index%4} ${className}`}>{item.image&&<SmartImage alt={`${item.title}封面`} src={item.image}/>}<span className="origin-badge">真实采集</span><span className="platform-badge">{item.platform}</span></div>;
}

function DetailGallery({item}:{item:CaseItem}){
  const photos=item.images.filter(Boolean);
  const [activeIndex,setActiveIndex]=useState(0);
  const [controlsExpanded,setControlsExpanded]=useState(true);
  const [direction,setDirection]=useState<"next"|"previous">("next");
  const [dragOffset,setDragOffset]=useState(0);
  const [dragging,setDragging]=useState(false);
  const hideTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pointerStart=useRef<{id:number;x:number;y:number}|null>(null);
  const stageRef=useRef<HTMLButtonElement>(null);
  const thumbsRef=useRef<HTMLDivElement>(null);
  const active=photos[activeIndex]||"";
  const galleryId=`detail-gallery-${item.id.replace(/[^a-zA-Z0-9_-]/g,"-")}`;

  const clearHideTimer=useCallback(()=>{
    if(hideTimer.current!==null){clearTimeout(hideTimer.current);hideTimer.current=null;}
  },[]);
  const armHideTimer=useCallback(()=>{
    clearHideTimer();
    if(photos.length<2)return;
    hideTimer.current=setTimeout(()=>{setControlsExpanded(false);hideTimer.current=null;},2100);
  },[clearHideTimer,photos.length]);
  const revealControls=useCallback(()=>{
    setControlsExpanded(true);
    armHideTimer();
  },[armHideTimer]);

  useEffect(()=>{
    armHideTimer();
    return clearHideTimer;
  },[armHideTimer,clearHideTimer]);

  useEffect(()=>{
    if(!controlsExpanded)return;
    const selected=thumbsRef.current?.querySelector<HTMLElement>(`[data-gallery-index="${activeIndex}"]`);
    selected?.scrollIntoView({block:"nearest",inline:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  },[activeIndex,controlsExpanded]);

  function selectPhoto(nextIndex:number,nextDirection?:"next"|"previous"){
    const clamped=Math.max(0,Math.min(photos.length-1,nextIndex));
    if(clamped===activeIndex){armHideTimer();return;}
    setDirection(nextDirection??(clamped>activeIndex?"next":"previous"));
    setActiveIndex(clamped);armHideTimer();
  }
  function adjacent(step:-1|1){selectPhoto(activeIndex+step,step>0?"next":"previous");}
  function focusThumb(index:number){
    requestAnimationFrame(()=>thumbsRef.current?.querySelector<HTMLButtonElement>(`[data-gallery-index="${index}"]`)?.focus());
  }
  function onGalleryKeyDown(event:React.KeyboardEvent<HTMLElement>){
    if(event.key==="ArrowLeft"){event.preventDefault();adjacent(-1);}
    else if(event.key==="ArrowRight"){event.preventDefault();adjacent(1);}
    else if((event.key==="Enter"||event.key===" ")&&!controlsExpanded){event.preventDefault();revealControls();}
    else armHideTimer();
  }
  function onThumbKeyDown(event:React.KeyboardEvent<HTMLButtonElement>,index:number){
    let next=index;
    if(event.key==="ArrowLeft")next=Math.max(0,index-1);
    else if(event.key==="ArrowRight")next=Math.min(photos.length-1,index+1);
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=photos.length-1;
    else{return;}
    event.preventDefault();selectPhoto(next,next>index?"next":"previous");focusThumb(next);
  }
  function onPointerDown(event:React.PointerEvent<HTMLButtonElement>){
    if(event.pointerType==="mouse"&&event.button!==0)return;
    clearHideTimer();pointerStart.current={id:event.pointerId,x:event.clientX,y:event.clientY};setDragging(true);setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event:React.PointerEvent<HTMLButtonElement>){
    const start=pointerStart.current;if(!start||start.id!==event.pointerId)return;
    const dx=event.clientX-start.x;const dy=event.clientY-start.y;
    if(Math.abs(dx)<Math.abs(dy))return;
    const beyondEdge=(activeIndex===0&&dx>0)||(activeIndex===photos.length-1&&dx<0);
    setDragOffset(dx*(beyondEdge?.22:.72));
  }
  function finishPointer(event:React.PointerEvent<HTMLButtonElement>,cancelled=false){
    const start=pointerStart.current;if(!start||start.id!==event.pointerId)return;
    const dx=event.clientX-start.x;const dy=event.clientY-start.y;
    pointerStart.current=null;setDragging(false);setDragOffset(0);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(!cancelled&&Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.15)adjacent(dx<0?1:-1);else armHideTimer();
  }

  if(!active)return <div className={`detail-gallery ${galleryStyles.gallery}`}><div className={`detail-stage ${galleryStyles.empty}`}><span>原帖图片暂时无法显示</span></div></div>;
  return <div className={`detail-gallery ${galleryStyles.gallery}`}>
    <button aria-label={`${item.title}图集，共${photos.length}张，可左右滑动或使用方向键`} aria-roledescription="轮播图" className={`detail-stage ${galleryStyles.stage}`} id={`${galleryId}-panel`} onKeyDown={onGalleryKeyDown} onPointerCancel={(event)=>finishPointer(event,true)} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishPointer} ref={stageRef} type="button">
      <SmartImage alt="" className={`detail-ambient ${galleryStyles.ambient}`} key={`ambient-${active}`} src={active}/>
      <div className={`${galleryStyles.dragLayer} ${dragging?galleryStyles.dragging:""}`} style={{"--gallery-drag":`${dragOffset}px`} as React.CSSProperties}>
        <div className={`${galleryStyles.mainFrame} ${direction==="next"?galleryStyles.fromRight:galleryStyles.fromLeft}`} key={active}>
          <SmartImage alt={`${item.title}第${activeIndex+1}张，完整妆造图`} className={`detail-main ${galleryStyles.mainImage}`} fit="contain" src={active}/>
        </div>
      </div>
      <span className={`gallery-count ${galleryStyles.count}`}>完整原帖 · {activeIndex+1}/{photos.length}</span>
      <span className={galleryStyles.swipeHint}>左右滑动</span>
    </button>
    <div className={`${galleryStyles.controls} ${controlsExpanded?"":galleryStyles.controlsCollapsed}`} onBlurCapture={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))armHideTimer();}} onFocusCapture={clearHideTimer} onPointerDown={clearHideTimer} onPointerUp={(event)=>{(event.target as HTMLElement).closest<HTMLButtonElement>("button")?.blur();armHideTimer();}}>
      <div aria-label="选择原帖图片" className={`detail-thumbs ${galleryStyles.thumbRail}`} ref={thumbsRef} role="tablist">
        {photos.map((photo,index)=><button aria-controls={`${galleryId}-panel`} aria-label={`查看第${index+1}张图片`} aria-selected={index===activeIndex} className={index===activeIndex?"active":""} data-gallery-index={index} key={`${photo}-${index}`} onClick={()=>selectPhoto(index)} onKeyDown={(event)=>onThumbKeyDown(event,index)} role="tab" tabIndex={index===activeIndex?0:-1} type="button"><SmartImage alt="" src={photo}/><small aria-hidden="true">{index+1}</small></button>)}
      </div>
      <button aria-expanded={controlsExpanded} aria-label={`展开缩略图，当前第${activeIndex+1}张，共${photos.length}张`} className={galleryStyles.compactControl} onClick={()=>{revealControls();requestAnimationFrame(()=>stageRef.current?.focus({preventScroll:true}));}} tabIndex={controlsExpanded?-1:0} type="button">
        <span aria-hidden="true" className={galleryStyles.dots}>{photos.slice(0,9).map((_,index)=><i className={index===Math.min(activeIndex,8)?galleryStyles.activeDot:""} key={index}/>)}</span>
        <strong>{activeIndex+1}/{photos.length}</strong>
      </button>
    </div>
    <p aria-live="polite" className={galleryStyles.srOnly}>正在显示第{activeIndex+1}张，共{photos.length}张</p>
  </div>;
}

function fallbackSource(item:CaseItem){return item.sourceUrl||`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(`${item.city} ${item.title}`)}`;}
function fallbackStore(item:CaseItem){return `#booking=${encodeURIComponent(item.id)}`;}
function providerIdentified(item:CaseItem){
  if(!item.shop||/未明确|未提及|那家店|某家店|喜欢的那家|原帖.*方/.test(item.shop))return false;
  return Boolean(item.shopEvidence||item.shopProfileUrl||item.storeAddress||item.storeUrl||(item.storeLatitude&&item.storeLongitude));
}
export function providerConnected(item:CaseItem,kind:"makeup"|"photo"="makeup"){
  const enabled=kind==="photo"?item.photographerBookingEnabled:item.shopBookingEnabled;
  const status=kind==="photo"?item.photographerStatus:item.storeStatus;
  return enabled===true||/merchant_connected|platform_connected|booking_enabled|onboarded|claimed/i.test(status||"");
}
export function pricePresentation(item:CaseItem){
  if(!item.price)return {value:"价格需沟通",note:"原帖没有明确总价",tone:"unknown"};
  if(/merchant_confirmed|price_confirmed|^verified$/.test(item.priceStatus||""))return {value:`¥${item.price} 起`,note:"商家已确认",tone:"confirmed"};
  if(/mentioned/.test(item.priceStatus||""))return {value:`¥${item.price}`,note:"原帖提到 · 待商家确认",tone:"reference"};
  return {value:`¥${item.price}`,note:"采集参考 · 待商家确认",tone:"reference"};
}

function CaseGrid({items,favorites,onFavorite,onSelect:selectCase}:{items:CaseItem[];favorites:string[];onFavorite:(id:string)=>void;onSelect:(item:CaseItem)=>void}){
  function onSelect(item:CaseItem){const doc=document as Document&{startViewTransition?:(update:()=>void)=>unknown};if(doc.startViewTransition)doc.startViewTransition(()=>selectCase(item));else selectCase(item);}
  if(!items.length)return <div className="empty-state"><span>⌕</span><h3>这座城市暂未收录真实帖子</h3><p>入口先留在这里，等真实游客案例到位后再开放。</p></div>;
  return <div className="waterfall">{items.map((item,index)=>{const price=pricePresentation(item);return <article className="case-card" key={item.id}><button className="visual-button" onClick={()=>onSelect(item)} type="button"><CaseVisual index={index} item={item}/></button><div className="case-body"><button className="case-title" onClick={()=>onSelect(item)} type="button">{item.title}</button><div className="case-place">{item.city} · {item.spot}</div><div className="case-meta"><span>{price.value}</span><span>{item.style}</span></div><div className="case-author"><span className="avatar">旅</span><span>@{item.author}</span><button aria-label="收藏" className={favorites.includes(item.id)?"heart liked":"heart"} onClick={()=>onFavorite(item.id)} type="button">{favorites.includes(item.id)?"♥":"♡"}</button></div></div></article>;})}</div>;
}

function formatTime(total:number){const minutes=(total+24*60)%(24*60);return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;}

export function ExploreWorkbench({city,setCity:applyCity,style,setStyle,favorites,onFavorite,onSelect}:{city:City;setCity:(city:City)=>void;style:string;setStyle:(style:string)=>void;favorites:string[];onFavorite:(id:string)=>void;onSelect:(item:CaseItem)=>void}){
  const cityCases=allCases.filter((item)=>item.city===city&&(style==="全部风格"||item.style===style));
  const spots=[...new Set(cityCases.map((item)=>item.spot))];
  const [spot,setSpot]=useState(spots[0]||"");
  const [shootHour,setShootHour]=useState(18);
  const [makeupMinutes,setMakeupMinutes]=useState(120);
  const [shootMinutes,setShootMinutes]=useState(120);
  const [budget,setBudget]=useState(1200);
  const [saved,setSaved]=useState(false);
  const transfer=30;
  const shootStart=shootHour*60;
  const makeupStart=shootStart-makeupMinutes-transfer;
  const casesForSpot=cityCases.filter((item)=>!spot||item.spot===spot);
  const skyLeft=((shootHour-7)/14)*100;
  function setCity(next:City){applyCity(next);setSpot(allCases.find((item)=>item.city===next)?.spot||"");}
  function savePlan(){localStorage.setItem("lvzhuang-plan",JSON.stringify({city,spot,shootHour,makeupMinutes,shootMinutes,budget,savedAt:new Date().toISOString()}));setSaved(true);setTimeout(()=>setSaved(false),1800);}
  return <section className="explore-page"><div className="page-intro"><span className="eyebrow">SHOOT PLANNER</span><h1>把“想拍”变成能执行的一天</h1><p>先安排时间、预算和景点，再看对应真实案例。所有时间由你设定，不虚构营业时间和路程。</p></div><div className="city-tabs">{cities.map((item)=><button className={city===item?"active":""} key={item} onClick={()=>setCity(item)} type="button"><strong>{item}</strong><small>{cityInfo[item].note}</small></button>)}</div>{city!=="西安"?<div className="city-coming"><span>{city}</span><h2>{cityInfo[city].scene}正在收集真实样本</h2><p>这里只保留城市入口，不展示演示帖子。等妆造店、摄影师和游客案例核实后再开放。</p><button onClick={()=>setCity("西安")} type="button">先体验西安计划器</button></div>:<><section className="planner-lab"><div className="light-panel"><div className="planner-heading"><div><span className="eyebrow">LIGHT TRACK</span><h2>希望几点开始拍？</h2></div><strong>{formatTime(shootStart)}</strong></div><div className="sky-track"><span className="sky-label dawn">清晨</span><span className="sky-label noon">正午</span><span className="sky-label dusk">日落</span><span className="sky-label night">夜景</span><i style={{left:`${skyLeft}%`}}>●</i></div><input aria-label="拍摄开始时间" max="21" min="7" onChange={(event)=>setShootHour(Number(event.target.value))} step="1" type="range" value={shootHour}/><p className="light-note">{shootHour<10?"光线通常较柔和，人流相对少；出发前仍需查看当日天气。":shootHour<16?"日间顶光明显，优先选择廊下、树荫或室内窗边。":shootHour<19?"暖光到蓝调的变化最快，建议提前完成妆造并到达机位。":"适合灯景与近景人像，先拍人物，再等大场景人流空隙。"}</p></div><div className="plan-controls"><label>妆造预留<select onChange={(event)=>setMakeupMinutes(Number(event.target.value))} value={makeupMinutes}><option value="90">1.5 小时</option><option value="120">2 小时</option><option value="180">3 小时</option></select></label><label>拍摄时长<select onChange={(event)=>setShootMinutes(Number(event.target.value))} value={shootMinutes}><option value="60">1 小时</option><option value="120">2 小时</option><option value="180">3 小时</option></select></label><label>总预算<input max="5000" min="300" onChange={(event)=>setBudget(Number(event.target.value))} step="100" type="number" value={budget}/></label></div><div className="timeline-card"><div><i>1</i><span>{formatTime(makeupStart)}</span><strong>到店妆造</strong><small>按你预留的 {makeupMinutes/60} 小时倒推</small></div><div><i>2</i><span>{formatTime(shootStart-transfer)}</span><strong>出发去景点</strong><small>暂留 30 分钟；请按真实路程调整</small></div><div><i>3</i><span>{formatTime(shootStart)}</span><strong>{spot||"选择景点"} 开拍</strong><small>预计拍到 {formatTime(shootStart+shootMinutes)}</small></div></div><div className="budget-card"><div><span>妆造预留</span><strong>¥{Math.round(budget*.35)}</strong></div><div><span>摄影预留</span><strong>¥{Math.round(budget*.5)}</strong></div><div><span>交通/机动</span><strong>¥{Math.round(budget*.15)}</strong></div><small>只是预算分配工具，不代表商家真实报价。</small></div></section><div className="spot-picker"><div className="section-heading"><div><span className="eyebrow">CHOOSE A SCENE</span><h2>这次想在哪儿入戏</h2></div></div><div>{spots.map((item)=><button className={spot===item?"active":""} key={item} onClick={()=>setSpot(item)} type="button"><strong>{item}</strong><span>{cityCases.filter((entry)=>entry.spot===item).length} 篇真实案例</span></button>)}</div><button className="save-plan" onClick={savePlan} type="button">{saved?"已保存到我的行程 ✓":"保存这份出片计划"}</button></div><div className="explore-controls"><div className="style-tabs">{styles.map((item)=><button className={style===item?"active":""} key={item} onClick={()=>setStyle(item)} type="button">{item}</button>)}</div></div><div className="section-heading"><div><span className="eyebrow">REAL REFERENCES</span><h2>{spot||"西安"}可参考的真实帖子</h2></div><small>{casesForSpot.length} 条</small></div><CaseGrid favorites={favorites} items={casesForSpot} onFavorite={onFavorite} onSelect={onSelect}/></>}</section>;
}

function ProfileHub({favorites,onOpenPublish,onOpenStudio}:{favorites:string[];onOpenPublish:()=>void;onOpenStudio:(tab:StudioTab)=>void}){
  const [account,setAccount]=useLocalState<TrialAccount|null>("lvzhuang-trial-account",null);
  const [role,setRole]=useState<TrialRole>("visitor");
  const [name,setName]=useState("");
  const [shopName,setShopName]=useState("");
  const [city,setCity]=useState<City>("西安");
  const [merchantSaved,setMerchantSaved]=useState(false);
  const [plan]=useLocalState<Record<string,unknown>|null>("lvzhuang-plan",null);
  function enter(){if(!name.trim())return;setAccount({role,name:name.trim(),city,shopName:role==="merchant"?shopName.trim():undefined});}
  if(!account)return <section className="profile-page"><div className="profile-intro"><span className="eyebrow">TRY AN IDENTITY</span><h1>你来这里，是为了出发，还是接住一次喜欢？</h1><p>选择一个试用身份。资料只保存在当前设备，不发送验证码，也不冒充正式账户系统。</p></div><div className="role-grid"><button className={role==="visitor"?"active":""} onClick={()=>setRole("visitor")} type="button"><span>旅</span><strong>我是游客</strong><small>收藏灵感、做行程、发布成片、云搭配</small></button><button className={role==="merchant"?"active":""} onClick={()=>setRole("merchant")} type="button"><span>店</span><strong>我是商家</strong><small>维护门店、案例、套餐和预约入口</small></button></div><div className="trial-form"><label>{role==="visitor"?"怎么称呼你":"联系人称呼"}<input onChange={(event)=>setName(event.target.value)} placeholder={role==="visitor"?"例如：小鱼":"例如：林店长"} value={name}/></label>{role==="merchant"&&<label>店铺名称<input onChange={(event)=>setShopName(event.target.value)} placeholder="例如：长安唐妆馆" value={shopName}/></label>}<label>常用城市<select onChange={(event)=>setCity(event.target.value as City)} value={city}>{cities.map((item)=><option key={item}>{item}</option>)}</select></label><button disabled={!name.trim()} onClick={enter} type="button">进入{role==="visitor"?"游客":"商家"}试用空间</button><small>正式小程序将接入微信登录；当前阶段不采集手机号和密码。</small></div></section>;
  return <section className="profile-page"><div className={`account-hero ${account.role}`}><div><span>{account.role==="visitor"?"游客空间":"商家工作台"}</span><h1>{account.name}，{account.role==="visitor"?"今天想种下哪颗旅行种子？":"把真实服务讲清楚，比广告更有用。"}</h1><p>{account.city} · {account.role==="merchant"?(account.shopName||"店铺资料待完善"):"旅拍灵感账户"}</p></div><button onClick={()=>setAccount(null)} type="button">切换身份</button></div>{account.role==="visitor"?<><div className="account-metrics"><div><strong>{favorites.length}</strong><span>收藏案例</span></div><div><strong>{plan?1:0}</strong><span>出片计划</span></div><div><strong>0</strong><span>投稿草稿</span></div></div><div className="visitor-actions"><button onClick={onOpenPublish} type="button"><span>发</span><div><strong>发布我的旅拍</strong><small>照片、店铺、摄影和真实体验</small></div></button><button onClick={()=>onOpenStudio("match")} type="button"><span>测</span><div><strong>测脸型找灵感</strong><small>先从轮廓方向筛选真实案例</small></div></button><button onClick={()=>onOpenStudio("diy")} type="button"><span>搭</span><div><strong>云搭配 DIY</strong><small>把凤冠、花钿、披帛贴到自己的照片上</small></div></button></div><div className="profile-seed"><span>旅行种子</span><h2>{plan?"你的西安出片计划已经保存":"先做一份不着急出发的计划"}</h2><p>哪怕暂时不去，也可以收藏一套妆造、试一次搭配、慢慢把想象变成目的地。</p></div></>:<><div className="merchant-panel"><div className="merchant-progress"><span>门店资料完成度</span><strong>{account.shopName?"40%":"20%"}</strong><i><b style={{width:account.shopName?"40%":"20%"}}/></i></div><div className="merchant-form"><label>店铺名称<input defaultValue={account.shopName}/></label><label>主要景区<select defaultValue={account.city}><option>西安 · 大唐不夜城</option><option>西安 · 大唐芙蓉园</option><option>西安 · 钟楼</option></select></label><label>主营服务<select defaultValue="妆造"><option>妆造与服装</option><option>摄影跟拍</option><option>妆造摄影一体</option></select></label><label>参考价格<input placeholder="例如：199 起"/></label><button onClick={()=>{setMerchantSaved(true);setTimeout(()=>setMerchantSaved(false),1800);}} type="button">{merchantSaved?"门店草稿已保存 ✓":"保存门店资料草稿"}</button></div></div><div className="merchant-tools"><article><span>案例</span><strong>上传真实客片</strong><p>注明是否获得顾客展示授权。</p></article><article><span>套餐</span><strong>把包含项目写清楚</strong><p>妆发、服装、精修和加价项分别列出。</p></article><article><span>预约</span><strong>预约能力待接入</strong><p>正式版再连接排期、订金与退款规则。</p></article></div></>}</section>;
}

function PublishSheet({onClose}:{onClose:()=>void}){
  const [photos,setPhotos]=useState<string[]>([]);
  const [saved,setSaved]=useState(false);
  const [caption,setCaption]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);
  function add(files?:FileList|null){if(!files)return;setPhotos((current)=>[...current,...Array.from(files).slice(0,9-current.length).map((file)=>URL.createObjectURL(file))]);}
  function save(){localStorage.setItem("lvzhuang-publish-draft",JSON.stringify({caption,photoCount:photos.length,savedAt:new Date().toISOString()}));setSaved(true);}
  return <div className="modal-backdrop" onClick={(event)=>{if(event.target===event.currentTarget)onClose();}}><section className="create-sheet"><button className="sheet-close" onClick={onClose} type="button">×</button><span className="eyebrow">SHARE A REAL DAY</span><h2>发布我的旅拍</h2><p>把“谁做的妆造、谁拍的、真实花了多少”一起留下，下一位游客会少踩一个坑。</p><button className="publish-upload" onClick={()=>inputRef.current?.click()} type="button"><span>＋</span><strong>添加成片或现场图</strong><small>最多 9 张，仅在当前设备预览</small></button><input accept="image/*" className="sr-only" multiple onChange={(event)=>add(event.target.files)} ref={inputRef} type="file"/>{photos.length>0&&<div className="publish-previews">{photos.map((photo,index)=><div key={photo}><img alt={`待发布图片${index+1}`} src={photo}/><button onClick={()=>setPhotos((items)=>items.filter((_,i)=>i!==index))} type="button">×</button></div>)}</div>}<div className="publish-form"><label>去了哪里<input placeholder="例如：西安 · 大唐芙蓉园"/></label><label>妆造店<input placeholder="不知道可以写“现场随机找”"/></label><label>摄影方<input placeholder="可填写摄影师账号或门店"/></label><label>真实花费<input inputMode="decimal" placeholder="妆造和摄影分开写更有帮助"/></label><label className="wide">想对后来的人说<textarea onChange={(event)=>setCaption(event.target.value)} placeholder="效果、排队、加价、服务和最推荐的地方……" value={caption}/></label></div><button className="primary-action" disabled={!photos.length&&!caption.trim()} onClick={save} type="button">{saved?"已保存到本机草稿 ✓":"保存投稿草稿"}</button><small className="local-note">当前是产品原型，不会公开上传；正式发布前会再次确认图片授权和内容。</small></section></div>;
}

function StudioSheet({initialTab,onClose,cases}:{initialTab:StudioTab;onClose:()=>void;cases:CaseItem[]}){
  const [tab,setTab]=useState<StudioTab>(initialTab);
  const [faceShape,setFaceShape]=useState("柔和圆润");
  const [facePhoto,setFacePhoto]=useState("");
  const [diyPhoto,setDiyPhoto]=useState("");
  const [stickers,setStickers]=useState<StickerItem[]>([]);
  const [selectedSticker,setSelectedSticker]=useState<number|null>(null);
  const faceInput=useRef<HTMLInputElement>(null);
  const diyInput=useRef<HTMLInputElement>(null);
  const stageRef=useRef<HTMLDivElement>(null);
  const dragRef=useRef<{id:number;x:number;y:number}|null>(null);
  const stickerId=useRef(0);
  const recommendations=useMemo(()=>{const keywords:Record<string,string[]>={"柔和圆润":["唐","高盘发","花钿"],"清秀偏长":["清透","温柔","宋"],"轮廓利落":["英气","新中式","高马尾"],"均衡鹅蛋":["唐妆","汉服","复原"]};const wanted=keywords[faceShape]||[];return [...cases].sort((a,b)=>wanted.filter((word)=>`${b.title}${b.tags.join("")}`.includes(word)).length-wanted.filter((word)=>`${a.title}${a.tags.join("")}`.includes(word)).length).slice(0,3);},[cases,faceShape]);
  function fileUrl(file?:File){return file?URL.createObjectURL(file):"";}
  function addSticker(sprite:number){const id=++stickerId.current;setStickers((items)=>[...items,{id,sprite,x:50,y:42,size:sprite===0?48:32}]);setSelectedSticker(id);}
  function pointerDown(event:React.PointerEvent,id:number){dragRef.current={id,x:event.clientX,y:event.clientY};setSelectedSticker(id);event.currentTarget.setPointerCapture(event.pointerId);}
  function pointerMove(event:React.PointerEvent){const drag=dragRef.current;const stage=stageRef.current;if(!drag||!stage)return;const rect=stage.getBoundingClientRect();const dx=(event.clientX-drag.x)/rect.width*100;const dy=(event.clientY-drag.y)/rect.height*100;dragRef.current={...drag,x:event.clientX,y:event.clientY};setStickers((items)=>items.map((item)=>item.id===drag.id?{...item,x:Math.max(0,Math.min(100,item.x+dx)),y:Math.max(0,Math.min(100,item.y+dy))}:item));}
  async function exportLook(){if(!diyPhoto)return;const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});const [photo,sheet]=await Promise.all([load(diyPhoto),load(publicAsset("assets/hanfu-stickers.png"))]);const canvas=document.createElement("canvas");canvas.width=800;canvas.height=1000;const context=canvas.getContext("2d");if(!context)return;context.fillStyle="#1a1512";context.fillRect(0,0,800,1000);const ratio=Math.min(800/photo.naturalWidth,1000/photo.naturalHeight);const pw=photo.naturalWidth*ratio;const ph=photo.naturalHeight*ratio;context.drawImage(photo,(800-pw)/2,(1000-ph)/2,pw,ph);const sw=sheet.naturalWidth/4;const sh=sheet.naturalHeight/3;stickers.forEach((item)=>{const col=item.sprite%4;const row=Math.floor(item.sprite/4);const dw=item.size/100*800;const dh=dw*(sh/sw);context.drawImage(sheet,col*sw,row*sh,sw,sh,item.x/100*800-dw/2,item.y/100*1000-dh/2,dw,dh);});const anchor=document.createElement("a");anchor.download="我的旅妆云搭配.png";anchor.href=canvas.toDataURL("image/png");anchor.click();}
  const selected=stickers.find((item)=>item.id===selectedSticker);
  const stickerSheet=publicAsset("assets/hanfu-stickers.png");
  return <div className="modal-backdrop studio-backdrop" onClick={(event)=>{if(event.target===event.currentTarget)onClose();}}><section className="studio-sheet"><button className="sheet-close" onClick={onClose} type="button">×</button><div className="studio-tabs"><button className={tab==="match"?"active":""} onClick={()=>setTab("match")} type="button">看我适合什么</button><button className={tab==="diy"?"active":""} onClick={()=>setTab("diy")} type="button">云搭配 DIY</button></div>{tab==="match"?<div className="match-studio"><div><span className="eyebrow">FACE DIRECTION</span><h2>先看轮廓方向，再看真实案例</h2><p>照片只在设备上预览。目前原型由你选择接近的轮廓，不会假装已经完成 AI 医学级识别。</p><button className={facePhoto?"portrait-upload has-photo":"portrait-upload"} onClick={()=>faceInput.current?.click()} style={facePhoto?{backgroundImage:`url(${facePhoto})`}:undefined} type="button">{facePhoto?<span>更换照片</span>:<><b>＋</b><strong>上传正脸照片</strong><small>正视、无遮挡、光线均匀</small></>}</button><input accept="image/*" className="sr-only" onChange={(event)=>setFacePhoto(fileUrl(event.target.files?.[0]))} ref={faceInput} type="file"/></div><div className="shape-panel"><span>选择接近的脸部轮廓</span><div>{["柔和圆润","清秀偏长","轮廓利落","均衡鹅蛋"].map((shape)=><button className={faceShape===shape?"active":""} key={shape} onClick={()=>setFaceShape(shape)} type="button">{shape}</button>)}</div><div className="match-result"><strong>{faceShape}可以先试</strong><p>{faceShape==="柔和圆润"?"提高发顶、保留脸侧轻盈碎发，唐风高盘发通常更显精神。":faceShape==="清秀偏长"?"横向发饰和柔和低盘发能增加温婉感，可先看宋制与清透妆。":faceShape==="轮廓利落"?"简洁发面、英气眉形和新中式造型更容易突出骨相。":"多数发型方向都容易适配，可以先按景区氛围选择。"}</p></div></div><div className="match-cases">{recommendations.map((item,index)=><article key={item.id}><CaseVisual index={index} item={item}/><strong>{item.title}</strong><small>{item.spot} · {item.style}</small></article>)}</div></div>:<div className="diy-studio"><div className="diy-copy"><span className="eyebrow">CLOUD DRESS-UP</span><h2>不去景区，也能先把自己放进故事里</h2><p>上传照片，点选贴纸后拖动到合适位置；选中贴纸还可以缩放和删除。</p></div><div className="diy-layout"><div className="diy-canvas" ref={stageRef}>{diyPhoto?<img alt="云搭配底图" src={diyPhoto}/>:<button onClick={()=>diyInput.current?.click()} type="button"><span>＋</span><strong>上传一张自己的照片</strong><small>半身或正脸照片都可以</small></button>}{stickers.map((item)=>{const col=item.sprite%4;const row=Math.floor(item.sprite/4);return <div aria-label={stickerNames[item.sprite]} className={selectedSticker===item.id?"placed-sticker selected":"placed-sticker"} key={item.id} onPointerDown={(event)=>pointerDown(event,item.id)} onPointerMove={pointerMove} onPointerUp={()=>{dragRef.current=null;}} role="button" style={{left:`${item.x}%`,top:`${item.y}%`,width:`${item.size}%`,backgroundImage:`url('${stickerSheet}')`,backgroundPosition:`${col/3*100}% ${row/2*100}%`,backgroundSize:"400% 300%"}} tabIndex={0}/>;})}</div><div className="sticker-tools"><input accept="image/*" className="sr-only" onChange={(event)=>setDiyPhoto(fileUrl(event.target.files?.[0]))} ref={diyInput} type="file"/><div className="sticker-palette">{stickerNames.map((name,index)=>{const col=index%4;const row=Math.floor(index/4);return <button key={name} onClick={()=>addSticker(index)} type="button"><i style={{backgroundImage:`url('${stickerSheet}')`,backgroundPosition:`${col/3*100}% ${row/2*100}%`,backgroundSize:"400% 300%"}}/><span>{name}</span></button>;})}</div>{selected&&<div className="sticker-adjust"><label>贴纸大小<input max="70" min="12" onChange={(event)=>setStickers((items)=>items.map((item)=>item.id===selected.id?{...item,size:Number(event.target.value)}:item))} type="range" value={selected.size}/></label><button onClick={()=>{setStickers((items)=>items.filter((item)=>item.id!==selected.id));setSelectedSticker(null);}} type="button">删除选中贴纸</button></div>}<div className="diy-actions"><button onClick={()=>diyInput.current?.click()} type="button">更换照片</button><button disabled={!diyPhoto} onClick={exportLook} type="button">保存我的搭配图</button></div></div></div></div>}</section></div>;
}

export default function Experience(){
  const [view,setView]=useState<View>("home");
  const [city,setCity]=useState<City>("西安");
  const [favorites,setFavorites]=useLocalState<string[]>("lvzhuang-favorites",[]);
  const [selected,setSelected]=useState<CaseItem|null>(null);
  const [detailClosing,setDetailClosing]=useState(false);
  const [plusOpen,setPlusOpen]=useState(false);
  const [publishOpen,setPublishOpen]=useState(false);
  const [studioOpen,setStudioOpen]=useState(false);
  const [studioTab,setStudioTab]=useState<StudioTab>("match");
  useEffect(()=>{const frame=window.requestAnimationFrame(()=>{const hash=window.location.hash.slice(1) as View;if(["home","explore","favorites","profile"].includes(hash))setView(hash);});return()=>window.cancelAnimationFrame(frame);},[]);
  useEffect(()=>{document.body.style.overflow=selected||publishOpen||studioOpen||plusOpen?"hidden":"";return()=>{document.body.style.overflow="";};},[selected,publishOpen,studioOpen,plusOpen]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("lvzhuang-case-detail",{detail:selected?.id||null}));},[selected]);
  const visible=allCases.slice(0,8);
  const favoriteCases=allCases.filter((item)=>favorites.includes(item.id));
  const relatedCases=selected?allCases.filter((item)=>item.id!==selected.id&&item.city===selected.city).sort((a,b)=>(b.spot===selected.spot?2:0)+(b.style===selected.style?1:0)-((a.spot===selected.spot?2:0)+(a.style===selected.style?1:0))).slice(0,4):[];
  function go(next:View){const update=()=>{setView(next);setPlusOpen(false);history.replaceState(null,"",`#${next}`);scrollTo({top:0,behavior:"smooth"});};const doc=document as Document&{startViewTransition?:(callback:()=>void)=>unknown};if(doc.startViewTransition)doc.startViewTransition(update);else update();}
  function toggleFavorite(id:string){setFavorites((items)=>items.includes(id)?items.filter((item)=>item!==id):[...items,id]);}
  function openStudio(tab:StudioTab){setStudioTab(tab);setStudioOpen(true);setPlusOpen(false);}
  function openCase(item:CaseItem){setDetailClosing(false);setSelected(item);}
  function closeDetail(){if(detailClosing)return;setDetailClosing(true);window.setTimeout(()=>{setSelected(null);setDetailClosing(false);},240);}
  function openLanding(){if(selected)window.dispatchEvent(new CustomEvent("lvzhuang-open-landing",{detail:selected.id}));}
  const selectedPrice=selected?pricePresentation(selected):null;
  const makeupConnected=selected?providerConnected(selected,"makeup"):false;
  const photoConnected=selected?providerConnected(selected,"photo"):false;

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={()=>go("home")} type="button"><span>旅</span><div><strong>旅妆地图</strong><small>TRAVEL BEAUTY MAP</small></div></button><div className="top-status">西安首批 · {allCases.length} 篇真实案例</div></header>
    {view==="home"&&<><section className="hero"><SmartImage alt="西安旅拍妆造" src={allCases[2]?.image||allCases[0]?.image||""}/><div className="hero-shade"/><div className="hero-copy"><span>REAL TRAVEL PORTRAITS</span><h1>先在这里，<br/>成为一次想象。</h1><p>看真实游客怎么妆、谁拍、花了多少；即使暂时不出发，也可以先收藏、试搭和做计划。</p><button onClick={()=>go("explore")} type="button">开始做一份出片计划 →</button></div></section><section className="home-content"><div className="section-heading"><div><span className="eyebrow">DESTINATIONS</span><h2>从哪座城开始种草</h2></div></div><div className="city-story-grid">{cities.map((item,index)=><button className={item==="西安"?"city-story available":"city-story"} key={item} onClick={()=>{setCity(item);go("explore");}} type="button"><span>0{index+1}</span><strong>{item}</strong><b>{cityInfo[item].scene}</b><small>{cityInfo[item].note}</small></button>)}</div><div className="play-banner"><div><span className="eyebrow">PLAY BEFORE YOU GO</span><h2>还没订票，也可以先云搭一套</h2><p>上传自己的照片，把凤冠、花钿、云肩和披帛拖到身上，看看哪一种风格会让你想真正去一次。</p></div><button onClick={()=>openStudio("diy")} type="button">打开云搭配 DIY</button></div><div className="section-heading"><div><span className="eyebrow">REAL STORIES</span><h2>西安真实旅拍灵感</h2></div><small>{visible.length} 篇</small></div><CaseGrid favorites={favorites} items={visible} onFavorite={toggleFavorite} onSelect={openCase}/></section></>}
    {view==="explore"&&<ExploreSandbox cases={allCases} initialCity={city} onCityChange={setCity} onOpenCase={(id)=>{const item=allCases.find((entry)=>entry.id===id);if(item)openCase(item);}}/>} 
    {view==="favorites"&&<section className="favorites-page"><div className="favorite-hero"><span className="eyebrow">MY SHOOT LIST</span><h1>收藏不是终点，是一份慢慢成形的出发。</h1><p>{favoriteCases.length?`你已经留下 ${favoriteCases.length} 个真实案例。下一步可以把喜欢的景区和时间放进行程。`:"先收藏一套真正打动你的妆造，再决定什么时候出发。"}</p><button onClick={()=>go("explore")} type="button">去做出片计划</button></div><CaseGrid favorites={favorites} items={favoriteCases} onFavorite={toggleFavorite} onSelect={openCase}/></section>}
    {view==="profile"&&<ProfileHub favorites={favorites} onOpenPublish={()=>setPublishOpen(true)} onOpenStudio={openStudio}/>} 
    <QuickCreateMenu open={plusOpen} onClose={()=>setPlusOpen(false)} onMatch={()=>openStudio("match")} onPublish={()=>setPublishOpen(true)}/>
    <nav className="bottom-nav"><button className={view==="home"?"active":""} onClick={()=>go("home")} type="button"><span>⌂</span>首页</button><button className={view==="explore"?"active":""} onClick={()=>go("explore")} type="button"><span>⌖</span>探索</button><button aria-expanded={plusOpen} className={plusOpen?"plus-button open":"plus-button"} onClick={()=>setPlusOpen((open)=>!open)} type="button"><span>＋</span><small>创作</small></button><button className={view==="favorites"?"active":""} onClick={()=>go("favorites")} type="button"><span>♡</span>收藏</button><button className={view==="profile"?"active":""} onClick={()=>go("profile")} type="button"><span>○</span>我的</button></nav>
    {selected&&selectedPrice&&<div className={`modal-backdrop detail-backdrop ${detailClosing?"closing":""}`} onClick={(event)=>{if(event.target===event.currentTarget)closeDetail();}}><section aria-label={`${selected.title}详情`} aria-modal="true" className="detail-sheet" role="dialog"><button aria-label="关闭帖子详情" className="sheet-close glass-control" onClick={closeDetail} type="button">×</button><DetailGallery item={selected} key={selected.id}/><div className="detail-content"><div className="detail-source"><span>{selected.platform}</span><span>@{selected.author}</span><small>真实采集</small></div><h2>{selected.title}</h2><p className="detail-location">⌖ {selected.city} · {selected.spot}</p><p className="detail-note">{selected.note}</p><div className="tag-row">{selected.tags.map((tag)=><span key={tag}>{tag}</span>)}</div>
      <section className={`price-overview ${selectedPrice.tone}`}><div><small>这套案例的价格</small><strong>{selectedPrice.value}</strong></div><span>{selectedPrice.note}</span><p>{selected.price?"把它当作出发前的预算参考，最终以商家确认的套餐、日期和加价项为准。":"这篇没有公开总价，先准备询问妆发、服装、饰品和摄影是否分别收费。"}</p></section>
      <a className={`provider-card provider-link ${makeupConnected?"connected":"pending"}`} href={fallbackStore(selected)}><span>妆</span><div><small>{providerIdentified(selected)?"原帖已识别的妆造方":"妆造方仍待核实"}</small><strong>{selected.shop}</strong><p>{selected.storeAddress||selected.packageText}</p></div><div className="provider-state"><b>{selectedPrice.value}</b><small>{makeupConnected?"已接入 · 直接预约":"未接入 · 查看沟通准备"}</small></div></a>
      {selected.photographer&&<a className={`provider-card provider-link photo-provider ${photoConnected?"connected":"pending"}`} href={fallbackStore(selected)}><span>摄</span><div><small>原帖提到的摄影方</small><strong>{selected.photographer}</strong><p>{selected.serviceArrangement||"服务方式需沟通"}</p></div><div className="provider-state"><b>{photoConnected?"可预约":"待沟通"}</b><small>{photoConnected?"已接入平台":"尚未接入"}</small></div></a>}
      <div className="detail-actions"><button className="detail-plan-action" onClick={openLanding} type="button"><span>准备清单</span><strong>查看价格、缺失项和询价话术</strong><b>›</b></button><a className="source-action" href={fallbackSource(selected)} rel="noreferrer" target="_blank"><span>来源</span><strong>查看原始帖子</strong><b>↗</b></a></div>
      {relatedCases.length>0&&<section className="related-cases"><div><small>同景区继续看</small><h3>更多真实妆造可能</h3></div><div>{relatedCases.map((item,index)=><button key={item.id} onClick={()=>openCase(item)} type="button"><CaseVisual index={index} item={item}/><strong>{item.title}</strong><small>{pricePresentation(item).value}</small></button>)}</div></section>}
    </div></section></div>}
    {publishOpen&&<PublishSheet onClose={()=>setPublishOpen(false)}/>} 
    {studioOpen&&<StudioSheet cases={allCases} initialTab={studioTab} onClose={()=>setStudioOpen(false)}/>} 
  </main>;
}
