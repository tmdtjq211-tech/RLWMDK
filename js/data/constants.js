export const attrIcon = {'rock':'✊','paper':'✋','scissors':'✌️'};

export const specificCards = [
    {id:1,name:'진해골킹',grade:'S'},{id:2,name:'진오노마똥',grade:'SSS'},
    {id:3,name:'퍼펙트제로',grade:'SSS'},{id:4,name:'기즈아아아',grade:'SSS'},
    {id:5,name:'농ㅋㅋ',grade:'SSS'},{id:6,name:'두두리안',grade:'SSS'},
    {id:7,name:'삼환마',grade:'SSS'},{id:8,name:'솔로 심영몬',grade:'SSS'},
    {id:9,name:'퍼펙트금화띠',grade:'SSS'},{id:10,name:'하이',grade:'SSS'}
];

export const specialSkills = {
    1:{type:'absolute_guard',name:'🛡️무적방패',desc:'적 공격 3회 무시',isSpecial:true},
    2:{type:'instant_kill',name:'⚡심판의번개',desc:'공격시 10% 즉사',isSpecial:true},
    3:{type:'triple_crit',name:'💥파괴광선',desc:'30% 확률 3배 피해',isSpecial:true},
    4:{type:'true_vamp',name:'🩸흡혈귀왕',desc:'가한 피해 100% 회복',isSpecial:true},
    5:{type:'reflect',name:'🔄가시갑옷',desc:'피격시 20% 반사',isSpecial:true},
    6:{type:'curse',name:'☠️파멸저주',desc:'매턴 적 최대체력 10% 피해',isSpecial:true},
    7:{type:'resurrect',name:'👼불사조',desc:'사망시 체력 50% 1회 부활',isSpecial:true},
    8:{type:'true_damage',name:'🎯절대관통',desc:'적 방어력 무시',isSpecial:true},
    9:{type:'regen',name:'💚대자연',desc:'매턴 내 최대체력 15% 회복',isSpecial:true},
    10:{type:'berserker',name:'😡광전사',desc:'잃은 체력 비례 공격력 증가',isSpecial:true}
};

export const normalSkills = [
    {type:'crit',name:'🔥치명타',desc:'1.5배 피해(50%)',isSpecial:false},
    {type:'pierce',name:'🗡️관통',desc:'방어무시(50%)',isSpecial:false},
    {type:'heal',name:'💚치유',desc:'공격후 체력 30%회복(50%)',isSpecial:false},
    {type:'vamp',name:'🦇흡혈',desc:'가한 피해 50%회복(50%)',isSpecial:false}
];

export const cardDatabase = []; 
export const elements = ['rock','paper','scissors']; 
export const fantasyNames = ["페가수스","그리폰","미노타우","켄타우로","사이클롭","오크대장","고블린킹","트롤술사","슬라임퀸","데스나잇","리치","뱀파이어","서큐버스","늑대인간","가고일","바실리스","하피","키메라","만티코어","와이번","크라켄","레비아탄","베히모스","요르문간","펜리르","발키리","에인헤랴","듀라한","골렘","호문쿨루","일리시드","비홀더","드라이어","실프","운디네","샐러맨더","노움","이프리트","마리드","정령왕","마도기사"];

for(let i=1; i<=51; i++){
    let isSp = specificCards.find(c=>c.id===i); 
    let cN = isSp ? isSp.name : fantasyNames[(i-11)%fantasyNames.length]; 
    let cG = isSp ? isSp.grade : (i%5===0?'A':(i%2===0?'B':'C')); 
    cardDatabase.push({templateId:i, name:cN, grade:cG, element:elements[i%3]});
}

export const grades = {
    'SSX':{class:'ssx',color:'#ffffff',sellPrice:5000,exp:10},
    'SSR':{class:'ssr',color:'#ff3333',sellPrice:2000,exp:8},
    'SSS':{class:'sss',color:'#ffea00',sellPrice:800,exp:6},
    'SS':{class:'ss',color:'#00f2ff',sellPrice:400,exp:5},
    'S':{class:'s',color:'#ff00e5',sellPrice:150,exp:4},
    'A':{class:'a',color:'#26ff00',sellPrice:80,exp:3},
    'B':{class:'b',color:'#ff9800',sellPrice:30,exp:2},
    'C':{class:'c',color:'#a0a0a0',sellPrice:10,exp:1}
};

export const gradeOrder = ['C','B','A','S','SS','SSS','SSR','SSX'];
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
