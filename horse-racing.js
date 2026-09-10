(() => {
"use strict";

const SUPABASE_URL = "https://wrmiylynviujwdoecvcn.supabase.co";
const SUPABASE_KEY = "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";
const PROFILE_KEY = "gildedAceProfile";

const HORSES = [
    {id:1,name:"Midnight Crown",odds:3,color:"#a90f1e"},
    {id:2,name:"Golden Fury",odds:4,color:"#e6e6e6"},
    {id:3,name:"Royal Flush",odds:6,color:"#20589c"},
    {id:4,name:"High Society",odds:8,color:"#d6c617"},
    {id:5,name:"Ace of Spades",odds:12,color:"#167c2e"},
    {id:6,name:"Long Shot",odds:20,color:"#61289a"}
];

const BET_STEPS = [100,250,500,1000,2500,5000,10000,25000,50000];

let selectedHorse = HORSES[0];
let bet = 100;
let balance = 10000;
let racing = false;
let raceNo = 1;

let client = null;
let user = null;
let cloudProfile = null;

const $ = id => document.getElementById(id);
const money = n => Math.max(0,Math.floor(Number(n)||0)).toLocaleString("en-US");

function getLocalProfile(){
    try{
        const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
        return {
            ...p,
            balance:Number.isFinite(Number(p.balance)) ? Number(p.balance) : 10000,
            wins:Number(p.wins)||0,
            losses:Number(p.losses)||0,
            gamesPlayed:Number(p.gamesPlayed)||0
        };
    }catch{
        return {username:"Gilded Player",balance:10000,wins:0,losses:0,gamesPlayed:0,collection:[]};
    }
}

function saveLocalBalance(newBalance,result=null){
    const p = getLocalProfile();
    p.balance = Math.max(0,Math.floor(newBalance));

    if(result === "win"){
        p.wins = (Number(p.wins)||0)+1;
        p.gamesPlayed = (Number(p.gamesPlayed)||0)+1;
    }else if(result === "loss"){
        p.losses = (Number(p.losses)||0)+1;
        p.gamesPlayed = (Number(p.gamesPlayed)||0)+1;
    }

    localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
}

async function initAccount(){
    balance = getLocalProfile().balance;
    renderBalance();

    if(!window.supabase?.createClient) return;

    try{
        client = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
        const {data:a} = await client.auth.getUser();
        user = a?.user || null;
        if(!user) return;

        const {data,error} = await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
        if(error) throw error;

        if(data){
            cloudProfile = data;
            balance = Number(data.balance)||0;
            const p = getLocalProfile();
            p.balance = balance;
            if(data.username) p.username = data.username;
            localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
            renderBalance();
        }
    }catch(e){
        console.warn("Horse racing account sync:",e);
    }
}

async function setBalance(newBalance,result=null){
    balance = Math.max(0,Math.floor(newBalance));
    saveLocalBalance(balance,result);
    renderBalance();

    if(!client || !user) return;

    try{
        if(!cloudProfile){
            const {data} = await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
            cloudProfile = data || {};
        }

        const patch = {balance};

        if(result === "win"){
            patch.wins = (Number(cloudProfile?.wins)||0)+1;
            patch.games_played = (Number(cloudProfile?.games_played)||0)+1;
        }else if(result === "loss"){
            patch.losses = (Number(cloudProfile?.losses)||0)+1;
            patch.games_played = (Number(cloudProfile?.games_played)||0)+1;
        }

        const {error} = await client.from("profiles").update(patch).eq("id",user.id);
        if(error) throw error;

        cloudProfile = {...(cloudProfile||{}),...patch};
    }catch(e){
        console.error("Horse racing cloud save failed:",e);
        setMessage("Race completed, but cloud balance sync failed.","error");
    }
}

function renderBalance(){
    $("horseHeaderBalance").textContent = `${money(balance)} AC`;
}

function renderBet(){
    $("horseBetDisplay").textContent = money(bet);
}

function svgMarkup(){
    return $("horseSvgTemplate").innerHTML;
}

function renderHorseChoices(){
    const grid = $("horseSelectionGrid");
    grid.innerHTML = "";

    HORSES.forEach(h=>{
        const b = document.createElement("button");
        b.type = "button";
        b.className = "horse-choice";
        b.dataset.horseId = h.id;
        b.style.setProperty("--lane-color",h.color);
        b.innerHTML = `
            <span class="horse-number">${h.id}</span>
            <span class="horse-name">${h.name}</span>
            <span class="horse-odds">${h.odds}:1</span>
            <span class="horse-radio"></span>
        `;
        b.addEventListener("click",()=>selectHorse(h.id));
        grid.appendChild(b);
    });
    selectHorse(selectedHorse.id);
}

function selectHorse(id){
    if(racing) return;
    selectedHorse = HORSES.find(h=>h.id===id) || HORSES[0];

    document.querySelectorAll(".horse-choice").forEach(b=>{
        b.classList.toggle("selected",Number(b.dataset.horseId)===id);
    });

    $("selectedHorseNumber").textContent = selectedHorse.id;
    $("selectedHorseNumber").style.background = selectedHorse.color;
    $("selectedHorseDisplay").textContent = selectedHorse.name;
    $("selectedOddsDisplay").textContent = `${selectedHorse.odds}:1`;
    setMessage(`${selectedHorse.name} selected at ${selectedHorse.odds}:1.`);
}

function setMessage(text,type=""){
    const el = $("horseBetMessage");
    el.textContent = text;
    el.className = `bet-message${type ? " "+type : ""}`;
}

function changeBet(dir){
    if(racing) return;
    let i = BET_STEPS.findIndex(v=>v>=bet);
    if(i<0) i = BET_STEPS.length-1;
    i = Math.max(0,Math.min(BET_STEPS.length-1,i+dir));
    bet = BET_STEPS[i];
    renderBet();
}

function chooseWinner(){
    const weights = HORSES.map(h=>1/(h.odds+1));
    const total = weights.reduce((a,b)=>a+b,0);
    let x = Math.random()*total;

    for(let i=0;i<HORSES.length;i++){
        x -= weights[i];
        if(x<=0) return HORSES[i];
    }
    return HORSES[0];
}

function buildTrack(){
    const track = $("raceTrack");
    track.innerHTML = "";

    HORSES.forEach(h=>{
        const lane = document.createElement("div");
        lane.className = "race-lane";
        lane.style.setProperty("--lane-color",h.color);

        const jockeyColor = h.color === "#e6e6e6" ? "#111111" : h.color;

        const horseCoats = {
            1:"#4a2b18",
            2:"#765136",
            3:"#1f1b19",
            4:"#8a5a2d",
            5:"#51301d",
            6:"#33251c"
        };

        const coat = horseCoats[h.id] || "#402719";

        lane.innerHTML = `
            <span class="lane-number">${h.id}</span>
            <div
                class="race-horse"
                id="raceHorse${h.id}"
                style="--jockey-color:${jockeyColor};--horse-coat:${coat};"
            >
                ${svgMarkup()}
            </div>
        `;
        track.appendChild(lane);
    });
}

function trackDistance(){
    const stage = document.querySelector(".track-stage");
    const width = stage?.clientWidth || 1200;
    return Math.max(220,width - 260);
}

function commentary(progress,leader,second){
    const m = Math.max(...Object.values(progress));
    if(m<8) return "And they're off! The field breaks cleanly from the gate!";
    if(m<24) return `${leader.name} grabs the early advantage.`;
    if(m<43) return `${leader.name} leads, with ${second.name} stalking the pace.`;
    if(m<62) return `Around the far turn — ${leader.name} still has the lead!`;
    if(m<80) return `They straighten for home! ${second.name} is trying to close!`;
    return `${leader.name} is driving hard for the finish!`;
}

function runAnimation(winner){
    return new Promise(resolve=>{
        const progress = {};
        const baseSpeed = {};
        const form = {};

        HORSES.forEach(h=>{
            progress[h.id]=0;
            baseSpeed[h.id]=0.019 + Math.random()*0.004;
            form[h.id]=0.94 + Math.random()*0.10;
            $("raceHorse"+h.id)?.classList.add("running");
        });

        let last = performance.now();
        let lastComment = 0;

        function frame(now){
            const dt = Math.min(34,now-last);
            last = now;

            const leaderProgress = Math.max(...Object.values(progress));

            HORSES.forEach(h=>{
                let pace = baseSpeed[h.id]*form[h.id]*(0.86+Math.random()*0.28);

                if(h.id===winner.id && leaderProgress>60){
                    pace *= 1.13;
                }

                if(h.id!==winner.id && progress[h.id]>92){
                    pace *= .16;
                }

                progress[h.id] += pace*dt;

                if(h.id===winner.id){
                    progress[h.id] = Math.min(progress[h.id],100);
                }else{
                    progress[h.id] = Math.min(progress[h.id],96.2);
                }

                const el = $("raceHorse"+h.id);
                if(el){
                    const x = (progress[h.id]/100)*trackDistance();
                    el.style.transform = `translate(${x}px,-50%)`;
                }
            });

            const rank = [...HORSES].sort((a,b)=>progress[b.id]-progress[a.id]);

            if(now-lastComment>1100){
                $("raceCommentary").textContent = commentary(progress,rank[0],rank[1]);
                lastComment = now;
            }

            if(progress[winner.id]>=100){
                HORSES.forEach(h=>$("raceHorse"+h.id)?.classList.remove("running"));
                $("raceCommentary").textContent = `${winner.name} hits the wire first!`;
                resolve([...HORSES].sort((a,b)=>progress[b.id]-progress[a.id]));
                return;
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    });
}

function renderResults(list){
    const r = $("raceResults");
    r.className = "race-results";
    r.innerHTML = "";

    list.forEach((h,i)=>{
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
            <span class="result-place">${i+1}</span>
            <span>${h.name}</span>
            <span class="result-odds">${h.odds}:1</span>
        `;
        r.appendChild(row);
    });
}

function showModal(title,text,won){
    $("winnerModalTitle").textContent = title;
    $("winnerModalText").textContent = text;
    $("winnerModalIcon").textContent = won ? "🏆" : "🏇";
    $("winnerModal").classList.add("open");
    $("winnerModal").setAttribute("aria-hidden","false");
}

function setDisabled(v){
    $("startRaceButton").disabled = v;
    $("horseBetDown").disabled = v;
    $("horseBetUp").disabled = v;
    document.querySelectorAll(".quick-bets button,.horse-choice").forEach(el=>el.disabled=v);
}

async function startRace(){
    if(racing) return;

    if(!selectedHorse){
        setMessage("Select a horse before placing your bet.","error");
        return;
    }

    if(bet<=0 || bet>balance){
        setMessage("You do not have enough Ace Credits for that wager.","error");
        return;
    }

    racing = true;
    setDisabled(true);

    const ticketHorse = selectedHorse;
    const ticketBet = bet;
    const winner = chooseWinner();

    await setBalance(balance-ticketBet);

    buildTrack();
    $("raceStatus").textContent = "RACE IN PROGRESS";
    $("raceCommentary").textContent = "The horses are loading into the starting gate...";
    setMessage(`Ticket locked: ${money(ticketBet)} AC on ${ticketHorse.name}.`);

    await new Promise(r=>setTimeout(r,1200));

    const placements = await runAnimation(winner);
    renderResults(placements);

    const won = winner.id===ticketHorse.id;

    if(won){
        const profit = ticketBet*ticketHorse.odds;
        const total = ticketBet+profit;

        await setBalance(balance+total,"win");
        setMessage(`WIN! ${ticketHorse.name} paid ${money(total)} AC total (${money(profit)} AC profit).`,"win");

        showModal(
            `${winner.name} WINS!`,
            `Your ${money(ticketBet)} AC ticket at ${ticketHorse.odds}:1 returned ${money(total)} AC.`,
            true
        );
    }else{
        await setBalance(balance,"loss");
        const finish = placements.findIndex(h=>h.id===ticketHorse.id)+1;

        setMessage(`${winner.name} won the race. Your ${money(ticketBet)} AC ticket on ${ticketHorse.name} did not cash.`,"loss");

        showModal(
            `${winner.name} WINS`,
            `${ticketHorse.name} finished ${finish}.`,
            false
        );
    }

    $("raceStatus").textContent = `${winner.name.toUpperCase()} — OFFICIAL`;
    raceNo++;
    $("raceNumber").textContent = String(raceNo).padStart(2,"0");

    racing = false;
    setDisabled(false);
}

function bind(){
    $("horseBetDown").addEventListener("click",()=>changeBet(-1));
    $("horseBetUp").addEventListener("click",()=>changeBet(1));

    document.querySelectorAll(".quick-bets button").forEach(b=>{
        b.addEventListener("click",()=>{
            if(racing) return;
            bet = Number(b.dataset.horseBet)||100;
            renderBet();
        });
    });

    $("startRaceButton").addEventListener("click",startRace);

    $("winnerModalClose").addEventListener("click",()=>{
        $("winnerModal").classList.remove("open");
        $("winnerModal").setAttribute("aria-hidden","true");
    });

    $("winnerModal").addEventListener("click",e=>{
        if(e.target===$("winnerModal")) $("winnerModalClose").click();
    });

    window.addEventListener("resize",()=>{
        if(!racing) buildTrack();
    });
}

document.addEventListener("DOMContentLoaded",async()=>{
    renderHorseChoices();
    buildTrack();
    renderBet();
    bind();
    await initAccount();
});
})();
