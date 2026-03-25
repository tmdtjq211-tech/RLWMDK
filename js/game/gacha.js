// js/game/gacha.js

import { cardDatabase, specialSkills, normalSkills, getRandomStats, grades } from '../data/constants.js';
import { state } from '../core/state.js';
import { createCardHTML } from '../ui/renderer.js';
import { getCardBaseInfo } from './battle-utils.js';

export function grantCardByTemplate(tid, fGr=null){
    const base=getCardBaseInfo(tid); 
    let g=fGr||base.grade; 
    let stats=getRandomStats(g);
    if(tid<=10){ stats.hp=Math.floor(stats.hp*1.15); stats.atk=Math.floor(stats.atk*1.15); stats.def=Math.floor(stats.def*1.15); }
    let rSkill = tid<=10?specialSkills[tid]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
    state.myCards.push({instanceId:String(Date.now()+Math.random()),templateId:tid,grade:g,baseHp:stats.hp,baseAtk:stats.atk,baseDef:stats.def,skillInfo:rSkill,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false}); 
}

window.adjustRateUp=(amt)=>{ 
    let i=document.getElementById('use-rate-up'); 
    let v=(parseInt(i.value)||0)+amt; 
    if(v<0)v=0; if(v>state.rateUpTickets)v=state.rateUpTickets; 
    i.value=v; 
    document.getElementById('rateup-pct').textContent=v*2; 
};

window.pullGacha = (times=1) => {
    let cost = 100 * times; 
    if(state.money<cost) return alert("골드 부족!");
    let useRu=parseInt(document.getElementById('use-rate-up').value)||0; 
    if(useRu>state.rateUpTickets) return alert("강화권 부족!");
    
    state.money-=cost; state.rateUpTickets-=useRu; document.getElementById('use-rate-up').value=0; 
    let sRate=1+(useRu*2); 
    let newCardsHTML = "";
    
    for(let i=0; i<times; i++) {
        let r=Math.random()*100, fGr='C';
        if(r<=sRate) fGr='SSS'; else if(r<=sRate+2) fGr='SS'; else if(r<=sRate+6) fGr='S'; else if(r<=86) fGr='A'; else if(r<=93) fGr='B'; 
        let pool=[]; 
        if(fGr==='SSS') pool=cardDatabase.filter(c=>(c.templateId>=2&&c.templateId<=10)||c.templateId>=11); 
        else if(fGr==='S') pool=cardDatabase.filter(c=>c.templateId===1||c.templateId>=11); 
        else pool=cardDatabase.filter(c=>c.templateId>=11);
        
        const rCard=pool[Math.floor(Math.random()*pool.length)];
        
        if(fGr==='SSS'&&state.myCards.some(c=>String(c.templateId)===String(rCard.templateId)&&c.grade==='SSS')){ 
            state.money+=grades['SSS'].sellPrice; 
            newCardsHTML+=`<div style="font-size:0.8rem; padding:10px; border:1px solid #ffea00; color:#ffea00;">SSS 중복! (800G)</div>`; 
        } else { 
            grantCardByTemplate(rCard.templateId, fGr); 
            let newC = state.myCards[state.myCards.length-1]; 
            newCardsHTML += `<div style="width:100px;">${createCardHTML(newC, false)}</div>`; 
            if(fGr==='SSS') window.sendSystemMessage(`🎉 [${state.myDisplayName}]님이 상점에서 [SSS] ${rCard.name} 획득!`); 
        }
    }
    document.getElementById('gacha-result-container').innerHTML=newCardsHTML; 
    document.getElementById('gacha-modal').style.display='flex'; 
    window.updateUI(); window.renderMyCards(); window.saveUserData();
};

window.buyItem = (type, cost) => { 
    if(state.money<cost) return alert("골드 부족!"); 
    if(!confirm(`구매하시겠습니까?`)) return; 
    state.money-=cost; 
    if(type==='shield') state.potions++; 
    else if(type==='attack') state.atkPotions++; 
    else if(type==='scroll') state.fusionScrolls++; 
    else if(type==='capture') state.capTickets++; 
    else if(type==='rateup') state.rateUpTickets++; 
    else if(type==='skip') state.skips++; 
    window.updateUI(); window.saveUserData(); 
};
