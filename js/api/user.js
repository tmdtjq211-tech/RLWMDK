// js/api/user.js

import { ref, set, get, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from '../config/firebase.js';
import { state } from '../core/state.js';
import { setSlotHTML, showRobbedBanner } from '../ui/renderer.js';
import { grantCardByTemplate } from '../game/gacha.js';

export function syncDataFromDB(data) {
    if(!data) return;
    state.money = data.money||0; 
    state.potions = data.potions||0; 
    state.atkPotions = data.atkPotions||0; 
    state.fusionScrolls = data.scrolls||0; 
    state.expTickets = data.exp||0; 
    state.winTickets = data.win||0; 
    state.upgItems = data.upg||0; 
    state.capTickets = data.cap||0; 
    state.userCapTickets = data.userCap||0; 
    state.rateUpTickets = data.rateUp||0; 
    state.aiWins = data.aiWins||0; 
    state.aiWinStreak = data.aiStrk||0; 
    state.exploreCount = data.expCnt||0; 
    state.claimedMails = data.claimedMails||{}; 
    state.tourneyWins = data.tourneyWins||0; 
    state.tournTickets = data.tournTickets!==undefined ? data.tournTickets : 3; 
    state.skips = data.skips||0;
    
    let rawDeck = data.deck ? (Array.isArray(data.deck) ? data.deck : Object.values(data.deck)) : [];
    state.myCards = rawDeck.filter(c=>c!=null).map(c=>({...c, isLocked:c.isLocked||false, level:c.level||1, exp:c.exp||0}));
    
    const mapDeck = (deck) => deck.map(c => c ? state.myCards.find(mc => String(mc.instanceId) === String(c.instanceId)) || null : null);
    
    state.aiAttackDeck = mapDeck(state.aiAttackDeck); 
    state.pvpAttackDeck = mapDeck(state.pvpAttackDeck); 
    state.exploreCards = mapDeck(state.exploreCards); 
    state.plunderAttackDeck = mapDeck(state.plunderAttackDeck); 
    state.fusionCards = mapDeck(state.fusionCards); 
    state.hcAttackDeck = mapDeck(state.hcAttackDeck); 
    state.tnAttackDeck = mapDeck(state.tnAttackDeck);
    
    let savedDef = data.defDeck ? (Array.isArray(data.defDeck) ? data.defDeck : Object.values(data.defDeck)) : [];
    state.defenseDeck = [null, null, null]; 
    for(let i=0; i<3; i++){ 
        if(savedDef[i] && savedDef[i].instanceId) {
            state.defenseDeck[i] = state.myCards.find(c=>String(c.instanceId) === String(savedDef[i].instanceId)) || null; 
        }
    }
}

export async function loadUserData(){
    try{
        const snap = await get(child(ref(db), `users/${state.currentUser.uid}`));
        if(snap.exists()){ 
            syncDataFromDB(snap.val()); 
        } else { 
            state.myCards=[]; state.money=1000; state.potions=3; state.atkPotions=0; state.fusionScrolls=0; state.upgItems=0; state.expTickets=0; state.winTickets=0; state.capTickets=0; state.userCapTickets=0; state.rateUpTickets=0; state.aiWins=0; state.aiWinStreak=0; state.exploreCount=0; state.claimedMails={}; state.defenseDeck=[null,null,null]; state.plunderAttackDeck=[null,null,null]; state.hcAttackDeck=[null,null,null]; state.tnAttackDeck=[null]; state.tournTickets=3; state.skips=0;
            grantCardByTemplate(50,'C'); grantCardByTemplate(49,'C'); grantCardByTemplate(40,'C'); 
            state.isDataLoaded = true; 
            window.saveUserData(); 
        }
        state.isDataLoaded = true; 
        window.updateUI(); 
        window.renderMyCards(); 
        for(let i=0; i<3; i++) setSlotHTML(document.getElementById(`def-setup-slot${i+1}`), state.defenseDeck[i], `방어${i+1}`);
    } catch(e){ 
        alert("데이터 로드 오류! 새로고침 해주세요."); 
    }
}

// 명시적으로 window 객체에 할당 (main.js에서 다른 파일들이 호출할 수 있도록)
window.saveUserData = async function(){ 
    if(!state.currentUser || !state.isDataLoaded) return; 
    const safeCards = state.myCards.filter(c=>c!=null);
    await set(ref(db, 'users/'+state.currentUser.uid), { 
        name:state.myDisplayName, email:state.currentUser.email||"guest", money:state.money, deck:safeCards, defDeck:state.defenseDeck, robbed:false, potions:state.potions, atkPotions:state.atkPotions, scrolls:state.fusionScrolls, exp:state.expTickets, win:state.winTickets, upg:state.upgItems, cap:state.capTickets, userCap:state.userCapTickets, rateUp:state.rateUpTickets, aiWins:state.aiWins, aiStrk:state.aiWinStreak, expCnt:state.exploreCount, claimedMails:state.claimedMails, tourneyWins:state.tourneyWins, tournTickets:state.tournTickets, skips:state.skips 
    }); 
};

export function listenToMyData(){ 
    onValue(ref(db, 'users/'+state.currentUser.uid), (snap)=>{ 
        if(!state.isDataLoaded) return; 
        const data=snap.val(); 
        if(data) { 
            syncDataFromDB(data); 
            if(data.robbed){ 
                showRobbedBanner(data.lostCardName, data.stolenMoney, data.robberName); 
                set(ref(db, 'users/'+state.currentUser.uid+'/robbed'), false); 
            } 
            window.updateUI(); 
            window.renderMyCards(); 
            for(let i=0; i<3; i++) setSlotHTML(document.getElementById(`def-setup-slot${i+1}`), state.defenseDeck[i], `방어${i+1}`); 
        }
    }); 
}

window.clearNotification = () => { document.getElementById('notification-banner').style.display='none'; set(ref(db, 'users/'+state.currentUser.uid+'/robbed'), false); };
