// js/game/modes.js

import { ref, get, child, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from '../config/firebase.js';
import { state } from '../core/state.js';
import { delay, printLog, setSlotHTML } from '../ui/renderer.js';
import { runLiveSimulation } from './simulation.js';
import { getAITeam, getCardBaseInfo } from './battle-utils.js';
import { grades, attrIcon } from '../data/constants.js';

window.startAIPvP = async () => {
    if(state.isBattling) return; 
    if(state.aiAttackDeck.filter(c=>c).length<2) return alert("2명 셋팅 요망."); const cCap=document.getElementById('use-ai-cap'); if(cCap.checked&&state.capTickets<=0){ cCap.checked=false; return alert("포획권 없음."); }
    state.isBattling = true; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let tLog = document.getElementById('ai-pvp-log'); if(tLog) tLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
    const t=getAITeam(state.aiWins); let w=0; await printLog('ai-pvp-log', `⚔️ AI(${state.aiWins}승) 결투 시작!`, "#ffea00", 600);
    for(let i=0;i<2;i++){ setSlotHTML(document.getElementById(`ai-def-slot${i+1}`), t[i], '?'); let r=await runLiveSimulation(state.aiAttackDeck[i], t[i], 'ai-pvp-log', i+1); if(r) w++; await delay(500); }
    await printLog('ai-pvp-log', '--- 전투 종료 ---', "#fff", 0); state.pendingBattleResult={type:'ai', wins:w, aiTeam:t, useCap:cCap.checked}; document.getElementById('live-battle-close').style.display='block'; state.isBattling = false;
};

export async function loadArenaData(){
    try{
        const sA=await get(child(ref(db), `arena/current`));
        if(sA.exists()){ state.currentDefender=sA.val(); document.getElementById('defender-name-ui').textContent=`⚔️ ${state.currentDefender.defenderName}`; for(let i=0;i<3;i++){ if(state.currentDefender.deck[i]){ document.getElementById(`def-slot${i+1}`).innerHTML=`<div style="font-size:2.5rem;display:flex;height:100%;align-items:center;justify-content:center;">${attrIcon[getCardBaseInfo(state.currentDefender.deck[i].templateId).element]}</div>`; document.getElementById(`def-slot${i+1}`).style.borderStyle='solid'; } } } 
        else{ document.getElementById('defender-name-ui').textContent=`⚔️ [AI] 무명`; state.currentDefender={defenderUid:'AI',defenderName:'무명',deck:[{templateId:11,grade:'S',level:12},{templateId:12,grade:'SS',level:12},{templateId:13,grade:'SSS',level:12}]}; }
        
        const sU=await get(child(ref(db), 'users')); const c=document.getElementById('user-list-container'); c.innerHTML='';
        if(sU.exists()){
            const us=sU.val(); let ct=0;
            Object.keys(us).forEach(id=>{
                if(id===state.currentUser.uid) return; const u=us[id];
                let defCards = u.defDeck ? (Array.isArray(u.defDeck) ? u.defDeck : Object.values(u.defDeck)) : [];
                const dc=defCards.filter(x=>x!=null).length; 
                c.innerHTML+=`<div style="display:flex;justify-content:space-between;align-items:center;background:#222;padding:10px;border-radius:5px;margin-bottom:5px;border:1px solid #333;"><div style="text-align:left;"><div style="font-weight:bold;color:#fff;">${u.name}</div><div style="font-size:0.7rem;color:#aaa;">방어:${dc}/3 장 | 소지:${u.money||0}G</div></div><button onclick="window.openAttackSetup('${id}', '${u.name}')" style="padding:5px 10px;font-size:0.8rem;background:#ff006e;" ${dc<1?'disabled':''}>약탈</button></div>`; ct++; 
            });
            if(ct===0) c.innerHTML='<div style="color:#aaa;">약탈 대상이 없습니다.</div>';
        }
    }catch(e){}
}

window.startArenaPvP = async () => {
    if(state.isBattling) return;
    if(state.pvpAttackDeck.filter(c=>c).length<3) return alert("3명 셋팅 요망."); if(state.currentDefender&&state.currentDefender.defenderUid===state.currentUser.uid) return alert("본인 공격 불가.");
    const cw=document.getElementById('use-win-ticket-arena'), cc=document.getElementById('use-user-capture-arena'); if(cw.checked&&state.winTickets<=0){ cw.checked=false; return alert("승리권 없음."); } if(cc.checked&&state.userCapTickets<=0){ cc.checked=false; return alert("포획권 없음."); }
    
    state.isBattling = true; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let pLog = document.getElementById('pvp-log'); if(pLog) pLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
    await printLog('pvp-log', '⚔️ 아레나 매칭 완료! 전투 시작!', "#ffea00", 600); let w=0;
    for(let i=0;i<3;i++){ let enC=state.currentDefender.deck[i]; setSlotHTML(document.getElementById(`def-slot${i+1}`), enC, '?'); if(!enC){ w++; await printLog('pvp-log', `[R${i+1}] 방어없음! 자동 승리!`, "#26ff00", 500); continue; } if(cw.checked){ w++; await printLog('pvp-log', `[R${i+1}] 🏆 자동 승리!`, "#26ff00", 800); continue; } let r=await runLiveSimulation(state.pvpAttackDeck[i], enC, 'pvp-log', i+1); if(r) w++; await delay(500); }
    await printLog('pvp-log', '--- 전투 종료 ---', "#fff", 0); state.pendingBattleResult={type:'arena', wins:w, useWin:cw.checked, useCap:cc.checked}; document.getElementById('live-battle-close').style.display='block'; state.isBattling = false;
};

window.openAttackSetup = async (id, nm) => {
    state.pvpTargetUser={uid:id, name:nm}; document.getElementById('attack-target-name').textContent=`[${nm}] 약탈`;
    try{
        const sn=await get(child(ref(db), `users/${id}/defDeck`)); let rawDef = sn.val(); let dD = rawDef ? (Array.isArray(rawDef) ? rawDef : Object.values(rawDef)) : [null,null,null]; state.pvpTargetUser.defDeck=dD;
        for(let i=0;i<3;i++){ if(dD[i]){ document.getElementById(`enemy-def-slot${i+1}`).innerHTML=`<div style="font-size:2.5rem;display:flex;height:100%;align-items:center;justify-content:center;">${attrIcon[getCardBaseInfo(dD[i].templateId).element]}</div>`; document.getElementById(`enemy-def-slot${i+1}`).style.borderStyle='solid'; } else{ document.getElementById(`enemy-def-slot${i+1}`).innerHTML='?'; document.getElementById(`enemy-def-slot${i+1}`).style.borderStyle='dashed'; } }
        document.getElementById('attack-setup-modal').style.display='flex';
    }catch(e){ alert("상대 정보 로드 실패."); }
};

window.startPlunderPvP = async () => {
    if(state.isBattling) return;
    if(state.plunderAttackDeck.filter(c=>c).length<3) return alert("약탈할 공격 덱 3명을 모두 세팅하세요.");
    const cw=document.getElementById('use-win-ticket-plunder'), cc=document.getElementById('use-user-capture-plunder'); if(cw.checked&&state.winTickets<=0){ cw.checked=false; return alert("승리권 없음."); } if(cc.checked&&state.userCapTickets<=0){ cc.checked=false; return alert("포획권 없음."); }
    
    state.isBattling = true; document.getElementById('attack-setup-modal').style.display='none'; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let pLog = document.getElementById('pvp-log'); if(pLog) pLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
    await printLog('pvp-log', `⚔️ [${state.pvpTargetUser.name}] 약탈 시작!`, "#ffea00", 600); let w=0;
    for(let i=0;i<3;i++){ let enC=state.pvpTargetUser.defDeck[i]; if(!enC){ w++; await printLog('pvp-log', `[R${i+1}] 방어없음 승리!`, "#26ff00", 500); continue; } if(cw.checked){ w++; await printLog('pvp-log', `[R${i+1}] 🏆 자동 승리!`, "#26ff00", 800); continue; } let r=await runLiveSimulation(state.plunderAttackDeck[i], enC, 'pvp-log', i+1); if(r) w++; await delay(500); }
    await printLog('pvp-log', '--- 전투 종료 ---', "#fff", 0); state.pendingBattleResult={type:'plunder', wins:w, useWin:cw.checked, useCap:cc.checked, target:state.pvpTargetUser}; document.getElementById('live-battle-close').style.display='block'; state.isBattling = false;
};

window.startHardcoreExplore = () => {
    if(state.hcAttackDeck.filter(c=>c).length<3) return alert("3명 세팅 요망.");
    let btn = document.getElementById('hc-btn'); btn.disabled=true; btn.textContent="탐험 중...";
    
    setTimeout(()=>{
        btn.disabled=false; btn.textContent="목숨 걸고 파견! (고수익/고위험)";
        if(Math.random()<0.30){
            let killIdx = Math.floor(Math.random()*3); let deadCard = state.hcAttackDeck[killIdx];
            state.myCards = state.myCards.filter(c=>String(c.instanceId)!==String(deadCard.instanceId));
            alert(`💀 끔찍한 사고 발생! [${getCardBaseInfo(deadCard.templateId).name}] 대원이 실종되었습니다!`);
        }else{
            let rGold = 5000+Math.floor(Math.random()*5000);
            state.money+=rGold; state.tournTickets++; state.winTickets++; state.capTickets++; state.skips++;
            alert(`🎉 하드코어 생존! ${rGold}G, 🎫토너입장권, 🏆승리권, 🪤포획권, ⏩스킵권 획득!`);
        }
        state.hcAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`hc-slot${i}`),null,'대원'+i);
        window.saveUserData(); window.updateUI(); window.renderMyCards();
    }, 2000);
};

