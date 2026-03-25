import { cardDatabase, specialSkills, normalSkills, grades, gradeOrder } from '../data/constants.js';

export function getRandomStats(grade){
    let hp, atk, def;
    switch(grade){
        case 'C': hp=100+Math.random()*120; atk=15+Math.random()*20; def=5+Math.random()*10; break;
        case 'B': hp=200+Math.random()*250; atk=30+Math.random()*40; def=12+Math.random()*18; break;
        case 'A': hp=400+Math.random()*500; atk=60+Math.random()*90; def=25+Math.random()*35; break;
        case 'S': hp=800+Math.random()*1000; atk=130+Math.random()*120; def=50+Math.random()*50; break;
        case 'SS': hp=1600+Math.random()*2000; atk=220+Math.random()*180; def=90+Math.random()*70; break;
        case 'SSS': hp=3200+Math.random()*2800; atk=350+Math.random()*250; def=140+Math.random()*110; break;
        case 'SSR': hp=5000+Math.random()*3000; atk=600+Math.random()*300; def=250+Math.random()*150; break;
        case 'SSX': hp=10000+Math.random()*5000; atk=1200+Math.random()*500; def=500+Math.random()*300; break;
    }
    return { hp:Math.floor(hp), atk:Math.floor(atk), def:Math.floor(def) };
}

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
