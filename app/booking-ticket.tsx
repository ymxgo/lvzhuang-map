"use client";

import { useEffect, useState } from "react";
import styles from "./booking-ticket.module.css";

export type BookingTicketData={
  code:string;
  status:string;
  title:string;
  provider:string;
  place:string;
  date:string;
  period:string;
  services:string[];
  budget?:string;
  note:string;
  demo?:boolean;
};

type TicketState="ready"|"filing"|"filed";

function roundedRect(context:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number){
  context.beginPath();
  context.roundRect(x,y,width,height,radius);
}

function drawWrapped(context:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines=3){
  const chars=[...text];
  let line="";
  let row=0;
  for(const char of chars){
    const next=line+char;
    if(context.measureText(next).width>maxWidth&&line){
      context.fillText(line,x,y+row*lineHeight);
      line=char;row+=1;
      if(row>=maxLines)return;
    }else line=next;
  }
  if(line&&row<maxLines)context.fillText(line,x,y+row*lineHeight);
}

function createTicketCanvas(data:BookingTicketData){
  const canvas=document.createElement("canvas");
  canvas.width=1080;canvas.height=1440;
  const context=canvas.getContext("2d");
  if(!context)return null;
  context.fillStyle="#eee8df";context.fillRect(0,0,1080,1440);
  const glow=context.createRadialGradient(820,150,30,820,150,620);
  glow.addColorStop(0,"rgba(202,69,54,.18)");glow.addColorStop(1,"rgba(202,69,54,0)");
  context.fillStyle=glow;context.fillRect(0,0,1080,700);
  roundedRect(context,90,70,900,1298,62);context.fillStyle="#fffdf9";context.fill();
  context.save();context.setLineDash([16,16]);context.strokeStyle="#cfc5ba";context.lineWidth=3;
  context.beginPath();context.moveTo(130,390);context.lineTo(950,390);context.stroke();context.restore();
  context.fillStyle="#c44436";context.font='700 40px "Noto Sans SC", sans-serif';context.fillText("旅妆地图",140,150);
  context.fillStyle="#8b8179";context.font='500 24px "Noto Sans SC", sans-serif';context.fillText("TRAVEL BEAUTY TICKET",140,195);
  roundedRect(context,760,112,170,58,29);context.fillStyle=data.demo?"#2f5145":"#c44436";context.fill();
  context.fillStyle="#fff";context.font='700 25px "Noto Sans SC", sans-serif';context.textAlign="center";context.fillText(data.status,845,150);context.textAlign="left";
  context.fillStyle="#211c19";context.font='800 60px "Noto Sans SC", sans-serif';drawWrapped(context,data.title,140,290,760,72,2);
  const rows=[
    ["妆造 / 摄影方",data.provider],
    ["目的地",data.place],
    ["预约日期",data.date],
    ["希望时段",data.period],
    ["服务清单",data.services.join(" · ")],
    ["预算准备",data.budget||"待商家确认"],
  ];
  let top=480;
  rows.forEach(([label,value],index)=>{
    context.fillStyle="#91867d";context.font='600 23px "Noto Sans SC", sans-serif';context.fillText(label,145,top);
    context.fillStyle="#231e1a";context.font=`${index===2?"800":"650"} ${index===2?38:30}px "Noto Sans SC", sans-serif`;
    drawWrapped(context,value,390,top,530,42,2);top+=index===4?120:105;
  });
  roundedRect(context,130,1110,820,132,30);context.fillStyle="#f2ede6";context.fill();
  context.fillStyle="#776d65";context.font='500 24px "Noto Sans SC", sans-serif';drawWrapped(context,data.note,165,1160,750,36,2);
  context.fillStyle="#b3a79d";context.font='500 21px ui-monospace, monospace';context.fillText(`# ${data.code}`,145,1300);
  context.textAlign="right";context.fillText("把喜欢的一套，安排成能出发的一天",930,1300);context.textAlign="left";
  for(let i=0;i<7;i++){context.beginPath();context.arc(245+i*100,1368,9,0,Math.PI*2);context.fillStyle="#c44436";context.fill();}
  return canvas;
}

