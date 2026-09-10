
"use strict";

const SUPABASE_URL = "https://wrmiylynviujwdoecvcn.supabase.co";
const SUPABASE_KEY = "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";

const sb = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

let currentUser = null;
let profile = null;
let balance = 0;
let syncBusy = false;

const $ = id => document.getElementById(id);
const fmt = n => Math.floor(Number(n) || 0).toLocaleString();
const rand = max => {
    if (window.crypto?.getRandomValues) {
        const a = new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return a[0] % max;
    }
    return Math.floor(Math.random() * max);
};

function setSystemMessage(text, isError=false){
    const el = $("casinoSystemMessage");
    if(!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.style.borderColor = isError ? "rgba(185,77,91,.5)" : "rgba(214,179,90,.32)";
    el.style.color = isError ? "#e18490" : "#f3d675";
}

function updateBalanceDisplays(){
    document.querySelectorAll("[data-ga-balance], .balance-value").forEach(el => {
        el.textContent = `${fmt(balance)} AC`;
    });
}

async function loadAccount(){
    if(!sb){
        setSystemMessage("Casino account service did not load. Refresh the page.", true);
        disableMoneyGames(true);
        return;
    }

    const {data:{session}, error:sessionError} = await sb.auth.getSession();
    if(sessionError){
        setSystemMessage(sessionError.message, true);
        disableMoneyGames(true);
        return;
    }

    if(!session?.user){
        setSystemMessage("Sign in through PROFILE before playing casino games.", true);
        disableMoneyGames(true);
        return;
    }

    currentUser = session.user;

    const {data, error} = await sb
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    if(error || !data){
        setSystemMessage(error?.message || "Your player profile could not be loaded.", true);
        disableMoneyGames(true);
        return;
    }

    profile = data;
    balance = Number(profile.balance) || 0;
    updateBalanceDisplays();
    disableMoneyGames(false);
}

function disableMoneyGames(disabled){
    [
        "blackjackDeal","blackjackHit","blackjackStand","blackjackDouble",
        "slotSpin","rouletteSpin","diceRoll"
    ].forEach(id => {
        const el=$(id);
        if(el) el.disabled = disabled;
    });
}

async function setBalance(next){
    balance = Math.max(0, Math.floor(Number(next) || 0));
    updateBalanceDisplays();

    if(!sb || !currentUser) return false;
    if(syncBusy) {
        // serialize balance writes to prevent an older response overwriting a newer wager
        await new Promise(resolve => setTimeout(resolve, 75));
    }

    syncBusy = true;
    const {error} = await sb
        .from("profiles")
        .update({balance})
        .eq("id", currentUser.id);
    syncBusy = false;

    if(error){
        setSystemMessage(`Balance sync failed: ${error.message}`, true);
        return false;
    }
    return true;
}

async function adjustStats(game, result){
    if(!profile || !sb || !currentUser) return;

    const patch = {
        wins: Number(profile.wins)||0,
        losses: Number(profile.losses)||0,
        games_played: Number(profile.games_played)||0
    };

    patch.games_played += 1;
    if(result==="win") patch.wins += 1;
    if(result==="loss") patch.losses += 1;

    const perGame = {
        blackjack:"blackjack_wins",
        slots:"slot_wins",
        roulette:"roulette_wins",
        dice:"dice_wins"
    };

    const col = perGame[game];
    if(result==="win" && col && Object.prototype.hasOwnProperty.call(profile,col)){
        patch[col] = (Number(profile[col])||0)+1;
    }

    Object.assign(profile, patch);
    await sb.from("profiles").update(patch).eq("id", currentUser.id);
}

/* =========================================================
   TABS
========================================================= */
document.querySelectorAll(".casino-tab").forEach(button => {
    button.addEventListener("click", () => {
        const game = button.dataset.game;
        document.querySelectorAll(".casino-tab").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".casino-game-panel").forEach(p => p.classList.remove("active"));
        button.classList.add("active");
        $(game)?.classList.add("active");
        history.replaceState(null,"",`#${game}`);
    });
});

