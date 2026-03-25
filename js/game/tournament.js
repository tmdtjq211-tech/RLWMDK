// js/game/tournament.js

import { ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from '../config/firebase.js';
import { state } from '../core/state.js';
import { renderMatchCard } from '../ui/renderer.js';
import { doMatch, getRandomStats } from './battle-utils.js';
import { cardDatabase, normalSkills, specialSkills } from '../data/constants.js';

export function listenToTournament() {
    onValue(ref(db, 'tournament/current'), (snap) => { state.tournData = snap.val(); if(state.tournData) state.nextRunTime = state.tournData.nextRun; });
    onValue(ref(db, 'tournament/participants'), (snap) => { state.tournParts = snap.val() || {}; });

    setInterval(async () => {
        let now = Date.now();
        if(state.nextRunTime && now >= state.nextRunTime) { 
            state.nextRunTime += 3600000; 
            setTimeout(() => runTournament(), Math.random() * 2000); 
        }
        
        let pCount = Object.keys(state.tournParts || {}).length; 
        let currCntEl = document.getElementById('tourn-curr-cnt'); if(currCntEl) currCntEl.textContent = pCount;
        let logEl = document.getElementById('tn-log'); let btn = document.getElementById('tn-btn');
        
        let qList = document.getElementById('tourn-queue-list');
        if(qList) {
            let partsArray = Object.values(state.tournParts || {}).sort((a,b) => (a.joinedAt||0) - (b.joinedAt||0));
            let qHtml = "";
            partsArray.forEach((p, idx) => { qHtml += `<div style="font-weight:bold;">${idx+1}. <span style="color:#00f2ff;">${p.name}</span> 대기 중</div>`; });
            for(let i=partsArray.length; i<16; i++) { qHtml += `<div style="color:#555">${i+1}. [빈 자리 - 정각에 AI 난입]</div>`; }
            qList.innerHTML = qHtml;
        }

        if(state.tournData && state.tournData.startTime) {
            let elapsed = now - state.tournData.startTime;
            let mins = Math.floor(elapsed / 60000); let secs = Math.floor((elapsed % 60000) / 1000);
            
            let t = state.tournData;
            let ffAt = t.fastForwardAt !== undefined ? t.fastForwardAt : 99;
            let displayMins = mins;
            if(mins >= ffAt) displayMins = 99;

            let logHtml = "";
            let remM = 3 - (mins % 4); let remS = 59 - secs;
            if(remM < 0) { remM = 0; remS = 0; }

            if (displayMins < 4) { 
                logHtml += `<h4 style="margin:5px 0; color:#ffea00;">⚔️ 16강 전투 진행 중... (8강까지 ${remM}분 ${remS}초)</h4>`; 
                if(t.matches && t.matches.r16) t.matches.r16.forEach(m => logHtml += `<div class="tourn-match-row">${renderMatchCard(m.p1)}<div style="font-weight:bold; color:#ff3366;">VS</div>${renderMatchCard(m.p2)}</div>`);
            } 
            else if (displayMins < 8) { 
                logHtml += `<h4 style="margin:5px 0; color:#00f2ff;">⚔️ 8강 전투 진행 중... (준결승까지 ${remM}분 ${remS}초)</h4>`; 
                if(t.matches && t.matches.r8) t.matches.r8.forEach(m => logHtml += `<div class="tourn-match-row">${renderMatchCard(m.p1)}<div style="font-weight:bold; color:#ff3366;">VS</div>${renderMatchCard(m.p2)}</div>`);
            } 
            else if (displayMins < 12) { 
                logHtml += `<h4 style="margin:5px 0; color:#ff00e5;">⚔️ 준결승 진행 중... (결승까지 ${remM}분 ${remS}초)</h4>`; 
                if(t.matches && t.matches.r4) t.matches.r4.forEach(m => logHtml += `<div class="tourn-match-row">${renderMatchCard(m.p1)}<div style="font-weight:bold; color:#ff3366;">VS</div>${renderMatchCard(m.p2)}</div>`);
            } 
            else if (displayMins < 16) { 
                logHtml += `<h4 style="margin:5px 0; color:#ffea00;">⚔️ 결승 진행 중... (최종발표까지 ${remM}분 ${remS}초)</h4>`; 
                if(t.matches && t.matches.r2) t.matches.r2.forEach(m => logHtml += `<div class="tourn-match-row">${renderMatchCard(m.p1)}<div style="font-weight:bold; color:#ff3366;">VS</div>${renderMatchCard(m.p2)}</div>`);
            } 
            else { 
                logHtml += `<h4 style="margin:5px 0; color:#ff00e5;">[준결승 완료]</h4>`;
                logHtml += `<h4 style="margin:5px 0; color:#ffea00;">[결승 결과]</h4>`;
                if(t.matches && t.matches.r2) t.matches.r2.forEach(m => logHtml += `<div class="tourn-match-row">${renderMatchCard(m.p1)}<div style="font-weight:bold; color:#ff3366;">VS</div>${renderMatchCard(m.p2)}</div>`);
                logHtml += `<div style="margin-top:15px; background:#222; padding:10px; border-radius:8px;"><span style="color:#26ff00; font-size:1.2rem; font-weight:bold;">👑 최종 우승: ${t.winnerName}</span><br><span style="color:#ffea00; font-size:0.8rem;">전리품: ${t.rewardDesc||'없음'}</span></div>`; 
            }
            
            if(logEl) { logEl.style.display = 'block'; logEl.innerHTML = logHtml; }
        }
        
        if(state.nextRunTime) { 
            let toNext = state.nextRunTime - now; 
            if(toNext > 0) { let nm = Math.floor(toNext / 60000); let ns = Math.floor((toNext % 60000) / 1000); let nI = document.getElementById('tourn-next-info'); if(nI) nI.textContent = `다음 토너먼트까지: ${nm}분 ${ns}초`; } 
        }
        if(state.tournParts && state.currentUser && state.tournParts[state.currentUser.uid]) { if(btn) { btn.textContent = "참가 대기 중..."; btn.style.background = "#555"; btn.disabled = true; } } else { if(btn) { btn.textContent = "참가 등록 (입장권 1장 소모)"; btn.style.background = "#009688"; btn.disabled = false; } }
        
        if (document.getElementById('skip-cnt-ui')) document.getElementById('skip-cnt-ui').textContent = state.skips;
    }, 1000);
}

async function runTournament() {
    const tRef = ref(db, 'tournament/current'); const pRef = ref(db, 'tournament/participants');
    const snap = await get(tRef); let t = snap.val() || {}; let now = Date.now();
    if(t.nextRun && now < t.nextRun) return; 

    let pSnap = await get(pRef); let parts = pSnap.val() || {};
    let uids = Object.keys(parts); let slots = [];
    for(let i=0; i<uids.length; i++) slots.push({uid: uids[i], ...parts[uids[i]]});
    
    let aiCount = 16 - slots.length;
    for(let i=0; i<aiCount; i++){
        let rand = Math.random(); let g = 'C';
        if(rand < 0.05) g = 'SSR'; else if(rand < 0.10) g = 'SSS'; else if(rand < 0.20) g = 'SS'; else if(rand < 0.40) g = 'S'; else g = 'A';
        let base = cardDatabase.filter(c=>c.grade===g); if(!base.length) base = cardDatabase;
        let cDef = base[Math.floor(Math.random()*base.length)]; let st = getRandomStats(g);
        let lvl = (g==='SSR'||g==='SSS') ? 5+Math.floor(Math.random()*6) : 1+Math.floor(Math.random()*5);
        let enh = (g==='SSR'||g==='SSS') ? Math.floor(Math.random()*3) : 0;
        let aiCard = { templateId: cDef.templateId, grade: g, level: lvl, enhance: enh, baseHp: st.hp, baseAtk: st.atk, baseDef: st.def, skillInfo: cDef.skill || normalSkills[0] };
        slots.push({uid: 'AI_'+i, name: (g==='SSR'||g==='SSS') ? '🤖[정예] AI' : '🤖일반 AI', card: aiCard});
    }
    
    slots.sort(() => Math.random() - 0.5); 
    let logs = { r16:[], r8:[], r4:[], r2:[] }; let matches = { r16:[], r8:[], r4:[], r2:[] };
    
    let w16 = []; for(let i=0; i<16; i+=2) { let res = doMatch(slots[i], slots[i+1]); matches.r16.push(res); logs.r16.push(`${res.p1.name} VS ${res.p2.name} ➡️ ${res.winner.name} 승`); w16.push(res.winner); }
    let w8 = []; for(let i=0; i<8; i+=2) { let res = doMatch(w16[i], w16[i+1]); matches.r8.push(res); logs.r8.push(`${res.p1.name} VS ${res.p2.name} ➡️ ${res.winner.name} 승`); w8.push(res.winner); }
    let w4 = []; for(let i=0; i<4; i+=2) { let res = doMatch(w8[i], w8[i+1]); matches.r4.push(res); logs.r4.push(`${res.p1.name} VS ${res.p2.name} ➡️ ${res.winner.name} 승`); w4.push(res.winner); }
    let finalRes = doMatch(w4[0], w4[1]); matches.r2.push(finalRes); logs.r2.push(`${finalRes.p1.name} VS ${finalRes.p2.name} ➡️ 👑 ${finalRes.winner.name} 우승!`); let finalWinner = finalRes.winner;

    let h16 = slots.some(p => !p.uid.startsWith('AI_')); let h8 = w16.some(p => !p.uid.startsWith('AI_')); let h4 = w8.some(p => !p.uid.startsWith('AI_')); let h2 = w4.some(p => !p.uid.startsWith('AI_'));
    let tDur = 0; if(!h16) tDur=0; else if(!h8) tDur=4; else if(!h4) tDur=8; else if(!h2) tDur=12; else tDur=16;

    for(let p of w4) {
        if(!p.uid.startsWith('AI_')) { try { const uRef = ref(db, `users/${p.uid}`); const uSnap = await get(uRef); if(uSnap.exists()) { let ud = uSnap.val(); ud.tournTickets = (ud.tournTickets||0) + 1; await set(uRef, ud); } } catch(e) {} }
    }

    let rewardDesc = "";
    if(!finalWinner.uid.startsWith('AI_')) {
        let rGold = 5000 + Math.floor(Math.random()*5000); let getSSR = Math.random() < 0.03; 
        rewardDesc = `💰${rGold}G, 방어약 5개, 🎫토너권 1장 페이백`;
        const wRef = ref(db, `users/${finalWinner.uid}`); const wSnap = await get(wRef);
        if(wSnap.exists()) {
            let wData = wSnap.val(); wData.tourneyWins = (wData.tourneyWins||0) + 1; wData.money = (wData.money||0) + rGold; wData.potions = (wData.potions||0) + 5;
            if (getSSR) {
                let rTid = Math.floor(Math.random()*51)+1; let st = getRandomStats('SSR'); if(rTid<=10){st.hp*=1.15; st.atk*=1.15; st.def*=1.15;}
                let rSkill = rTid<=10?specialSkills[rTid]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
                let nC = {instanceId:String(Date.now()+Math.random()), templateId:rTid, grade:'SSR', baseHp:st.hp, baseAtk:st.atk, baseDef:st.def, skillInfo:rSkill, level:1, exp:0, enhance:0, atkBuff:0, isLocked:false};
                let safeDeck = wData.deck ? (Array.isArray(wData.deck)?wData.deck:Object.values(wData.deck)).filter(c=>c!=null) : []; safeDeck.push(nC); wData.deck = safeDeck;
                rewardDesc = `💰${rGold}G, 방어약 5개, 🎉[SSR] 영웅 1장 대박!`; 
            } else { wData.tournTickets = (wData.tournTickets||0) + 1; }
            await set(wRef, wData);
        }
    } else { rewardDesc = "AI 우승으로 전리품 소멸."; }

    let nextR = now + 1200000;
    if(tDur < 16) { nextR = now + (tDur * 60000) + 60000; } 
    if(!h16) nextR = now + 15000; 

    await set(tRef, { startTime: now, matches: matches, logs: logs, winnerName: finalWinner.name, rewardDesc: rewardDesc, fastForwardAt: tDur, nextRun: nextR });
    await set(pRef, {}); 
}

window.joinTournament = async () => {
    if(!state.tnAttackDeck[0]) return alert("엔트리 카드를 선택하세요.");
    if(state.tournTickets <= 0) return alert("🎫 토너먼트 입장권이 부족합니다! (탐험, 하드코어 모드에서 획득 가능)");
    const pRef = ref(db, 'tournament/participants'); const snap = await get(pRef); let parts = snap.val() || {};
    if(parts[state.currentUser.uid]) return alert("이미 참가 대기 중입니다.");
    if(Object.keys(parts).length >= 16) return alert("이번 회차 마감 (16명). 다음 정각을 노려주세요.");
    
    state.tournTickets--; window.updateUI(); window.saveUserData();
    parts[state.currentUser.uid] = { name: state.myDisplayName, card: state.tnAttackDeck[0], joinedAt: Date.now() };
    await set(pRef, parts); alert("✅ 참가 등록 완료! 대기열에 진입했습니다.");
};

window.skipTournament = async () => {
    if(state.skips <= 0) return alert("스킵권이 부족합니다! (상점 구매 또는 하드코어 탐험에서 획득)");
    if(!state.tournData || !state.tournData.startTime) return alert("진행 중인 토너먼트가 없습니다.");
    if(!confirm("스킵권 1장을 사용하여 즉시 4분을 단축하시겠습니까? (전 서버 공통 적용)")) return;
    try {
        const tRef = ref(db, 'tournament/current'); const snap = await get(tRef);
        if(snap.exists()) { let t = snap.val(); t.startTime -= 240000; await set(tRef, t); state.skips--; window.updateUI(); window.saveUserData(); alert("⏩ 4분 스킵 완료! 쾌속 진행됩니다."); }
    } catch(e) { alert("스킵 오류!"); }
};
