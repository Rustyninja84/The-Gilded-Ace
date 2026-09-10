(() => {
"use strict";

const SUPABASE_URL = "https://wrmiylynviujwdoecvcn.supabase.co";
const SUPABASE_KEY = "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";
const PROFILE_KEY = "gildedAceProfile";
const HISTORY_KEY = "gildedAcePlinkoHistory";

const ROWS = 10;
const SLOT_COUNT = ROWS + 1;
const MULTIPLIERS = [10,4,1.8,1.1,.8,.45,.8,1.1,1.8,4,10];
const BET_STEPS = [100,250,500,1000,2500,5000,10000,25000,50000];

let balance = 10000;
let bet = 100;
let dropping = false;
let history = [];

let client = null;
let user = null;
let cloudProfile = null;

const $ = id => document.getElementById(id);
const money = n => Math.max(0,Math.floor(Number(n)||0)).toLocaleString("en-US");

const canvas = $("plinkoCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const board = {
    top:82,
    bottom:600,
    centerX:W/2,
    rowGap:47,
    pegGap:66,
    pegRadius:6,
    ballRadius:12
};


/* =========================================================
   PLINKO PHYSICS v2
   Real gravity, peg collisions, side-wall collisions and slot landing.
========================================================= */

const PHYSICS = {
    gravity: 1180,          // pixels / second^2
    airDrag: 0.9985,
    pegRestitution: 0.57,
    wallRestitution: 0.62,
    tangentialFriction: 0.985,
    collisionJitter: 22,   // px/s random deflection after peg impact
    maxSpeed: 980,
    fixedStep: 1/120,
    maxFrameDt: 0.033
};

function allPegPositions(){
    const pegs = [];

    for(let row=0; row<ROWS; row++){
        for(let i=0; i<=row; i++){
            pegs.push(pegPosition(row,i));
        }
    }

    return pegs;
}

const PLINKO_PEGS = allPegPositions();

function nearestSlotIndex(x){
    let bestIndex = 0;
    let bestDistance = Infinity;

    for(let i=0; i<SLOT_COUNT; i++){
        const d = Math.abs(x-slotX(i));

        if(d < bestDistance){
            bestDistance = d;
            bestIndex = i;
        }
    }

    return bestIndex;
}

function resolvePegCollision(ball,peg){
    const dx = ball.x-peg.x;
    const dy = ball.y-peg.y;
    const minDistance = board.ballRadius + board.pegRadius + 1;

    let distance = Math.hypot(dx,dy);

    if(distance >= minDistance){
        return false;
    }

    if(distance < .0001){
        distance = .0001;
    }

    const nx = dx/distance;
    const ny = dy/distance;

    // Push the ball outside the peg so it cannot sink/stick.
    const penetration = minDistance-distance;
    ball.x += nx*(penetration+0.7);
    ball.y += ny*(penetration+0.7);

    const normalVelocity = ball.vx*nx + ball.vy*ny;

    // Only reflect when moving into the peg.
    if(normalVelocity < 0){
        const impulse = -(1+PHYSICS.pegRestitution)*normalVelocity;
        ball.vx += impulse*nx;
        ball.vy += impulse*ny;

        // Preserve some lateral roll while removing excessive energy.
        const tx = -ny;
        const ty = nx;
        const tangentVelocity = ball.vx*tx + ball.vy*ty;
        const normalAfter = ball.vx*nx + ball.vy*ny;

        ball.vx =
            (tangentVelocity*PHYSICS.tangentialFriction)*tx +
            normalAfter*nx;

        ball.vy =
            (tangentVelocity*PHYSICS.tangentialFriction)*ty +
            normalAfter*ny;

        // Tiny imperfection makes each physical bounce feel less mechanical.
        ball.vx += (Math.random()-.5)*PHYSICS.collisionJitter;

        return true;
    }

    return false;
}

function simulatePhysicsStep(ball,dt){
    ball.vy += PHYSICS.gravity*dt;

    const drag = Math.pow(PHYSICS.airDrag,dt*60);
    ball.vx *= drag;
    ball.vy *= drag;

    ball.x += ball.vx*dt;
    ball.y += ball.vy*dt;

    /*
     * TRIANGLE SIDE WALLS
     *
     * The playable Plinko area widens as the ball falls.
     * These boundaries follow the outside edge of the peg triangle,
     * so the ball can never bounce outside the triangle.
     */
    const triangleTopY = board.top - 34;
    const triangleBottomY = board.top + (ROWS - 1) * board.rowGap + board.rowGap * .72;

    const topHalfWidth = board.pegGap * .58;
    const bottomHalfWidth = (ROWS * board.pegGap) / 2 + board.pegGap * .95;

    const wallProgress = Math.max(
        0,
        Math.min(
            1,
            (ball.y - triangleTopY) / (triangleBottomY - triangleTopY)
        )
    );

    const halfWidth =
        topHalfWidth +
        (bottomHalfWidth - topHalfWidth) * wallProgress;

    const leftWall = board.centerX - halfWidth + board.ballRadius;
    const rightWall = board.centerX + halfWidth - board.ballRadius;

    if(ball.x < leftWall){
        ball.x = leftWall;
        ball.vx = Math.abs(ball.vx) * PHYSICS.wallRestitution + 3;
    }else if(ball.x > rightWall){
        ball.x = rightWall;
        ball.vx = -Math.abs(ball.vx) * PHYSICS.wallRestitution - 3;
    }

    // Resolve peg impacts more than once per step to reduce tunneling/sticking.
    for(let pass=0; pass<2; pass++){
        for(const peg of PLINKO_PEGS){
            resolvePegCollision(ball,peg);
        }
    }

    const speed = Math.hypot(ball.vx,ball.vy);

    if(speed > PHYSICS.maxSpeed){
        const scale = PHYSICS.maxSpeed/speed;
        ball.vx *= scale;
        ball.vy *= scale;
    }
}

function animatePhysicalBall(){
    return new Promise(resolve=>{
        /*
         * About 4% of drops become an "edge chase".
         * The ball still uses the same gravity and peg-collision physics;
         * it only receives a modest initial sideways velocity.
         * This makes the 10x edge slots realistically attainable.
         */
        const edgeChase = Math.random() < 0.04;
        const edgeDirection = Math.random() < 0.5 ? -1 : 1;

        const ball = {
            x:board.centerX + (Math.random()-.5)*4,
            y:56,
            vx:edgeChase
                ? edgeDirection * (105 + Math.random()*25)
                : (Math.random()-.5)*34,
            vy:0
        };

        const trail = [];
        const landingY = board.bottom+40;

        let last = performance.now();
        let accumulator = 0;
        let started = last;

        function frame(now){
            const rawDt = Math.min(PHYSICS.maxFrameDt,(now-last)/1000);
            last = now;
            accumulator += rawDt;

            while(accumulator >= PHYSICS.fixedStep){
                simulatePhysicsStep(ball,PHYSICS.fixedStep);

                // Gentle late-board drift only on rare edge-chase drops.
                // Peg collisions can still cancel or reverse it.
                if(edgeChase && ball.y > board.top + board.rowGap*5){
                    ball.vx += edgeDirection * 7.5 * PHYSICS.fixedStep;
                }

                accumulator -= PHYSICS.fixedStep;
            }

            trail.push({x:ball.x,y:ball.y});
            if(trail.length>14) trail.shift();

            drawBoard(ball,trail);

            const elapsed = now-started;

            if(ball.y >= landingY || elapsed > 8500){
                // Clamp final X to the payout-slot span before choosing a slot.
                const minSlotX = slotX(0);
                const maxSlotX = slotX(SLOT_COUNT - 1);
                ball.x = Math.max(minSlotX, Math.min(maxSlotX, ball.x));

                const slot = nearestSlotIndex(ball.x);

                // Snap visually to the center of the payout slot.
                ball.x = slotX(slot);
                ball.y = landingY;
                drawBoard(ball,[]);

                resolve(slot);
                return;
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    });
}


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
        return {
            username:"Gilded Player",
            balance:10000,
            wins:0,
            losses:0,
            gamesPlayed:0,
            collection:[]
        };
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

        const {data,error} = await client
            .from("profiles")
            .select("*")
            .eq("id",user.id)
            .maybeSingle();

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
    }catch(err){
        console.warn("Plinko account sync:",err);
    }
}

async function setBalance(newBalance,result=null){
    balance = Math.max(0,Math.floor(newBalance));
    saveLocalBalance(balance,result);
    renderBalance();

    if(!client || !user) return;

    try{
        if(!cloudProfile){
            const {data} = await client
                .from("profiles")
                .select("*")
                .eq("id",user.id)
                .maybeSingle();

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

        const {error} = await client
            .from("profiles")
            .update(patch)
            .eq("id",user.id);

        if(error) throw error;

        cloudProfile = {...(cloudProfile||{}),...patch};
    }catch(err){
        console.error("Plinko cloud save failed:",err);
        setMessage("Drop completed, but cloud balance sync failed.","error");
    }
}

function renderBalance(){
    const text = `${money(balance)} AC`;
    $("plinkoHeaderBalance").textContent = text;
    $("plinkoBalance").textContent = text;
}

function renderBet(){
    $("plinkoBetDisplay").textContent = `${money(bet)} AC`;
}

function setMessage(text,type=""){
    const el = $("plinkoMessage");
    el.textContent = text;
    el.className = `plinko-message${type ? " "+type : ""}`;
}

function changeBet(dir){
    if(dropping) return;

    let i = BET_STEPS.findIndex(v => v >= bet);
    if(i < 0) i = BET_STEPS.length - 1;

    i = Math.max(0,Math.min(BET_STEPS.length-1,i+dir));
    bet = BET_STEPS[i];
    renderBet();
}

function loadHistory(){
    try{
        const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        history = Array.isArray(raw) ? raw.slice(0,12) : [];
    }catch{
        history = [];
    }
    renderHistory();
}

function saveHistory(){
    localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,12)));
}

