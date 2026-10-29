'use client';
import React, {useState} from 'react';

type Props={site:string;articleKey:string|number;title:string;category?:string;src?:string|null;className?:string;replace?:boolean;eager?:boolean;fit?:'cover'|'contain'};
const endpoint='https://sic-group.us/api/editorial-photo/image';

function PhotoAttempt({site,articleKey,title,category='',src,className,replace=false,eager=false,fit='cover'}:Props){
 const [originalFailed,setOriginalFailed]=useState(false),[failed,setFailed]=useState(false);
 const preserve=!!src&&!replace&&!originalFailed;
 const url=(variant:string,width:number)=>`${endpoint}?${new URLSearchParams({site,key:String(articleKey),title,category,variant,width:String(width)})}`;
 const source=preserve?src:url('desktop',1600);
 return <figure role="img" aria-label={title} data-editorial-photo-key={`${site}:${articleKey}`} style={{margin:0,position:'relative',width:'100%',height:'100%',overflow:'hidden',background:'#e8ecef'}}>
  {!failed&&<picture>
   {!preserve&&<source media="(max-width: 767px)" srcSet={[480,720,960].map(width=>`${url('mobile',width)} ${width}w`).join(', ')} sizes="100vw"/>}
   <img src={source||undefined} srcSet={preserve?undefined:[640,960,1600].map(width=>`${url('desktop',width)} ${width}w`).join(', ')}
    sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 1200px" alt={title} className={className}
    style={{display:'block',width:'100%',height:'100%',objectFit:preserve?fit:'cover',objectPosition:'center'}} loading={eager?'eager':'lazy'} decoding="async"
    ref={image=>{if(image?.complete&&image.naturalWidth===0){if(preserve)setOriginalFailed(true);else setFailed(true);}}}
    onError={()=>{if(preserve)setOriginalFailed(true);else setFailed(true);}}/>
  </picture>}
 </figure>;
}
export default function UnsplashPhoto(props:Props){return <PhotoAttempt key={`${props.site}:${props.articleKey}:${props.src||''}:${!!props.replace}`} {...props}/>;}
