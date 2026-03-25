// js/battle.js

import { cardDatabase, normalSkills, specialSkills, gradeOrder, getRandomStats } from './constants.js';
import { printLog } from './ui.js';

export function getCardBaseInfo(tid){ 
    return cardDatabase.find(c=>String(c.templateId)===String(tid)) || cardDatabase[0]; 
}

export function getBattleStats(card){
    if(!card) return {name:'오류', element:'rock', skill:normalSkills[0], hp:1, atk:1, def:0};
    const base=getCardBaseInfo(card.templateId); 
    const lvBonus=((card.level||1)-1);
    let bHp=card.baseHp||100, bAtk=card.baseAtk||15, bDef=card.baseDef||5; 
    let sObj=base.templateId<=10?specialSkills[base.templateId]:(card.skillInfo||normalSkills[0]); 
    if(!sObj) sObj=normalSkills[0]; 
    return {name:base.name, element:base.element, skill:sObj, hp:bHp+(lvBonus*50), atk:bAtk+(lvBonus*10)+((card.enhance||0)*20)+((card.atkBuff||0)*20), def:bDef+(lvBonus*5)+Math.floor((card.enhance||0)*5)};
}

export function doMatch(p1, p2) {
    if(!p1) return { p1:p1, p2:p2, winner:p2 };
    if(!p2) return { p1:p1, p2:p2, winner:p1 };
    
    let sc1 = p1.card ? getBattleStats(p1.card).hp + getBattleStats(p1.card).atk*3 + getBattleStats(p1.card).def*2 + (p1.card.templateId<=10?500:0) + (p1.card.grade==='SSX'?2000:0) + (p1.card.grade==='SSR'?1000:0) : 1;
    let sc2 = p2.card ? getBattleStats(p2.card).hp + getBattleStats(p2.card).atk*3 + getBattleStats(p2.card).def*2 + (p2.card.templateId<=10?500:0) + (p2.card.grade==='SSX'?2000:0) + (p2.card.grade==='SSR'?1000:0) : 1;
    
    let rate1 = Math.round((sc1 / (sc1+sc2)) * 100); 
    let rate2 = 100 - rate1;
    let winner = Math.random()*100 < rate1 ? p1 : p2;
    
    return { p1: {...p1, winRate: rate1}, p2: {...p2, winRate: rate2}, winner: winner };
}

export function getAITeam(w){
    let bLv=1+Math.floor(w/2), mGr=Math.min(5,Math.floor(w/5)); 
    return [0,1].map(()=>{
        let g='C'; if(Math.random()<0.04) g='SSS'; else g=gradeOrder[Math.max(0,mGr-(Math.random()>0.7?1:0))]||'C';
        let pool=cardDatabase.filter(c=>c.grade===g&&c.templateId>10); if(!pool.length) pool=cardDatabase.filter(c=>c.grade===g);
        let pk=pool[Math.floor(Math.random()*pool.length)]; let st=getRandomStats(g);
        return {templateId:pk.templateId, grade:g, level:bLv+Math.floor(Math.random()*2), enhance:Math.floor(w/10), baseHp:st.hp, baseAtk:st.atk, baseDef:st.def, skillInfo:pk.skill};
    });
}

