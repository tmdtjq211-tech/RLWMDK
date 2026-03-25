// js/main.js

import { auth, db, provider } from './config/firebase.js';
import { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { ref, set, onValue, push, query, limitToLast, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { state } from './core/state.js';
import { setSlotHTML } from './ui/renderer.js';
import { loadUserData, listenToMyData } from './api/user.js';
import { loadArenaData } from './game/modes.js';
import { listenToTournament } from './game/tournament.js';
import { populateGmCardSelect, populateGmUserList } from './admin/gm.js';
import { getCardBaseInfo } from './game/battle-utils.js';
import { grantCardByTemplate } from './game/gacha.js';

// 전역 로그인 함수 연결
window.loginWithGoogle = () => { signInWithPopup(auth, provider).catch(err=>alert("로그인 실패")); }; 
window.loginAsGuest = () => { signInAnonymously(auth).catch(err=>alert("게스트 로그인 실패")); };
window.logout = () => { signOut(auth).then(()=>{location.reload();}); };

onAuthStateChanged(auth, (user) => {
    if(user){ 
        state.currentUser = user; 
        document.getElementById('login-overlay').style.display = 'none'; 
        state.myDisplayName = user.displayName || ("게스트_" + user.uid.substring(0,4));
        
        if(user.email === 'tmdtjq211@gmail.com'){ 
            state.isAdmin = true; 
            document.getElementById('player-name').innerHTML = `<span style="color:#ff00e5;">[GM]</span> ${state.myDisplayName}`; 
            document.getElementById('tab-gm').style.display = 'block'; 
            populateGmCardSelect(); 
            populateGmUserList(); 
        } else { 
            document.getElementById('player-name').textContent = state.myDisplayName; 
        }
        
        const myStatusRef = ref(db, `users/${user.uid}/presence`);
        onValue(ref(db, '.info/connected'), (snap) => { 
            if (snap.val() === true) { 
                set(myStatusRef, { status: 'online', act: '접속중', last: Date.now() }); 
                onDisconnect(myStatusRef).set({ status: 'offline', act: '오프라인', last: Date.now() }); 
            } 
        });
        
        loadUserData(); 
        listenToMyData(); 
        loadArenaData(); 
        listenToServerMails(); 
        listenToChat(); 
        listenToTournament();
    } else { 
        document.getElementById('login-overlay').style.display = 'flex'; 
    }
});

window.updateUI = () => { 
    document.getElementById('money').textContent=state.money.toLocaleString(); document.getElementById('potion-count').textContent=state.potions; document.getElementById('atk-potion-count').textContent=state.atkPotions; 
    if(document.getElementById('win-t-cnt-arena')) document.getElementById('win-t-cnt-arena').textContent=state.winTickets; if(document.getElementById('win-t-cnt-plunder')) document.getElementById('win-t-cnt-plunder').textContent=state.winTickets; 
    if(document.getElementById('ai-cap-cnt')) document.getElementById('ai-cap-cnt').textContent=state.capTickets; if(document.getElementById('user-cap-cnt-arena')) document.getElementById('user-cap-cnt-arena').textContent=state.userCapTickets; if(document.getElementById('user-cap-cnt-plunder')) document.getElementById('user-cap-cnt-plunder').textContent=state.userCapTickets; 
    if(document.getElementById('rateup-cnt')) document.getElementById('rateup-cnt').textContent=state.rateUpTickets; if(document.getElementById('ai-win-ui')) document.getElementById('ai-win-ui').textContent=state.aiWins; if(document.getElementById('ai-streak-ui')) document.getElementById('ai-streak-ui').textContent=state.aiWinStreak; 
    if(document.getElementById('tourn-ticket-ui')) document.getElementById('tourn-ticket-ui').textContent = state.tournTickets; if(document.getElementById('tourn-win-cnt')) document.getElementById('tourn-win-cnt').textContent = state.tourneyWins;
    if(document.getElementById('skip-cnt-ui')) document.getElementById('skip-cnt-ui').textContent = state.skips;
    let rU=document.getElementById('use-rate-up'); if(rU&&parseInt(rU.value)>state.rateUpTickets) rU.value=state.rateUpTickets; if(document.getElementById('rateup-pct')&&rU) document.getElementById('rateup-pct').textContent=(parseInt(rU.value)||0)*2;
};

function listenToChat(){ 
    onValue(query(ref(db, 'global_chat'), limitToLast(50)), (snap)=>{ 
        const container=document.getElementById('chat-container'); 
        container.innerHTML=''; 
        if(snap.exists()){ 
            snap.forEach(child=>{ 
                const msg=child.val(); 
                if(msg.type==='system'){ 
                    container.innerHTML+=`<div class="chat-msg system">${msg.text}</div>`; 
                } else { 
                    let isMe=msg.uid===state.currentUser.uid; 
                    container.innerHTML+=`<div class="chat-msg ${isMe?'me':''}"><div class="chat-name">${msg.name}</div><div>${msg.text}</div></div>`; 
                } 
            }); 
        } 
        container.scrollTop = container.scrollHeight; 
    }); 
}

window.openChat = () => { document.getElementById('global-chat-modal').style.display='flex'; };
window.sendChat = () => { 
    const input=document.getElementById('chat-input'); 
    const text=input.value.trim(); 
    if(!text) return; 
    set(push(ref(db, 'global_chat')), {uid:state.currentUser.uid, name:state.myDisplayName, text:text, type:'user', timestamp:Date.now()}); 
    input.value=''; 
};
window.sendSystemMessage = (text) => { set(push(ref(db, 'global_chat')), {type:'system', text:text, timestamp:Date.now()}); };

function listenToServerMails(){ onValue(ref(db, 'server_mails'), (snap)=>{ state.serverMails=snap.val()||{}; updateMailboxBadge(); }); }
function updateMailboxBadge(){ 
    let unread = Object.keys(state.serverMails).filter(id => !state.claimedMails[id] && (state.serverMails[id].targetUid==='ALL' || state.serverMails[id].targetUid===state.currentUser.uid)).length; 
    const b = document.getElementById('mail-badge'); 
    if(unread>0){ b.style.display='inline-block'; b.textContent=unread; } else b.style.display='none'; 
}

window.openMailbox = () => {
    const container = document.getElementById('mail-list-container'); 
    container.innerHTML=''; 
    const mailIds=Object.keys(state.serverMails).reverse();
    let myMails = mailIds.filter(id => !state.claimedMails[id] && (state.serverMails[id].targetUid==='ALL' || state.serverMails[id].targetUid===state.currentUser.uid));
    
    if(myMails.length===0){ 
        container.innerHTML='<div style="color:#aaa;text-align:center;margin-top:20px;">도착한 우편이 없습니다.</div>'; 
    } else { 
        myMails.forEach(id=>{ 
            const m=state.serverMails[id]; 
            let rTxt=[]; 
            if(m.gold) rTxt.push(`💰 ${m.gold}G`); 
            if(m.rateUp) rTxt.push(`✨ 강화권 ${m.rateUp}장`); 
            if(m.cardTid) rTxt.push(`🃏 [${m.cardGrade}] ${getCardBaseInfo(m.cardTid).name}`); 
            container.innerHTML+=`<div class="mail-item"><div style="color:#ff00e5;font-weight:bold;margin-bottom:5px;">${m.title}</div><div style="font-size:0.85rem;color:#ffea00;">보상: ${rTxt.join(', ')}</div><div style="font-size:0.7rem;color:#888;margin-top:5px;">${new Date(m.timestamp).toLocaleString()}</div><button onclick="window.claimMail('${id}')" style="background:#26ff00;color:#000;width:100%;margin-top:10px;font-weight:bold;">수령하기</button></div>`; 
        }); 
    }
    document.getElementById('mailbox-modal').style.display='flex';
};

window.claimMail = (id) => { 
    const m=state.serverMails[id]; 
    if(!m||state.claimedMails[id]) return; 
    if(m.gold) state.money+=parseInt(m.gold); 
    if(m.rateUp) state.rateUpTickets+=parseInt(m.rateUp); 
    if(m.cardTid) grantCardByTemplate(m.cardTid, m.cardGrade); 
    state.claimedMails[id]=true; 
    window.saveUserData(); window.updateUI(); updateMailboxBadge(); window.openMailbox(); 
};

window.claimAllMails = () => { 
    let claimedAny=false; 
    Object.keys(state.serverMails).forEach(id=>{ 
        const m=state.serverMails[id]; 
        if(!state.claimedMails[id] && (m.targetUid==='ALL' || m.targetUid===state.currentUser.uid)){ 
            if(m.gold) state.money+=parseInt(m.gold); 
            if(m.rateUp) state.rateUpTickets+=parseInt(m.rateUp); 
            if(m.cardTid) grantCardByTemplate(m.cardTid, m.cardGrade); 
            state.claimedMails[id]=true; claimedAny=true; 
        } 
    }); 
    if(claimedAny){ 
        window.saveUserData(); window.updateUI(); updateMailboxBadge(); window.openMailbox(); alert("🎁 모든 우편 수령!"); 
    } else alert("수령할 우편이 없습니다."); 
};

window.closeModal=id=>{ document.getElementById(id).style.display='none'; }; 
window.switchTab=n=>{ document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===n)); document.querySelectorAll('.section').forEach((s,i)=>s.classList.toggle('active',i===n)); if(n===4) loadArenaData(); };