export default function BookingTicket({data,onDone,onOpenWallet}:{data:BookingTicketData;onDone:()=>void;onOpenWallet?:()=>void}){
  const [ticketState,setTicketState]=useState<TicketState>("ready");
  const [saveMessage,setSaveMessage]=useState("");

  useEffect(()=>()=>{setTicketState("ready");},[]);

  async function saveImage(){
    const canvas=createTicketCanvas(data);if(!canvas)return;
    const blob=await new Promise<Blob|null>((resolve)=>canvas.toBlob(resolve,"image/png",1));if(!blob)return;
    const file=new File([blob],`旅妆预约小票-${data.code}.png`,{type:"image/png"});
    const shareNavigator=navigator as Navigator&{canShare?:(value:{files:File[]})=>boolean;share?:(value:{files:File[];title:string;text:string})=>Promise<void>};
    if(shareNavigator.share&&shareNavigator.canShare?.({files:[file]})){
      try{await shareNavigator.share({files:[file],title:"我的旅妆预约小票",text:`${data.place} · ${data.provider}`});setSaveMessage("已打开手机保存面板");return;}catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;}
    }
    const link=document.createElement("a");link.download=file.name;link.href=URL.createObjectURL(blob);link.click();window.setTimeout(()=>URL.revokeObjectURL(link.href),1000);setSaveMessage("小票图片已下载");
  }

  function fileTicket(){
    if(ticketState!=="ready")return;
    setTicketState("filing");
    window.setTimeout(()=>setTicketState("filed"),900);
  }

  return <div className={styles.success}>
    <div aria-hidden="true" className={styles.sparkles}><i/><i/><i/><i/><i/></div>
    <header><span>{data.demo?"体验预约完成":"预约意向提交成功"}</span><h2>{data.demo?"一张流程小票，已经准备好":"先把这次心动，稳稳收好"}</h2><p>{data.note}</p></header>
    <div className={styles.scene} data-ticket-state={ticketState}>
      <article aria-label="预约小票" className={styles.ticket}>
        <div className={styles.ticketTop}><span>旅妆地图</span><b>{data.status}</b></div>
        <small>TRAVEL BEAUTY TICKET · #{data.code}</small>
        <h3>{data.title}</h3>
        <dl>
          <div><dt>妆造 / 摄影方</dt><dd>{data.provider}</dd></div>
          <div><dt>目的地</dt><dd>{data.place}</dd></div>
          <div><dt>日期</dt><dd>{data.date}</dd></div>
          <div><dt>时段</dt><dd>{data.period}</dd></div>
          <div><dt>服务</dt><dd>{data.services.join(" · ")}</dd></div>
          <div><dt>预算</dt><dd>{data.budget||"待商家确认"}</dd></div>
        </dl>
        <footer><span>把喜欢的一套，安排成能出发的一天</span><i/><i/><i/><i/><i/></footer>
      </article>
      <div aria-hidden="true" className={styles.wallet}><i/><span>我的票夹</span><b>{ticketState==="filed"?"✓":"旅"}</b></div>
      {ticketState==="filed"&&<div aria-live="polite" className={styles.filedMessage}><span>✓</span><strong>已收到我的票夹</strong><small>这张小票保存在当前设备的预约记录里</small></div>}
    </div>
    {ticketState==="ready"?<div className={styles.actions}>
      <button className={styles.save} onClick={saveImage} type="button"><span>▣</span><strong>保存小票图片</strong><small>手机会打开保存或分享面板</small></button>
      <button className={styles.file} onClick={fileTicket} type="button"><span>⌄</span><strong>不存图片，收进票夹</strong><small>仍保留在本机预约记录</small></button>
    </div>:ticketState==="filed"?<div className={styles.finishedActions}>{onOpenWallet&&<button onClick={onOpenWallet} type="button">去我的票夹</button>}<button onClick={onDone} type="button">继续浏览案例</button></div>:<p className={styles.filingLabel}>正在收好你的小票…</p>}
    {saveMessage&&<p aria-live="polite" className={styles.saveMessage}>{saveMessage}</p>}
  </div>;
}
