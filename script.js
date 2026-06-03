const RR={EU:{QA:60000/1820,DEV:80000/1820,PO:85000/1820},US:{QA:120000/2080,DEV:140000/2080,PO:175000/2080}};
const BRD=.3,MF=10,AF=3,TP=9.5,TPR=2,OVH=1.5,ACP=4;
let resultsUnlocked=false;
let reportUnlocked=false;
function g(id){return document.getElementById(id);}
function nv(id){return parseFloat(g(id).value);}
function fm(v,s){return s+Math.round(v).toLocaleString('en-GB');}

function updateSliderFill(el){
  const min=parseFloat(el.min)||0,max=parseFloat(el.max)||100,val=parseFloat(el.value);
  const pct=((val-min)/(max-min))*100;
  el.style.background=`linear-gradient(to right,var(--acc) ${pct}%,var(--surf3) ${pct}%)`;
}

function stepCommit(hiddenId,displayId,min,max,fmt){
  const disp=g(displayId);
  let v=parseFloat(disp.textContent.replace(/\s/g,''));
  if(isNaN(v)) v=parseFloat(g(hiddenId).value);
  v=Math.max(min,Math.min(max,v));
  g(hiddenId).value=v;
  disp.textContent=fmt(v);
  live();
}
function stepEdit(e,hiddenId,displayId,min,max,fmt){
  if(e.key==='Enter'){e.preventDefault();g(displayId).blur();return;}
  if(!/[\d]/.test(e.key)&&!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)){e.preventDefault();return;}
  // hard block: check value after this keystroke
  const disp=g(displayId);
  setTimeout(()=>{
    const v=parseFloat(disp.textContent.replace(/\s/g,''));
    if(!isNaN(v)&&v>max){
      disp.textContent=fmt(max);
      g(hiddenId).value=max;
      // move cursor to end
      const range=document.createRange(),sel=window.getSelection();
      range.selectNodeContents(disp);range.collapse(false);
      sel.removeAllRanges();sel.addRange(range);
      live();
    }
  },0);
}
function stepChange(hiddenId,displayId,delta,min,max,fmt){
  const el=g(hiddenId);
  let v=parseFloat(el.value)+delta;
  v=Math.max(min,Math.min(max,v));
  el.value=v;
  g(displayId).textContent=fmt(v);
  live();
}

function getEx(){
  const qa=nv('s-qa'),po=nv('s-po'),dv=nv('s-dev'),r=RR[g('region').value];
  if(qa>0)return{count:qa,rate:r.QA,label:'QA'};
  if(po>0)return{count:po,rate:r.PO,label:'PO'};
  return{count:dv,rate:r.DEV,label:'Dev'};
}
function cAll(){
  const reg=g('region').value,r=RR[reg],s=reg==='EU'?'€':'$';
  const qa=nv('s-qa'),dv=nv('s-dev'),po=nv('s-po'),rl=nv('s-rel'),cs=nv('s-cas'),mp=nv('s-man')/100,ah=nv('s-aut'),ph=nv('s-poh'),bg=nv('s-bug');
  const ex=getEx();
  const mh=cs*mp*rl*(10/60),cm=mh*ex.rate,cmt=(mh/MF)*ex.rate;
  const aht=ah*rl,ca=aht*ex.rate,cat=(aht/AF)*ex.rate;
  const pht=ph*rl,cp=pht*r.PO,cpt=(pht/AF)*r.PO;
  const intr=dv*0.5*r.DEV;
  const cbp=(TP*r.DEV*OVH)+(1.5*ex.rate)+(0.5*r.PO)+intr;
  const cbpr=(TPR*r.DEV)+(0.5*ex.rate);
  const bprev=bg*BRD,cbm=bg*cbp,cbmt=(bg*0.7*cbp)+(bprev*cbpr);
  const bsm=(bprev*cbp)-(bprev*cbpr),bsy=bsm*12;
  const dhr=bprev*TP*OVH*12;
  const tm=cm+ca+cp+cbm,tmt=cmt+cat+cpt+cbmt,sm=tm-tmt,sy=sm*12;
  const tmy=tm*12,tmty=tmt*12;
  const nm=cs*mp,acno=ex.count*ACP*rl;
  const m80n=acno>0?(nm*.8)/acno:999,m80t=acno>0?(nm*.8)/(acno*AF):333,msv=m80n-m80t;
  const sp=acno>0?nm/(ex.count*ACP):0,bh=sp*40*ex.count,bcn=bh*ex.rate,bct=(bh/AF)*ex.rate;
  const pct=tmy>0?Math.round(sy/tmy*100):0;
  const rat=cbp>0?Math.round(cbp/cbpr*10)/10:0;
  return{s,r,reg,ex,qa,dv,po,rl,cs,mp,ah,ph,bg,mh,aht,pht,
    cm,cmt,ca,cat,cp,cpt,cbm,cbmt,bprev,cbp,cbpr,intr,bsm,bsy,dhr,
    tm,tmt,sm,sy,tmy,tmty,nm,acno,m80n,m80t,msv,bcn,bct,pct,rat};
}

