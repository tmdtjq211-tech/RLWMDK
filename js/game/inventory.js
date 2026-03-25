// js/game/inventory.js

import { grades, gradeOrder, specialSkills, normalSkills, getRandomStats } from '../data/constants.js';
import { state } from '../core/state.js';
import { createCardHTML, setSlotHTML } from '../ui/renderer.js';
import { getBattleStats, getCardBaseInfo } from './battle-utils.js';

window.toggleSellMode = () => { 
    state.sellMode = !state.sellMode; state.selectedForSell.clear(); 
    document.getElementById('sell-mode-btn').textContent = `선택 판매: ${state.sellMode ? 'ON' : 'OFF'}`; 
    document.getElementById('sell-mode-btn').style.background = state.sellMode ? '#ff006e' : '#444'; 
    document.getElementById('sell-actions').style.display = state.sellMode ? 'block' : 'none'; 
    window.renderMyCards(); 
};

window.execSelectSell = () => {
    if(state.selectedForSell.size === 0) return alert("선택된 카드가 없습니다."); 
    if(!confirm(`선택한 ${state.selectedForSell.size}장의 카드를 판매하시겠습니까? (보호 제외)`)) return;
    
    let sCnt=0, ern=0, keep=[];
    for(let c of state.myCards){
        if(state.selectedForSell.has(String(c.instanceId)) && !c.isLocked){ 
            let isEq=state.fusionCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.aiAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.pvpAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.exploreCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.defenseDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.plunderAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.hcAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.tnAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId)); 
            if(!isEq){ sCnt++; ern+=grades[c.grade].sellPrice; continue; } 
        }
        keep.push(c);
    }
    state.myCards=keep; state.money+=ern; state.selectedForSell.clear(); 
    document.getElementById('sel-sell-cnt').textContent = 0; 
    alert(`🧹 총 ${sCnt}장 판매 완료 (+${ern}G)`); 
    window.updateUI(); window.renderMyCards(); window.saveUserData();
};

window.bulkSell = (grade) => {
    if(!confirm(`보호 상태가 아닌 모든 ${grade}등급 카드를 일괄 판매하시겠습니까?`)) return;
    let sCnt=0, ern=0, keep=[];
    for(let c of state.myCards){
        if(c.grade===grade&&!c.isLocked){ 
            let isEq=state.fusionCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.aiAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.pvpAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.exploreCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.defenseDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.plunderAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.hcAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||state.tnAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId)); 
            if(!isEq){ sCnt++; ern+=grades[grade].sellPrice; continue; } 
        }
        keep.push(c);
    }
    if(sCnt===0) return alert("판매할 카드가 없습니다."); 
    state.myCards=keep; state.money+=ern; 
    alert(`🧹 총 ${sCnt}장의 카드를 판매하여 ${ern}G를 획득했습니다!`); 
    window.updateUI(); window.renderMyCards(); window.saveUserData();
};

window.renderMyCards = () => { 
    const grid=document.getElementById('my-deck-grid'); grid.innerHTML=''; 
    [...state.myCards].sort((a,b)=>gradeOrder.indexOf(b.grade)-gradeOrder.indexOf(a.grade)).forEach(c=>{ 
        const el=document.createElement('div'); el.innerHTML=createCardHTML(c); 
        el.onclick=()=>{
            if(state.sellMode) { 
                let cid = String(c.instanceId);
                if(state.selectedForSell.has(cid)) state.selectedForSell.delete(cid); 
                else state.selectedForSell.add(cid); 
                document.getElementById('sel-sell-cnt').textContent = state.selectedForSell.size; 
                window.renderMyCards(); 
            } else { window.showZoomModal(c); }
        }; 
        grid.appendChild(el); 
    }); 
    document.getElementById('card-count').textContent=state.myCards.length; 
};

