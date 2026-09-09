const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* ==========================================================
   CORE PROFILE
   ========================================================== */

const DEFAULT_PROFILE = {
    username: "Gilded Player",
    balance: 10000,

    wins: 0,
    losses: 0,
    gamesPlayed: 0,

    blackjackWins: 0,
    slotWins: 0,
    rouletteWins: 0,
    diceWins: 0,

    collection: []
};


function loadProfile() {

    const saved =
        localStorage.getItem("gildedAceProfile");

    if (!saved) {

        const fresh = {
            ...DEFAULT_PROFILE,
            collection: []
        };

        localStorage.setItem(
            "gildedAceProfile",
            JSON.stringify(fresh)
        );

        return fresh;
    }


    try {

        const parsed = JSON.parse(saved);

        return {
            ...DEFAULT_PROFILE,
            ...parsed,

            collection:
                Array.isArray(parsed.collection)
                    ? parsed.collection
                    : []
        };

    } catch (error) {

        console.error(
            "Could not load Gilded Ace profile.",
            error
        );

        return {
            ...DEFAULT_PROFILE,
            collection: []
        };
    }

}


let profile = loadProfile();


function saveProfile() {

    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(profile)
    );

    updateAllDisplays();

}


function formatCredits(amount) {

    return (
        Number(amount || 0).toLocaleString()
        + " AC"
    );

}


/* ==========================================================
   DISPLAY
   ========================================================== */

function setText(selector, value) {

    const element = $(selector);

    if (element) {
        element.textContent = value;
    }

}


function updateBalanceDisplays() {

    $$("[data-balance]").forEach((element) => {

        element.textContent =
            formatCredits(profile.balance);

    });

}


function updateAllDisplays() {

    updateBalanceDisplays();

    updateProfilePage();

    updateCollectionPage();

    updateStoreButtons();

}


/* ==========================================================
   DAILY REWARD
   ========================================================== */

function claimDaily() {

    const today =
        new Date().toDateString();

    const lastClaim =
        localStorage.getItem(
            "gildedAceDailyReward"
        );


    if (lastClaim === today) {

        alert(
            "You have already claimed today's reward."
        );

        return;
    }


    profile.balance += 1000;


    localStorage.setItem(
        "gildedAceDailyReward",
        today
    );


    saveProfile();


    alert(
        "Daily reward claimed: +1,000 AC"
    );

}


/* ==========================================================
   STORE
   ========================================================== */

const STORE_ITEMS = {

    "Gold Profile Frame": {
        category: "profile",
        price: 10000
    },

    "Diamond Nameplate": {
        category: "profile",
        price: 25000
    },

    "High Roller Title": {
        category: "profile",
        price: 50000
    },

    "Gilded Watch": {
        category: "collectible",
        price: 75000
    },

    "Golden Ace Card": {
        category: "collectible",
        price: 100000
    },

    "Diamond Crown": {
        category: "collectible",
        price: 350000
    },

    "Grand Touring Coupe": {
        category: "vehicle",
        price: 150000
    },

    "Gilded Supercar": {
        category: "vehicle",
        price: 500000
    },

    "Executive Limousine": {
        category: "vehicle",
        price: 750000
    },

    "Private Yacht": {
        category: "vehicle",
        price: 2500000
    },

    "Private Jet": {
        category: "vehicle",
        price: 5000000
    },

    "Club Hotel Suite": {
        category: "property",
        price: 50000
    },

    "Luxury Penthouse": {
        category: "property",
        price: 1000000
    },

    "Private Estate": {
        category: "property",
        price: 3000000
    },

    "Gilded Card Back": {
        category: "casino",
        price: 15000
    },

    "Gold Blackjack Table": {
        category: "casino",
        price: 100000
    },

    "Midnight Roulette": {
        category: "casino",
        price: 150000
    },

    "High Roller Membership": {
        category: "prestige",
        price: 250000
    },

    "Diamond Club": {
        category: "prestige",
        price: 1000000
    },

    "Casino Ownership": {
        category: "prestige",
        price: 10000000
    }

};


function buyItem(name, price) {

    const owned =
        profile.collection.some(
            (item) => item.name === name
        );


    if (owned) {

        alert(
            "You already own this item."
        );

        return;
    }


    if (profile.balance < price) {

        alert(
            "You do not have enough Ace Credits."
        );

        return;
    }


    const storeItem =
        STORE_ITEMS[name] || {
            category: "collectible",
            price
        };


    profile.balance -= price;


    profile.collection.push({

        name,

        price,

        category:
            storeItem.category,

        purchased:
            new Date().toISOString()

    });


    saveProfile();


    alert(
        `${name} added to your collection.`
    );

}