function activateHash(){
    const game = location.hash.replace("#","");
    if(!["blackjack","slots","roulette","dice"].includes(game)) return;
    document.querySelector(`.casino-tab[data-game="${game}"]`)?.click();
}

/* =========================================================
   GENERIC BET CONTROLS
========================================================= */
function makeBetControl(displayId, downId, upId, initial=100){
    let amount = initial;
    const display=$(displayId), down=$(downId), up=$(upId);

    const draw=()=>{ if(display) display.textContent=`${fmt(amount)} AC`; };
    down?.addEventListener("click",()=>{amount=Math.max(100,amount-100);draw();});
    up?.addEventListener("click",()=>{amount=Math.min(5000,amount+100);draw();});
    draw();

    return {
        get:()=>amount,
        setDisabled(v){ if(down)down.disabled=v;if(up)up.disabled=v; }
    };
}

/* =========================================================
   BLACKJACK
========================================================= */
const bjBet = makeBetControl("blackjackBet","blackjackBetDown","blackjackBetUp",100);
let bjDeck=[], playerHand=[], dealerHand=[], bjWager=0, bjActive=false;

function makeDeck(){
    const suits=["S","H","D","C"], ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    const deck=[];
    for(const s of suits) for(const r of ranks) deck.push(r+s);
    for(let i=deck.length-1;i>0;i--){
        const j=rand(i+1);
        [deck[i],deck[j]]=[deck[j],deck[i]];
    }
    return deck;
}
function cardValue(card){const r=card.slice(0,-1);if(r==="A")return 11;if(["J","Q","K"].includes(r))return 10;return Number(r);}
function handValue(hand){
    let total=hand.reduce((s,c)=>s+cardValue(c),0);
    let aces=hand.filter(c=>c.startsWith("A")).length;
    while(total>21 && aces>0){total-=10;aces--;}
    return total;
}
function cardHTML(card,hidden=false){
    if(hidden) return `<div class="ga-card back">A</div>`;
    const suitMap={S:"♠",H:"♥",D:"♦",C:"♣"};
    const suit=card.slice(-1), rank=card.slice(0,-1);
    const red=suit==="H"||suit==="D";
    return `<div class="ga-card ${red?"red":""}"><span>${rank}</span><span>${suitMap[suit]}</span></div>`;
}
function renderBJ(revealDealer=false){
    $("playerCards").innerHTML=playerHand.map(c=>cardHTML(c)).join("");
    $("dealerCards").innerHTML=dealerHand.map((c,i)=>cardHTML(c,!revealDealer&&i===1)).join("");
    $("playerValue").textContent=`Your Hand: ${playerHand.length?handValue(playerHand):"—"}`;
    $("dealerValue").textContent=revealDealer?`Dealer: ${handValue(dealerHand)}`:`Dealer: ${dealerHand.length?cardValue(dealerHand[0]):"—"}`;
}
function bjButtons(active){
    bjActive=active;
    $("blackjackDeal").disabled=active || !currentUser;
    $("blackjackHit").disabled=!active;
    $("blackjackStand").disabled=!active;
    $("blackjackDouble").disabled=!active || playerHand.length!==2 || balance<bjWager;
    bjBet.setDisabled(active);
}
async function finishBJ(message,result,payout=0){
    if(payout>0) await setBalance(balance+payout);
    renderBJ(true);
    bjButtons(false);
    $("blackjackMessage").textContent=message;
    $("blackjackMessage").className=`game-message ${result==="win"?"win":result==="loss"?"loss":""}`;
    if(result==="win"||result==="loss") await adjustStats("blackjack",result);
}
$("blackjackDeal").addEventListener("click",async()=>{
    if(!currentUser)return;
    const wager=bjBet.get();
    if(balance<wager){$("blackjackMessage").textContent="Not enough Ace Credits.";return;}
    await setBalance(balance-wager);
    bjWager=wager; bjDeck=makeDeck(); playerHand=[bjDeck.pop(),bjDeck.pop()];dealerHand=[bjDeck.pop(),bjDeck.pop()];
    renderBJ(false);bjButtons(true);
    const pv=handValue(playerHand),dv=handValue(dealerHand);
    if(pv===21&&dv===21) return finishBJ("Both have blackjack — push.","push",wager);
    if(pv===21) return finishBJ(`BLACKJACK! ${fmt(Math.floor(wager*2.5))} AC paid.`,"win",Math.floor(wager*2.5));
    if(dv===21) return finishBJ("Dealer has blackjack.","loss",0);
    $("blackjackMessage").textContent="Hit, stand, or double.";
});
$("blackjackHit").addEventListener("click",async()=>{
    if(!bjActive)return;
    playerHand.push(bjDeck.pop());renderBJ(false);
    if(handValue(playerHand)>21) await finishBJ("Bust — dealer wins.","loss");
    else bjButtons(true);
});
$("blackjackStand").addEventListener("click",async()=>{
    if(!bjActive)return;
    while(handValue(dealerHand)<17) dealerHand.push(bjDeck.pop());
    const p=handValue(playerHand),d=handValue(dealerHand);
    if(d>21||p>d) await finishBJ(`You win ${fmt(bjWager*2)} AC.`,"win",bjWager*2);
    else if(p===d) await finishBJ("Push — wager returned.","push",bjWager);
    else await finishBJ("Dealer wins.","loss");
});
$("blackjackDouble").addEventListener("click",async()=>{
    if(!bjActive||playerHand.length!==2||balance<bjWager)return;
    await setBalance(balance-bjWager);
    bjWager*=2;
    playerHand.push(bjDeck.pop());
    renderBJ(false);
    if(handValue(playerHand)>21) return finishBJ("Double down bust — dealer wins.","loss");
    while(handValue(dealerHand)<17) dealerHand.push(bjDeck.pop());
    const p=handValue(playerHand),d=handValue(dealerHand);
    if(d>21||p>d) await finishBJ(`Double down win! ${fmt(bjWager*2)} AC paid.`,"win",bjWager*2);
    else if(p===d) await finishBJ("Double down push.","push",bjWager);
    else await finishBJ("Dealer wins.","loss");
});