window.openCardSelector = (mode, sIdx) => {
    let cD=null, dTxt='선택';
    if(mode==='fusion') { cD=state.fusionCards; dTxt=`재료${sIdx}`; } else if(mode==='ai') cD=state.aiAttackDeck; else if(mode==='pvp') cD=state.pvpAttackDeck; else if(mode==='explore') { cD=state.exploreCards; dTxt=`대원${sIdx}`; } else if(mode==='defense') { cD=state.defenseDeck; dTxt=`방어${sIdx}`; } else if(mode==='plunder') { cD=state.plunderAttackDeck; dTxt=`공격${sIdx}`; } else if(mode==='hardcore') { cD=state.hcAttackDeck; dTxt=`대원${sIdx}`; } else if(mode==='tourn') { cD=state.tnAttackDeck; dTxt=`엔트리`; }
    if(cD&&cD[sIdx-1]){ 
        if(confirm("장착 해제?")){ 
            cD[sIdx-1]=null; 
            let pfx=mode==='explore'?'explore':(mode==='ai'?'ai-atk':(mode==='fusion'?'fusion':(mode==='defense'?'def-setup':(mode==='plunder'?'plunder-atk':(mode==='hardcore'?'hc':'tn'))))); 
            setSlotHTML(document.getElementById(`${pfx}-slot${sIdx}`), null, dTxt); window.saveUserData(); 
        } return; 
    }
    state.selectionTarget={mode, slotIdx:sIdx}; 
    document.getElementById('card-select-title').textContent=`[${mode.toUpperCase()}] 장착 선택`;
    const grid=document.getElementById('selector-grid'); grid.innerHTML=''; 
    let sCards=[...state.myCards].sort((a,b)=>gradeOrder.indexOf(b.grade)-gradeOrder.indexOf(a.grade));
    if(sCards.length===0){ grid.innerHTML='<div style="color:#aaa;">카드가 없습니다.</div>'; } 
    else{
        sCards.forEach(card => {
            const el=document.createElement('div'); el.innerHTML=createCardHTML(card);
            let cid = String(card.instanceId);
            let isEq=state.fusionCards.some(c=>c&&String(c.instanceId)===cid)||state.aiAttackDeck.some(c=>c&&String(c.instanceId)===cid)||state.pvpAttackDeck.some(c=>c&&String(c.instanceId)===cid)||state.exploreCards.some(c=>c&&String(c.instanceId)===cid)||state.defenseDeck.some(c=>c&&String(c.instanceId)===cid)||state.plunderAttackDeck.some(c=>c&&String(c.instanceId)===cid)||state.hcAttackDeck.some(c=>c&&String(c.instanceId)===cid)||state.tnAttackDeck.some(c=>c&&String(c.instanceId)===cid);
            let isInv=false, rsn="";
            if(isEq){ isInv=true; rsn="장착중"; } else if(mode==='fusion'&&(card.isLocked||card.grade==='SSX')){ isInv=true; rsn=card.isLocked?"보호됨":"합성불가"; }
            if(isInv){ 
                el.style.opacity='0.3'; 
                el.innerHTML+=`<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);padding:5px;border-radius:5px;color:#ff3366;font-weight:bold;z-index:10;">${rsn}</div>`; 
                el.onclick=()=>alert("장착불가"); 
            } 
            else el.onclick=()=>window.finalizeSelection(cid); grid.appendChild(el);
        });
    }
    document.getElementById('card-select-modal').style.display='flex';
};

window.finalizeSelection = (id) => {
    const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
    const {mode, slotIdx}=state.selectionTarget; const tIdx=slotIdx-1; let sPfx='';
    if(mode==='fusion'){ state.fusionCards[tIdx]=c; sPfx='fusion'; } else if(mode==='ai'){ state.aiAttackDeck[tIdx]=c; sPfx='ai-atk'; } else if(mode==='pvp'){ state.pvpAttackDeck[tIdx]=c; sPfx='atk'; } else if(mode==='explore'){ state.exploreCards[tIdx]=c; sPfx='explore'; } else if(mode==='defense'){ state.defenseDeck[tIdx]=c; sPfx='def-setup'; } else if(mode==='plunder'){ state.plunderAttackDeck[tIdx]=c; sPfx='plunder-atk'; } else if(mode==='hardcore'){ state.hcAttackDeck[tIdx]=c; sPfx='hc'; } else if(mode==='tourn'){ state.tnAttackDeck[tIdx]=c; sPfx='tn'; }
    setSlotHTML(document.getElementById(`${sPfx}-slot${slotIdx}`), c); window.saveUserData(); window.closeModal('card-select-modal');
};