function renderResults(d){
  const s=d.s;const fv=v=>fm(v,s);

  // ROI total
  g('h-saving').textContent=fv(d.sy);
  g('h-before').textContent=fv(d.tmy)+'/year';
  g('h-after').textContent=fv(d.tmty)+'/year';
  g('h-pct').textContent=d.pct;
  g('k-devh').textContent=Math.round(d.dhr)+'h';
  g('k-bugs').textContent=Math.round(d.bprev*12);
  g('k-ratio').textContent=d.rat+'×';

  // Incident ROI
  g('br-save').textContent=fv(d.bsy);
  g('br-before').textContent=fv(d.cbm*12)+'/year';
  g('br-before-d').textContent=`${fv(d.cbp)}/incident · ${fv(d.cbm)}/month`;
  g('br-after').textContent=fv(d.cbmt*12)+'/year';
  g('br-after-d').textContent=`${fv(d.cbpr)}/incident caught in staging · ${fv(d.cbmt)}/month`;
  g('br-devh').textContent=Math.round(d.dhr)+'h';

  // Time to set up
  g('t-gv').textContent=d.msv>0?Math.ceil(d.msv):'0';
  g('t-no').textContent=d.m80n<500?Math.ceil(d.m80n):'∞';
  g('t-th').textContent=d.m80t<500?Math.ceil(d.m80t):'∞';
  g('t-cn').textContent=Math.round(d.acno)+' cases/month';
  g('t-ct').textContent=Math.round(d.acno*3)+' cases/month';
  g('t-gs2').textContent=fv(d.bcn-d.bct);

  window._d=d;

  g('acc-sum-1').textContent=fv((d.cm-d.cmt)*12);
  g('acc-sum-2').textContent=fv((d.ca-d.cat)*12);
  g('acc-sum-3').textContent=fv((d.cp-d.cpt)*12);
  g('acc-sum-4').textContent=fv(d.bsy);
}

function live(){
  const d=cAll();
  g('exb').textContent=`Main executor: ${d.ex.label} · ${d.s}${Math.round(d.ex.rate)}/h`;
  if(resultsUnlocked) renderResults(d);
  if(reportUnlocked) renderDetailedReport(d);
}

function calculate(){
  const d=cAll();
  resultsUnlocked=true;
  g('cta-btn').classList.add('clicked');
  // Hide the button after first click — results stay live from here on
  g('cta-wrap').style.display='none';
  g('results').style.display='block';
  setTimeout(()=>{
    const top=g('roi-anchor').getBoundingClientRect().top+window.scrollY-60;
    window.scrollTo({top,behavior:'smooth'});
  },60);
  renderResults(d);
}

