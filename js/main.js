    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
    import { getDatabase, ref, set, get, child, onValue, push, query, limitToLast, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

    const firebaseConfig = { 
        apiKey: "AIzaSyCvf7uhsBqZtz6iC-xzxDngnLEsZJGIot0", 
        authDomain: "gameih.firebaseapp.com", 
        databaseURL: "https://gameih-default-rtdb.firebaseio.com", 
        projectId: "gameih", 
        storageBucket: "gameih.firebasestorage.app", 
        messagingSenderId: "898099533818", 
        appId: "1:898099533818:web:a5e683940c9b9524c5b643" 
    };
    
    const app = initializeApp(firebaseConfig); 
    const auth = getAuth(app); 
    const db = getDatabase(app); 
    const provider = new GoogleAuthProvider();

    let currentUser = null;
    let isAdmin = false;
    let isDataLoaded = false;
    let isBattling = false; 
    let myDisplayName = "유저";
    let myCards = [];
    let money = 1000;
    let potions = 3;
    let atkPotions = 0;
    let fusionScrolls = 0;
    let upgItems = 0;
    let expTickets = 0;
    let winTickets = 0;
    let capTickets = 0;
    let userCapTickets = 0;
    let rateUpTickets = 0; 
    let aiWins = 0;
    let aiWinStreak = 0;
    let exploreCount = 0;
    let tourneyWins = 0;
    let tournTickets = 3;
    let skips = 0; 
    let claimedMails = {};
    let serverMails = {};  
    let fusionCards = [null,null];
    let aiAttackDeck = [null,null];
    let pvpAttackDeck = [null,null,null];
    let exploreCards = [null,null,null];
    let defenseDeck = [null,null,null];
    let plunderAttackDeck = [null,null,null];
    let hcAttackDeck = [null,null,null];
    let tnAttackDeck = [null]; 
    let pvpTargetUser = null;
    let currentDefender = null;
    let selectionTarget = {mode:null, slotIdx:null}; 
    let sellMode = false;
    let selectedForSell = new Set();
    let tournData = null;
    let tournParts = null;
    let nextRunTime = null; 

    const attrIcon = {'rock':'✊','paper':'✋','scissors':'✌️'};
    const specificCards = [
        {id:1,name:'진해골킹',grade:'S'},{id:2,name:'진오노마똥',grade:'SSS'},
        {id:3,name:'퍼펙트제로',grade:'SSS'},{id:4,name:'기즈아아아',grade:'SSS'},
        {id:5,name:'농ㅋㅋ',grade:'SSS'},{id:6,name:'두두리안',grade:'SSS'},
        {id:7,name:'삼환마',grade:'SSS'},{id:8,name:'솔로 심영몬',grade:'SSS'},
        {id:9,name:'퍼펙트금화띠',grade:'SSS'},{id:10,name:'하이',grade:'SSS'}
    ];
    
    const specialSkills = {
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
    
    const normalSkills = [
        {type:'crit',name:'🔥치명타',desc:'1.5배 피해(50%)',isSpecial:false},
        {type:'pierce',name:'🗡️관통',desc:'방어무시(50%)',isSpecial:false},
        {type:'heal',name:'💚치유',desc:'공격후 체력 30%회복(50%)',isSpecial:false},
        {type:'vamp',name:'🦇흡혈',desc:'가한 피해 50%회복(50%)',isSpecial:false}
    ];
    
    function getRandomStats(grade){
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

    const cardDatabase = []; 
    const elements = ['rock','paper','scissors']; 
    const fantasyNames = ["페가수스","그리폰","미노타우","켄타우로","사이클롭","오크대장","고블린킹","트롤술사","슬라임퀸","데스나잇","리치","뱀파이어","서큐버스","늑대인간","가고일","바실리스","하피","키메라","만티코어","와이번","크라켄","레비아탄","베히모스","요르문간","펜리르","발키리","에인헤랴","듀라한","골렘","호문쿨루","일리시드","비홀더","드라이어","실프","운디네","샐러맨더","노움","이프리트","마리드","정령왕","마도기사"];
    
    for(let i=1; i<=51; i++){
        let isSp = specificCards.find(c=>c.id===i); 
        let cN = isSp ? isSp.name : fantasyNames[(i-11)%fantasyNames.length]; 
        let cG = isSp ? isSp.grade : (i%5===0?'A':(i%2===0?'B':'C')); 
        cardDatabase.push({templateId:i, name:cN, grade:cG, element:elements[i%3]});
    }
    
    const grades = {
        'SSX':{class:'ssx',color:'#ffffff',sellPrice:5000,exp:10},
        'SSR':{class:'ssr',color:'#ff3333',sellPrice:2000,exp:8},
        'SSS':{class:'sss',color:'#ffea00',sellPrice:800,exp:6},
        'SS':{class:'ss',color:'#00f2ff',sellPrice:400,exp:5},
        'S':{class:'s',color:'#ff00e5',sellPrice:150,exp:4},
        'A':{class:'a',color:'#26ff00',sellPrice:80,exp:3},
        'B':{class:'b',color:'#ff9800',sellPrice:30,exp:2},
        'C':{class:'c',color:'#a0a0a0',sellPrice:10,exp:1}
    };
    const gradeOrder = ['C','B','A','S','SS','SSS','SSR','SSX'];

    // 핵심 매치 함수
    function doMatch(p1, p2) {
        if(!p1) return { p1:p1, p2:p2, winner:p2 };
        if(!p2) return { p1:p1, p2:p2, winner:p1 };
        
        let sc1 = p1.card ? getBattleStats(p1.card).hp + getBattleStats(p1.card).atk*3 + getBattleStats(p1.card).def*2 + (p1.card.templateId<=10?500:0) + (p1.card.grade==='SSX'?2000:0) + (p1.card.grade==='SSR'?1000:0) : 1;
        let sc2 = p2.card ? getBattleStats(p2.card).hp + getBattleStats(p2.card).atk*3 + getBattleStats(p2.card).def*2 + (p2.card.templateId<=10?500:0) + (p2.card.grade==='SSX'?2000:0) + (p2.card.grade==='SSR'?1000:0) : 1;
        
        let rate1 = Math.round((sc1 / (sc1+sc2)) * 100); 
        let rate2 = 100 - rate1;
        let winner = Math.random()*100 < rate1 ? p1 : p2;
        
        return { p1: {...p1, winRate: rate1}, p2: {...p2, winRate: rate2}, winner: winner };
    }

    function renderMatchCard(p){
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

    // 전역 함수 등록
    window.loginWithGoogle = () => { signInWithPopup(auth, provider).catch(err=>alert("로그인 실패")); }; 
    window.loginAsGuest = () => { signInAnonymously(auth).catch(err=>alert("게스트 로그인 실패")); };
    window.logout = () => { signOut(auth).then(()=>{location.reload();}); };
    
    onAuthStateChanged(auth, (user) => {
        if(user){ 
            currentUser = user; 
            document.getElementById('login-overlay').style.display = 'none'; 
            myDisplayName = user.displayName || ("게스트_" + user.uid.substring(0,4));
            
            if(user.email === 'tmdtjq211@gmail.com'){ 
                isAdmin = true; 
                document.getElementById('player-name').innerHTML = `<span style="color:#ff00e5;">[GM]</span> ${myDisplayName}`; 
                document.getElementById('tab-gm').style.display = 'block'; 
                populateGmCardSelect(); 
                populateGmUserList(); 
            } else { 
                document.getElementById('player-name').textContent = myDisplayName; 
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

    function syncDataFromDB(data) {
        if(!data) return;
        money = data.money||0; 
        potions = data.potions||0; 
        atkPotions = data.atkPotions||0; 
        fusionScrolls = data.scrolls||0; 
        expTickets = data.exp||0; 
        winTickets = data.win||0; 
        upgItems = data.upg||0; 
        capTickets = data.cap||0; 
        userCapTickets = data.userCap||0; 
        rateUpTickets = data.rateUp||0; 
        aiWins = data.aiWins||0; 
        aiWinStreak = data.aiStrk||0; 
        exploreCount = data.expCnt||0; 
        claimedMails = data.claimedMails||{}; 
        tourneyWins = data.tourneyWins||0; 
        tournTickets = data.tournTickets!==undefined ? data.tournTickets : 3; 
        skips = data.skips||0;
        
        let rawDeck = data.deck ? (Array.isArray(data.deck) ? data.deck : Object.values(data.deck)) : [];
        myCards = rawDeck.filter(c=>c!=null).map(c=>({...c, isLocked:c.isLocked||false, level:c.level||1, exp:c.exp||0}));
        
        const mapDeck = (deck) => deck.map(c => c ? myCards.find(mc => String(mc.instanceId) === String(c.instanceId)) || null : null);
        
        aiAttackDeck = mapDeck(aiAttackDeck); 
        pvpAttackDeck = mapDeck(pvpAttackDeck); 
        exploreCards = mapDeck(exploreCards); 
        plunderAttackDeck = mapDeck(plunderAttackDeck); 
        fusionCards = mapDeck(fusionCards); 
        hcAttackDeck = mapDeck(hcAttackDeck); 
        tnAttackDeck = mapDeck(tnAttackDeck);
        
        let savedDef = data.defDeck ? (Array.isArray(data.defDeck) ? data.defDeck : Object.values(data.defDeck)) : [];
        defenseDeck = [null, null, null]; 
        for(let i=0; i<3; i++){ 
            if(savedDef[i] && savedDef[i].instanceId) {
                defenseDeck[i] = myCards.find(c=>String(c.instanceId) === String(savedDef[i].instanceId)) || null; 
            }
        }
    }

    async function loadUserData(){
        try{
            const snap = await get(child(ref(db), `users/${currentUser.uid}`));
            if(snap.exists()){ 
                syncDataFromDB(snap.val()); 
            } else { 
                myCards=[]; money=1000; potions=3; atkPotions=0; fusionScrolls=0; upgItems=0; expTickets=0; winTickets=0; capTickets=0; userCapTickets=0; rateUpTickets=0; aiWins=0; aiWinStreak=0; exploreCount=0; claimedMails={}; defenseDeck=[null,null,null]; plunderAttackDeck=[null,null,null]; hcAttackDeck=[null,null,null]; tnAttackDeck=[null]; tournTickets=3; skips=0;
                grantCardByTemplate(50,'C'); grantCardByTemplate(49,'C'); grantCardByTemplate(40,'C'); 
                isDataLoaded = true; 
                saveUserData(); 
            }
            isDataLoaded = true; 
            updateUI(); 
            renderMyCards(); 
            for(let i=0; i<3; i++) setSlotHTML(document.getElementById(`def-setup-slot${i+1}`), defenseDeck[i], `방어${i+1}`);
        } catch(e){ 
            alert("데이터 로드 오류! 새로고침 해주세요."); 
        }
    }

    async function saveUserData(){ 
        if(!currentUser || !isDataLoaded) return; 
        const safeCards = myCards.filter(c=>c!=null);
        await set(ref(db, 'users/'+currentUser.uid), { 
            name:myDisplayName, email:currentUser.email||"guest", money, deck:safeCards, defDeck:defenseDeck, robbed:false, potions, atkPotions, scrolls:fusionScrolls, exp:expTickets, win:winTickets, upg:upgItems, cap:capTickets, userCap:userCapTickets, rateUp:rateUpTickets, aiWins, aiStrk:aiWinStreak, expCnt:exploreCount, claimedMails, tourneyWins, tournTickets, skips 
        }); 
    }
    
    function listenToMyData(){ 
        onValue(ref(db, 'users/'+currentUser.uid), (snap)=>{ 
            if(!isDataLoaded) return; 
            const data=snap.val(); 
            if(data) { 
                syncDataFromDB(data); 
                if(data.robbed){ 
                    showRobbedBanner(data.lostCardName, data.stolenMoney, data.robberName); 
                    set(ref(db, 'users/'+currentUser.uid+'/robbed'), false); 
                } 
                updateUI(); 
                renderMyCards(); 
                for(let i=0; i<3; i++) setSlotHTML(document.getElementById(`def-setup-slot${i+1}`), defenseDeck[i], `방어${i+1}`); 
            }
        }); 
    }
    
    function showRobbedBanner(cardName, gold, robber){ 
        let msg=`🚨 방어선 붕괴! [${robber||'누군가'}]의 약탈<br>`; 
        if(gold) msg+=`골드 손실: -${gold}G<br>`; 
        if(cardName) msg+=`👿 <span style="color:#ffea00;font-weight:bold;">[${cardName}] 강탈당함!</span>`; 
        const banner=document.getElementById('notification-banner'); 
        banner.innerHTML=msg; 
        banner.style.display='block'; 
        setTimeout(()=>banner.style.display='none',7000); 
    }
    
    window.clearNotification = () => { document.getElementById('notification-banner').style.display='none'; set(ref(db, 'users/'+currentUser.uid+'/robbed'), false); };

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
                        let isMe=msg.uid===currentUser.uid; 
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
        set(push(ref(db, 'global_chat')), {uid:currentUser.uid, name:myDisplayName, text:text, type:'user', timestamp:Date.now()}); 
        input.value=''; 
    };
    function sendSystemMessage(text){ set(push(ref(db, 'global_chat')), {type:'system', text:text, timestamp:Date.now()}); }

    function listenToServerMails(){ onValue(ref(db, 'server_mails'), (snap)=>{ serverMails=snap.val()||{}; updateMailboxBadge(); }); }
    function updateMailboxBadge(){ 
        let unread = Object.keys(serverMails).filter(id => !claimedMails[id] && (serverMails[id].targetUid==='ALL' || serverMails[id].targetUid===currentUser.uid)).length; 
        const b = document.getElementById('mail-badge'); 
        if(unread>0){ b.style.display='inline-block'; b.textContent=unread; } else b.style.display='none'; 
    }
    
    window.openMailbox = () => {
        const container = document.getElementById('mail-list-container'); 
        container.innerHTML=''; 
        const mailIds=Object.keys(serverMails).reverse();
        let myMails = mailIds.filter(id => !claimedMails[id] && (serverMails[id].targetUid==='ALL' || serverMails[id].targetUid===currentUser.uid));
        
        if(myMails.length===0){ 
            container.innerHTML='<div style="color:#aaa;text-align:center;margin-top:20px;">도착한 우편이 없습니다.</div>'; 
        } else { 
            myMails.forEach(id=>{ 
                const m=serverMails[id]; 
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
        const m=serverMails[id]; 
        if(!m||claimedMails[id]) return; 
        if(m.gold) money+=parseInt(m.gold); 
        if(m.rateUp) rateUpTickets+=parseInt(m.rateUp); 
        if(m.cardTid) grantCardByTemplate(m.cardTid, m.cardGrade); 
        claimedMails[id]=true; 
        saveUserData(); updateUI(); updateMailboxBadge(); window.openMailbox(); 
    };
    
    window.claimAllMails = () => { 
        let claimedAny=false; 
        Object.keys(serverMails).forEach(id=>{ 
            const m=serverMails[id]; 
            if(!claimedMails[id] && (m.targetUid==='ALL' || m.targetUid===currentUser.uid)){ 
                if(m.gold) money+=parseInt(m.gold); 
                if(m.rateUp) rateUpTickets+=parseInt(m.rateUp); 
                if(m.cardTid) grantCardByTemplate(m.cardTid, m.cardGrade); 
                claimedMails[id]=true; claimedAny=true; 
            } 
        }); 
        if(claimedAny){ 
            saveUserData(); updateUI(); updateMailboxBadge(); window.openMailbox(); alert("🎁 모든 우편 수령!"); 
        } else alert("수령할 우편이 없습니다."); 
    };

    window.openGmUserList = async () => {
        if(!isAdmin) return; 
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
        if(!isAdmin) return; 
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
        if(!isAdmin) return; 
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

    function populateGmCardSelect(){ 
        const sel=document.getElementById('gm-mail-card-id'); 
        cardDatabase.forEach(c=>{ sel.innerHTML+=`<option value="${c.templateId}">[${c.templateId}] ${c.name}</option>`; }); 
    }

    async function populateGmUserList(){ 
        const snap=await get(child(ref(db), 'users')); 
        const sel=document.getElementById('gm-target-user'); 
        if(snap.exists()){ 
            const u=snap.val(); 
            Object.keys(u).forEach(id=>{ sel.innerHTML+=`<option value="${id}">${u[id].name} (${u[id].email||'Guest'})</option>`; }); 
        } 
    }

    window.sendGmMail = async () => { 
        if(!isAdmin) return; 
        const target=document.getElementById('gm-target-user').value;
        const title=document.getElementById('gm-mail-title').value||'운영자 선물';
        const gold=parseInt(document.getElementById('gm-mail-gold').value)||0;
        const rateUp=parseInt(document.getElementById('gm-mail-rateup').value)||0;
        const cardTid=parseInt(document.getElementById('gm-mail-card-id').value)||0;
        const cardGrade=document.getElementById('gm-mail-card-grade').value; 
        
        if(gold===0&&rateUp===0&&cardTid===0) return alert("보상 입력 요망"); 
        if(!confirm(`발송하시겠습니까?`)) return; 
        
        await set(push(ref(db, 'server_mails')), {title, targetUid:target, gold, rateUp, cardTid, cardGrade, timestamp:Date.now()}); 
        alert("발송 완료!"); 
    };

    window.applyGmBuff = () => { 
        if(!isAdmin) return; 
        money+=1000000; potions+=100; atkPotions+=100; fusionScrolls+=100; expTickets+=100; winTickets+=100; upgItems+=100; capTickets+=100; userCapTickets+=100; rateUpTickets+=100; tournTickets+=100; skips+=100; 
        alert("GM 버프 적용!"); updateUI(); saveUserData(); 
    };

    function getCardBaseInfo(tid){ 
        return cardDatabase.find(c=>String(c.templateId)===String(tid)) || cardDatabase[0]; 
    }

    function getBattleStats(card){
        if(!card) return {name:'오류', element:'rock', skill:normalSkills[0], hp:1, atk:1, def:0};
        const base=getCardBaseInfo(card.templateId); 
        const lvBonus=((card.level||1)-1);
        let bHp=card.baseHp||100, bAtk=card.baseAtk||15, bDef=card.baseDef||5; 
        let sObj=base.templateId<=10?specialSkills[base.templateId]:(card.skillInfo||normalSkills[0]); 
        if(!sObj) sObj=normalSkills[0]; 
        return {name:base.name, element:base.element, skill:sObj, hp:bHp+(lvBonus*50), atk:bAtk+(lvBonus*10)+((card.enhance||0)*20)+((card.atkBuff||0)*20), def:bDef+(lvBonus*5)+Math.floor((card.enhance||0)*5)};
    }

    function createCardHTML(card, isZoom=false){
        if(!card) return `<div style="color:#666;margin:auto;">비어있음</div>`;
        const stats=getBattleStats(card); 
        const enTxt=card.enhance>0?`<span style="color:#ffea00;">+${card.enhance}</span> `:''; 
        const lck=card.isLocked?`<div class="locked-icon">🔒</div>`:'';
        const gClass=card.grade?grades[card.grade].class:'c'; 
        const gCol=card.grade?grades[card.grade].color:'#fff';
        const selClass = (sellMode && selectedForSell.has(String(card.instanceId))) ? 'selected' : '';
        return `
            <div class="card ${gClass} ${selClass} ${isZoom?'zoom-card':''}" data-instance-id="${card.instanceId}">
                ${lck}
                <div style="width:100%;height:75%;position:relative;"><img src="./images/${card.templateId}.png" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'300\\'><rect width=\\'200\\' height=\\'300\\' fill=\\'%23333\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23aaa\\' text-anchor=\\'middle\\'>NO IMG</text></svg>'"><div class="card-grade" style="color:${gCol}">${enTxt}${card.grade||'C'}</div></div>
                <div style="width:100%;height:25%;background:#1a1a1a;display:flex;flex-direction:column;justify-content:center;align-items:center;border-top:1px solid #444;padding:2px;box-sizing:border-box;"><div style="color:#fff;font-weight:bold;font-size:0.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">${attrIcon[stats.element]} ${stats.name} <span style="color:#00f2ff;font-size:0.6rem;font-weight:normal;">Lv.${card.level||1}</span></div><div style="font-size:0.65rem;margin-top:2px;display:flex;gap:4px;"><span style="color:#26ff00;">H:${stats.hp}</span><span style="color:#a0a0a0;">D:${stats.def}</span><span style="color:#ff3366;font-weight:bold;">A:${stats.atk}</span></div></div>
            </div>`;
    }

    function setSlotHTML(el, c, defT){ 
        if(c){ 
            el.innerHTML=createCardHTML(c); 
            el.classList.add('filled'); 
        }else{ 
            el.innerHTML=`<div class="slot-add-icon">+</div>${defT}`; 
            el.classList.remove('filled'); 
        } 
    }
    
    function grantCardByTemplate(tid, fGr=null){
        const base=getCardBaseInfo(tid); 
        let g=fGr||base.grade; 
        let stats=getRandomStats(g);
        if(tid<=10){ stats.hp=Math.floor(stats.hp*1.15); stats.atk=Math.floor(stats.atk*1.15); stats.def=Math.floor(stats.def*1.15); }
        let rSkill = tid<=10?specialSkills[tid]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
        myCards.push({instanceId:String(Date.now()+Math.random()),templateId:tid,grade:g,baseHp:stats.hp,baseAtk:stats.atk,baseDef:stats.def,skillInfo:rSkill,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false}); 
    }

    window.adjustRateUp=(amt)=>{ 
        let i=document.getElementById('use-rate-up'); 
        let v=(parseInt(i.value)||0)+amt; 
        if(v<0)v=0; if(v>rateUpTickets)v=rateUpTickets; 
        i.value=v; 
        document.getElementById('rateup-pct').textContent=v*2; 
    };
    
    window.pullGacha = (times=1) => {
        let cost = 100 * times; 
        if(money<cost) return alert("골드 부족!");
        let useRu=parseInt(document.getElementById('use-rate-up').value)||0; 
        if(useRu>rateUpTickets) return alert("강화권 부족!");
        
        money-=cost; rateUpTickets-=useRu; document.getElementById('use-rate-up').value=0; 
        let sRate=1+(useRu*2); 
        let newCardsHTML = "";
        
        for(let i=0; i<times; i++) {
            let r=Math.random()*100, fGr='C';
            if(r<=sRate) fGr='SSS'; else if(r<=sRate+2) fGr='SS'; else if(r<=sRate+6) fGr='S'; else if(r<=86) fGr='A'; else if(r<=93) fGr='B'; 
            let pool=[]; 
            if(fGr==='SSS') pool=cardDatabase.filter(c=>(c.templateId>=2&&c.templateId<=10)||c.templateId>=11); 
            else if(fGr==='S') pool=cardDatabase.filter(c=>c.templateId===1||c.templateId>=11); 
            else pool=cardDatabase.filter(c=>c.templateId>=11);
            
            const rCard=pool[Math.floor(Math.random()*pool.length)];
            
            if(fGr==='SSS'&&myCards.some(c=>String(c.templateId)===String(rCard.templateId)&&c.grade==='SSS')){ 
                money+=grades['SSS'].sellPrice; 
                newCardsHTML+=`<div style="font-size:0.8rem; padding:10px; border:1px solid #ffea00; color:#ffea00;">SSS 중복! (800G)</div>`; 
            } else { 
                grantCardByTemplate(rCard.templateId, fGr); 
                let newC = myCards[myCards.length-1]; 
                newCardsHTML += `<div style="width:100px;">${createCardHTML(newC, false)}</div>`; 
                if(fGr==='SSS') sendSystemMessage(`🎉 [${myDisplayName}]님이 상점에서 [SSS] ${rCard.name} 획득!`); 
            }
        }
        document.getElementById('gacha-result-container').innerHTML=newCardsHTML; 
        document.getElementById('gacha-modal').style.display='flex'; 
        updateUI(); renderMyCards(); saveUserData();
    };

    window.buyItem = (type, cost) => { 
        if(money<cost) return alert("골드 부족!"); 
        if(!confirm(`구매하시겠습니까?`)) return; 
        money-=cost; 
        if(type==='shield') potions++; 
        else if(type==='attack') atkPotions++; 
        else if(type==='scroll') fusionScrolls++; 
        else if(type==='capture') capTickets++; 
        else if(type==='rateup') rateUpTickets++; 
        else if(type==='skip') skips++; 
        updateUI(); saveUserData(); 
    };

    window.toggleSellMode = () => { 
        sellMode = !sellMode; selectedForSell.clear(); 
        document.getElementById('sell-mode-btn').textContent = `선택 판매: ${sellMode ? 'ON' : 'OFF'}`; 
        document.getElementById('sell-mode-btn').style.background = sellMode ? '#ff006e' : '#444'; 
        document.getElementById('sell-actions').style.display = sellMode ? 'block' : 'none'; 
        renderMyCards(); 
    };
    
    window.execSelectSell = () => {
        if(selectedForSell.size === 0) return alert("선택된 카드가 없습니다."); 
        if(!confirm(`선택한 ${selectedForSell.size}장의 카드를 판매하시겠습니까? (보호 제외)`)) return;
        
        let sCnt=0, ern=0, keep=[];
        for(let c of myCards){
            if(selectedForSell.has(String(c.instanceId)) && !c.isLocked){ 
                let isEq=fusionCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||aiAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||pvpAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||exploreCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||defenseDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||plunderAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||hcAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||tnAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId)); 
                if(!isEq){ sCnt++; ern+=grades[c.grade].sellPrice; continue; } 
            }
            keep.push(c);
        }
        myCards=keep; money+=ern; selectedForSell.clear(); 
        document.getElementById('sel-sell-cnt').textContent = 0; 
        alert(`🧹 총 ${sCnt}장 판매 완료 (+${ern}G)`); 
        updateUI(); renderMyCards(); saveUserData();
    };

    window.bulkSell = (grade) => {
        if(!confirm(`보호 상태가 아닌 모든 ${grade}등급 카드를 일괄 판매하시겠습니까?`)) return;
        let sCnt=0, ern=0, keep=[];
        for(let c of myCards){
            if(c.grade===grade&&!c.isLocked){ 
                let isEq=fusionCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||aiAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||pvpAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||exploreCards.some(x=>x&&String(x.instanceId)===String(c.instanceId))||defenseDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||plunderAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||hcAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId))||tnAttackDeck.some(x=>x&&String(x.instanceId)===String(c.instanceId)); 
                if(!isEq){ sCnt++; ern+=grades[grade].sellPrice; continue; } 
            }
            keep.push(c);
        }
        if(sCnt===0) return alert("판매할 카드가 없습니다."); 
        myCards=keep; money+=ern; 
        alert(`🧹 총 ${sCnt}장의 카드를 판매하여 ${ern}G를 획득했습니다!`); 
        updateUI(); renderMyCards(); saveUserData();
    };

    window.renderMyCards = () => { 
        const grid=document.getElementById('my-deck-grid'); grid.innerHTML=''; 
        [...myCards].sort((a,b)=>gradeOrder.indexOf(b.grade)-gradeOrder.indexOf(a.grade)).forEach(c=>{ 
            const el=document.createElement('div'); el.innerHTML=createCardHTML(c); 
            el.onclick=()=>{
                if(sellMode) { 
                    let cid = String(c.instanceId);
                    if(selectedForSell.has(cid)) selectedForSell.delete(cid); 
                    else selectedForSell.add(cid); 
                    document.getElementById('sel-sell-cnt').textContent = selectedForSell.size; 
                    renderMyCards(); 
                } else { showZoomModal(c); }
            }; 
            grid.appendChild(el); 
        }); 
        document.getElementById('card-count').textContent=myCards.length; 
    };

    window.openCardSelector = (mode, sIdx) => {
        let cD=null, dTxt='선택';
        if(mode==='fusion') { cD=fusionCards; dTxt=`재료${sIdx}`; } else if(mode==='ai') cD=aiAttackDeck; else if(mode==='pvp') cD=pvpAttackDeck; else if(mode==='explore') { cD=exploreCards; dTxt=`대원${sIdx}`; } else if(mode==='defense') { cD=defenseDeck; dTxt=`방어${sIdx}`; } else if(mode==='plunder') { cD=plunderAttackDeck; dTxt=`공격${sIdx}`; } else if(mode==='hardcore') { cD=hcAttackDeck; dTxt=`대원${sIdx}`; } else if(mode==='tourn') { cD=tnAttackDeck; dTxt=`엔트리`; }
        if(cD&&cD[sIdx-1]){ 
            if(confirm("장착 해제?")){ 
                cD[sIdx-1]=null; 
                let pfx=mode==='explore'?'explore':(mode==='ai'?'ai-atk':(mode==='fusion'?'fusion':(mode==='defense'?'def-setup':(mode==='plunder'?'plunder-atk':(mode==='hardcore'?'hc':'tn'))))); 
                setSlotHTML(document.getElementById(`${pfx}-slot${sIdx}`), null, dTxt); saveUserData(); 
            } return; 
        }
        selectionTarget={mode, slotIdx:sIdx}; 
        document.getElementById('card-select-title').textContent=`[${mode.toUpperCase()}] 장착 선택`;
        const grid=document.getElementById('selector-grid'); grid.innerHTML=''; 
        let sCards=[...myCards].sort((a,b)=>gradeOrder.indexOf(b.grade)-gradeOrder.indexOf(a.grade));
        if(sCards.length===0){ grid.innerHTML='<div style="color:#aaa;">카드가 없습니다.</div>'; } 
        else{
            sCards.forEach(card => {
                const el=document.createElement('div'); el.innerHTML=createCardHTML(card);
                let cid = String(card.instanceId);
                let isEq=fusionCards.some(c=>c&&String(c.instanceId)===cid)||aiAttackDeck.some(c=>c&&String(c.instanceId)===cid)||pvpAttackDeck.some(c=>c&&String(c.instanceId)===cid)||exploreCards.some(c=>c&&String(c.instanceId)===cid)||defenseDeck.some(c=>c&&String(c.instanceId)===cid)||plunderAttackDeck.some(c=>c&&String(c.instanceId)===cid)||hcAttackDeck.some(c=>c&&String(c.instanceId)===cid)||tnAttackDeck.some(c=>c&&String(c.instanceId)===cid);
                let isInv=false, rsn="";
                if(isEq){ isInv=true; rsn="장착중"; } else if(mode==='fusion'&&(card.isLocked||card.grade==='SSX')){ isInv=true; rsn=card.isLocked?"보호됨":"합성불가"; }
                if(isInv){ 
                    el.style.opacity='0.3'; 
                    el.innerHTML+=`<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);padding:5px;border-radius:5px;color:#ff3366;font-weight:bold;z-index:10;">${rsn}</div>`; 
                    el.onclick=()=>alert("장착불가"); 
                } 
                else el.onclick=()=>finalizeSelection(cid); grid.appendChild(el);
            });
        }
        document.getElementById('card-select-modal').style.display='flex';
    };

    window.finalizeSelection = (id) => {
        const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
        const {mode, slotIdx}=selectionTarget; const tIdx=slotIdx-1; let sPfx='';
        if(mode==='fusion'){ fusionCards[tIdx]=c; sPfx='fusion'; } else if(mode==='ai'){ aiAttackDeck[tIdx]=c; sPfx='ai-atk'; } else if(mode==='pvp'){ pvpAttackDeck[tIdx]=c; sPfx='atk'; } else if(mode==='explore'){ exploreCards[tIdx]=c; sPfx='explore'; } else if(mode==='defense'){ defenseDeck[tIdx]=c; sPfx='def-setup'; } else if(mode==='plunder'){ plunderAttackDeck[tIdx]=c; sPfx='plunder-atk'; } else if(mode==='hardcore'){ hcAttackDeck[tIdx]=c; sPfx='hc'; } else if(mode==='tourn'){ tnAttackDeck[tIdx]=c; sPfx='tn'; }
        setSlotHTML(document.getElementById(`${sPfx}-slot${slotIdx}`), c); saveUserData(); window.closeModal('card-select-modal');
    };

    window.showZoomModal = (c) => {
        document.getElementById('zoom-container').innerHTML=createCardHTML(c,true);
        const stats=getBattleStats(c); const prc=grades[c.grade].sellPrice; let exBtns='';
        if(expTickets>0) exBtns+=`<button onclick="window.useSpecialItem('${c.instanceId}', 'exp')" style="background:#2196F3;flex:1;font-size:0.85rem;">🌟렙업 (${expTickets})</button>`;
        if(upgItems>0 && c.grade!=='SSX') exBtns+=`<button onclick="window.useSpecialItem('${c.instanceId}', 'upg')" style="background:#8338ec;flex:1;font-size:0.85rem;">⏫진화 (${upgItems})</button>`;
        let lTxt=c.isLocked?"🔓보호해제":"🔒보호설정"; let lCol=c.isLocked?"#555":"#4CAF50";
        let enR = Math.floor(Math.max(0.1, 0.8 - ((c.enhance||0) * 0.05)) * 100);

        document.getElementById('zoom-actions').innerHTML=`
            <div style="margin-bottom:5px;font-weight:bold;color:${stats.skill.isSpecial?'#ffea00':'#00f2ff'};font-size:0.85rem;border:1px solid #444;padding:5px;border-radius:5px;background:#000;">${stats.skill.name} : ${stats.skill.desc}</div>
            <div style="margin-bottom:10px;font-weight:bold;color:#ffea00;font-size:0.9rem;">EXP: ${c.exp||0} / ${(c.level||1)*100}</div>
            <div style="display:flex;justify-content:center;gap:5px;margin-bottom:8px;"><button onclick="window.enhanceCard('${c.instanceId}')" style="background:#ff9800;flex:1;font-size:0.85rem;">🔨강화(${enR}%)</button><button onclick="window.useAttackPotion('${c.instanceId}')" style="background:#ff3366;flex:1;font-size:0.85rem;">💊투여(${atkPotions})</button></div>
            ${exBtns?`<div style="display:flex;justify-content:center;gap:5px;margin-bottom:8px;">${exBtns}</div>`:''}
            <div style="display:flex;justify-content:center;gap:5px;"><button onclick="window.toggleLock('${c.instanceId}')" style="background:${lCol};flex:1;font-size:0.85rem;">${lTxt}</button><button onclick="window.sellCard('${c.instanceId}', ${prc})" style="background:#333;flex:1;font-size:0.85rem;">💰판매(+${prc})</button></div>
        `;
        document.getElementById('zoom-modal').style.display='flex';
    };

    window.toggleLock=(id)=>{ const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; c.isLocked=!c.isLocked; updateUI(); renderMyCards(); window.showZoomModal(c); saveUserData(); };
    
    window.enhanceCard=(id)=>{ 
        if(money<100) return alert("골드 부족!"); const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; money-=100; 
        let r=Math.max(0.1, 0.8 - ((c.enhance||0) * 0.05));
        if(Math.random()<r){ c.enhance++; alert(`✨ 강화 성공!`); } else alert(`💥 실패. (${Math.floor(r*100)}%)`); 
        updateUI(); renderMyCards(); window.showZoomModal(c); saveUserData(); 
    };
    
    window.useAttackPotion=(id)=>{ 
        if(atkPotions<=0) return alert("약 부족!"); const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; atkPotions--; c.atkBuff=(c.atkBuff||0)+1; alert(`💉 공격력 상승!`); updateUI(); renderMyCards(); window.showZoomModal(c); saveUserData(); 
    };
    
    window.useSpecialItem=(id,t)=>{ 
        const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
        if(t==='exp'){ expTickets--; c.level++; c.exp=0; alert("🌟 렙업!"); } 
        else if(t==='upg'){ if(c.grade==='SSX') return alert("최고 등급입니다."); upgItems--; c.grade=gradeOrder[gradeOrder.indexOf(c.grade)+1]; alert(`⏫ 진화!`); } 
        updateUI(); renderMyCards(); window.showZoomModal(c); saveUserData(); 
    };
    
    window.sellCard=(id,p)=>{
        const c=myCards.find(x=>String(x.instanceId)===String(id)); if(!c) return; 
        if(c.isLocked) return alert("보호됨."); if(!confirm(`판매하시겠습니까?`)) return;
        myCards=myCards.filter(x=>String(x.instanceId)!==String(id));
        [fusionCards,aiAttackDeck,pvpAttackDeck,exploreCards,defenseDeck,plunderAttackDeck,hcAttackDeck,tnAttackDeck].forEach((d,di)=>{ for(let i=0;i<d.length;i++){ if(d[i]&&String(d[i].instanceId)===String(id)){ d[i]=null; let pf=di===0?'fusion':(di===1?'ai-atk':(di===2?'atk':(di===3?'explore':(di===4?'def-setup':(di===5?'plunder-atk':(di===6?'hc':'tn')))))); setSlotHTML(document.getElementById(`${pf}-slot${i+1}`),null,'선택'); } } });
        money+=p; updateUI(); renderMyCards(); window.closeModal('zoom-modal'); saveUserData();
    };

    window.executeFusion=(useScr)=>{
        const c1=fusionCards[0], c2=fusionCards[1]; if(!c1||!c2) return alert("재료 2장 필요"); if(c1.templateId!==c2.templateId||c1.grade!==c2.grade) return alert("조건 안맞음");
        if(c1.grade==='SSX') return alert("최고 등급입니다.");
        let bRate=0.60; if(c1.grade==='S') bRate=0.10; else if(c1.grade==='SS') bRate=0.03; else if(c1.grade==='SSS') bRate=0.01; else if(c1.grade==='SSR') bRate=0.005;
        let fRate=useScr?bRate+0.25:bRate;
        if(useScr){ if(fusionScrolls<=0) return alert("부적 없음"); if(!confirm(`부적사용? (${Math.floor(fRate*100)}%)`)) return; fusionScrolls--; } else if(!confirm(`합성진행? (${Math.floor(fRate*100)}%)`)) return;
        const suc=Math.random()<fRate; 
        myCards=myCards.filter(c=>String(c.instanceId)!==String(c1.instanceId) && String(c.instanceId)!==String(c2.instanceId)); fusionCards=[null,null];
        setSlotHTML(document.getElementById('fusion-slot1'),null,'재료1'); setSlotHTML(document.getElementById('fusion-slot2'),null,'재료2');
        if(suc){
            const nG=gradeOrder[gradeOrder.indexOf(c1.grade)+1];
            let st=getRandomStats(nG); if(c1.templateId<=10){ st.hp=Math.floor(st.hp*1.15); st.atk=Math.floor(st.atk*1.15); st.def=Math.floor(st.def*1.15); }
            let rSk=c1.templateId<=10?specialSkills[c1.templateId]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
            myCards.push({instanceId:String(Date.now()+Math.random()),templateId:c1.templateId,grade:nG,baseHp:st.hp,baseAtk:st.atk,baseDef:st.def,skillInfo:rSk,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false});
            alert(`✨ ${nG}등급 탄생!`); if(nG==='SSS'||nG==='SSR'||nG==='SSX') sendSystemMessage(`✨ [${myDisplayName}]님 [${nG}] ${getCardBaseInfo(c1.templateId).name} 획득!`);
        }else alert("💥 실패 파괴됨.");
        updateUI(); renderMyCards(); saveUserData();
    };

    window.batchFusion=()=>{
        if(!confirm("잠금 해제된 중복 자동 합성 (+20% 확률업)")) return;
        let df=true, fCt=0, sCt=0, higBorn=[];
        while(df){
            df=false; let grps={}; for(let c of myCards){ if(c.grade==='SSX'||c.isLocked) continue; const k=c.templateId+'_'+c.grade; if(!grps[k])grps[k]=[]; grps[k].push(c); }
            let rm=new Set(), nc=[];
            for(const k in grps){
                const g=grps[k];
                while(g.length>=2){
                    const c1=g.pop(), c2=g.pop(); rm.add(String(c1.instanceId)); rm.add(String(c2.instanceId)); df=true; fCt++;
                    let bRate=0.60; if(c1.grade==='S') bRate=0.10; else if(c1.grade==='SS') bRate=0.03; else if(c1.grade==='SSS') bRate=0.01; else if(c1.grade==='SSR') bRate=0.005;
                    let fRate=bRate+0.20;
                    if(Math.random()<fRate){
                        sCt++; const nG=gradeOrder[gradeOrder.indexOf(c1.grade)+1];
                        let st=getRandomStats(nG); if(c1.templateId<=10){ st.hp=Math.floor(st.hp*1.15); st.atk=Math.floor(st.atk*1.15); st.def=Math.floor(st.def*1.15); }
                        let rSk=c1.templateId<=10?specialSkills[c1.templateId]:normalSkills[Math.floor(Math.random()*normalSkills.length)];
                        nc.push({instanceId:String(Date.now()+Math.random()),templateId:c1.templateId,grade:nG,baseHp:st.hp,baseAtk:st.atk,baseDef:st.def,skillInfo:rSk,level:1,exp:0,enhance:0,atkBuff:0,isLocked:false});
                        if(nG==='SSS'||nG==='SSR'||nG==='SSX') higBorn.push(nG);
                    }
                }
            }
            if(df) myCards=myCards.filter(c=>!rm.has(String(c.instanceId))).concat(nc);
        }
        alert(`⚡ 일괄완료! 시도:${fCt} 성공:${sCt}`); if(higBorn.length>0) sendSystemMessage(`✨ [${myDisplayName}]님 연쇄합성으로 [${higBorn[0]}] 등급 탄생!`);
        updateUI(); renderMyCards(); saveUserData();
    };

    const delay = ms => new Promise(res=>setTimeout(res,ms));
    
    async function printLog(targetBgId, htmlText, color="#aaa", delayMs=300) {
        try {
            const createLine=(cId)=>{ const e=document.getElementById(cId); if(e){ e.innerHTML+=`<div style="color:${color};margin-bottom:4px;">${htmlText}</div>`; e.scrollTop=e.scrollHeight; } };
            createLine('live-battle-log'); createLine(targetBgId); if(delayMs>0) await delay(delayMs);
        } catch(e) { console.log(e); }
    }

    async function runLiveSimulation(myC, enC, logBgId, roundNum) {
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

                if(enHp>0){ if(eSk.type==='true_vamp'){ let h=eDmg; enHp=Math.min(enS.hp, enHp+h); await printLog(logBgId, `🩸적 흡혈귀왕 (+${h})`, "#26ff00", 200); } else if(eTrig&&eSk.type==='heal'){ let h=Math.floor(enS.hp*0.3); enHp=Math.min(enS.hp, enHp+h); await printLog(logBgId, `💚적 치유 (+${h})`, "#26ff00", 200); } else if(eTrig&&eSk.type==='vamp'){ let h=Math.floor(eDmg*0.5); enHp=Math.min(enS.hp, enHp+h); await printLog(logBgId, `🦇적 흡혈 (+${h})`, "#26ff00", 200); } }
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

    function getAITeam(w){
        let bLv=1+Math.floor(w/2), mGr=Math.min(5,Math.floor(w/5)); 
        return [0,1].map(()=>{
            let g='C'; if(Math.random()<0.04) g='SSS'; else g=gradeOrder[Math.max(0,mGr-(Math.random()>0.7?1:0))]||'C';
            let pool=cardDatabase.filter(c=>c.grade===g&&c.templateId>10); if(!pool.length) pool=cardDatabase.filter(c=>c.grade===g);
            let pk=pool[Math.floor(Math.random()*pool.length)]; let st=getRandomStats(g);
            return {templateId:pk.templateId, grade:g, level:bLv+Math.floor(Math.random()*2), enhance:Math.floor(w/10), baseHp:st.hp, baseAtk:st.atk, baseDef:st.def, skillInfo:pk.skill};
        });
    }

    window.startAIPvP = async () => {
        if(isBattling) return; 
        if(aiAttackDeck.filter(c=>c).length<2) return alert("2명 셋팅 요망."); const cCap=document.getElementById('use-ai-cap'); if(cCap.checked&&capTickets<=0){ cCap.checked=false; return alert("포획권 없음."); }
        isBattling = true; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let tLog = document.getElementById('ai-pvp-log'); if(tLog) tLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
        const t=getAITeam(aiWins); let w=0; await printLog('ai-pvp-log', `⚔️ AI(${aiWins}승) 결투 시작!`, "#ffea00", 600);
        for(let i=0;i<2;i++){ setSlotHTML(document.getElementById(`ai-def-slot${i+1}`), t[i], '?'); let r=await runLiveSimulation(aiAttackDeck[i], t[i], 'ai-pvp-log', i+1); if(r) w++; await delay(500); }
        await printLog('ai-pvp-log', '--- 전투 종료 ---', "#fff", 0); window.pendingBattleResult={type:'ai', wins:w, aiTeam:t, useCap:cCap.checked}; document.getElementById('live-battle-close').style.display='block'; isBattling = false;
    };

    async function loadArenaData(){
        try{
            const sA=await get(child(ref(db), `arena/current`));
            if(sA.exists()){ currentDefender=sA.val(); document.getElementById('defender-name-ui').textContent=`⚔️ ${currentDefender.defenderName}`; for(let i=0;i<3;i++){ if(currentDefender.deck[i]){ document.getElementById(`def-slot${i+1}`).innerHTML=`<div style="font-size:2.5rem;display:flex;height:100%;align-items:center;justify-content:center;">${attrIcon[getCardBaseInfo(currentDefender.deck[i].templateId).element]}</div>`; document.getElementById(`def-slot${i+1}`).style.borderStyle='solid'; } } } 
            else{ document.getElementById('defender-name-ui').textContent=`⚔️ [AI] 무명`; currentDefender={defenderUid:'AI',defenderName:'무명',deck:[{templateId:11,grade:'S',level:12},{templateId:12,grade:'SS',level:12},{templateId:13,grade:'SSS',level:12}]}; }
            
            const sU=await get(child(ref(db), 'users')); const c=document.getElementById('user-list-container'); c.innerHTML='';
            if(sU.exists()){
                const us=sU.val(); let ct=0;
                Object.keys(us).forEach(id=>{
                    if(id===currentUser.uid) return; const u=us[id];
                    let defCards = u.defDeck ? (Array.isArray(u.defDeck) ? u.defDeck : Object.values(u.defDeck)) : [];
                    const dc=defCards.filter(x=>x!=null).length; 
                    c.innerHTML+=`<div style="display:flex;justify-content:space-between;align-items:center;background:#222;padding:10px;border-radius:5px;margin-bottom:5px;border:1px solid #333;"><div style="text-align:left;"><div style="font-weight:bold;color:#fff;">${u.name}</div><div style="font-size:0.7rem;color:#aaa;">방어:${dc}/3 장 | 소지:${u.money||0}G</div></div><button onclick="window.openAttackSetup('${id}', '${u.name}')" style="padding:5px 10px;font-size:0.8rem;background:#ff006e;" ${dc<1?'disabled':''}>약탈</button></div>`; ct++; 
                });
                if(ct===0) c.innerHTML='<div style="color:#aaa;">약탈 대상이 없습니다.</div>';
            }
        }catch(e){}
    }

    window.startArenaPvP = async () => {
        if(isBattling) return;
        if(pvpAttackDeck.filter(c=>c).length<3) return alert("3명 셋팅 요망."); if(currentDefender&&currentDefender.defenderUid===currentUser.uid) return alert("본인 공격 불가.");
        const cw=document.getElementById('use-win-ticket-arena'), cc=document.getElementById('use-user-capture-arena'); if(cw.checked&&winTickets<=0){ cw.checked=false; return alert("승리권 없음."); } if(cc.checked&&userCapTickets<=0){ cc.checked=false; return alert("포획권 없음."); }
        
        isBattling = true; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let pLog = document.getElementById('pvp-log'); if(pLog) pLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
        await printLog('pvp-log', '⚔️ 아레나 매칭 완료! 전투 시작!', "#ffea00", 600); let w=0;
        for(let i=0;i<3;i++){ let enC=currentDefender.deck[i]; setSlotHTML(document.getElementById(`def-slot${i+1}`), enC, '?'); if(!enC){ w++; await printLog('pvp-log', `[R${i+1}] 방어없음! 자동 승리!`, "#26ff00", 500); continue; } if(cw.checked){ w++; await printLog('pvp-log', `[R${i+1}] 🏆 자동 승리!`, "#26ff00", 800); continue; } let r=await runLiveSimulation(pvpAttackDeck[i], enC, 'pvp-log', i+1); if(r) w++; await delay(500); }
        await printLog('pvp-log', '--- 전투 종료 ---', "#fff", 0); window.pendingBattleResult={type:'arena', wins:w, useWin:cw.checked, useCap:cc.checked}; document.getElementById('live-battle-close').style.display='block'; isBattling = false;
    };

    window.openAttackSetup = async (id, nm) => {
        pvpTargetUser={uid:id, name:nm}; document.getElementById('attack-target-name').textContent=`[${nm}] 약탈`;
        try{
            const sn=await get(child(ref(db), `users/${id}/defDeck`)); let rawDef = sn.val(); let dD = rawDef ? (Array.isArray(rawDef) ? rawDef : Object.values(rawDef)) : [null,null,null]; pvpTargetUser.defDeck=dD;
            for(let i=0;i<3;i++){ if(dD[i]){ document.getElementById(`enemy-def-slot${i+1}`).innerHTML=`<div style="font-size:2.5rem;display:flex;height:100%;align-items:center;justify-content:center;">${attrIcon[getCardBaseInfo(dD[i].templateId).element]}</div>`; document.getElementById(`enemy-def-slot${i+1}`).style.borderStyle='solid'; } else{ document.getElementById(`enemy-def-slot${i+1}`).innerHTML='?'; document.getElementById(`enemy-def-slot${i+1}`).style.borderStyle='dashed'; } }
            document.getElementById('attack-setup-modal').style.display='flex';
        }catch(e){ alert("상대 정보 로드 실패."); }
    };

    window.startPlunderPvP = async () => {
        if(isBattling) return;
        if(plunderAttackDeck.filter(c=>c).length<3) return alert("약탈할 공격 덱 3명을 모두 세팅하세요.");
        const cw=document.getElementById('use-win-ticket-plunder'), cc=document.getElementById('use-user-capture-plunder'); if(cw.checked&&winTickets<=0){ cw.checked=false; return alert("승리권 없음."); } if(cc.checked&&userCapTickets<=0){ cc.checked=false; return alert("포획권 없음."); }
        
        isBattling = true; document.getElementById('attack-setup-modal').style.display='none'; document.getElementById('live-battle-modal').style.display='flex'; document.getElementById('live-battle-log').innerHTML=''; let pLog = document.getElementById('pvp-log'); if(pLog) pLog.innerHTML=''; document.getElementById('live-battle-close').style.display='none';
        await printLog('pvp-log', `⚔️ [${pvpTargetUser.name}] 약탈 시작!`, "#ffea00", 600); let w=0;
        for(let i=0;i<3;i++){ let enC=pvpTargetUser.defDeck[i]; if(!enC){ w++; await printLog('pvp-log', `[R${i+1}] 방어없음 승리!`, "#26ff00", 500); continue; } if(cw.checked){ w++; await printLog('pvp-log', `[R${i+1}] 🏆 자동 승리!`, "#26ff00", 800); continue; } let r=await runLiveSimulation(plunderAttackDeck[i], enC, 'pvp-log', i+1); if(r) w++; await delay(500); }
        await printLog('pvp-log', '--- 전투 종료 ---', "#fff", 0); window.pendingBattleResult={type:'plunder', wins:w, useWin:cw.checked, useCap:cc.checked, target:pvpTargetUser}; document.getElementById('live-battle-close').style.display='block'; isBattling = false;
    };

    window.startHardcoreExplore = () => {
        if(hcAttackDeck.filter(c=>c).length<3) return alert("3명 세팅 요망.");
        let btn = document.getElementById('hc-btn'); btn.disabled=true; btn.textContent="탐험 중...";
        
        setTimeout(()=>{
            btn.disabled=false; btn.textContent="목숨 걸고 파견! (고수익/고위험)";
            if(Math.random()<0.30){
                let killIdx = Math.floor(Math.random()*3); let deadCard = hcAttackDeck[killIdx];
                myCards = myCards.filter(c=>String(c.instanceId)!==String(deadCard.instanceId));
                alert(`💀 끔찍한 사고 발생! [${getCardBaseInfo(deadCard.templateId).name}] 대원이 실종되었습니다!`);
            }else{
                let rGold = 5000+Math.floor(Math.random()*5000);
                money+=rGold; tournTickets++; winTickets++; capTickets++; skips++;
                alert(`🎉 하드코어 생존! ${rGold}G, 🎫토너입장권, 🏆승리권, 🪤포획권, ⏩스킵권 획득!`);
            }
            hcAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`hc-slot${i}`),null,'대원'+i);
            saveUserData(); updateUI(); renderMyCards();
        }, 2000);
    };

    function listenToTournament() {
        onValue(ref(db, 'tournament/current'), (snap) => { window.tournData = snap.val(); if(window.tournData) window.nextRunTime = window.tournData.nextRun; });
        onValue(ref(db, 'tournament/participants'), (snap) => { window.tournParts = snap.val() || {}; });

        setInterval(async () => {
            let now = Date.now();
            if(window.nextRunTime && now >= window.nextRunTime) { 
                window.nextRunTime += 3600000; 
                setTimeout(() => runTournament(), Math.random() * 2000); 
            }
            
            let pCount = Object.keys(window.tournParts || {}).length; 
            let currCntEl = document.getElementById('tourn-curr-cnt'); if(currCntEl) currCntEl.textContent = pCount;
            let logEl = document.getElementById('tn-log'); let btn = document.getElementById('tn-btn');
            
            let qList = document.getElementById('tourn-queue-list');
            if(qList) {
                let partsArray = Object.values(window.tournParts || {}).sort((a,b) => (a.joinedAt||0) - (b.joinedAt||0));
                let qHtml = "";
                partsArray.forEach((p, idx) => { qHtml += `<div style="font-weight:bold;">${idx+1}. <span style="color:#00f2ff;">${p.name}</span> 대기 중</div>`; });
                for(let i=partsArray.length; i<16; i++) { qHtml += `<div style="color:#555">${i+1}. [빈 자리 - 정각에 AI 난입]</div>`; }
                qList.innerHTML = qHtml;
            }

            if(window.tournData && window.tournData.startTime) {
                let elapsed = now - window.tournData.startTime;
                let mins = Math.floor(elapsed / 60000); let secs = Math.floor((elapsed % 60000) / 1000);
                
                let t = window.tournData;
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
            
            if(window.nextRunTime) { 
                let toNext = window.nextRunTime - now; 
                if(toNext > 0) { let nm = Math.floor(toNext / 60000); let ns = Math.floor((toNext % 60000) / 1000); let nI = document.getElementById('tourn-next-info'); if(nI) nI.textContent = `다음 토너먼트까지: ${nm}분 ${ns}초`; } 
            }
            if(window.tournParts && currentUser && window.tournParts[currentUser.uid]) { if(btn) { btn.textContent = "참가 대기 중..."; btn.style.background = "#555"; btn.disabled = true; } } else { if(btn) { btn.textContent = "참가 등록 (입장권 1장 소모)"; btn.style.background = "#009688"; btn.disabled = false; } }
            
            document.getElementById('skip-cnt-ui').textContent = skips;
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

    setTimeout(async () => {
        if(isAdmin && (!window.tournData || !window.tournData.nextRun)) {
            await set(ref(db, 'tournament/current'), { nextRun: Date.now() + 1200000, startTime: 0, logs: {}, matches: {}, winnerName: "", rewardDesc: "" });
        }
    }, 3000);

    window.joinTournament = async () => {
        if(!tnAttackDeck[0]) return alert("엔트리 카드를 선택하세요.");
        if(tournTickets <= 0) return alert("🎫 토너먼트 입장권이 부족합니다! (탐험, 하드코어 모드에서 획득 가능)");
        const pRef = ref(db, 'tournament/participants'); const snap = await get(pRef); let parts = snap.val() || {};
        if(parts[currentUser.uid]) return alert("이미 참가 대기 중입니다.");
        if(Object.keys(parts).length >= 16) return alert("이번 회차 마감 (16명). 다음 정각을 노려주세요.");
        
        tournTickets--; updateUI(); saveUserData();
        parts[currentUser.uid] = { name: myDisplayName, card: tnAttackDeck[0], joinedAt: Date.now() };
        await set(pRef, parts); alert("✅ 참가 등록 완료! 대기열에 진입했습니다.");
    };

    window.skipTournament = async () => {
        if(skips <= 0) return alert("스킵권이 부족합니다! (상점 구매 또는 하드코어 탐험에서 획득)");
        if(!window.tournData || !window.tournData.startTime) return alert("진행 중인 토너먼트가 없습니다.");
        if(!confirm("스킵권 1장을 사용하여 즉시 4분을 단축하시겠습니까? (전 서버 공통 적용)")) return;
        try {
            const tRef = ref(db, 'tournament/current'); const snap = await get(tRef);
            if(snap.exists()) { let t = snap.val(); t.startTime -= 240000; await set(tRef, t); skips--; updateUI(); saveUserData(); alert("⏩ 4분 스킵 완료! 쾌속 진행됩니다."); }
        } catch(e) { alert("스킵 오류!"); }
    };

    window.closeLiveBattle = async () => {
        document.getElementById('live-battle-modal').style.display='none'; const rs=window.pendingBattleResult; if(!rs) return;

        if(rs.type==='ai'){
            if(rs.wins>=1){ 
                aiWins++; aiWinStreak++; aiAttackDeck.forEach(c=>{c.exp=(c.exp||0)+30; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); money+=200;
                let cM=""; if(rs.useCap){ capTickets--; const t=rs.aiTeam[Math.floor(Math.random()*2)]; grantCardByTemplate(t.templateId, t.grade); cM=`\n🪤 AI 영웅 포획 성공!`; }
                alert(`🎉 AI 대전 승리! (200G 획득)${cM}`);
            }else{
                aiWinStreak=0; if(rs.useCap) capTickets--;
                if(potions>0){ potions--; alert("💀 패배... 방어 물약 소모. (연승 초기화)"); } else{ myCards=myCards.filter(c=>String(c.instanceId)!==String(aiAttackDeck[Math.floor(Math.random()*2)].instanceId)); alert("💀 패배... 영웅 파괴! (연승 초기화)"); }
            }
            aiAttackDeck=[null,null]; setSlotHTML(document.getElementById(`ai-atk-slot1`),null,'선택'); setSlotHTML(document.getElementById(`ai-atk-slot2`),null,'선택'); document.getElementById('use-ai-cap').checked=false;
        } 
        else if(rs.type==='arena'){
            if(rs.useWin) winTickets--;
            if(rs.wins>=2){
                pvpAttackDeck.forEach(c=>{c.exp=(c.exp||0)+50; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); money+=500; let cM="";
                if(rs.useCap){
                    userCapTickets--;
                    if(currentDefender.defenderUid!=='AI'){
                        try{ const ls=await get(child(ref(db), `users/${currentDefender.defenderUid}`)); if(ls.exists()){ let d=ls.val(); let sc=d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)).filter(c=>c&&!c.isLocked):[]; if(sc.length>0){ const st=sc[Math.floor(Math.random()*sc.length)]; d.deck=(d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)):[]).filter(c=>c&&String(c.instanceId)!==String(st.instanceId)); d.robbed=true; d.lostCardName=getCardBaseInfo(st.templateId).name; await set(ref(db, `users/${currentDefender.defenderUid}`), d); st.instanceId=String(Date.now()+Math.random()); st.atkBuff=0; st.enhance=0; myCards.push(st); cM=`\n👿 [${d.lostCardName}] 탈취 성공!`; } else cM=`\n👿 상대 방어됨.`; } }catch(e){}
                    }else{ grantCardByTemplate(currentDefender.deck[Math.floor(Math.random()*3)].templateId, currentDefender.deck[0].grade); cM=`\n👿 포획!`; }
                }
                await set(ref(db, 'arena/current'), {defenderUid:currentUser.uid, defenderName:myDisplayName, deck:pvpAttackDeck});
                if(currentDefender.defenderUid!=='AI'){ try{ const ls=await get(child(ref(db), `users/${currentDefender.defenderUid}`)); if(ls.exists()){ let d=ls.val(); let sM=Math.min(Math.max(0,d.money||0),300); d.money=Math.max(0,(d.money||0)-sM); d.robbed=true; d.stolenMoney=(d.stolenMoney||0)+sM; await set(ref(db, `users/${currentDefender.defenderUid}`), d); money+=sM; } }catch(e){} }
                alert(`🎉 챔피언 등극! (500G)${cM}`); sendSystemMessage(`🏆 [${myDisplayName}]님이 아레나 챔피언에 등극했습니다!`);
            }else{ alert("💀 챔피언 도전 패배."); if(rs.useCap) userCapTickets--; }
            pvpAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`atk-slot${i}`),null,'선택'); document.getElementById('use-win-ticket-arena').checked=false; document.getElementById('use-user-capture-arena').checked=false; loadArenaData();
        }
        else if(rs.type==='plunder'){
            if(rs.useWin) winTickets--;
            if(rs.wins>=2){
                plunderAttackDeck.forEach(c=>{c.exp=(c.exp||0)+50; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); let cM="", sG=0, sI="";
                try{
                    const ls=await get(child(ref(db), `users/${rs.target.uid}`));
                    if(ls.exists()){
                        let d=ls.val(); sG=Math.min(1000,Math.floor((d.money||0)*(0.1+Math.random()*0.1))); d.money=Math.max(0,(d.money||0)-sG); money+=sG;
                        if(Math.random()<0.3){ const vs=['potions','atkPotions','scrolls','exp','win','upg','cap','rateUp','skips'].filter(i=>d[i]>0); if(vs.length>0){ const si=vs[Math.floor(Math.random()*vs.length)]; d[si]--; if(si==='potions')potions++; else if(si==='atkPotions')atkPotions++; else if(si==='scrolls')fusionScrolls++; else if(si==='exp')expTickets++; else if(si==='win')winTickets++; else if(si==='upg')upgItems++; else if(si==='cap')capTickets++; else if(si==='rateUp')rateUpTickets++; else if(si==='skips')skips++; sI="\n🎁 전리품 스틸 성공!"; } }
                        if(rs.useCap||Math.random()<0.05){
                            if(rs.useCap) userCapTickets--; let sc=d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)).filter(c=>c&&!c.isLocked):[];
                            if(sc.length>0){ const st=sc[Math.floor(Math.random()*sc.length)]; d.deck=(d.deck?(Array.isArray(d.deck)?d.deck:Object.values(d.deck)):[]).filter(c=>c&&String(c.instanceId)!==String(st.instanceId)); if(d.defDeck)d.defDeck=(Array.isArray(d.defDeck)?d.defDeck:Object.values(d.defDeck)).map(c=>(c&&String(c.instanceId)===String(st.instanceId))?null:c); d.lostCardName=getCardBaseInfo(st.templateId).name; st.instanceId=String(Date.now()+Math.random()); st.atkBuff=0; st.enhance=0; myCards.push(st); cM=`\n👿 상대의 [${d.lostCardName}] 영구 탈취!`; } else cM=`\n👿 방어됨. 카드 스틸 실패.`;
                        } else if(rs.useCap) userCapTickets--;
                        d.robbed=true; d.stolenMoney=(d.stolenMoney||0)+sG; d.robberName=myDisplayName; await set(ref(db, `users/${rs.target.uid}`), d);
                        alert(`🎉 약탈 성공! (+${sG}G)${sI}${cM}`); sendSystemMessage(`🔥 [${myDisplayName}]님이 [${rs.target.name}]님을 약탈했습니다!`);
                    }
                }catch(e){}
            }else{ alert("💀 약탈 실패."); if(rs.useCap) userCapTickets--; }
            plunderAttackDeck=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`plunder-atk-slot${i}`),null,'공격'+i); document.getElementById('use-win-ticket-plunder').checked=false; document.getElementById('use-user-capture-plunder').checked=false; loadArenaData();
        }
        window.pendingBattleResult=null; saveUserData(); updateUI(); renderMyCards();
    };

    window.startExplore = () => {
        if(exploreCards.filter(c=>c).length<3) return alert("3명 셋팅 요망.");
        let lS=exploreCards.reduce((s,c)=>s+(grades[c.grade].exp),0); const b=document.getElementById('explore-btn'), r=document.getElementById('explore-result'); b.disabled=true; b.textContent="탐험 중..."; r.innerHTML=`수색 중...`;
        setTimeout(()=>{
            b.disabled=false; b.textContent=`탐험 출발!`;
            if(Math.random()<Math.max(0.02,0.25-(lS*0.01))){
                const lC=exploreCards[Math.floor(Math.random()*3)]; if(potions>0){ potions--; alert(`🚨 기습! 방어 물약으로 보호했습니다.`); } else{ myCards=myCards.filter(c=>String(c.instanceId)!==String(lC.instanceId)); r.innerHTML=`<span style="color:#ff3366;">🚨 기습! 대원 파괴됨</span>`; alert("🚨 기습으로 대원을 잃었습니다..."); }
            }else{
                let gG=400+(lS*40)+Math.floor(Math.random()*100); money+=gG; let fI=[];
                for(let j=0;j<(1+Math.floor(lS/5));j++){ if(Math.random()<0.7){ let dR=Math.random(); if(lS>=12&&dR<0.05){ userCapTickets++; fI.push("👿유저포획권"); } else if(lS>=10&&dR<0.15){ rateUpTickets++; fI.push("✨확률강화권"); } else if(lS>=8&&dR<0.20){ upgItems++; fI.push("⏫등급업권"); } else if(dR<0.30){ tournTickets++; fI.push("🎫토너권"); } else if(dR<0.50){ winTickets++; fI.push("🏆승리권"); } else if(dR<0.70){ capTickets++; fI.push("🪤AI포획권"); } else if(dR<0.90){ expTickets++; fI.push("🌟경험치권"); } else{ fusionScrolls++; fI.push("✨부적"); } } }
                exploreCards.forEach(c=>{c.exp=(c.exp||0)+40; if(c.exp>=(c.level||1)*100){c.level++;c.exp=0;}}); r.innerHTML=`<span style="color:#26ff00;">🎉 성공 (+${gG}G)</span><br>${fI.length>0?`[${fI.join(', ')}] 획득!`:""}`;
            }
            exploreCards=[null,null,null]; for(let i=1;i<=3;i++) setSlotHTML(document.getElementById(`explore-slot${i}`),null,`대원${i}`); updateUI(); renderMyCards(); saveUserData();
        }, 2000); 
    };

    window.closeModal=id=>{ document.getElementById(id).style.display='none'; }; window.switchTab=n=>{ document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===n)); document.querySelectorAll('.section').forEach((s,i)=>s.classList.toggle('active',i===n)); if(n===4)loadArenaData(); };

    function updateUI(){ 
        document.getElementById('money').textContent=money.toLocaleString(); document.getElementById('potion-count').textContent=potions; document.getElementById('atk-potion-count').textContent=atkPotions; 
        if(document.getElementById('win-t-cnt-arena')) document.getElementById('win-t-cnt-arena').textContent=winTickets; if(document.getElementById('win-t-cnt-plunder')) document.getElementById('win-t-cnt-plunder').textContent=winTickets; 
        if(document.getElementById('ai-cap-cnt')) document.getElementById('ai-cap-cnt').textContent=capTickets; if(document.getElementById('user-cap-cnt-arena')) document.getElementById('user-cap-cnt-arena').textContent=userCapTickets; if(document.getElementById('user-cap-cnt-plunder')) document.getElementById('user-cap-cnt-plunder').textContent=userCapTickets; 
        if(document.getElementById('rateup-cnt')) document.getElementById('rateup-cnt').textContent=rateUpTickets; if(document.getElementById('ai-win-ui')) document.getElementById('ai-win-ui').textContent=aiWins; if(document.getElementById('ai-streak-ui')) document.getElementById('ai-streak-ui').textContent=aiWinStreak; 
        if(document.getElementById('tourn-ticket-ui')) document.getElementById('tourn-ticket-ui').textContent = tournTickets; if(document.getElementById('tourn-win-cnt')) document.getElementById('tourn-win-cnt').textContent = tourneyWins;
        if(document.getElementById('skip-cnt-ui')) document.getElementById('skip-cnt-ui').textContent = skips;
        let rU=document.getElementById('use-rate-up'); if(rU&&parseInt(rU.value)>rateUpTickets) rU.value=rateUpTickets; if(document.getElementById('rateup-pct')&&rU) document.getElementById('rateup-pct').textContent=(parseInt(rU.value)||0)*2;
    }
