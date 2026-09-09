const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* ==========================================================
   CORE PROFILE DATA
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

        localStorage.setItem(
            "gildedAceProfile",
            JSON.stringify(DEFAULT_PROFILE)
        );

        return {
            ...DEFAULT_PROFILE,
            collection: []
        };

    }

    try {

        const parsed =
            JSON.parse(saved);

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
   GLOBAL DISPLAY UPDATES
   ========================================================== */

function updateAllDisplays() {

    updateBalanceDisplays();

    updateProfilePage();

    updateCollectionPage();

    updateStoreButtons();

}


function updateBalanceDisplays() {

    $$("[data-balance]").forEach(
        (element) => {

            element.textContent =
                formatCredits(profile.balance);

        }
    );

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
   STORE ITEMS
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


/* ==========================================================
   PURCHASE ITEM
   ========================================================== */

function buyItem(name, price) {

    const existing =
        profile.collection.find(
            (item) => item.name === name
        );


    if (existing) {

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


    const itemData =
        STORE_ITEMS[name] || {
            category: "collectible",
            price: price
        };


    profile.balance -= price;


    profile.collection.push({

        name: name,

        price: price,

        category: itemData.category,

        purchased:
            new Date().toISOString()

    });


    saveProfile();


    alert(
        `${name} added to your collection.`
    );

}


/* ==========================================================
   STORE BUTTON STATE
   ========================================================== */

function updateStoreButtons() {

    const buttons =
        $$("button[onclick^='buyItem']");


    buttons.forEach(
        (button) => {

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


            const itemName =
                match[1];


            const owned =
                profile.collection.some(
                    (item) =>
                        item.name === itemName
                );


            if (owned) {

                button.textContent =
                    "OWNED";

                button.disabled =
                    true;

                button.style.opacity =
                    "0.55";

                button.style.cursor =
                    "default";

            }

        }
    );

}


/* ==========================================================
   COLLECTION PAGE
   ========================================================== */

let currentCollectionFilter =
    "all";


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


    filtered.forEach(
        (item) => {

            const card =
                document.createElement(
                    "div"
                );

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

        }
    );


    const empty =
        $("#emptyCollection");


    if (empty) {

        empty.style.display =
            filtered.length
                ? "none"
                : "block";

    }


    const count =
        $("#collectionCount");

    if (count) {

        count.textContent =
            items.length;

    }


    const totalValue =
        items.reduce(
            (sum, item) =>
                sum + Number(item.price || 0),
            0
        );


    const valueElement =
        $("#collectionValue");

    if (valueElement) {

        valueElement.textContent =
            formatCredits(totalValue);

    }


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


    const highestElement =
        $("#highestPurchase");

    if (highestElement) {

        highestElement.textContent =
            highest
                ? highest.name
                : "—";

    }

}


/* ==========================================================
   COLLECTION FILTERS
   ========================================================== */

function filterCollection(
    category,
    button
) {

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


/* ==========================================================
   MEMBERSHIP STATUS
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
                (balance / 100000) * 100
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


    const total =
        profile.collection.reduce(
            (sum, item) =>
                sum + Number(item.price || 0),
            0
        );


    setText(
        "#profileCollectionValue",
        formatCredits(total)
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


function setText(
    selector,
    value
) {

    const element =
        $(selector);

    if (element) {

        element.textContent =
            value;

    }

}


/* ==========================================================
   USERNAME
   ========================================================== */

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


/* ==========================================================
   RESET PROFILE
   ========================================================== */

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
   RECORD GAME RESULT
   ========================================================== */

function recordResult(
    won,
    game
) {

    profile.gamesPlayed++;


    if (won === true) {

        profile.wins++;

    }


    if (won === false) {

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


    suits.forEach(
        (suit) => {

            ranks.forEach(
                (rank) => {

                    deck.push({
                        suit,
                        rank
                    });

                }
            );

        }
    );


    return shuffle(deck);

}


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


function cardValue(card) {

    if (
        ["J", "Q", "K"].includes(
            card.rank
        )
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


    hand.forEach(
        (card) => {

            total +=
                cardValue(card);

            if (
                card.rank === "A"
            ) {

                aces++;

            }

        }
    );


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
                )
                + " ?";

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


    const total =
        handValue(
            blackjackPlayer
        );


    if (total > 21) {

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

        setText(
            "#blackjackMessage",
            "You win!"
        );


        profile.balance +=
            500;


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

        profile.balance +=
            2500;


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
   EUROPEAN ROULETTE
   ========================================================== */

const europeanWheel = [

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


const redNumbers =
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


let selectedBet = null;

let betAmount = 100;

let rouletteSpinning = false;

let wheelRotation = 0;

let ballRotation = 0;


/* ==========================================================
   BUILD WHEEL LABELS
   ========================================================== */

function initRoulette() {

    const container =
        $("#rouletteNumbers");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    europeanWheel.forEach(
        (number, index) => {

            const holder =
                document.createElement(
                    "div"
                );


            holder.className =
                "roulette-number";


            const angle =
                index *
                (
                    360 /
                    europeanWheel.length
                );


            holder.style.transform =
                `rotate(${angle}deg)`;


            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                number;


            span.style.transform =
                `rotate(${-angle}deg)`;


            holder.appendChild(
                span
            );


            container.appendChild(
                holder
            );

        }
    );

}


/* ==========================================================
   ROULETTE BETS
   ========================================================== */

function selectBet(
    bet,
    button
) {

    selectedBet =
        bet;


    $$(".bet-row button").forEach(
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


    setText(
        "#selectedBet",
        bet.toUpperCase()
    );

}


function changeBet(amount) {

    let newAmount =
        betAmount + amount;


    newAmount =
        Math.max(
            100,
            newAmount
        );


    newAmount =
        Math.min(
            profile.balance,
            newAmount
        );


    betAmount =
        newAmount;


    setText(
        "#betAmount",
        formatCredits(
            betAmount
        )
    );

}


function rouletteBetWins(
    number,
    bet
) {

    if (
        bet === "red"
    ) {

        return (
            number !== 0 &&
            redNumbers.has(number)
        );

    }


    if (
        bet === "black"
    ) {

        return (
            number !== 0 &&
            !redNumbers.has(number)
        );

    }


    if (
        bet === "even"
    ) {

        return (
            number !== 0 &&
            number % 2 === 0
        );

    }


    if (
        bet === "odd"
    ) {

        return (
            number !== 0 &&
            number % 2 === 1
        );

    }


    if (
        bet === "low"
    ) {

        return (
            number >= 1 &&
            number <= 18
        );

    }


    if (
        bet === "high"
    ) {

        return (
            number >= 19 &&
            number <= 36
        );

    }


    return false;

}


/* ==========================================================
   ROULETTE SPIN
   ========================================================== */

function spinRoulette() {

    if (rouletteSpinning) {
        return;
    }


    if (!selectedBet) {

        alert(
            "Select a roulette bet first."
        );

        return;

    }


    if (
        profile.balance <
        betAmount
    ) {

        alert(
            "You do not have enough Ace Credits."
        );

        return;

    }


    const wheel =
        $("#rouletteWheel");

    const ball =
        $("#ballTrack");

    const button =
        $("#rouletteSpinButton");


    if (
        !wheel ||
        !ball
    ) {

        return;

    }


    rouletteSpinning =
        true;


    if (button) {

        button.disabled =
            true;

    }


    const winningIndex =
        Math.floor(
            Math.random() *
            europeanWheel.length
        );


    const winningNumber =
        europeanWheel[
            winningIndex
        ];


    setText(
        "#rouletteResult",
        "SPINNING"
    );


    ball.classList.remove(
        "ball-drop"
    );


    const pocketAngle =
        360 /
        europeanWheel.length;


    const selectedPocketAngle =
        winningIndex *
        pocketAngle;


    const wheelExtraSpins =
        7 +
        Math.floor(
            Math.random() * 3
        );


    const targetWheelAngle =
        360 -
        selectedPocketAngle;


    const currentWheelMod =
        (
            wheelRotation %
            360 +
            360
        ) % 360;


    const wheelCorrection =
        (
            targetWheelAngle -
            currentWheelMod +
            360
        ) % 360;


    wheelRotation +=
        wheelExtraSpins *
        360 +
        wheelCorrection;


    const ballExtraSpins =
        12 +
        Math.floor(
            Math.random() * 3
        );


    const ballTargetAngle =
        selectedPocketAngle;


    const currentBallMod =
        (
            ballRotation %
            360 +
            360
        ) % 360;


    const ballCorrection =
        (
            ballTargetAngle -
            currentBallMod +
            360
        ) % 360;


    ballRotation -=
        ballExtraSpins *
        360;


    ballRotation -=
        ballCorrection;


    wheel.style.transform =
        `rotate(${wheelRotation}deg)`;


    ball.style.transform =
        `rotate(${ballRotation}deg)`;


    setTimeout(
        () => {

            ball.classList.add(
                "ball-drop"
            );

        },
        3900
    );


    setTimeout(
        () => {

            finishRoulette(
                winningNumber
            );


            if (button) {

                button.disabled =
                    false;

            }


            rouletteSpinning =
                false;

        },
        7100
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
            winningNumber,
            selectedBet
        );


    profile.balance -=
        betAmount;


    if (won) {

        profile.balance +=
            betAmount * 2;

    }


    let color =
        "BLACK";


    if (
        winningNumber === 0
    ) {

        color =
            "GREEN";

    } else if (
        redNumbers.has(
            winningNumber
        )
    ) {

        color =
            "RED";

    }


    setText(
        "#rouletteResult",
        `${winningNumber} • ${color}`
    );


    recordResult(
        won,
        "roulette"
    );

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


    if (
        player > house
    ) {

        profile.balance +=
            250;


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


    if (
        player < house
    ) {

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
   LEADERBOARD SORTING
   ========================================================== */

function sortLeaderboard(
    type
) {

    const table =
        $("#leaderboardTable");

    if (!table) {
        return;
    }


    const tbody =
        table.querySelector(
            "tbody"
        );


    const rows =
        Array.from(
            tbody.querySelectorAll(
                "tr"
            )
        );


    rows.sort(
        (a, b) => {

            if (
                type === "balance"
            ) {

                return (
                    Number(
                        b.dataset.balance
                    )
                    -
                    Number(
                        a.dataset.balance
                    )
                );

            }


            if (
                type === "wins"
            ) {

                return (
                    Number(
                        b.dataset.wins
                    )
                    -
                    Number(
                        a.dataset.wins
                    )
                );

            }


            if (
                type === "prestige"
            ) {

                return (
                    Number(
                        b.dataset.prestige
                    )
                    -
                    Number(
                        a.dataset.prestige
                    )
                );

            }


            return 0;

        }
    );


    rows.forEach(
        (row, index) => {

            const rankCell =
                row.querySelector(
                    "td"
                );


            if (rankCell) {

                rankCell.textContent =
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    );

            }


            tbody.appendChild(
                row
            );

        }
    );

}


/* ==========================================================
   INITIALIZE SITE
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initRoulette();

        updateAllDisplays();

    }
);