window.closeLiveBattle = async () => {
    document.getElementById('live-battle-modal').style.display='none'; const rs=state.pendingBattleResult; if(!rs) return;

    if(rs.type==='ai'){
        if(rs.wins>=1){ 
            state.aiWins++; state.aiWinStreak++; state.aiAttackDeck.forEach(c=>{c.exp=(c.exp||0)+30; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); state.money+=200;
            let cM=""; if(rs.useCap){ state.capTickets--; const t=rs.aiTeam[Math.floor(Math.random()*2)]; grantCardByTemplate(t.templateId, t.grade); cM=`\n🪤 AI 영웅 포획 성공!`; }
            alert(`🎉 AI 대전 승리! (200G 획득)${cM}`);
        }else{
            state.aiWinStreak=0; if(rs.useCap) state.capTickets--;
            if(state.potions>0){ state.potions--; alert("💀 패배... 방어 물약 소모. (연승 초기화)"); } else{ state.myCards=state.myCards.filter(c=>String(c.instanceId)!==String(state.aiAttackDeck[Math.floor(Math.random()*2)].instanceId)); alert("💀 패배... 영웅 파괴! (연승 초기화)"); }
        }
        state.aiAttackDeck=[null,null]; setSlotHTML(document.getElementById(`ai-atk-slot1`),null,'선택'); setSlotHTML(document.getElementById(`ai-atk-slot2`),null,'선택'); document.getElementById('use-ai-cap').checked=false;
    } 
    else if(rs.type==='arena'){
        if(rs.useWin) state.winTickets--;
        if(rs.wins>=2){
            state.pvpAttackDeck.forEach(c=>{c.exp=(c.exp||0)+50; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); state.money+=500; let cM="";
            if(rs.useCap){
                state.userCapTickets--;
                if(state.currentDefender.defenderUid!=='AI'){
                    try{ const ls=await get(child(ref(db), `users/${state.currentDefender.defenderUid}`)); if(ls.exists()){ let d=ls.val(); let sc=d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)).filter(c=>c&&!c.isLocked):[]; if(sc.length>0){ const st=sc[Math.floor(Math.random()*sc.length)]; d.deck=(d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)):[]).filter(c=>c&&String(c.instanceId)!==String(st.instanceId)); d.robbed=true; d.lostCardName=getCardBaseInfo(st.templateId).name; await set(ref(db, `users/${state.currentDefender.defenderUid}`), d); st.instanceId=String(Date.now()+Math.random()); st.atkBuff=0; st.enhance=0; state.myCards.push(st); cM=`\n👿 [${d.lostCardName}] 탈취 성공!`; } else cM=`\n👿 상대 방어됨.`; } }catch(e){}
                }else{ grantCardByTemplate(state.currentDefender.deck[Math.floor(Math.random()*3)].templateId, state.currentDefender.deck[0].grade); cM=`\n👿 포획!`; }
            }
            await set(ref(db, 'arena/current'), {defenderUid:state.currentUser.uid, defenderName:state.myDisplayName, deck:state.pvpAttackDeck});
            if(state.currentDefender.defenderUid!=='AI'){ try{ const ls=await get(child(ref(db), `users/${state.currentDefender.defenderUid}`)); if(ls.exists()){ let d=ls.val(); let sM=Math.min(Math.max(0,d.money||0),300); d.money=Math.max(0,(d.money||0)-sM); d.robbed=true; d.stolenMoney=(d.stolenMoney||0)+sM; await set(ref(db, `users/${state.currentDefender.defenderUid}`), d); state.money+=sM; } }catch(e){} }
            alert(`🎉 챔피언 등극! (500G)${cM}`); window.sendSystemMessage(`🏆 [${state.myDisplayName}]님이 아레나 챔피언에 등극했습니다!`);
        }else{ alert("💀 챔피언 도전 패배."); if(rs.useCap) state.userCapTickets--; }
        state.pvpAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`atk-slot${i}`),null,'선택'); document.getElementById('use-win-ticket-arena').checked=false; document.getElementById('use-user-capture-arena').checked=false; loadArenaData();
    }
    else if(rs.type==='plunder'){
        if(rs.useWin) state.winTickets--;
        if(rs.wins>=2){
            state.plunderAttackDeck.forEach(c=>{c.exp=(c.exp||0)+50; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); let cM="", sG=0, sI="";
            try{
                const ls=await get(child(ref(db), `users/${rs.target.uid}`));
                if(ls.exists()){
                    let d=ls.val(); sG=Math.min(1000,Math.floor((d.money||0)*(0.1+Math.random()*0.1))); d.money=Math.max(0,(d.money||0)-sG); state.money+=sG;
                    if(Math.random()<0.3){ const vs=['potions','atkPotions','scrolls','exp','win','upg','cap','rateUp','skips'].filter(i=>d[i]>0); if(vs.length>0){ const si=vs[Math.floor(Math.random()*vs.length)]; d[si]--; if(si==='potions')state.potions++; else if(si==='atkPotions')state.atkPotions++; else if(si==='scrolls')state.fusionScrolls++; else if(si==='exp')state.expTickets++; else if(si==='win')state.winTickets++; else if(si==='upg')state.upgItems++; else if(si==='cap')state.capTickets++; else if(si==='rateUp')state.rateUpTickets++; else if(si==='skips')state.skips++; sI="\n🎁 전리품 스틸 성공!"; } }
                    if(rs.useCap||Math.random()<0.05){
                        if(rs.useCap) state.userCapTickets--; let sc=d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)).filter(c=>c&&!c.isLocked):[];
                        if(sc.length>0){ const st=sc[Math.floor(Math.random()*sc.length)]; d.deck=(d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)):[]).filter(c=>c&&String(c.instanceId)!==String(st.instanceId)); if(d.defDeck)d.defDeck=(Array.isArray(d.defDeck)?d.defDeck:Object.values(d.defDeck)).map(c=>(c&&String(c.instanceId)===String(st.instanceId))?null:c); d.lostCardName=getCardBaseInfo(st.templateId).name; st.instanceId=String(Date.now()+Math.random()); st.atkBuff=0; st.enhance=0; state.myCards.push(st); cM=`\n👿 상대의 [${d.lostCardName}] 영구 탈취!`; } else cM=`\n👿 방어됨. 카드 스틸 실패.`;
                    } else if(rs.useCap) state.userCapTickets--;
                    d.robbed=true; d.stolenMoney=(d.stolenMoney||0)+sG; d.robberName=state.myDisplayName; await set(ref(db, `users/${rs.target.uid}`), d);
                    alert(`🎉 약탈 성공! (+${sG}G)${sI}${cM}`); window.sendSystemMessage(`🔥 [${state.myDisplayName}]님이 [${rs.target.name}]님을 약탈했습니다!`);
                }
            }catch(e){}
        }else{ alert("💀 약탈 실패."); if(rs.useCap) state.userCapTickets--; }
        state.plunderAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`plunder-atk-slot${i}`),null,'공격'+i); document.getElementById('use-win-ticket-plunder').checked=false; document.getElementById('use-user-capture-plunder').checked=false; loadArenaData();
    }
    state.pendingBattleResult=null; window.saveUserData(); window.updateUI(); window.renderMyCards();
};
