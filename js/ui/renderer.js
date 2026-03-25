// js/ui/renderer.js

import { attrIcon, grades } from '../data/constants.js';
import { getBattleStats } from '../game/battle-utils.js';
import { state } from '../core/state.js';

export const delay = ms => new Promise(res=>setTimeout(res,ms));

export async function printLog(targetBgId, htmlText, color="#aaa", delayMs=300) {
    try {
        const createLine=(cId)=>{ const e=document.getElementById(cId); if(e){ e.innerHTML+=`<div style="color:${color};margin-bottom:4px;">${htmlText}</div>`; e.scrollTop=e.scrollHeight; } };
        createLine('live-battle-log'); createLine(targetBgId); if(delayMs>0) await delay(delayMs);
    } catch(e) { console.log(e); }
}

export function renderMatchCard(p){
    if(!p || !p.card) return `<div style="width:60px; height:80px; display:flex; align-items:center; justify-content:center; color:#555; border:1px dashed #444; border-radius:5px; font-size:0.7rem;">[빈자리]</div>`;
    const g = grades[p.card.grade] || grades['C'];
    const rateColor = p.winRate >= 50 ? '#26ff00' : '#ff3366';
    return `
    <div style="display:flex; flex-direction:column; align-items:center; width:65px;">
        <div style="font-size:0.65rem; color:#fff; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; width:100%; text-align:center;">${p.name}</div>
        <div class="tourn-card-mini" style="border-color:${g.color}; box-shadow:0 0 5px ${g.color}; margin:2px 0;">
            <img src="./images/${p.card.templateId}.png" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23333\\'/></svg>'">
            <div class="tourn-card-mini-grade" style="color:${g.color};">${p.card.grade}</div>
        </div>
        <div style="font-size:0.75rem; color:${rateColor}; font-weight:bold;">${p.winRate}%</div>
    </div>`;
}

export function createCardHTML(card, isZoom=false){
    if(!card) return `<div style="color:#666;margin:auto;">비어있음</div>`;
    const stats=getBattleStats(card); 
    const enTxt=card.enhance>0?`<span style="color:#ffea00;">+${card.enhance}</span> `:''; 
    const lck=card.isLocked?`<div class="locked-icon">🔒</div>`:'';
    const gClass=card.grade?grades[card.grade].class:'c'; 
    const gCol=card.grade?grades[card.grade].color:'#fff';
    const selClass = (state.sellMode && state.selectedForSell.has(String(card.instanceId))) ? 'selected' : '';
    return `
        <div class="card ${gClass} ${selClass} ${isZoom?'zoom-card':''}" data-instance-id="${card.instanceId}">
            ${lck}
            <div style="width:100%;height:75%;position:relative;"><img src="./images/${card.templateId}.png" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'300\\'><rect width=\\'200\\' height=\\'300\\' fill=\\'%23333\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23aaa\\' text-anchor=\\'middle\\'>NO IMG</text></svg>'"><div class="card-grade" style="color:${gCol}">${enTxt}${card.grade||'C'}</div></div>
            <div style="width:100%;height:25%;background:#1a1a1a;display:flex;flex-direction:column;justify-content:center;align-items:center;border-top:1px solid #444;padding:2px;box-sizing:border-box;"><div style="color:#fff;font-weight:bold;font-size:0.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">${attrIcon[stats.element]} ${stats.name} <span style="color:#00f2ff;font-size:0.6rem;font-weight:normal;">Lv.${card.level||1}</span></div><div style="font-size:0.65rem;margin-top:2px;display:flex;gap:4px;"><span style="color:#26ff00;">H:${stats.hp}</span><span style="color:#a0a0a0;">D:${stats.def}</span><span style="color:#ff3366;font-weight:bold;">A:${stats.atk}</span></div></div>
        </div>`;
}

export function setSlotHTML(el, c, defT){ 
    if(c){ 
        el.innerHTML=createCardHTML(c); 
        el.classList.add('filled'); 
    }else{ 
        el.innerHTML=`<div class="slot-add-icon">+</div>${defT}`; 
        el.classList.remove('filled'); 
    } 
}

export function showRobbedBanner(cardName, gold, robber){ 
    let msg=`🚨 방어선 붕괴! [${robber||'누군가'}]의 약탈<br>`; 
    if(gold) msg+=`골드 손실: -${gold}G<br>`; 
    if(cardName) msg+=`👿 <span style="color:#ffea00;font-weight:bold;">[${cardName}] 강탈당함!</span>`; 
    const banner=document.getElementById('notification-banner'); 
    banner.innerHTML=msg; 
    banner.style.display='block'; 
    setTimeout(()=>banner.style.display='none',7000); 
}
// 🌟 카드 선택창 열기 함수 (HTML에서 접근 가능하도록 window에 등록)
window.openCardSelector = (type, slot) => {
    state.currentSelector = { type, slot }; // 현재 어떤 모드(PvP, 스테이지 등)의 몇 번 슬롯인지 저장
    
    const modal = document.getElementById('card-select-modal');
    const grid = document.getElementById('selector-grid');
    const title = document.getElementById('card-select-title');
    
    if (!modal || !grid) return;

    // 타이틀 변경
    const typeNames = {
        'pvp': '아레나 공격',
        'defense': '아레나 방어',
        'tourn': '토너먼트/스테이지',
        'ai': 'AI 대전',
        'fusion': '카드 합성',
        'explore': '탐험대',
        'hardcore': '하드코어',
        'plunder': '약탈 공격'
    };
    title.textContent = `[${typeNames[type] || '카드'}] ${slot}번 슬롯 장착`;

    // 내 카드 목록 렌더링
    grid.innerHTML = '';
    
    // 잠금 안 된 카드나 선택 가능한 카드들 나열
    state.myCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.innerHTML = createCardHTML(card); // 기존에 정의된 createCardHTML 사용
        
        // 카드 클릭 시 장착 로직
        cardDiv.onclick = () => {
            window.equipCard(card); 
            window.closeModal('card-select-modal');
        };
        grid.appendChild(cardDiv);
    });

    modal.style.display = 'flex';
};

// 🌟 선택한 카드 실제 장착 로직
window.equipCard = (card) => {
    const { type, slot } = state.currentSelector;
    const idx = slot - 1;

    // 각 모드별 덱 배열에 카드 할당
    if (type === 'pvp') state.pvpAttackDeck[idx] = card;
    else if (type === 'defense') state.defDeck[idx] = card;
    else if (type === 'tourn') state.pvpAttackDeck[idx] = card; // 스테이지는 아레나 덱 공유
    else if (type === 'ai') state.aiAttackDeck[idx] = card;
    else if (type === 'fusion') state.fusionSlots[idx] = card;
    else if (type === 'explore') state.exploreCards[idx] = card;
    else if (type === 'hardcore') state.hcAttackDeck[idx] = card;
    else if (type === 'plunder') state.plunderAttackDeck[idx] = card;

    // UI 업데이트 (메인 UI 갱신 함수 호출)
    if (window.updateUI) window.updateUI();
    alert(`${slot}번 슬롯에 장착 완료!`);
};

// 🌟 모달 닫기 함수
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};
