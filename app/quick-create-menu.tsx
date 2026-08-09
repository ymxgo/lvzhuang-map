"use client";

import { useEffect, useRef } from "react";
import styles from "./quick-create-menu.module.css";

export type QuickCreateMenuProps={
  open:boolean;
  onClose:()=>void;
  onPublish:()=>void;
  onMatch:()=>void;
};

export function QuickCreateMenu({open,onClose,onPublish,onMatch}:QuickCreateMenuProps){
  const publishRef=useRef<HTMLButtonElement>(null);
  const matchRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const frame=requestAnimationFrame(()=>publishRef.current?.focus({preventScroll:true}));
    return()=>{
      cancelAnimationFrame(frame);
      if(previous&&document.contains(previous))previous.focus({preventScroll:true});
    };
  },[open]);

  useEffect(()=>{
    if(!open)return;
    function onKeyDown(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();onClose();return;}
      if(event.key!=="Tab")return;
      const first=publishRef.current;const last=matchRef.current;if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",onKeyDown);
    return()=>document.removeEventListener("keydown",onKeyDown);
  },[onClose,open]);

  function choose(callback:()=>void){onClose();callback();}

  return <div aria-hidden={!open} className={`${styles.backdrop} ${open?styles.open:""}`}>
    <button aria-label="关闭创作菜单" className={styles.dismiss} onClick={onClose} tabIndex={-1} type="button"/>
    <section aria-label="选择创作方式" aria-modal="true" className={styles.menu} role="dialog">
      <span aria-hidden="true" className={styles.origin}>＋</span>
      <button className={`${styles.card} ${styles.publish}`} onClick={()=>choose(onPublish)} ref={publishRef} tabIndex={open?0:-1} type="button">
        <span aria-hidden="true" className={`${styles.icon} ${styles.publishIcon}`}>发</span>
        <span className={styles.copy}><strong>发布旅拍</strong><small>分享妆造、店铺和真实花费</small></span>
        <span aria-hidden="true" className={styles.arrow}>↗</span>
      </button>
      <button className={`${styles.card} ${styles.match}`} onClick={()=>choose(onMatch)} ref={matchRef} tabIndex={open?0:-1} type="button">
        <span aria-hidden="true" className={`${styles.icon} ${styles.matchIcon}`}>测</span>
        <span className={styles.copy}><strong>测脸找妆造</strong><small>上传正脸，匹配真实案例</small></span>
        <span aria-hidden="true" className={styles.arrow}>↗</span>
      </button>
    </section>
  </div>;
}

export default QuickCreateMenu;