function renderHistory(){
    const wrap = $("plinkoHistory");
    wrap.innerHTML = "";

    if(!history.length){
        wrap.innerHTML = '<span class="plinko-empty-history">No drops yet.</span>';
        return;
    }

    history.forEach(item=>{
        const chip = document.createElement("div");
        chip.className = "plinko-history-chip";
        chip.innerHTML = `
            <strong>${item.multiplier}×</strong>
            <span>${money(item.payout)} AC</span>
        `;
        wrap.appendChild(chip);
    });
}

function renderMultiplierStrip(hitIndex=-1){
    const strip = $("plinkoMultiplierStrip");
    strip.innerHTML = "";

    MULTIPLIERS.forEach((m,i)=>{
        const d = document.createElement("div");
        d.className = "plinko-multiplier";

        if(i===0 || i===MULTIPLIERS.length-1){
            d.classList.add("edge");
        }else if(m>=1.8){
            d.classList.add("hot");
        }

        if(i===hitIndex){
            d.classList.add("hit");
        }

        d.textContent = `${m}×`;
        strip.appendChild(d);
    });
}

function pegPosition(row,index){
    const count = row + 1;
    const y = board.top + row * board.rowGap;
    const rowWidth = (count - 1) * board.pegGap;
    const startX = board.centerX - rowWidth/2;
    return {
        x:startX + index*board.pegGap,
        y
    };
}

