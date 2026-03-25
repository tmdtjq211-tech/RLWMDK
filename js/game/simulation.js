// js/game/simulation.js

import { normalSkills } from '../data/constants.js';
import { getBattleStats } from './battle-utils.js';
import { printLog } from '../ui/renderer.js';

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