window.showZoomModal = (c) => {
    document.getElementById('zoom-container').innerHTML=createCardHTML(c,true);
    const stats=getBattleStats(c); const prc=grades[c.grade].sellPrice; let exBtns='';
    if(state.expTickets>0) exBtns+=`<button onclick="window.useSpecialItem('${c.instanceId}', 'exp')" style="background:#2196F3;flex:1;font-size:0.85rem;">🌟렙업 (${state.expTickets})</button>`;
    if(state.upgItems>0 && c.grade!=='SSX') exBtns+=`<button onclick="window.useSpecialItem('${c.instanceId}', 'upg')" style="background:#8338ec;flex:1;font-size:0.85rem;">⏫진화 (${state.upgItems})</button>`;
    let lTxt=c.isLocked?"🔓보호해제":"🔒보호설정"; let lCol=c.isLocked?"#555":"#4CAF50";
    let enR = Math.floor(Math.max(0.1, 0.8 - ((c.enhance||0) * 0.05)) * 100);

    document.getElementById('zoom-actions').innerHTML=`
        <div style="margin-bottom:5px;font-weight:bold;color:${stats.skill.isSpecial?'#ffea00':'#00f2ff'};font-size:0.85rem;border:1px solid #444;padding:5px;border-radius:5px;background:#000;">${stats.skill.name} : ${stats.skill.desc}</div>
        <div style="margin-bottom:10px;font-weight:bold;color:#ffea00;font-size:0.9rem;">EXP: ${c.exp||0} / ${(c.level||1)*100}</div>
        <div style="display:flex;justify-content:center;gap:5px;margin-bottom:8px;"><button onclick="window.enhanceCard('${c.instanceId}')" style="background:#ff9800;flex:1;font-size:0.85rem;">🔨강화(${enR}%)</button><button onclick="window.useAttackPotion('${c.instanceId}')" style="background:#ff3366;flex:1;font-size:0.85rem;">💊투여(${state.atkPotions})</button></div>
        ${exBtns?`<div style="display:flex;justify-content:center;gap:5px;margin-bottom:8px;">${exBtns}</div>`:''}
        <div style="display:flex;justify-content:center;gap:5px;"><button onclick="window.toggleLock('${c.instanceId}')" style="background:${lCol};flex:1;font-size:0.85rem;">${lTxt}</button><button onclick="window.sellCard('${c.instanceId}', ${prc})" style="background:#333;flex:1;font-size:0.85rem;">💰판매(+${prc})</button></div>
    `;
    document.getElementById('zoom-modal').style.display='flex';
};

window.toggleLock=(id)=>{ const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; c.isLocked=!c.isLocked; window.updateUI(); window.renderMyCards(); window.showZoomModal(c); window.saveUserData(); };
 
window.enhanceCard=(id)=>{ 
    if(state.money<100) return alert("골드 부족!"); const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; state.money-=100; 
    let r=Math.max(0.1, 0.8 - ((c.enhance||0) * 0.05));
    if(Math.random()<r){ c.enhance++; alert(`✨ 강화 성공!`); } else alert(`💥 실패. (${Math.floor(r*100)}%)`); 
    window.updateUI(); window.renderMyCards(); window.showZoomModal(c); window.saveUserData(); 
};
 
window.useAttackPotion=(id)=>{ 
    if(state.atkPotions<=0) return alert("약 부족!"); const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; state.atkPotions--; c.atkBuff=(c.atkBuff||0)+1; alert(`💉 공격력 상승!`); window.updateUI(); window.renderMyCards(); window.showZoomModal(c); window.saveUserData(); 
};
 
window.useSpecialItem=(id,t)=>{ 
    const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
    if(t==='exp'){ state.expTickets--; c.level++; c.exp=0; alert("🌟 렙업!"); } 
    else if(t==='upg'){ if(c.grade==='SSX') return alert("최고 등급입니다."); state.upgItems--; c.grade=gradeOrder[gradeOrder.indexOf(c.grade)+1]; alert(`⏫ 진화!`); } 
    window.updateUI(); window.renderMyCards(); window.showZoomModal(c); window.saveUserData(); 
};
 
window.sellCard=(id,p)=>{
    const c=state.myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
    if(c.isLocked) return alert("보호됨."); if(!confirm(`판매하시겠습니까?`)) return;
    state.myCards=state.myCards.filter(x=>String(x.instanceId)!==String(id));
    [state.fusionCards,state.aiAttackDeck,state.pvpAttackDeck,state.exploreCards,state.defenseDeck,state.plunderAttackDeck,state.hcAttackDeck,state.tnAttackDeck].forEach((d,di)=>{ for(let i=0;i<d.length;i++){ if(d[i]&&String(d[i].instanceId)===String(id)){ d[i]=null; let pf=di===0?'fusion':(di===1?'ai-atk':(di===2?'atk':(di===3?'explore':(di===4?'def-setup':(di===5?'plunder-atk':(di===6?'hc':'tn')))))); setSlotHTML(document.getElementById(`${pf}-slot${i+1}`),null,'선택'); } } });
    state.money+=p; window.updateUI(); window.renderMyCards(); window.closeModal('zoom-modal'); window.saveUserData();
};