function slotX(index){
    const slotGap = board.pegGap;
    const rowWidth = ROWS * slotGap;
    const startX = board.centerX - rowWidth/2;
    return startX + index*slotGap;
}

function drawBoard(ball=null,trail=[]){
    ctx.clearRect(0,0,W,H);

    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#17140f");
    g.addColorStop(.55,"#0e0d0b");
    g.addColorStop(1,"#070707");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // decorative side rails
    ctx.strokeStyle = "rgba(212,166,50,.34)";
    ctx.lineWidth = 2;
    ctx.strokeRect(38,34,W-76,H-68);

    // title
    ctx.fillStyle = "#d4a632";
    ctx.textAlign = "center";
    ctx.font = "700 18px Cinzel, Georgia, serif";
    ctx.fillText("THE GILDED ACE PLINKO",W/2,48);

    // peg glow + peg
    for(let row=0;row<ROWS;row++){
        for(let i=0;i<=row;i++){
            const p = pegPosition(row,i);

            ctx.beginPath();
            ctx.arc(p.x,p.y,board.pegRadius+5,0,Math.PI*2);
            ctx.fillStyle = "rgba(212,166,50,.08)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x,p.y,board.pegRadius,0,Math.PI*2);
            ctx.fillStyle = "#d6b45d";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x-2,p.y-2,2,0,Math.PI*2);
            ctx.fillStyle = "#f4de9a";
            ctx.fill();
        }
    }

    // payout dividers
    const slotTop = board.bottom + 13;
    for(let i=0;i<SLOT_COUNT;i++){
        const x = slotX(i);
        ctx.strokeStyle = "rgba(212,166,50,.26)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x-board.pegGap/2,slotTop);
        ctx.lineTo(x-board.pegGap/2,H-38);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(slotX(SLOT_COUNT-1)+board.pegGap/2,slotTop);
    ctx.lineTo(slotX(SLOT_COUNT-1)+board.pegGap/2,H-38);
    ctx.stroke();

    // trail
    trail.forEach((p,idx)=>{
        const alpha = (idx+1)/trail.length*.14;
        ctx.beginPath();
        ctx.arc(p.x,p.y,board.ballRadius*(.45 + idx/trail.length*.4),0,Math.PI*2);
        ctx.fillStyle = `rgba(242,204,105,${alpha})`;
        ctx.fill();
    });

    if(ball){
        // ball glow
        ctx.beginPath();
        ctx.arc(ball.x,ball.y,board.ballRadius+10,0,Math.PI*2);
        ctx.fillStyle = "rgba(242,204,105,.18)";
        ctx.fill();

        const bg = ctx.createRadialGradient(
            ball.x-4,ball.y-5,2,
            ball.x,ball.y,board.ballRadius
        );
        bg.addColorStop(0,"#fff2b2");
        bg.addColorStop(.35,"#f0c55b");
        bg.addColorStop(1,"#a77520");

        ctx.beginPath();
        ctx.arc(ball.x,ball.y,board.ballRadius,0,Math.PI*2);
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.strokeStyle = "#f5d778";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function choosePath(){
    const decisions = [];
    let rightCount = 0;

    for(let row=0;row<ROWS;row++){
        const right = Math.random() < .5;
        decisions.push(right ? 1 : 0);
        if(right) rightCount++;
    }

    return {
        decisions,
        slot:rightCount
    };
}

function buildWaypoints(decisions){
    const pts = [{x:board.centerX,y:55}];
    let rights = 0;

    for(let row=0;row<ROWS;row++){
        if(decisions[row]) rights++;

        const peg = pegPosition(row,rights);
        const direction = decisions[row] ? 1 : -1;

        pts.push({
            x:peg.x + direction*(board.pegGap*.48),
            y:peg.y + board.rowGap*.55
        });
    }

    pts.push({
        x:slotX(rights),
        y:board.bottom + 40
    });

    return pts;
}

function easeInOut(t){
    return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
}

function animateBall(decisions){
    return new Promise(resolve=>{
        const points = buildWaypoints(decisions);
        const segmentMs = 175;
        const trail = [];

        let seg = 0;
        let segStart = performance.now();

        function frame(now){
            const from = points[seg];
            const to = points[seg+1];

            let t = Math.min(1,(now-segStart)/segmentMs);
            const eased = easeInOut(t);

            const arc = Math.sin(Math.PI*t)*11;

            const ball = {
                x:from.x + (to.x-from.x)*eased,
                y:from.y + (to.y-from.y)*eased - arc
            };

            trail.push(ball);
            if(trail.length>12) trail.shift();

            drawBoard(ball,trail);

            if(t>=1){
                seg++;
                segStart = now;

                if(seg >= points.length-1){
                    drawBoard(ball,[]);
                    resolve();
                    return;
                }
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    });
}

function setControlsDisabled(v){
    $("plinkoDropButton").disabled = v;
    $("plinkoBetDown").disabled = v;
    $("plinkoBetUp").disabled = v;

    document
        .querySelectorAll(".plinko-quick-bets button")
        .forEach(b=>b.disabled=v);
}

function showResult(multiplier,payout,profit){
    $("plinkoModalMultiplier").textContent = `${multiplier}×`;

    const won = payout > bet;
    const brokeEven = payout === bet;

    if(won){
        $("plinkoModalTitle").textContent = "WINNER";
        $("plinkoModalText").textContent =
            `Your ${money(bet)} AC drop returned ${money(payout)} AC — a ${money(profit)} AC profit.`;
    }else if(brokeEven){
        $("plinkoModalTitle").textContent = "PUSH";
        $("plinkoModalText").textContent =
            `Your ${money(bet)} AC drop returned your wager.`;
    }else{
        $("plinkoModalTitle").textContent = "DROP COMPLETE";
        $("plinkoModalText").textContent =
            `Your ${money(bet)} AC drop returned ${money(payout)} AC.`;
    }

    $("plinkoResultModal").classList.add("open");
    $("plinkoResultModal").setAttribute("aria-hidden","false");
}

async function dropBall(){
    if(dropping) return;

    if(bet<=0 || bet>balance){
        setMessage("You do not have enough Ace Credits for that wager.","error");
        return;
    }

    dropping = true;
    setControlsDisabled(true);
    renderMultiplierStrip();

    const wager = bet;
    await setBalance(balance-wager);

    setMessage(`Dropping ${money(wager)} AC...`);

    const landedSlot = await animatePhysicalBall();

    const multiplier = MULTIPLIERS[landedSlot];
    const payout = Math.floor(wager*multiplier);
    const profit = payout-wager;

    let resultType = null;
    if(payout>wager) resultType="win";
    else if(payout<wager) resultType="loss";

    await setBalance(balance+payout,resultType);

    $("plinkoLastResult").textContent = `${multiplier}×`;
    renderMultiplierStrip(landedSlot);

    history.unshift({
        multiplier,
        payout,
        bet:wager,
        at:Date.now()
    });

    history = history.slice(0,12);
    saveHistory();
    renderHistory();

    if(multiplier === 10){
        setMessage(
            `10× JACKPOT HIT! ${money(payout)} AC returned (${money(profit)} AC profit).`,
            "win"
        );
    }else if(payout>wager){
        setMessage(
            `${multiplier}× hit! ${money(payout)} AC returned (${money(profit)} AC profit).`,
            "win"
        );
    }else if(payout===wager){
        setMessage(`${multiplier}× — your wager was returned.`);
    }else{
        setMessage(
            `${multiplier}× hit. ${money(payout)} AC returned.`,
            "loss"
        );
    }

    showResult(multiplier,payout,profit);

    dropping = false;
    setControlsDisabled(false);
}

function bind(){
    $("plinkoBetDown").addEventListener("click",()=>changeBet(-1));
    $("plinkoBetUp").addEventListener("click",()=>changeBet(1));

    document
        .querySelectorAll(".plinko-quick-bets button")
        .forEach(b=>{
            b.addEventListener("click",()=>{
                if(dropping) return;
                bet = Number(b.dataset.plinkoBet)||100;
                renderBet();
            });
        });

    $("plinkoDropButton").addEventListener("click",dropBall);

    $("plinkoClearHistory").addEventListener("click",()=>{
        history = [];
        saveHistory();
        renderHistory();
        $("plinkoLastResult").textContent = "—";
    });

    $("plinkoModalClose").addEventListener("click",()=>{
        $("plinkoResultModal").classList.remove("open");
        $("plinkoResultModal").setAttribute("aria-hidden","true");
    });

    $("plinkoResultModal").addEventListener("click",e=>{
        if(e.target===$("plinkoResultModal")){
            $("plinkoModalClose").click();
        }
    });
}

document.addEventListener("DOMContentLoaded",async()=>{
    renderBet();
    renderMultiplierStrip();
    drawBoard();
    loadHistory();
    bind();
    await initAccount();
});

})();