/* =========================================================
   SLOTS
========================================================= */
const slotBet=makeBetControl("slotBet","slotBetDown","slotBetUp",100);
const slotSymbols=["7","A","♠","♥","♦","♣","★"];
const reels=[$("slotReel1"),$("slotReel2"),$("slotReel3")];
const pickSymbol=()=>slotSymbols[rand(slotSymbols.length)];
$("slotSpin").addEventListener("click",async()=>{
    if(!currentUser)return;
    const wager=slotBet.get();
    if(balance<wager){$("slotMessage").textContent="Not enough Ace Credits.";return;}
    await setBalance(balance-wager);
    $("slotSpin").disabled=true;slotBet.setDisabled(true);
    const timer=setInterval(()=>reels.forEach(r=>r.textContent=pickSymbol()),80);
    setTimeout(async()=>{
        clearInterval(timer);
        const result=[pickSymbol(),pickSymbol(),pickSymbol()];
        reels.forEach((r,i)=>r.textContent=result[i]);
        let mult=0;
        if(result.every(v=>v==="7"))mult=10;
        else if(result.every(v=>v==="A"))mult=7;
        else if(result[0]===result[1]&&result[1]===result[2])mult=5;
        else if(result[0]===result[1]||result[1]===result[2]||result[0]===result[2])mult=2;

        if(mult){
            const payout=wager*mult;
            await setBalance(balance+payout);
            $("slotMessage").textContent=`WIN! ${fmt(payout)} AC paid.`;
            $("slotMessage").className="game-message win";
            await adjustStats("slots","win");
        }else{
            $("slotMessage").textContent=`No match. You lost ${fmt(wager)} AC.`;
            $("slotMessage").className="game-message loss";
            await adjustStats("slots","loss");
        }
        $("slotSpin").disabled=false;slotBet.setDisabled(false);
    },1050);
});