// ⚠️ 원본의 초거대 전투 알고리즘 100% 생략 없이 이식
export async function runLiveSimulation(myC, enC, logBgId, roundNum) {
    try {
        const myS=getBattleStats(myC), enS=getBattleStats(enC);
        await printLog(logBgId, `⚔️ [R${roundNum}] <span style="color:#00f2ff">${myS.name}</span> VS <span style="color:#ff3366">${enS.name}</span>`, "#fff", 600);
        let mHp=myS.hp||100, eHp=enS.hp||100, mSk=myS.skill||normalSkills[0], eSk=enS.skill||normalSkills[0];
        let mBl=mSk.type==='absolute_guard'?3:0, eBl=eSk.type==='absolute_guard'?3:0, mRev=mSk.type==='resurrect'?1:0, eRev=eSk.type==='resurrect'?1:0, winR=false;

        for(let turn=1; turn<=10; turn++){
            await printLog(logBgId, `--- 턴 ${turn} ---`, "#666", 200);

            let mAtk=Number(myS.atk)||10, eDef=Number(enS.def)||5, mTrig=false;
            if((myS.element==='rock'&&enS.element==='scissors')||(myS.element==='scissors'&&enS.element==='paper')||(myS.element==='paper'&&enS.element==='rock')){ mAtk+=20; await printLog(logBgId, `👉 속성우위 (ATK+20)`, "#00f2ff", 200); }
            if(mSk.isSpecial){ if(mSk.type==='berserker'){ mAtk+=mAtk*((myS.hp-mHp)/myS.hp); } if(mSk.type==='triple_crit'&&Math.random()<0.3){ mAtk*=3; mTrig=true; } if(mSk.type==='true_damage'){ eDef=0; } } else{ if(Math.random()<0.5){ mTrig=true; if(mSk.type==='crit') mAtk*=1.5; if(mSk.type==='pierce') eDef=0; } }
            let mDmg=Math.max(1,Math.floor(mAtk-eDef));
            if(eBl>0){ mDmg=0; eBl--; await printLog(logBgId, `[적 방어] 🛡️무적 (남은:${eBl})`, "#ffea00", 300); }

            if(mSk.type==='instant_kill'&&Math.random()<0.10&&mDmg>0){ eHp=0; await printLog(logBgId, `⚡즉사 발동!`, "#ffea00", 500); } 
            else{ eHp-=mDmg; await printLog(logBgId, `${mTrig?`[${mSk.name}] `:''}적에게 <span style="color:#ff3366;">${mDmg}</span>피해! (HP:${Math.max(0,Math.floor(eHp))})`, "#00f2ff", 400); if(eSk.type==='reflect'&&Math.random()<0.20&&mDmg>0){ mHp-=mDmg; await printLog(logBgId, `🔄가시갑옷 반사! (내HP:${Math.max(0,Math.floor(mHp))})`, "#ffea00", 300); } }

            if(mHp>0){ if(mSk.type==='true_vamp'){ let h=mDmg; mHp=Math.min(myS.hp, mHp+h); await printLog(logBgId, `🩸흡혈귀왕 (+${h})`, "#26ff00", 200); } else if(mTrig&&mSk.type==='heal'){ let h=Math.floor(myS.hp*0.3); mHp=Math.min(myS.hp, mHp+h); await printLog(logBgId, `💚치유 (+${h})`, "#26ff00", 200); } else if(mTrig&&mSk.type==='vamp'){ let h=Math.floor(mDmg*0.5); mHp=Math.min(myS.hp, mHp+h); await printLog(logBgId, `🦇흡혈 (+${h})`, "#26ff00", 200); } }
            if(mHp<=0&&mRev>0){ mHp=Math.floor(myS.hp*0.5); mRev--; await printLog(logBgId, `👼불사조 부활! (내HP:${mHp})`, "#ffea00", 400); }
            if(eHp<=0&&eRev>0){ eHp=Math.floor(enS.hp*0.5); eRev--; await printLog(logBgId, `👼적 불사조 부활! (적HP:${eHp})`, "#ffea00", 400); }
            if(eHp<=0){ winR=true; await printLog(logBgId, `✅ 적군 쓰러짐! 승리!`, "#26ff00", 500); break; }
            if(mHp<=0){ winR=false; await printLog(logBgId, `❌ 아군 쓰러짐... 패배`, "#ff3366", 500); break; }

            let eAtk=Number(enS.atk)||10, mDef=Number(myS.def)||5, eTrig=false;
            if(enS.element!==myS.element&&!((myS.element==='rock'&&enS.element==='scissors')||(myS.element==='scissors'&&enS.element==='paper')||(myS.element==='paper'&&enS.element==='rock'))){ eAtk+=20; await printLog(logBgId, `👉 적 속성우위 (ATK+20)`, "#ff3366", 200); }
            if(eSk.isSpecial){ if(eSk.type==='berserker'){ eAtk+=eAtk*((enS.hp-eHp)/enS.hp); } if(eSk.type==='triple_crit'&&Math.random()<0.3){ eAtk*=3; eTrig=true; } if(eSk.type==='true_damage'){ mDef=0; } } else{ if(Math.random()<0.5){ eTrig=true; if(eSk.type==='crit') eAtk*=1.5; if(eSk.type==='pierce') mDef=0; } }
            let eDmg=Math.max(1,Math.floor(eAtk-mDef));
            if(mBl>0){ eDmg=0; mBl--; await printLog(logBgId, `[내방어] 🛡️무적 (남은:${mBl})`, "#ffea00", 300); }

            if(eSk.type==='instant_kill'&&Math.random()<0.10&&eDmg>0){ mHp=0; await printLog(logBgId, `⚡적 즉사 발동!`, "#ffea00", 500); } 
            else{ mHp-=eDmg; await printLog(logBgId, `${eTrig?`[${eSk.name}] `:''}나에게 <span style="color:#ff3366;">${eDmg}</span>피해! (HP:${Math.max(0,Math.floor(mHp))})`, "#ff3366", 400); if(mSk.type==='reflect'&&Math.random()<0.20&&eDmg>0){ eHp-=eDmg; await printLog(logBgId, `🔄가시갑옷 반사! 적피해 ${eDmg} (적HP:${Math.max(0,Math.floor(eHp))})`, "#ffea00", 300); } }

            if(eHp>0){ if(eSk.type==='true_vamp'){ let h=eDmg; eHp=Math.min(enS.hp, eHp+h); await printLog(logBgId, `🩸적 흡혈귀왕 (+${h})`, "#26ff00", 200); } else if(eTrig&&eSk.type==='heal'){ let h=Math.floor(enS.hp*0.3); eHp=Math.min(enS.hp, eHp+h); await printLog(logBgId, `💚적 치유 (+${h})`, "#26ff00", 200); } else if(eTrig&&eSk.type==='vamp'){ let h=Math.floor(eDmg*0.5); eHp=Math.min(enS.hp, eHp+h); await printLog(logBgId, `🦇적 흡혈 (+${h})`, "#26ff00", 200); } }
            if(mHp>0&&eHp>0){ let dMsg=""; if(mSk.type==='curse'){ let d=Math.floor(enS.hp*0.1); eHp-=d; dMsg+=`☠️저주(적) `; } if(eSk.type==='curse'){ let d=Math.floor(myS.hp*0.1); mHp-=d; dMsg+=`☠️저주(나) `; } if(mSk.type==='regen'){ let h=Math.floor(myS.hp*0.15); mHp=Math.min(myS.hp, mHp+h); dMsg+=`💚자연 `; } if(eSk.type==='regen'){ let h=Math.floor(enS.hp*0.15); eHp=Math.min(enS.hp, eHp+h); dMsg+=`💚자연(적) `; } if(dMsg) await printLog(logBgId, dMsg, "#aaa", 300); }
            if(mHp<=0&&mRev>0){ mHp=Math.floor(myS.hp*0.5); mRev--; await printLog(logBgId, `👼불사조 부활! (내HP:${mHp})`, "#ffea00", 400); }
            if(eHp<=0&&eRev>0){ eHp=Math.floor(enS.hp*0.5); eRev--; await printLog(logBgId, `👼적 불사조 부활! (적HP:${eHp})`, "#ffea00", 400); }
            if(mHp<=0){ winR=false; await printLog(logBgId, `❌ 아군 쓰러짐... 패배`, "#ff3366", 500); break; }
            if(eHp<=0){ winR=true; await printLog(logBgId, `✅ 적군 쓰러짐! 승리!`, "#26ff00", 500); break; }
        }
        if(mHp>0&&eHp>0){ winR=(mHp/myS.hp>=eHp/enS.hp); await printLog(logBgId, `⚠️ 10턴 판정 -> ${winR?'<span style="color:#26ff00;">승리!</span>':'<span style="color:#ff3366;">패배...</span>'}`, "#ffea00", 500); }
        return winR;
    } catch(err) { await printLog(logBgId, `⚠️ 오류 강제 무승부`, "#ff0000", 500); return false; }
}