window.executeFusion=(useScr)=>{
    const c1=state.fusionCards[0], c2=state.fusionCards[1]; if(!c1||!c2) return alert("재료 2장 필요"); if(c1.templateId!==c2.templateId||c1.grade!==c2.grade) return alert("조건 안맞음");
    if(c1.grade==='SSX') return alert("최고 등급입니다.");
    let bRate=0.60; if(c1.grade==='S') bRate=0.10; else if(c1.grade==='SS') bRate=0.03; else if(c1.grade==='SSS') bRate=0.01; else if(c1.grade==='SSR') bRate=0.005;
    let fRate=useScr?bRate+0.25:bRate;
    if(useScr){ if(state.fusionScrolls<=0) return alert("부적 없음"); if(!confirm(`부적사용? (${Math.floor(fRate*100)}%)`)) return; state.fusionScrolls--; } else if(!confirm(`합성진행? (${Math.floor(fRate*100)}%)`)) return;
    const suc=Math.random()<fRate; 
    state.myCards=state.myCards.filter(c=>String(c.instanceId)!==String(c1.instanceId) && String(c.instanceId)!==String(c2.instanceId)); state.fusionCards=[null,null];
    setSlotHTML(document.getElementById('fusion-slot1'),null,'재료1'); setSlotHTML(document.getElementById('fusion-slot2'),null,'재료2');
    if(suc){
        const nG=gradeOrder[gradeOrder.indexOf(c1.grade)+1];
        let st=getRandomStats(nG); if(c1.templateId<=10){ st.hp=Math.floor(st.hp*1.15); st.atk=Math.floor(st.atk*1.15); st.def=Math.floor(st.def*1.15); }
        let rSk=c1.templateId<=10?specialSkills[c1.templateId]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
        state.myCards.push({instanceId:String(Date.now()+Math.random()),templateId:c1.templateId,grade:nG,baseHp:st.hp,baseAtk:st.atk,baseDef:st.def,skillInfo:rSk,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false});
        alert(`✨ ${nG}등급 탄생!`); if(nG==='SSS'||nG==='SSR'||nG==='SSX') window.sendSystemMessage(`✨ [${state.myDisplayName}]님 [${nG}] ${getCardBaseInfo(c1.templateId).name} 획득!`);
    }else alert("💥 실패 파괴됨.");
    window.updateUI(); window.renderMyCards(); window.saveUserData();
};

window.batchFusion=()=>{
    if(!confirm("잠금 해제된 중복 자동 합성 (+20% 확률업)")) return;
    let df=true, fCt=0, sCt=0, higBorn=[];
    while(df){
        df=false; let grps={}; for(let c of state.myCards){ if(c.grade==='SSX'||c.isLocked) continue; const k=c.templateId+'_'+c.grade; if(!grps[k])grps[k]=[]; grps[k].push(c); }
        let rm=new Set(), nc=[];
        for(const k in grps){
            const g=grps[k];
            while(g.length>=2){
                const c1=g.pop(), c2=g.pop(); rm.add(String(c1.instanceId)); rm.add(String(c2.instanceId)); df=true; fCt++;
                let bRate=0.60; if(c1.grade==='S') bRate=0.10; else if(c1.grade==='SS') bRate=0.03; else if(c1.grade==='SSS') bRate=0.01; else if(c1.grade==='SSR') bRate=0.005;
                let fRate=bRate+0.20;
                if(Math.random()<fRate){
                    sCt++; const nG=gradeOrder[gradeOrder.indexOf(c1.grade)+1];
                    let st=getRandomStats(nG); if(c1.templateId<=10){ st.hp=Math.floor(st.hp*1.15); st.atk=Math.floor(st.atk*1.15); st.def=Math.floor(st.def*1.15); }
                    let rSk=c1.templateId<=10?specialSkills[c1.templateId]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
                    nc.push({instanceId:String(Date.now()+Math.random()),templateId:c1.templateId,grade:nG,baseHp:st.hp,baseAtk:st.atk,baseDef:st.def,skillInfo:rSk,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false});
                    if(nG==='SSS'||nG==='SSR'||nG==='SSX') higBorn.push(nG);
                }
            }
        }
        if(df) state.myCards=state.myCards.filter(c=>!rm.has(String(c.instanceId))).concat(nc);
    }
    alert(`⚡ 일괄완료! 시도:${fCt} 성공:${sCt}`); if(higBorn.length>0) window.sendSystemMessage(`✨ [${state.myDisplayName}]님 연쇄합성으로 [${higBorn[0]}] 등급 탄생!`);
    window.updateUI(); window.renderMyCards(); window.saveUserData();
};