function updateStoreButtons() {

    const buttons =
        $$("button[onclick^='buyItem']");


    buttons.forEach((button) => {

        const onclick =
            button.getAttribute("onclick");


        if (!onclick) {
            return;
        }


        const match =
            onclick.match(
                /buyItem\(\s*['"](.+?)['"]/
            );


        if (!match) {
            return;
        }


        const name =
            match[1];


        const owned =
            profile.collection.some(
                (item) =>
                    item.name === name
            );


        if (owned) {

            button.textContent =
                "OWNED";

            button.disabled =
                true;

            button.style.opacity =
                ".55";

        }

    });

}


/* ==========================================================
   COLLECTION
   ========================================================== */

let currentCollectionFilter =
    "all";


function filterCollection(category, button) {

    currentCollectionFilter =
        category;


    $$(".collection-filter").forEach(
        (element) => {

            element.classList.remove(
                "selected"
            );

        }
    );


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    updateCollectionPage();

}


function updateCollectionPage() {

    const grid =
        $("#collectionGrid");


    if (!grid) {
        return;
    }


    const items =
        profile.collection;


    const filtered =
        currentCollectionFilter === "all"
            ? items
            : items.filter(
                (item) =>
                    item.category ===
                    currentCollectionFilter
            );


    grid.innerHTML =
        "";


    filtered.forEach((item) => {

        const card =
            document.createElement("div");

        card.className =
            "card collection-item";

        card.dataset.category =
            item.category;


        card.innerHTML = `

            <span class="tag">
                ${item.category.toUpperCase()}
            </span>

            <h3>
                ${item.name}
            </h3>

            <p>
                Owned Gilded Ace virtual item.
            </p>

            <div class="price">
                ${formatCredits(item.price)}
            </div>

        `;


        grid.appendChild(card);

    });


    const empty =
        $("#emptyCollection");


    if (empty) {

        empty.style.display =
            filtered.length
                ? "none"
                : "block";

    }


    setText(
        "#collectionCount",
        items.length
    );


    const value =
        items.reduce(
            (sum, item) =>
                sum + Number(item.price || 0),
            0
        );


    setText(
        "#collectionValue",
        formatCredits(value)
    );


    const highest =
        items.reduce(
            (best, item) => {

                if (
                    !best ||
                    item.price > best.price
                ) {
                    return item;
                }

                return best;

            },
            null
        );


    setText(
        "#highestPurchase",
        highest
            ? highest.name
            : "—"
    );

}


/* ==========================================================
   MEMBERSHIP
   ========================================================== */

function getMembershipTier(balance) {

    if (balance >= 10000000) {

        return {
            current: "CASINO OWNER",
            next: "MAXIMUM TIER",
            progress: 100
        };

    }


    if (balance >= 5000000) {

        return {
            current: "DIAMOND CLUB",
            next: "CASINO OWNER",
            progress:
                ((balance - 5000000) /
                5000000) * 100
        };

    }


    if (balance >= 1000000) {

        return {
            current: "HIGH ROLLER",
            next: "DIAMOND CLUB",
            progress:
                ((balance - 1000000) /
                4000000) * 100
        };

    }


    if (balance >= 100000) {

        return {
            current: "GOLD MEMBER",
            next: "HIGH ROLLER",
            progress:
                ((balance - 100000) /
                900000) * 100
        };

    }


    return {
        current: "STANDARD",
        next: "GOLD MEMBER",
        progress:
            Math.min(
                100,
                balance / 100000 * 100
            )
    };

}


/* ==========================================================
   PROFILE PAGE
   ========================================================== */

function updateProfilePage() {

    const tier =
        getMembershipTier(
            profile.balance
        );


    setText(
        "#profileUsername",
        profile.username
    );


    setText(
        "#profileStatus",
        `${tier.current} MEMBER`
    );


    setText(
        "#currentTier",
        tier.current
    );


    setText(
        "#nextTier",
        tier.next
    );


    const bar =
        $("#membershipProgress");


    if (bar) {

        bar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    tier.progress
                )
            )}%`;

    }


    setText(
        "#profileWins",
        profile.wins
    );


    setText(
        "#profileLosses",
        profile.losses
    );


    setText(
        "#profileGames",
        profile.gamesPlayed
    );


    setText(
        "#profileCollection",
        `${profile.collection.length} ITEMS`
    );


    setText(
        "#profileItemsOwned",
        profile.collection.length
    );


    setText(
        "#blackjackWins",
        `${profile.blackjackWins} WINS`
    );


    setText(
        "#slotWins",
        `${profile.slotWins} WINS`
    );


    setText(
        "#rouletteWins",
        `${profile.rouletteWins} WINS`
    );


    setText(
        "#diceWins",
        `${profile.diceWins} WINS`
    );


    const value =
        profile.collection.reduce(
            (sum, item) =>
                sum + Number(item.price || 0),
            0
        );


    setText(
        "#profileCollectionValue",
        formatCredits(value)
    );


    const highest =
        profile.collection.reduce(
            (best, item) => {

                if (
                    !best ||
                    item.price > best.price
                ) {
                    return item;
                }

                return best;

            },
            null
        );


    setText(
        "#profileHighestPurchase",
        highest
            ? highest.name
            : "—"
    );

}


function changeUsername() {

    const input =
        $("#newUsername");


    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (name.length < 3) {

        alert(
            "Username must be at least 3 characters."
        );

        return;
    }


    profile.username =
        name.substring(0, 20);


    input.value =
        "";


    saveProfile();


    alert(
        "Username updated."
    );

}


function resetGildedProfile() {

    const confirmed =
        confirm(
            "Reset your balance, statistics, and collection?"
        );


    if (!confirmed) {
        return;
    }


    profile = {
        ...DEFAULT_PROFILE,
        collection: []
    };


    localStorage.removeItem(
        "gildedAceDailyReward"
    );


    saveProfile();


    alert(
        "Gilded Ace profile reset."
    );

}


/* ==========================================================
   GAME STATISTICS
   ========================================================== */

function recordResult(won, game) {

    profile.gamesPlayed++;


    if (won === true) {

        profile.wins++;

    } else if (won === false) {

        profile.losses++;

    }


    if (
        won === true &&
        game === "blackjack"
    ) {

        profile.blackjackWins++;

    }


    if (
        won === true &&
        game === "slots"
    ) {

        profile.slotWins++;

    }


    if (
        won === true &&
        game === "roulette"
    ) {

        profile.rouletteWins++;

    }


    if (
        won === true &&
        game === "dice"
    ) {

        profile.diceWins++;

    }


    saveProfile();

}


/* ==========================================================
   BLACKJACK
   ========================================================== */

let blackjackDeck = [];

let blackjackPlayer = [];

let blackjackDealer = [];

let blackjackActive = false;


function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}


function buildDeck() {

    const suits = [
        "♠",
        "♥",
        "♦",
        "♣"
    ];


    const ranks = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K"
    ];


    const deck = [];


    suits.forEach((suit) => {

        ranks.forEach((rank) => {

            deck.push({
                suit,
                rank
            });

        });

    });


    return shuffle(deck);

}


function cardValue(card) {

    if (
        ["J", "Q", "K"].includes(card.rank)
    ) {

        return 10;

    }


    if (card.rank === "A") {

        return 11;

    }


    return Number(card.rank);

}


function handValue(hand) {

    let total = 0;

    let aces = 0;


    hand.forEach((card) => {

        total +=
            cardValue(card);


        if (card.rank === "A") {

            aces++;

        }

    });


    while (
        total > 21 &&
        aces > 0
    ) {

        total -= 10;

        aces--;

    }


    return total;

}


function cardText(card) {

    return (
        card.rank +
        card.suit
    );

}


function renderBlackjack(
    hideDealer = false
) {

    const playerCards =
        $("#playerCards");

    const dealerCards =
        $("#dealerCards");


    if (playerCards) {

        playerCards.textContent =
            blackjackPlayer
                .map(cardText)
                .join(" ");

    }


    if (dealerCards) {

        if (
            hideDealer &&
            blackjackDealer.length
        ) {

            dealerCards.textContent =
                cardText(
                    blackjackDealer[0]
                ) + " ?";

        } else {

            dealerCards.textContent =
                blackjackDealer
                    .map(cardText)
                    .join(" ");

        }

    }


    setText(
        "#playerTotal",
        handValue(
            blackjackPlayer
        )
    );


    setText(
        "#dealerTotal",
        hideDealer
            ? "?"
            : handValue(
                blackjackDealer
            )
    );

}


function startBlackjack() {

    blackjackDeck =
        buildDeck();


    blackjackPlayer = [
        blackjackDeck.pop(),
        blackjackDeck.pop()
    ];


    blackjackDealer = [
        blackjackDeck.pop(),
        blackjackDeck.pop()
    ];


    blackjackActive =
        true;


    renderBlackjack(true);


    setText(
        "#blackjackMessage",
        "Choose HIT or STAND."
    );


    if (
        handValue(
            blackjackPlayer
        ) === 21
    ) {

        blackjackStand();

    }

}


function blackjackHit() {

    if (!blackjackActive) {

        alert(
            "Press DEAL first."
        );

        return;
    }


    blackjackPlayer.push(
        blackjackDeck.pop()
    );


    renderBlackjack(true);


    if (
        handValue(
            blackjackPlayer
        ) > 21
    ) {

        blackjackActive =
            false;


        renderBlackjack(false);


        setText(
            "#blackjackMessage",
            "BUST — House wins."
        );


        recordResult(
            false,
            "blackjack"
        );

    }

}


function blackjackStand() {

    if (!blackjackActive) {

        alert(
            "Press DEAL first."
        );

        return;
    }


    blackjackActive =
        false;


    while (
        handValue(
            blackjackDealer
        ) < 17
    ) {

        blackjackDealer.push(
            blackjackDeck.pop()
        );

    }


    renderBlackjack(false);


    const player =
        handValue(
            blackjackPlayer
        );


    const dealer =
        handValue(
            blackjackDealer
        );


    if (
        dealer > 21 ||
        player > dealer
    ) {

        profile.balance += 500;


        setText(
            "#blackjackMessage",
            "You win! +500 AC"
        );


        recordResult(
            true,
            "blackjack"
        );


        return;
    }


    if (player < dealer) {

        setText(
            "#blackjackMessage",
            "House wins."
        );


        recordResult(
            false,
            "blackjack"
        );


        return;
    }


    setText(
        "#blackjackMessage",
        "Push — tie game."
    );


    recordResult(
        null,
        "blackjack"
    );

}


/* ==========================================================
   SLOTS
   ========================================================== */

function spinSlots() {

    const display =
        $("#slotDisplay");


    if (!display) {
        return;
    }


    const symbols = [
        "7",
        "A",
        "♠",
        "♦",
        "★"
    ];


    const reels = [
        symbols[
            Math.floor(
                Math.random() *
                symbols.length
            )
        ],

        symbols[
            Math.floor(
                Math.random() *
                symbols.length
            )
        ],

        symbols[
            Math.floor(
                Math.random() *
                symbols.length
            )
        ]
    ];


    display.textContent =
        reels.join(" ");


    const jackpot =
        reels[0] === reels[1] &&
        reels[1] === reels[2];


    if (jackpot) {

        profile.balance += 2500;


        setText(
            "#slotMessage",
            "JACKPOT! +2,500 AC"
        );


        recordResult(
            true,
            "slots"
        );

    } else {

        setText(
            "#slotMessage",
            "No match. Spin again."
        );


        recordResult(
            false,
            "slots"
        );

    }

}


/* ==========================================================
   EUROPEAN ROULETTE DATA
   ========================================================== */

const EUROPEAN_WHEEL = [

    0,
    32,
    15,
    19,
    4,
    21,
    2,
    25,
    17,
    34,
    6,
    27,
    13,
    36,
    11,
    30,
    8,
    23,
    10,
    5,
    24,
    16,
    33,
    1,
    20,
    14,
    31,
    9,
    22,
    18,
    29,
    7,
    28,
    12,
    35,
    3,
    26

];


const RED_NUMBERS =
    new Set([

        1,
        3,
        5,
        7,
        9,
        12,
        14,
        16,
        18,
        19,
        21,
        23,
        25,
        27,
        30,
        32,
        34,
        36

    ]);


const POCKET_COUNT =
    EUROPEAN_WHEEL.length;


const POCKET_ANGLE =
    360 / POCKET_COUNT;


/* ==========================================================
   ROULETTE STATE
   ========================================================== */

let selectedRouletteBet =
    null;


let selectedRouletteButton =
    null;


let betAmount =
    100;


let rouletteSpinning =
    false;


let wheelRotation =
    0;


let ballRotation =
    0;


/* ==========================================================
   NUMBER COLOR
   ========================================================== */

function rouletteColor(number) {

    if (number === 0) {
        return "green";
    }


    if (
        RED_NUMBERS.has(number)
    ) {
        return "red";
    }


    return "black";

}


/* ==========================================================
   GENERATE REAL WHEEL POCKETS
   ========================================================== */

function buildRouletteWheel() {

    const layer =
        $("#roulettePocketLayer");


    if (!layer) {
        return;
    }


    layer.innerHTML =
        "";


    EUROPEAN_WHEEL.forEach(
        (number, index) => {

            const pocket =
                document.createElement(
                    "div"
                );


            const color =
                rouletteColor(number);


            pocket.className =
                `roulette-pocket ${color}`;


            const angle =
                index * POCKET_ANGLE;


            pocket.style.transform =
                `
                translateX(-50%)
                rotate(${angle}deg)
                `;


            const numberLabel =
                document.createElement(
                    "span"
                );


            numberLabel.className =
                "roulette-pocket-number";


            numberLabel.textContent =
                number;


            pocket.appendChild(
                numberLabel
            );


            layer.appendChild(
                pocket
            );

        }
    );

}


/* ==========================================================
   GENERATE 1-36 BETTING TABLE
   ========================================================== */

function buildRouletteTable() {

    const grid =
        $("#rouletteNumberGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML =
        "";


    /*
        Standard roulette table columns:

        3  6  9  12 ...
        2  5  8  11 ...
        1  4  7  10 ...

        CSS grid-auto-flow: column handles
        the three-row layout on desktop.
    */


    for (
        let number = 1;
        number <= 36;
        number++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            `
            roulette-number-cell
            ${rouletteColor(number)}
            `;


        button.textContent =
            number;


        button.dataset.number =
            number;


        button.addEventListener(
            "click",
            () => {

                selectNumberBet(
                    number,
                    button
                );

            }
        );


        grid.appendChild(
            button
        );

    }

}


/* ==========================================================
   CLEAR SELECTED BET BUTTON
   ========================================================== */

function clearRouletteSelection() {

    $$(".roulette-table button").forEach(
        (button) => {

            button.classList.remove(
                "selected"
            );

        }
    );


    $$(".roulette-dozens button").forEach(
        (button) => {

            button.classList.remove(
                "selected"
            );

        }
    );


    $$(".roulette-outside-bets button").forEach(
        (button) => {

            button.classList.remove(
                "selected"
            );

        }
    );

}


/* ==========================================================
   STRAIGHT NUMBER BET
   ========================================================== */

function selectNumberBet(
    number,
    button
) {

    if (rouletteSpinning) {
        return;
    }


    clearRouletteSelection();


    selectedRouletteBet = {

        type: "number",

        number,

        label:
            `NUMBER ${number}`,

        payout:
            35

    };


    selectedRouletteButton =
        button;


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    setText(
        "#selectedBet",
        `NUMBER ${number}`
    );


    setText(
        "#selectedPayout",
        "STRAIGHT BET • 35:1"
    );

}


/* ==========================================================
   OUTSIDE / DOZEN BET
   ========================================================== */

function selectRouletteBet(
    type,
    button
) {

    if (rouletteSpinning) {
        return;
    }


    clearRouletteSelection();


    const bets = {

        low: {
            label: "1 TO 18",
            payout: 1
        },

        even: {
            label: "EVEN",
            payout: 1
        },

        red: {
            label: "RED",
            payout: 1
        },

        black: {
            label: "BLACK",
            payout: 1
        },

        odd: {
            label: "ODD",
            payout: 1
        },

        high: {
            label: "19 TO 36",
            payout: 1
        },

        dozen1: {
            label: "1ST 12",
            payout: 2
        },

        dozen2: {
            label: "2ND 12",
            payout: 2
        },

        dozen3: {
            label: "3RD 12",
            payout: 2
        }

    };


    const data =
        bets[type];


    if (!data) {
        return;
    }


    selectedRouletteBet = {

        type,

        label:
            data.label,

        payout:
            data.payout

    };


    selectedRouletteButton =
        button;


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    setText(
        "#selectedBet",
        data.label
    );


    setText(
        "#selectedPayout",
        `${data.payout}:1 PAYOUT`
    );

}


/* ==========================================================
   BET AMOUNT
   ========================================================== */

function changeBet(amount) {

    if (rouletteSpinning) {
        return;
    }


    if (profile.balance <= 0) {

        betAmount = 0;

        setText(
            "#betAmount",
            "0 AC"
        );

        return;
    }


    betAmount +=
        amount;


    betAmount =
        Math.max(
            100,
            betAmount
        );


    betAmount =
        Math.min(
            profile.balance,
            betAmount
        );


    setText(
        "#betAmount",
        formatCredits(
            betAmount
        )
    );

}


/* ==========================================================
   DETERMINE WINNING BET
   ========================================================== */

function rouletteBetWins(
    winningNumber
) {

    if (!selectedRouletteBet) {
        return false;
    }


    const type =
        selectedRouletteBet.type;


    if (type === "number") {

        return (
            winningNumber ===
            selectedRouletteBet.number
        );

    }


    if (type === "red") {

        return (
            winningNumber !== 0 &&
            RED_NUMBERS.has(
                winningNumber
            )
        );

    }


    if (type === "black") {

        return (
            winningNumber !== 0 &&
            !RED_NUMBERS.has(
                winningNumber
            )
        );

    }


    if (type === "even") {

        return (
            winningNumber !== 0 &&
            winningNumber % 2 === 0
        );

    }


    if (type === "odd") {

        return (
            winningNumber !== 0 &&
            winningNumber % 2 === 1
        );

    }


    if (type === "low") {

        return (
            winningNumber >= 1 &&
            winningNumber <= 18
        );

    }


    if (type === "high") {

        return (
            winningNumber >= 19 &&
            winningNumber <= 36
        );

    }


    if (type === "dozen1") {

        return (
            winningNumber >= 1 &&
            winningNumber <= 12
        );

    }


    if (type === "dozen2") {

        return (
            winningNumber >= 13 &&
            winningNumber <= 24
        );

    }


    if (type === "dozen3") {

        return (
            winningNumber >= 25 &&
            winningNumber <= 36
        );

    }


    return false;

}


/* ==========================================================
   ROULETTE RESULT COLOR
   ========================================================== */

function rouletteResultName(number) {

    if (number === 0) {

        return "GREEN";

    }


    if (
        RED_NUMBERS.has(number)
    ) {

        return "RED";

    }


    return "BLACK";

}


/* ==========================================================
   NORMALIZE DEGREES
   ========================================================== */

function normalizeAngle(angle) {

    return (
        (angle % 360) + 360
    ) % 360;

}


/* ==========================================================
   ROULETTE SPIN
   ========================================================== */

function spinRoulette() {

    if (rouletteSpinning) {
        return;
    }


    if (!selectedRouletteBet) {

        alert(
            "Select a roulette bet first."
        );

        return;
    }


    if (
        betAmount <= 0 ||
        profile.balance < betAmount
    ) {

        alert(
            "You do not have enough Ace Credits."
        );

        return;
    }


    const wheel =
        $("#rouletteWheel");

    const ballTrack =
        $("#ballTrack");

    const spinButton =
        $("#rouletteSpinButton");


    if (
        !wheel ||
        !ballTrack
    ) {
        return;
    }


    rouletteSpinning =
        true;


    if (spinButton) {

        spinButton.disabled =
            true;

    }


    /*
        Pick one ACTUAL pocket from the wheel.
        Everything after this point uses this same index.
    */

    const winningIndex =
        Math.floor(
            Math.random() *
            POCKET_COUNT
        );


    const winningNumber =
        EUROPEAN_WHEEL[
            winningIndex
        ];


    /*
        Pocket center position relative to wheel's
        starting top pointer.

        Pocket 0 starts at 0 degrees.
    */

    const pocketAngle =
        winningIndex *
        POCKET_ANGLE;


    setText(
        "#rouletteResult",
        "SPINNING"
    );


    ballTrack.classList.remove(
        "ball-drop"
    );


    /*
        WHEEL:

        The chosen winning pocket will finish
        directly under the pointer at 12 o'clock.

        Wheel spins clockwise several times.
    */

    const extraWheelSpins =
        7 +
        Math.floor(
            Math.random() * 3
        );


    const currentWheel =
        normalizeAngle(
            wheelRotation
        );


    const desiredWheel =
        normalizeAngle(
            -pocketAngle
        );


    const wheelDifference =
        normalizeAngle(
            desiredWheel -
            currentWheel
        );


    wheelRotation +=
        extraWheelSpins *
        360 +
        wheelDifference;


    /*
        BALL:

        Ball rotates the opposite direction.

        It completes more revolutions than the wheel
        to create a realistic counter-rotation.
    */

    const extraBallSpins =
        11 +
        Math.floor(
            Math.random() * 3
        );


    ballRotation -=
        extraBallSpins *
        360;


    wheel.style.transform =
        `rotate(${wheelRotation}deg)`;


    ballTrack.style.transform =
        `rotate(${ballRotation}deg)`;


    /*
        Near the end of the animation,
        visually move the ball inward.
    */

    setTimeout(
        () => {

            ballTrack.classList.add(
                "ball-drop"
            );

        },
        3900
    );


    /*
        Finish result after animation.
    */

    setTimeout(
        () => {

            finishRoulette(
                winningNumber
            );


            rouletteSpinning =
                false;


            if (spinButton) {

                spinButton.disabled =
                    false;

            }

        },
        6700
    );

}


/* ==========================================================
   FINISH ROULETTE
   ========================================================== */

function finishRoulette(
    winningNumber
) {

    const won =
        rouletteBetWins(
            winningNumber
        );


    /*
        Deduct original wager first.
    */

    profile.balance -=
        betAmount;


    if (won) {

        /*
            Example:
            1:1 = wager + equal profit
            2:1 = wager + 2x profit
            35:1 = wager + 35x profit
        */

        const totalReturn =
            betAmount *
            (
                selectedRouletteBet.payout +
                1
            );


        profile.balance +=
            totalReturn;

    }


    const color =
        rouletteResultName(
            winningNumber
        );


    setText(
        "#rouletteResult",
        `${winningNumber} • ${color}`
    );


    recordResult(
        won,
        "roulette"
    );


    /*
        If player's remaining balance is below
        the selected wager, automatically lower it.
    */

    if (
        profile.balance > 0 &&
        betAmount > profile.balance
    ) {

        betAmount =
            profile.balance;


        setText(
            "#betAmount",
            formatCredits(
                betAmount
            )
        );

    }


    if (
        profile.balance <= 0
    ) {

        betAmount = 0;


        setText(
            "#betAmount",
            "0 AC"
        );

    }

}


/* ==========================================================
   HIGH ROLL
   ========================================================== */

function rollDice() {

    const diceSymbols = [
        "⚀",
        "⚁",
        "⚂",
        "⚃",
        "⚄",
        "⚅"
    ];


    const house =
        1 +
        Math.floor(
            Math.random() * 6
        );


    const player =
        1 +
        Math.floor(
            Math.random() * 6
        );


    setText(
        "#houseDice",
        diceSymbols[
            house - 1
        ]
    );


    setText(
        "#playerDice",
        diceSymbols[
            player - 1
        ]
    );


    if (player > house) {

        profile.balance += 250;


        setText(
            "#diceMessage",
            "You win! +250 AC"
        );


        recordResult(
            true,
            "dice"
        );


        return;
    }


    if (player < house) {

        setText(
            "#diceMessage",
            "House wins."
        );


        recordResult(
            false,
            "dice"
        );


        return;
    }


    setText(
        "#diceMessage",
        "Tie game."
    );


    recordResult(
        null,
        "dice"
    );

}


/* ==========================================================
   LEADERBOARD
   ========================================================== */

function sortLeaderboard(type) {

    const table =
        $("#leaderboardTable");


    if (!table) {
        return;
    }


    const tbody =
        table.querySelector("tbody");


    const rows =
        Array.from(
            tbody.querySelectorAll("tr")
        );


    rows.sort((a, b) => {

        if (type === "balance") {

            return (
                Number(b.dataset.balance)
                -
                Number(a.dataset.balance)
            );

        }


        if (type === "wins") {

            return (
                Number(b.dataset.wins)
                -
                Number(a.dataset.wins)
            );

        }


        if (type === "prestige") {

            return (
                Number(b.dataset.prestige)
                -
                Number(a.dataset.prestige)
            );

        }


        return 0;

    });


    rows.forEach(
        (row, index) => {

            const rank =
                row.querySelector("td");


            if (rank) {

                rank.textContent =
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    );

            }


            tbody.appendChild(row);

        }
    );

}


/* ==========================================================
   INITIALIZE
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        buildRouletteWheel();

        buildRouletteTable();

        updateAllDisplays();

    }
);
