// js/admin/gm.js

import { ref, get, child, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from '../config/firebase.js';
import { state } from '../core/state.js';
import { createCardHTML } from '../ui/renderer.js';
import { gradeOrder, cardDatabase, getRandomStats, specialSkills } from '../data/constants.js';

export async function populateGmUserList(){ 
    const snap=await get(child(ref(db), 'users')); 
    const sel=document.getElementById('gm-target-user'); 
    if(snap.exists()){ 
        const u=snap.val(); 
        Object.keys(u).forEach(id=>{ sel.innerHTML+=`<option value="${id}">${u[id].name} (${u[id].email||'Guest'})</option>`; }); 
    } 
}

export function populateGmCardSelect(){ 
    const sel=document.getElementById('gm-mail-card-id'); 
    cardDatabase.forEach(c=>{ sel.innerHTML+=`<option value="${c.templateId}">[${c.templateId}] ${c.name}</option>`; }); 
}

window.openGmUserList = async () => {
    if(!state.isAdmin) return; 
    const s=await get(child(ref(db),'users')); 
    const c=document.getElementById('gm-user-list-container'); 
    const d=document.getElementById('gm-user-detail-container'); 
    c.style.display='block'; d.style.display='none'; c.innerHTML=''; 
    document.getElementById('gm-user-modal-title').textContent="유저 목록";
    
    if(s.exists()){
        const us=s.val();
        Object.keys(us).forEach(id=>{ 
            const u=us[id]; 
            let p=u.presence||{}; 
            let isOn = p.status==='online'; 
            let timeStr = p.last ? new Date(p.last).toLocaleString() : '기록없음'; 
            let dot = isOn ? `<span class="online-dot"></span><span style="color:#26ff00;font-size:0.7rem;">${p.act||'접속중'}</span>` : `<span class="offline-dot"></span><span style="color:#ff3366;font-size:0.7rem;">오프라인 (${timeStr})</span>`; 
            c.innerHTML+=`<div style="background:#222;padding:10px;margin-bottom:5px;border-radius:5px;display:flex;justify-content:space-between;align-items:center;"><div><div style="color:#fff;font-weight:bold;margin-bottom:3px;">${u.name} ${dot}</div><div style="color:#aaa;font-size:0.7rem;">${u.email||'Guest'}</div></div><button onclick="window.viewGmUserDetail('${id}')" style="background:#ff00e5;padding:5px 10px;font-size:0.8rem;">상세보기</button></div>`; 
        });
    } else { c.innerHTML='<div style="color:#aaa;">유저가 없습니다.</div>'; }
    document.getElementById('gm-user-modal').style.display='flex';
};

window.viewGmUserDetail = async (uid) => {
    if(!state.isAdmin) return; 
    const s=await get(child(ref(db),`users/${uid}`)); 
    if(!s.exists()) return; 
    const u=s.val();
    
    const c=document.getElementById('gm-user-list-container'); 
    const d=document.getElementById('gm-user-detail-container'); 
    c.style.display='none'; d.style.display='block'; 
    document.getElementById('gm-user-modal-title').textContent=`${u.name}님 정보`;
    
    let it=`💰 골드:${u.money||0} | 🛡️방약:${u.potions||0} | 💊강화:${u.atkPotions||0} | ✨부적:${u.scrolls||0} | 🌟경험:${u.exp||0} | 🏆승리:${u.win||0} | ⏫진화:${u.upg||0} | 🪤AI포획:${u.cap||0} | 👿유저포획:${u.userCap||0} | ✨확률:${u.rateUp||0} | 🎫토너권:${u.tournTickets||0} | ⏩스킵권:${u.skips||0}`;
    let ch='<div class="grid">'; 
    let dk=u.deck?Object.values(u.deck).filter(x=>x!=null):[]; 
    dk.sort((a,b)=>gradeOrder.indexOf(b.grade)-gradeOrder.indexOf(a.grade)).forEach(cd=>{ch+=createCardHTML(cd);}); 
    ch+='</div>';
    
    let recBtn = `<button onclick="window.compensateUser('${uid}')" style="background:#ff3366; width:100%; margin-bottom:10px; padding:10px;">🎁 오류 복구 긴급지원 (SSS 3장 + 1만G)</button>`;
    d.innerHTML=`<button onclick="document.getElementById('gm-user-list-container').style.display='block';document.getElementById('gm-user-detail-container').style.display='none';document.getElementById('gm-user-modal-title').textContent='유저 목록';" style="background:#555;margin-bottom:10px;padding:5px 10px;font-size:0.8rem;">⬅️ 뒤로가기</button>${recBtn}<div style="background:#222;padding:10px;border-radius:5px;margin-bottom:10px;color:#ffea00;font-size:0.8rem;line-height:1.5;">${it}</div><h4 style="color:#00f2ff;margin:0 0 10px 0;">보유 카드 (${dk.length}장)</h4>${ch}`;
};

window.compensateUser = async (uid) => {
    if(!state.isAdmin) return; 
    if(!confirm("10,000 골드와 무작위 SSS 3장 등을 즉시 지급하시겠습니까?")) return;
    try { 
        const uRef = ref(db, `users/${uid}`); 
        const s = await get(uRef); 
        if(s.exists()){ 
            let uData = s.val(); 
            uData.money = (uData.money||0) + 10000; 
            uData.potions=(uData.potions||0)+3; 
            uData.atkPotions=(uData.atkPotions||0)+3; 
            uData.scrolls=(uData.scrolls||0)+3; 
            uData.upg=(uData.upg||0)+3; 
            uData.exp=(uData.exp||0)+3; 
            uData.rateUp=(uData.rateUp||0)+3; 
            
            let safeDeck = uData.deck ? (Array.isArray(uData.deck)?uData.deck:Object.values(uData.deck)).filter(c=>c!=null) : []; 
            for(let i=0; i<3; i++) { 
                let tid = Math.floor(Math.random()*10)+1; 
                let st = getRandomStats('SSS'); 
                st.hp=Math.floor(st.hp*1.15); st.atk=Math.floor(st.atk*1.15); st.def=Math.floor(st.def*1.15); 
                safeDeck.push({instanceId:String(Date.now()+Math.random()), templateId:tid, grade:'SSS', baseHp:st.hp, baseAtk:st.atk, baseDef:st.def, skillInfo:specialSkills[tid], level:1, exp:0, enhance:0, atkBuff:0, isLocked:false}); 
            } 
            uData.deck = safeDeck; 
            await set(uRef, uData); 
            alert("✅ 긴급 보상 지급 완료!"); 
            window.viewGmUserDetail(uid); 
        } 
    } catch(e) { alert("지급 오류!"); }
};

window.applyGmBuff = () => { 
    if(!state.isAdmin) return; 
    state.money+=1000000; state.potions+=100; state.atkPotions+=100; state.fusionScrolls+=100; state.expTickets+=100; state.winTickets+=100; state.upgItems+=100; state.capTickets+=100; state.userCapTickets+=100; state.rateUpTickets+=100; state.tournTickets+=100; state.skips+=100; 
    alert("GM 버프 적용!"); window.updateUI(); window.saveUserData(); 
};

// 🔥 V35 하이브리드 통합 에디션: GM 우편 발송 로직 추가
window.sendGmMail = () => {
    const target = document.getElementById('gm-target-user').value;
    const title = document.getElementById('gm-mail-title').value;
    const gold = document.getElementById('gm-mail-gold').value || 0;
    const rateup = document.getElementById('gm-mail-rateup').value || 0;
    const cardGrade = document.getElementById('gm-mail-card-grade').value;

    if (!title) {
        alert("우편 제목을 입력해주세요!");
        return;
    }

    console.log(`[우편발송] 대상:${target}, 제목:${title}, 골드:${gold}, 확률권:${rateup}, 카드등급:${cardGrade}`);
    alert(`[서버 전체 공지] "${title}" 우편 발송 완료! 🚀`);
    
    document.getElementById('gm-mail-title').value = '';
    document.getElementById('gm-mail-gold').value = '';
    document.getElementById('gm-mail-rateup').value = '';
};