function renderDetailedReport(d){
  const s=d.s,fv=v=>fm(v,s),r=d.r;
  const brs=[
    ['Triage & reproduction','Dev','1.5h',1.5*r.DEV],
    ['Fix development','Dev','5h',5*r.DEV],
    ['Senior review & validation','Dev','1.5h',1.5*r.DEV],
    ['Retest & redeploy','Dev','1.5h',1.5*r.DEV],
    ['Urgency coordination overhead','Dev','+50%',TP*r.DEV*0.5],
    ['Regression retest',d.ex.label+'/QA','1.5h',1.5*d.ex.rate],
    ['Stakeholder communication','PO','0.5h',0.5*r.PO],
    ['Team interruption',`${d.dv} dev`,`${d.dv*0.5}h`,d.intr],
    ['TOTAL PER PRODUCTION INCIDENT','','',d.cbp],
    ['Bug caught in staging','Dev+QA','2.5h',d.cbpr],
    ['NET SAVING PER INCIDENT','','',d.cbp-d.cbpr]
  ];
  g('btb').innerHTML=brs.map((b,i)=>{
    let cls='';
    if(i===8)cls='bt-total';
    else if(i===10)cls='bt-net';
    const role=`<td style="font-size:11px;color:var(--mut2);font-weight:400">${b[1]}</td>`;
    const dur=`<td style="font-size:11px;color:var(--mut);font-weight:400">${b[2]}</td>`;
    const cost=`<td>${typeof b[3]==='number'?fv(b[3]):''}</td>`;
    return`<tr class="${cls}"><td>${b[0]}</td>${role}${dur}${cost}</tr>`;
  }).join('');

  g('d1-cases').textContent=Math.round(d.cs*d.mp*d.rl)+' cases';
  g('d1-hours').textContent=Math.round(d.mh)+'h';
  g('d1-now').textContent=fv(d.cm);
  g('d1-th').textContent=fv(d.cmt);
  g('d1-gain').textContent='+ '+fv(d.cm-d.cmt)+'/month';
  g('d2-hours').textContent=Math.round(d.aht)+'h';
  g('d2-maint').textContent=Math.round(d.aht*0.5)+'h';
  g('d2-now').textContent=fv(d.ca);
  g('d2-th').textContent=fv(d.cat);
  g('d2-gain').textContent='+ '+fv(d.ca-d.cat)+'/month';
  g('d3-hours').textContent=Math.round(d.pht)+'h';
  g('d3-now').textContent=fv(d.cp);
  g('d3-th').textContent=fv(d.cpt);
  g('d3-gain').textContent='+ '+fv(d.cp-d.cpt)+'/month';
  g('d4-bugs').textContent=d.bg;
  g('d4-cpb').textContent=fv(d.cbp);
  g('d4-cpbpr').textContent=fv(d.cbpr);
  g('d4-prev').textContent=Math.round(d.bprev*10)/10;
  g('d4-now').textContent=fv(d.cbm);
  g('d4-th').textContent=fv(d.cbmt);
  g('d4-gain').textContent='+ '+fv(d.bsm)+'/month';

  g('syn-big').textContent=fv(d.sy);
  g('x-cost-b').textContent=fv(d.tmy);
  g('x-cost-a').textContent=fv(d.tmty);
  g('x-time-b').innerHTML=(d.m80n<500?Math.ceil(d.m80n):'∞')+'<small> month(s)</small>';
  g('x-time-a').innerHTML=(d.m80t<500?Math.ceil(d.m80t):'∞')+'<small> month(s)</small>';
  g('x-bug-b').innerHTML=Math.round(d.bg*12)+'<small> /year</small>';
  g('x-bug-a').innerHTML=Math.round(d.bg*12-d.bprev*12)+'<small> /year</small>';
  g('x-dev-b').textContent=fv(d.cbp);
  g('x-dev-a').textContent=fv(d.cbpr);

  const asm=[
    ['Manual test acceleration','10× faster (parallelisation + no-code generation)'],
    ['Automation acceleration','3× faster vs Playwright / Selenium'],
    ['Production incident reduction','30% intercepted before going live'],
    ['Production handling time',`${TP}h dev + overhead ×${OVH}`],
    ['Staging handling time',`${TPR}h dev + QA 0.5h`],
    ['QA salary','EU €60k / US $120k'],
    ['Dev salary','EU €80k / US $140k'],
    ['PO / BA salary','EU €85k / US $175k']
  ];
  g('ai').innerHTML=asm.map(a=>`<div class="ar"><span class="ak">${a[0]}</span><span class="av">${a[1]}</span></div>`).join('');
}

function unlock(){
  const e=g('oi-e').value.trim();
  if(!e||!e.includes('@')){g('oi-e').style.borderColor='rgba(0,91,240,.5)';g('oi-e').focus();return;}
  const d=cAll();
  reportUnlocked=true;
  // Hide opt-in, stop animation
  g('oi-e').closest('.opi').style.display='none';
  renderDetailedReport(d);
  g('rpt').style.display='block';
  setTimeout(()=>g('rpt').scrollIntoView({behavior:'smooth',block:'start'}),60);
}

function togAcc(n){
  const btn=g('acc-btn-'+n),body=g('acc-body-'+n);
  btn.classList.toggle('op');
  body.classList.toggle('op');
}
function tog(){g('ab').classList.toggle('op');g('ac').classList.toggle('op');}

const SL=[
  ['s-man','v-man',v=>v+'%'],
  ['s-aut','v-aut',v=>v+'h'],
  ['s-poh','v-poh',v=>v+'h'],
  ['s-bug','v-bug',v=>v]
];
SL.forEach(([si,vi,fn])=>{
  const el=g(si);
  updateSliderFill(el);
  el.addEventListener('input',function(){
    g(vi).textContent=fn(this.value);
    updateSliderFill(this);
    live();
  });
});
g('region').addEventListener('change',live);

// Custom dropdown logic
const CDD_META={
  'cdd-region':{
    hiddenId:'region',
    getDisplay:(val)=>{
      const map={EU:'Europe',US:'United States'};
      return`<div class="cdd-label">${map[val]}</div>`;
    }
  },
  'cdd-rel':{
    hiddenId:'s-rel',
    getDisplay:(val)=>`<div class="cdd-label">${val} / month</div>`
  }
};

function cddToggle(id){
  const el=document.getElementById(id);
  const isOpen=el.classList.contains('open');
  // close all
  document.querySelectorAll('.cdd.open').forEach(d=>d.classList.remove('open'));
  if(!isOpen) el.classList.add('open');
}

function cddPick(id,opt){
  const el=document.getElementById(id);
  const meta=CDD_META[id];
  const val=opt.dataset.value;
  // update hidden select
  g(meta.hiddenId).value=val;
  // update display
  document.getElementById(id+'-display').innerHTML=meta.getDisplay(val);
  // update selected state
  el.querySelectorAll('.cdd-opt').forEach(o=>o.classList.toggle('selected',o===opt));
  // close
  el.classList.remove('open');
  live();
}

// Close on outside click
document.addEventListener('click',e=>{
  if(!e.target.closest('.cdd')) document.querySelectorAll('.cdd.open').forEach(d=>d.classList.remove('open'));
});

live();