window.startExplore = () => {
    if(state.exploreCards.filter(c=>c).length<3) return alert("3명 셋팅 요망.");
    let lS=state.exploreCards.reduce((s,c)=>s+(grades[c.grade].exp),0); const b=document.getElementById('explore-btn'), r=document.getElementById('explore-result'); b.disabled=true; b.textContent="탐험 중..."; r.innerHTML=`수색 중...`;
    setTimeout(()=>{
        b.disabled=false; b.textContent=`탐험 출발!`;
        if(Math.random()<Math.max(0.02,0.25-(lS*0.01))){
            const lC=state.exploreCards[Math.floor(Math.random()*3)]; if(state.potions>0){ state.potions--; alert(`🚨 기습! 방어 물약으로 보호했습니다.`); } else{ state.myCards=state.myCards.filter(c=>String(c.instanceId)!==String(lC.instanceId)); r.innerHTML=`<span style="color:#ff3366;">🚨 기습! 대원 파괴됨</span>`; alert("🚨 기습으로 대원을 잃었습니다..."); }
        }else{
            let gG=400+(lS*40)+Math.floor(Math.random()*100); state.money+=gG; let fI=[];
            for(let j=0;j<(1+Math.floor(lS/5));j++){ if(Math.random()<0.7){ let dR=Math.random(); if(lS>=12&&dR<0.05){ state.userCapTickets++; fI.push("👿유저포획권"); } else if(lS>=10&&dR<0.15){ state.rateUpTickets++; fI.push("✨확률강화권"); } else if(lS>=8&&dR<0.20){ state.upgItems++; fI.push("⏫등급업권"); } else if(dR<0.30){ state.tournTickets++; fI.push("🎫토너권"); } else if(dR<0.50){ state.winTickets++; fI.push("🏆승리권"); } else if(dR<0.70){ state.capTickets++; fI.push("🪤AI포획권"); } else if(dR<0.90){ state.expTickets++; fI.push("🌟경험치권"); } else{ state.fusionScrolls++; fI.push("✨부적"); } } }
            state.exploreCards.forEach(c=>{c.exp=(c.exp||0)+40; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); r.innerHTML=`<span style="color:#26ff00;">🎉 성공 (+${gG}G)</span><br>${fI.length>0?`[${fI.join(', ')}] 획득!`:""}`;
        }
        state.exploreCards=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`explore-slot${i}`),null,`대원${i}`); window.updateUI(); window.renderMyCards(); window.saveUserData();
    }, 2000); 
};
// 🔥 [신규] 무한 스테이지 모드 실행 함수
window.startStageBattle = async () => {
    // 1. 상태 체크 및 내 영웅 확인 (1번 슬롯 재활용)
    if (state.isBattling) return;
    const myHero = state.pvpAttackDeck[0]; // 아레나 1번 슬롯 영웅 출전 (원하는 슬롯으로 변경 가능)
    if (!myHero) return alert("전투에 나갈 영웅 1명을 아레나 1번 슬롯에 배치해주세요!");

    state.isBattling = true;
    
    // 2. UI 초기화 (로그 창 열기)
    document.getElementById('live-battle-modal').style.display = 'flex';
    document.getElementById('live-battle-log').innerHTML = '';
    let pLog = document.getElementById('pvp-log'); // 기존 pvp-log 엘리먼트 활용
    if (pLog) pLog.innerHTML = '';
    document.getElementById('live-battle-close').style.display = 'none';

    // 3. 적 생성 로직 (10단계부터 2마리)
    const currentStage = state.userStage || 1; // state에 userStage가 없으면 1부터 시작
    const enemyCount = currentStage >= 10 ? 2 : 1;
    const enemies = [];

    await printLog('pvp-log', `🚩 스테이지 ${currentStage} 도전 시작!`, "#ffea00", 600);

    // 적 스탯 결정 (단계별로 강해짐)
    for (let i = 0; i < enemyCount; i++) {
        const difficulty = 1 + (currentStage * 0.15); // 15%씩 복리 강화
        const randomTid = Math.floor(Math.random() * 51) + 1;
        
        enemies.push({
            templateId: randomTid,
            grade: currentStage > 15 ? 'SSS' : (currentStage > 7 ? 'S' : 'B'),
            level: currentStage,
            hp: Math.floor(150 * difficulty),
            atk: Math.floor(30 * difficulty),
            def: Math.floor(15 * difficulty)
        });
    }

    // 4. 연속 전투 실행
    let winCount = 0;
    for (let i = 0; i < enemies.length; i++) {
        await printLog('pvp-log', `⚔️ 적 ${i + 1}번 등장! (${enemies[i].grade}급)`, "#ff4444", 800);
        
        // 기존 전투 시뮬레이션 호출
        let result = await runLiveSimulation(myHero, enemies[i], 'pvp-log', i + 1);
        
        if (result) {
            winCount++;
            await delay(500);
        } else {
            break; // 한 번이라도 지면 중단
        }
    }

    // 5. 결과 처리 및 보상
    await printLog('pvp-log', '--- 전투 종료 ---', "#fff", 0);
    
    if (winCount === enemyCount) {
        alert(`🎉 스테이지 ${currentStage} 클리어!`);
        state.userStage = (state.userStage || 1) + 1;
        const rewardGold = currentStage * 200;
        state.money += rewardGold;
        await printLog('pvp-log', `💰 보상 획득: ${rewardGold}G`, "#26ff00", 0);
    } else {
        alert(`💀 스테이지 ${currentStage} 패배...`);
        await printLog('pvp-log', `실패: ${winCount}/${enemyCount} 처치`, "#ff3366", 0);
    }

    document.getElementById('live-battle-close').style.display = 'block';
    state.isBattling = false;

    // UI 갱신 및 데이터 저장
    if (window.updateUI) window.updateUI();
    if (window.saveUserData) window.saveUserData();
};