/* =========================================================
   ROULETTE
========================================================= */

const ROULETTE_WHEEL = [
    0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,
    5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

const RED_NUMBERS = new Set([
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
]);

let rouletteBet = 100;
let rouletteSelection = null;
let rouletteSpinning = false;
let rouletteHistory = [];
let wheelRotation = 0;
let ballRotation = 0;

function rouletteColor(n){
    return n === 0 ? "green" : RED_NUMBERS.has(n) ? "red" : "black";
}

function rouletteDrawBet(){
    $("rouletteBetDisplay").textContent = `${fmt(rouletteBet)} AC`;
}

function buildPhysicalRouletteWheel(){
    const ring = $("roulettePocketRing");
    if(!ring) return;

    ring.innerHTML = "";

    const step = 360 / ROULETTE_WHEEL.length;
    const radius = 43.2;

    /*
      European single-zero wheel order, clockwise from 0:
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13,
      36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
      31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26

      0 is placed at exactly 12 o'clock.
      Every following number advances clockwise by one pocket.
    */
    ROULETTE_WHEEL.forEach((number, index) => {
        const angleFromTop = index * step;
        const theta = (angleFromTop - 90) * Math.PI / 180;

        const x = 50 + Math.cos(theta) * radius;
        const y = 50 + Math.sin(theta) * radius;

        const pocket = document.createElement("div");
        pocket.className = "roulette-pocket";
        pocket.dataset.number = String(number);
        pocket.style.left = `${x}%`;
        pocket.style.top = `${y}%`;

        /*
          Rotate the pocket radially so the number follows the wheel.
          +90 converts our top-based angle into CSS's horizontal baseline.
        */
        pocket.style.transform =
            `translate(-50%, -50%) rotate(${angleFromTop}deg)`;

        const face = document.createElement("div");
        face.className =
            `roulette-pocket-face ${rouletteColor(number)}`;
        face.textContent = String(number);

        pocket.appendChild(face);
        ring.appendChild(pocket);
    });
}

function clearRouletteSelection(){
    rouletteSelection = null;
    document
        .querySelectorAll(".ga-number,.ga-roulette-choice")
        .forEach(b => b.classList.remove("selected"));

    $("rouletteSelectedBet").textContent = "NONE";
}

function chooseRoulette(selection, label, button){
    if(rouletteSpinning) return;

    clearRouletteSelection();
    rouletteSelection = selection;
    button.classList.add("selected");
    $("rouletteSelectedBet").textContent = label;
    $("rouletteMessage").textContent = `${label} selected for ${fmt(rouletteBet)} AC.`;
    $("rouletteMessage").className = "roulette-luxury-message";
}

function buildRouletteBoard(){
    const board = $("rouletteNumberBoard");
    board.innerHTML = "";

    const zero = document.createElement("button");
    zero.type = "button";
    zero.className = "ga-number green zero";
    zero.textContent = "0";
    zero.addEventListener("click", () =>
        chooseRoulette({type:"number",value:0},"0",zero)
    );
    board.appendChild(zero);

    for(let n = 1; n <= 36; n++){
        const b = document.createElement("button");
        b.type = "button";
        b.className = `ga-number ${rouletteColor(n)}`;
        b.textContent = String(n);
        b.addEventListener("click", () =>
            chooseRoulette({type:"number",value:n},String(n),b)
        );
        board.appendChild(b);
    }
}

function rouletteWins(sel,n){
    if(!sel) return false;
    if(sel.type === "number") return n === sel.value;
    if(n === 0) return false;

    switch(sel.type){
        case "red": return RED_NUMBERS.has(n);
        case "black": return !RED_NUMBERS.has(n);
        case "odd": return n % 2 === 1;
        case "even": return n % 2 === 0;
        case "low": return n >= 1 && n <= 18;
        case "high": return n >= 19 && n <= 36;
        default: return false;
    }
}

function rouletteMultiplier(sel){
    return sel?.type === "number" ? 36 : 2;
}

function renderHistory(){
    const box = $("rouletteHistoryList");

    if(!rouletteHistory.length){
        box.innerHTML = '<span class="ga-history-empty">NO SPINS YET</span>';
        return;
    }

    box.innerHTML = rouletteHistory
        .slice(0,12)
        .map(n => `<span class="ga-history-chip ${rouletteColor(n)}">${n}</span>`)
        .join("");
}

function setRouletteControls(disabled){
    rouletteSpinning = disabled;

    document
        .querySelectorAll(
            ".ga-number,.ga-roulette-choice," +
            "#rouletteBetMinus500,#rouletteBetDown,#rouletteBetUp," +
            "#rouletteClearBet,#rouletteSpin"
        )
        .forEach(el => el.disabled = disabled);
}

function getPocketAngle(number){
    const index = ROULETTE_WHEEL.indexOf(number);
    return index * (360 / ROULETTE_WHEEL.length);
}

function normalizeAngle(deg){
    return ((deg % 360) + 360) % 360;
}

function animateRouletteToNumber(number){
    const wheel = $("rouletteWheel");
    const ballTrack = $("rouletteBallTrack");

    const pocketAngle = getPocketAngle(number);

    /*
      IMPORTANT:
      rouletteBallTrack is INSIDE rouletteWheel.

      That means:
      - The wheel's rotation moves BOTH the numbered pockets and ball track.
      - The ball track's own transform is LOCAL to the wheel.

      So the ball's final local angle must simply equal the selected
      pocket's local angle. The previous version incorrectly added the
      wheel's world rotation a second time, which caused the visible
      landing spot to disagree with the reported winning number.
    */

    const wheelExtraTurns = 6 + rand(3);
    const ballExtraTurns = 9 + rand(4);

    // Give the wheel a natural-looking final orientation.
    const newWheelRotation =
        wheelRotation +
        (wheelExtraTurns * 360) +
        (110 + rand(150));

    /*
      Ball travels counter-clockwise.

      Find the nearest equivalent of pocketAngle that is behind the
      current local ball angle, then add several full CCW revolutions.
    */
    const currentLocalAngle = normalizeAngle(ballRotation);
    let localDelta = pocketAngle - currentLocalAngle;

    while(localDelta >= 0){
        localDelta -= 360;
    }

    const newBallRotation =
        ballRotation -
        (ballExtraTurns * 360) +
        localDelta;

    wheel.style.transition =
        "transform 3.8s cubic-bezier(.10,.72,.12,1)";

    ballTrack.style.transition =
        "transform 4.35s cubic-bezier(.08,.74,.12,1)";

    requestAnimationFrame(() => {
        wheel.style.transform =
            `rotate(${newWheelRotation}deg)`;

        ballTrack.style.transform =
            `rotate(${newBallRotation}deg)`;
    });

    wheelRotation = newWheelRotation;
    ballRotation = newBallRotation;
}

$("rouletteBetMinus500").addEventListener("click", () => {
    rouletteBet = Math.max(100, rouletteBet - 500);
    rouletteDrawBet();
});

$("rouletteBetDown").addEventListener("click", () => {
    rouletteBet = Math.max(100, rouletteBet - 100);
    rouletteDrawBet();
});

$("rouletteBetUp").addEventListener("click", () => {
    rouletteBet = Math.min(5000, rouletteBet + 100);
    rouletteDrawBet();
});

$("rouletteClearBet").addEventListener("click", () => {
    if(rouletteSpinning) return;

    clearRouletteSelection();
    $("rouletteMessage").textContent =
        "Bet cleared. Select a new number or outside bet.";
    $("rouletteMessage").className = "roulette-luxury-message";
});

document.querySelectorAll(".ga-roulette-choice").forEach(button => {
    button.addEventListener("click", () =>
        chooseRoulette(
            {type:button.dataset.betType},
            button.textContent.trim(),
            button
        )
    );
});

$("rouletteSpin").addEventListener("click", async () => {
    if(!currentUser) return;

    if(!rouletteSelection){
        $("rouletteMessage").textContent =
            "Select a roulette bet before spinning.";
        $("rouletteMessage").className =
            "roulette-luxury-message loss";
        return;
    }

    if(balance < rouletteBet){
        $("rouletteMessage").textContent =
            "Not enough Ace Credits.";
        $("rouletteMessage").className =
            "roulette-luxury-message loss";
        return;
    }

    const lockedSelection = {...rouletteSelection};
    const wager = rouletteBet;
    const winningIndex = rand(ROULETTE_WHEEL.length);
    const number = ROULETTE_WHEEL[winningIndex];

    await setBalance(balance - wager);

    setRouletteControls(true);

    $("rouletteStatus").textContent = "WHEEL SPINNING";
    $("rouletteResult").textContent = "—";
    $("rouletteMessage").textContent =
        "Ball in motion...";
    $("rouletteMessage").className =
        "roulette-luxury-message";

    animateRouletteToNumber(number);

    setTimeout(async () => {
        $("rouletteResult").textContent = String(number);

        rouletteHistory.unshift(number);
        rouletteHistory = rouletteHistory.slice(0,12);
        renderHistory();

        if(rouletteWins(lockedSelection,number)){
            const payout =
                wager * rouletteMultiplier(lockedSelection);

            await setBalance(balance + payout);

            const profit = payout - wager;

            $("rouletteMessage").textContent =
                `${number} ${rouletteColor(number).toUpperCase()} — WIN! +${fmt(profit)} AC.`;

            $("rouletteMessage").className =
                "roulette-luxury-message win";

            await adjustStats("roulette","win");
        } else {
            $("rouletteMessage").textContent =
                `${number} ${rouletteColor(number).toUpperCase()} — You lost ${fmt(wager)} AC.`;

            $("rouletteMessage").className =
                "roulette-luxury-message loss";

            await adjustStats("roulette","loss");
        }

        $("rouletteStatus").textContent =
            "PLACE YOUR BET";

        setRouletteControls(false);

    }, 4450);
});

/* =========================================================
   DICE
========================================================= */
const diceBet=makeBetControl("diceBet","diceBetDown","diceBetUp",100);
const DIE=["⚀","⚁","⚂","⚃","⚄","⚅"];
$("diceRoll").addEventListener("click",async()=>{
    if(!currentUser)return;
    const wager=diceBet.get();
    if(balance<wager){$("diceMessage").textContent="Not enough Ace Credits.";return;}
    await setBalance(balance-wager);
    $("diceRoll").disabled=true;diceBet.setDisabled(true);
    const house=rand(6)+1,player=rand(6)+1;
    $("houseDie").textContent=DIE[house-1];$("playerDie").textContent=DIE[player-1];
    $("houseDieValue").textContent=house;$("playerDieValue").textContent=player;
    if(player>house){
        await setBalance(balance+wager*2);
        $("diceMessage").textContent=`You win ${fmt(wager)} AC.`;
        $("diceMessage").className="game-message win";
        await adjustStats("dice","win");
    }else if(player===house){
        await setBalance(balance+wager);
        $("diceMessage").textContent="Tie — wager returned.";
        $("diceMessage").className="game-message";
    }else{
        $("diceMessage").textContent=`House wins. You lost ${fmt(wager)} AC.`;
        $("diceMessage").className="game-message loss";
        await adjustStats("dice","loss");
    }
    $("diceRoll").disabled=false;diceBet.setDisabled(false);
});

/* =========================================================
   INIT
========================================================= */
buildPhysicalRouletteWheel();
buildRouletteBoard();
rouletteDrawBet();
renderBJ(false);
activateHash();
loadAccount();
