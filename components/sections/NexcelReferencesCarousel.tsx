"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {useBrand} from "@/contexts/BrandContext";

export default function NexcelReferencesCarousel(){
  const brand=useBrand(), path=usePathname();
  const active=brand.id==="nexcel"&&path==="/";
  const holder=useRef<HTMLDivElement>(null);
  const track=useRef<HTMLElement|null>(null);
  const cards=useRef<HTMLElement[]>([]);
  const [state,setState]=useState({index:0,total:0});

  useEffect(()=>{
    if(!active)return;
    const section=holder.current?.closest('section[data-nxl-ref-section="true"]');
    const el=section?.querySelector<HTMLElement>('[data-nxl-ref-track="true"]');
    const list=el?Array.from(el.children).filter((n):n is HTMLElement=>n instanceof HTMLElement):[];
    if(!el||!section||list.length<2)return;

    track.current=el;cards.current=list;
    const oldTab=el.getAttribute("tabindex");
    const oldLabel=el.getAttribute("aria-label");
    el.tabIndex=0;
    el.setAttribute("aria-label","Referenzprojekte horizontal blättern");
    section.setAttribute("data-nxl-ref-active","true");

    const update=()=>{
      const left=el.getBoundingClientRect().left;
      let index=0,best=Infinity;
      list.forEach((card,i)=>{
        const d=Math.abs(card.getBoundingClientRect().left-left);
        if(d<best){best=d;index=i}
      });
      if(el.scrollLeft>=el.scrollWidth-el.clientWidth-2)index=list.length-1;
      setState(prev=>prev.index===index&&prev.total===list.length?prev:{index,total:list.length});
    };

    const onKey=(event:KeyboardEvent)=>{
      if(event.target!==el||!(["ArrowLeft","ArrowRight"].includes(event.key)))return;
      event.preventDefault();
      const left=el.getBoundingClientRect().left;
      let i=0,best=Infinity;
      list.forEach((card,j)=>{
        const d=Math.abs(card.getBoundingClientRect().left-left);
        if(d<best){best=d;i=j}
      });
      if(el.scrollLeft>=el.scrollWidth-el.clientWidth-2)i=list.length-1;
      const next=list[Math.max(0,Math.min(list.length-1,i+(event.key==="ArrowRight"?1:-1)))];
      el.scrollTo({
        left:next.getBoundingClientRect().left-left+el.scrollLeft,
        behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"
      });
    };

    el.addEventListener("scroll",update,{passive:true});
    el.addEventListener("keydown",onKey);
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(update):null;
    ro?.observe(el);
    list.forEach(card=>ro?.observe(card));
    update();

    return()=>{
      ro?.disconnect();
      el.removeEventListener("scroll",update);
      el.removeEventListener("keydown",onKey);
      section.removeAttribute("data-nxl-ref-active");
      if(oldTab===null)el.removeAttribute("tabindex");else el.setAttribute("tabindex",oldTab);
      if(oldLabel===null)el.removeAttribute("aria-label");else el.setAttribute("aria-label",oldLabel);
      track.current=null;cards.current=[];
    };
  },[active]);

  const move=(step:number)=>{
    const el=track.current,list=cards.current;
    if(!el||!list.length)return;
    const target=list[Math.max(0,Math.min(list.length-1,state.index+step))];
    el.scrollTo({
      left:target.getBoundingClientRect().left-el.getBoundingClientRect().left+el.scrollLeft,
      behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"
    });
  };

  return <div ref={holder} className="nxl-ref-controls-anchor">
    {active&&state.total>1&&<nav className="nxl-ref-controls" aria-label="Projekt-Slider">
      <span className="nxl-ref-label">AUSGEWÄHLTE PROJEKTE</span>
      <span className="nxl-ref-counter" aria-live="polite">
        {String(state.index+1).padStart(2,"0")} / {String(state.total).padStart(2,"0")}
      </span>
      <span className="nxl-ref-bar" aria-hidden="true">
        <span style={{width:`${(state.index+1)*100/state.total}%`}}/>
      </span>
      <button type="button" aria-label="Vorheriges Projekt"
        disabled={state.index===0} onClick={()=>move(-1)}>←</button>
      <button type="button" aria-label="Nächstes Projekt"
        disabled={state.index===state.total-1} onClick={()=>move(1)}>→</button>
    </nav>}
  </div>;
}
