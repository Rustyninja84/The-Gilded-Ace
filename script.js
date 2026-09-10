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
        localStorage.getItem(
            "gildedAceProfile"
        );


    if (!saved) {

        const oldBalance =
            Number(
                localStorage.getItem(
                    "ga_balance"
                )
            );


        const fresh = {
            ...DEFAULT_PROFILE,
            collection: []
        };


        if (
            Number.isFinite(oldBalance) &&
            oldBalance > 0
        ) {

            fresh.balance =
                oldBalance;

        }


        localStorage.setItem(
            "gildedAceProfile",
            JSON.stringify(fresh)
        );


        return fresh;

    }


    try {

        const parsed =
            JSON.parse(saved);


        return {
            ...DEFAULT_PROFILE,
            ...parsed,

            collection:
                Array.isArray(
                    parsed.collection
                )
                    ? parsed.collection
                    : []
        };

    } catch (error) {

        console.error(
            "Could not load profile.",
            error
        );


        return {
            ...DEFAULT_PROFILE,
            collection: []
        };

    }

}


let profile =
    loadProfile();


function saveProfile() {

    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(profile)
    );


    updateAllDisplays();

}


function formatCredits(amount) {

    return (
        Number(amount || 0)
            .toLocaleString()
        +
        " AC"
    );

}


/* ==========================================================
   DISPLAY HELPERS
   ========================================================== */

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


function updateBalanceDisplays() {

    $$("[data-balance]")
        .forEach(
            (element) => {

                element.textContent =
                    formatCredits(
                        profile.balance
                    );

            }
        );

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
        new Date()
            .toDateString();


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


    profile.balance +=
        1000;


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


function buyItem(
    name,
    price
) {

    const owned =
        profile.collection.some(
            (item) =>
                item.name === name
        );


    if (owned) {

        alert(
            "You already own this item."
        );

        return;

    }


    if (
        profile.balance <
        price
    ) {

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


    profile.balance -=
        price;


    profile.collection.push({

        name,

        price,

        category:
            storeItem.category,

        purchased:
            new Date()
                .toISOString()

    });


    saveProfile();


    alert(
        `${name} added to your collection.`
    );

}


function updateStoreButtons() {

    const buttons =
        $$(
            "button[onclick*='buyItem']"
        );


    buttons.forEach(
        (button) => {

            const onclick =
                button.getAttribute(
                    "onclick"
                );


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
                        item.name ===
                        name
                );


            if (owned) {

                button.textContent =
                    "OWNED";

                button.disabled =
                    true;

            }

        }
    );

}


/* ==========================================================
   COLLECTION
   ========================================================== */

let currentCollectionFilter =
    "all";


function filterCollection(
    category,
    button
) {

    currentCollectionFilter =
        category;


    $$(".collection-filter")
        .forEach(
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


            grid.appendChild(
                card
            );

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


    setText(
        "#collectionCount",
        items.length
    );


    const value =
        items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.price || 0
                ),
            0
        );


    setText(
        "#collectionValue",
        formatCredits(
            value
        )
    );


    const highest =
        items.reduce(
            (best, item) => {

                if (
                    !best ||
                    item.price >
                    best.price
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

function getMembershipTier(
    balance
) {

    if (
        balance >=
        10000000
    ) {

        return {
            current: "CASINO OWNER",
            next: "MAXIMUM TIER",
            progress: 100
        };

    }


    if (
        balance >=
        5000000
    ) {

        return {
            current: "DIAMOND CLUB",
            next: "CASINO OWNER",
            progress:
                (
                    (
                        balance -
                        5000000
                    )
                    /
                    5000000
                )
                *
                100
        };

    }


    if (
        balance >=
        1000000
    ) {

        return {
            current: "HIGH ROLLER",
            next: "DIAMOND CLUB",
            progress:
                (
                    (
                        balance -
                        1000000
                    )
                    /
                    4000000
                )
                *
                100
        };

    }


    if (
        balance >=
        100000
    ) {

        return {
            current: "GOLD MEMBER",
            next: "HIGH ROLLER",
            progress:
                (
                    (
                        balance -
                        100000
                    )
                    /
                    900000
                )
                *
                100
        };

    }


    return {
        current: "STANDARD",
        next: "GOLD MEMBER",
        progress:
            Math.min(
                100,
                balance /
                100000 *
                100
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


    const statusLabel =
        tier.current ===
        "STANDARD"
            ? "STANDARD MEMBER"
            : tier.current;


    setText(
        "#profileStatus",
        statusLabel
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
            `${
                Math.max(
                    0,
                    Math.min(
                        100,
                        tier.progress
                    )
                )
            }%`;

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
                sum +
                Number(
                    item.price || 0
                ),
            0
        );


    setText(
        "#profileCollectionValue",
        formatCredits(
            value
        )
    );


    const highest =
        profile.collection.reduce(
            (best, item) => {

                if (
                    !best ||
                    item.price >
                    best.price
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


    if (
        name.length < 3
    ) {

        alert(
            "Username must be at least 3 characters."
        );

        return;

    }


    profile.username =
        name.substring(
            0,
            20
        );


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

function recordResult(
    won,
    game
) {

    profile.gamesPlayed++;


    if (won === true) {

        profile.wins++;

    } else if (
        won === false
    ) {

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

let blackjackDeck =
    [];


let blackjackPlayer =
    [];


let blackjackDealer =
    [];


let blackjackActive =
    false;


let blackjackBet =
    500;


let blackjackBetLocked =
    0;


/* ==========================================================
   BLACKJACK DECK
   ========================================================== */

function shuffle(array) {

    for (
        let i =
            array.length - 1;

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
        ]
        =
        [
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


/* ==========================================================
   BLACKJACK CARD VALUES
   ========================================================== */

function cardValue(card) {

    if (
        card.rank === "J" ||
        card.rank === "Q" ||
        card.rank === "K"
    ) {

        return 10;

    }


    if (
        card.rank === "A"
    ) {

        return 11;

    }


    return Number(
        card.rank
    );

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


function isBlackjack(hand) {

    return (
        hand.length === 2 &&
        handValue(hand) === 21
    );

}


/* ==========================================================
   CREATE VISUAL CARD
   ========================================================== */

function createPlayingCard(
    card,
    hidden = false
) {

    const element =
        document.createElement(
            "div"
        );


    if (hidden) {

        element.className =
            "playing-card card-back";


        return element;

    }


    const red =
        card.suit === "♥" ||
        card.suit === "♦";


    element.className =
        red
            ? "playing-card red-card"
            : "playing-card";


    element.innerHTML = `

        <div class="card-corner">

            <span>
                ${card.rank}
            </span>

            <span>
                ${card.suit}
            </span>

        </div>


        <div class="card-suit-large">

            ${card.suit}

        </div>


        <div class="card-corner bottom">

            <span>
                ${card.rank}
            </span>

            <span>
                ${card.suit}
            </span>

        </div>

    `;


    return element;

}


/* ==========================================================
   RENDER BLACKJACK
   ========================================================== */

function renderBlackjack(
    hideDealer = false
) {

    const playerArea =
        document.getElementById(
            "playerCards"
        );


    const dealerArea =
        document.getElementById(
            "dealerCards"
        );


    if (playerArea) {

        playerArea.innerHTML =
            "";


        if (
            blackjackPlayer.length === 0
        ) {

            playerArea.innerHTML = `
                <div class="playing-card card-back"></div>
                <div class="playing-card card-back"></div>
            `;

        } else {

            blackjackPlayer.forEach(
                (card) => {

                    playerArea.appendChild(
                        createPlayingCard(
                            card
                        )
                    );

                }
            );

        }

    }


    if (dealerArea) {

        dealerArea.innerHTML =
            "";


        if (
            blackjackDealer.length === 0
        ) {

            dealerArea.innerHTML = `
                <div class="playing-card card-back"></div>
                <div class="playing-card card-back"></div>
            `;

        } else {

            blackjackDealer.forEach(
                (card, index) => {

                    dealerArea.appendChild(
                        createPlayingCard(
                            card,
                            hideDealer &&
                            index === 1
                        )
                    );

                }
            );

        }

    }


    setText(
        "#playerTotal",
        blackjackPlayer.length
            ? handValue(
                blackjackPlayer
            )
            : "—"
    );


    if (
        !blackjackDealer.length
    ) {

        setText(
            "#dealerTotal",
            "—"
        );

    } else if (
        hideDealer
    ) {

        setText(
            "#dealerTotal",
            cardValue(
                blackjackDealer[0]
            )
        );

    } else {

        setText(
            "#dealerTotal",
            handValue(
                blackjackDealer
            )
        );

    }

}


/* ==========================================================
   BLACKJACK CONTROLS
   ========================================================== */

function setBlackjackControls(
    active
) {

    const deal =
        document.getElementById(
            "blackjackDealButton"
        );


    const hit =
        document.getElementById(
            "blackjackHitButton"
        );


    const stand =
        document.getElementById(
            "blackjackStandButton"
        );


    if (deal) {

        deal.disabled =
            active;

    }


    if (hit) {

        hit.disabled =
            !active;

    }


    if (stand) {

        stand.disabled =
            !active;

    }

}


/* ==========================================================
   BLACKJACK BET DISPLAY
   ========================================================== */

function updateBlackjackBetDisplay() {

    if (
        profile.balance < 100 &&
        !blackjackActive
    ) {

        blackjackBet = 0;

    }


    setText(
        "#blackjackBetAmount",
        formatCredits(
            blackjackBet
        )
    );

}


/* ==========================================================
   BLACKJACK BETTING
   ========================================================== */

function setBlackjackBet(amount) {

    if (blackjackActive) {
        return;
    }


    if (
        profile.balance < 100
    ) {

        blackjackBet = 0;

        updateBlackjackBetDisplay();

        return;

    }


    blackjackBet =
        Math.max(
            100,
            Math.min(
                Number(amount),
                profile.balance
            )
        );


    updateBlackjackBetDisplay();

}


function changeBlackjackBet(
    change
) {

    if (blackjackActive) {
        return;
    }


    if (
        profile.balance < 100
    ) {

        blackjackBet = 0;

        updateBlackjackBetDisplay();

        return;

    }


    blackjackBet +=
        Number(change);


    blackjackBet =
        Math.max(
            100,
            blackjackBet
        );


    blackjackBet =
        Math.min(
            profile.balance,
            blackjackBet
        );


    updateBlackjackBetDisplay();

}


function maxBlackjackBet() {

    if (blackjackActive) {
        return;
    }


    if (
        profile.balance <
        100
    ) {

        blackjackBet = 0;

    } else {

        blackjackBet =
            profile.balance;

    }


    updateBlackjackBetDisplay();

}


/* ==========================================================
   START BLACKJACK HAND
   ========================================================== */

function startBlackjack() {

    if (blackjackActive) {
        return;
    }


    if (
        blackjackBet < 100 ||
        profile.balance <
        blackjackBet
    ) {

        alert(
            "You need enough Ace Credits to cover your bet."
        );

        return;

    }


    const table =
        document.querySelector(
            ".blackjack-casino-table"
        );


    if (table) {

        table.classList.remove(
            "blackjack-win"
        );

    }


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


    blackjackBetLocked =
        blackjackBet;


    profile.balance -=
        blackjackBetLocked;


    saveProfile();


    renderBlackjack(true);


    setBlackjackControls(
        true
    );


    setText(
        "#blackjackMessage",
        "Your turn. HIT or STAND."
    );


    const playerBJ =
        isBlackjack(
            blackjackPlayer
        );


    const dealerBJ =
        isBlackjack(
            blackjackDealer
        );


    if (
        playerBJ ||
        dealerBJ
    ) {

        setTimeout(
            () => {

                resolveInitialBlackjack(
                    playerBJ,
                    dealerBJ
                );

            },
            600
        );

    }

}


/* ==========================================================
   NATURAL BLACKJACK
   ========================================================== */

function resolveInitialBlackjack(
    playerBJ,
    dealerBJ
) {

    blackjackActive =
        false;


    renderBlackjack(false);


    setBlackjackControls(
        false
    );


    if (
        playerBJ &&
        dealerBJ
    ) {

        profile.balance +=
            blackjackBetLocked;


        saveProfile();


        setText(
            "#blackjackMessage",
            "Both have Blackjack — PUSH."
        );


        recordResult(
            null,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    if (playerBJ) {

        const profit =
            blackjackBetLocked *
            1.5;


        const totalReturn =
            blackjackBetLocked +
            profit;


        profile.balance +=
            totalReturn;


        saveProfile();


        blackjackWinEffect();


        setText(
            "#blackjackMessage",
            `BLACKJACK! You win ${formatCredits(profit)}.`
        );


        recordResult(
            true,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    setText(
        "#blackjackMessage",
        "Dealer Blackjack — house wins."
    );


    recordResult(
        false,
        "blackjack"
    );


    prepareNextBlackjackBet();

}


/* ==========================================================
   BLACKJACK HIT
   ========================================================== */

function blackjackHit() {

    if (!blackjackActive) {
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


    if (
        total > 21
    ) {

        blackjackActive =
            false;


        renderBlackjack(false);


        setBlackjackControls(
            false
        );


        setText(
            "#blackjackMessage",
            `BUST — ${total}. House wins.`
        );


        recordResult(
            false,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    if (
        total === 21
    ) {

        setText(
            "#blackjackMessage",
            "21! Dealer's turn."
        );


        setTimeout(
            blackjackStand,
            450
        );


        return;

    }


    setText(
        "#blackjackMessage",
        `Your total is ${total}. HIT or STAND.`
    );

}


/* ==========================================================
   BLACKJACK STAND
   ========================================================== */

function blackjackStand() {

    if (!blackjackActive) {
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


    setBlackjackControls(
        false
    );


    const playerTotal =
        handValue(
            blackjackPlayer
        );


    const dealerTotal =
        handValue(
            blackjackDealer
        );


    if (
        dealerTotal > 21
    ) {

        payBlackjackWin();


        blackjackWinEffect();


        setText(
            "#blackjackMessage",
            `Dealer busts with ${dealerTotal}. You win ${formatCredits(blackjackBetLocked)}.`
        );


        recordResult(
            true,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    if (
        playerTotal >
        dealerTotal
    ) {

        payBlackjackWin();


        blackjackWinEffect();


        setText(
            "#blackjackMessage",
            `${playerTotal} beats ${dealerTotal}. You win ${formatCredits(blackjackBetLocked)}.`
        );


        recordResult(
            true,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    if (
        playerTotal <
        dealerTotal
    ) {

        setText(
            "#blackjackMessage",
            `${dealerTotal} beats ${playerTotal}. House wins.`
        );


        recordResult(
            false,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    profile.balance +=
        blackjackBetLocked;


    saveProfile();


    setText(
        "#blackjackMessage",
        `${playerTotal} to ${dealerTotal} — PUSH.`
    );


    recordResult(
        null,
        "blackjack"
    );


    prepareNextBlackjackBet();

}


/* ==========================================================
   NORMAL BLACKJACK WIN
   ========================================================== */

function payBlackjackWin() {

    profile.balance +=
        blackjackBetLocked * 2;


    saveProfile();

}


/* ==========================================================
   BLACKJACK WIN EFFECT
   ========================================================== */

function blackjackWinEffect() {

    const table =
        document.querySelector(
            ".blackjack-casino-table"
        );


    if (!table) {
        return;
    }


    table.classList.add(
        "blackjack-win"
    );


    setTimeout(
        () => {

            table.classList.remove(
                "blackjack-win"
            );

        },
        2200
    );

}


/* ==========================================================
   PREPARE NEXT BLACKJACK BET
   ========================================================== */

function prepareNextBlackjackBet() {

    if (
        profile.balance <
        100
    ) {

        blackjackBet = 0;

    } else if (
        blackjackBet >
        profile.balance
    ) {

        blackjackBet =
            profile.balance;

    }


    updateBlackjackBetDisplay();

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
        reels[0] ===
        reels[1]
        &&
        reels[1] ===
        reels[2];


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
    360 /
    POCKET_COUNT;


let selectedRouletteBet =
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
   ROULETTE COLORS
   ========================================================== */

function rouletteColor(number) {

    if (
        number === 0
    ) {

        return "green";

    }


    return RED_NUMBERS.has(
        number
    )
        ? "red"
        : "black";

}


function rouletteColorHex(
    number
) {

    if (
        number === 0
    ) {

        return "#087541";

    }


    return RED_NUMBERS.has(
        number
    )
        ? "#a50b20"
        : "#111111";

}


/* ==========================================================
   BUILD ROULETTE WHEEL
   ========================================================== */

function buildRouletteWheel() {

    const wheel =
        document.getElementById(
            "rouletteWheel"
        );


    const layer =
        document.getElementById(
            "roulettePocketLayer"
        );


    if (
        !wheel ||
        !layer
    ) {

        return;

    }


    layer.innerHTML =
        "";


    const sectors =
        [];


    EUROPEAN_WHEEL.forEach(
        (
            number,
            index
        ) => {

            const start =
                index *
                POCKET_ANGLE;


            const end =
                (
                    index + 1
                )
                *
                POCKET_ANGLE;


            sectors.push(
                `${rouletteColorHex(number)} ${start}deg ${end}deg`
            );

        }
    );


    wheel.style.background =
        `
        conic-gradient(
            from ${-POCKET_ANGLE / 2}deg,
            ${sectors.join(",")}
        )
        `;


    EUROPEAN_WHEEL.forEach(
        (
            number,
            index
        ) => {

            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "roulette-pocket-number";


            label.textContent =
                number;


            const angle =
                index *
                POCKET_ANGLE;


            const radians =
                (
                    angle -
                    90
                )
                *
                Math.PI
                /
                180;


            const radius =
                44;


            const x =
                50 +
                Math.cos(
                    radians
                )
                *
                radius;


            const y =
                50 +
                Math.sin(
                    radians
                )
                *
                radius;


            label.style.left =
                `${x}%`;


            label.style.top =
                `${y}%`;


            label.style.transform =
                `
                translate(-50%, -50%)
                rotate(${angle}deg)
                `;


            layer.appendChild(
                label
            );

        }
    );

}


/* ==========================================================
   BUILD ROULETTE TABLE
   ========================================================== */

function buildRouletteTable() {

    const grid =
        document.getElementById(
            "rouletteNumberGrid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML =
        "";


    for (
        let column = 0;

        column < 12;

        column++
    ) {

        const lowNumber =
            column * 3 + 1;


        const numbers = [
            lowNumber + 2,
            lowNumber + 1,
            lowNumber
        ];


        numbers.forEach(
            (number) => {

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
                    function() {

                        selectNumberBet(
                            number,
                            this
                        );

                    }
                );


                grid.appendChild(
                    button
                );

            }
        );

    }

}


/* ==========================================================
   ROULETTE SELECT BET
   ========================================================== */

function clearRouletteSelection() {

    document
        .querySelectorAll(
            ".roulette-table-wrapper button"
        )
        .forEach(
            (button) => {

                button.classList.remove(
                    "selected"
                );

            }
        );

}


function selectNumberBet(
    number,
    button
) {

    if (
        rouletteSpinning
    ) {

        return;

    }


    clearRouletteSelection();


    selectedRouletteBet = {
        type: "number",
        number: Number(number),
        label: `NUMBER ${number}`,
        payout: 35
    };


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


function selectRouletteBet(
    type,
    button
) {

    if (
        rouletteSpinning
    ) {

        return;

    }


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


    const bet =
        bets[type];


    if (!bet) {
        return;
    }


    clearRouletteSelection();


    selectedRouletteBet = {
        type,
        label: bet.label,
        payout: bet.payout
    };


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    setText(
        "#selectedBet",
        bet.label
    );


    setText(
        "#selectedPayout",
        `${bet.payout}:1 PAYOUT`
    );

}


/* ==========================================================
   ROULETTE BET AMOUNT
   ========================================================== */

function changeBet(change) {

    if (
        rouletteSpinning
    ) {

        return;

    }


    if (
        profile.balance <
        100
    ) {

        betAmount = 0;


        setText(
            "#betAmount",
            "0 AC"
        );


        return;

    }


    betAmount +=
        Number(change);


    if (
        betAmount <
        100
    ) {

        betAmount =
            100;

    }


    if (
        betAmount >
        profile.balance
    ) {

        betAmount =
            profile.balance;

    }


    setText(
        "#betAmount",
        formatCredits(
            betAmount
        )
    );

}


/* ==========================================================
   ROULETTE WIN CHECK
   ========================================================== */

function rouletteBetWins(
    number
) {

    if (
        !selectedRouletteBet
    ) {

        return false;

    }


    const type =
        selectedRouletteBet.type;


    if (
        type === "number"
    ) {

        return (
            number ===
            selectedRouletteBet.number
        );

    }


    if (
        number === 0
    ) {

        return false;

    }


    if (
        type === "red"
    ) {

        return RED_NUMBERS.has(
            number
        );

    }


    if (
        type === "black"
    ) {

        return !RED_NUMBERS.has(
            number
        );

    }


    if (
        type === "even"
    ) {

        return (
            number % 2 === 0
        );

    }


    if (
        type === "odd"
    ) {

        return (
            number % 2 !== 0
        );

    }


    if (
        type === "low"
    ) {

        return (
            number >= 1 &&
            number <= 18
        );

    }


    if (
        type === "high"
    ) {

        return (
            number >= 19 &&
            number <= 36
        );

    }


    if (
        type === "dozen1"
    ) {

        return (
            number >= 1 &&
            number <= 12
        );

    }


    if (
        type === "dozen2"
    ) {

        return (
            number >= 13 &&
            number <= 24
        );

    }


    if (
        type === "dozen3"
    ) {

        return (
            number >= 25 &&
            number <= 36
        );

    }


    return false;

}


/* ==========================================================
   ROULETTE RESULT
   ========================================================== */

function rouletteResultName(
    number
) {

    if (
        number === 0
    ) {

        return "GREEN";

    }


    return RED_NUMBERS.has(
        number
    )
        ? "RED"
        : "BLACK";

}


function normalizeAngle(
    angle
) {

    return (
        (
            angle %
            360
        )
        +
        360
    )
    %
    360;

}


/* ==========================================================
   SPIN ROULETTE
   ========================================================== */

function spinRoulette() {

    if (
        rouletteSpinning
    ) {

        return;

    }


    if (
        !selectedRouletteBet
    ) {

        alert(
            "Select a number or outside bet first."
        );

        return;

    }


    if (
        betAmount < 100 ||
        profile.balance <
        betAmount
    ) {

        alert(
            "You need at least 100 Ace Credits to spin."
        );

        return;

    }


    const wheel =
        document.getElementById(
            "rouletteWheel"
        );


    const ballTrack =
        document.getElementById(
            "ballTrack"
        );


    const spinButton =
        document.getElementById(
            "rouletteSpinButton"
        );


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


    const winningIndex =
        Math.floor(
            Math.random() *
            POCKET_COUNT
        );


    const winningNumber =
        EUROPEAN_WHEEL[
            winningIndex
        ];


    const targetPocketAngle =
        winningIndex *
        POCKET_ANGLE;


    const currentWheelAngle =
        normalizeAngle(
            wheelRotation
        );


    const desiredWheelAngle =
        normalizeAngle(
            -targetPocketAngle
        );


    const neededRotation =
        normalizeAngle(
            desiredWheelAngle -
            currentWheelAngle
        );


    const extraWheelSpins =
        7 +
        Math.floor(
            Math.random() *
            3
        );


    wheelRotation +=
        (
            extraWheelSpins *
            360
        )
        +
        neededRotation;


    const extraBallSpins =
        11 +
        Math.floor(
            Math.random() *
            3
        );


    ballRotation -=
        extraBallSpins *
        360;


    setText(
        "#rouletteResult",
        "SPINNING"
    );


    ballTrack.classList.remove(
        "ball-drop"
    );


    void ballTrack.offsetWidth;


    wheel.style.transform =
        `rotate(${wheelRotation}deg)`;


    ballTrack.style.transform =
        `rotate(${ballRotation}deg)`;


    setTimeout(
        () => {

            ballTrack.classList.add(
                "ball-drop"
            );

        },
        4000
    );


    setTimeout(
        () => {

            finishRoulette(
                winningNumber
            );


            rouletteSpinning =
                false;


            if (
                spinButton
            ) {

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


    profile.balance -=
        betAmount;


    if (won) {

        const totalReturn =
            betAmount *
            (
                selectedRouletteBet.payout
                +
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


    if (
        profile.balance >=
        100 &&
        betAmount >
        profile.balance
    ) {

        betAmount =
            profile.balance;

    }


    if (
        profile.balance <
        100
    ) {

        betAmount =
            0;

    }


    setText(
        "#betAmount",
        formatCredits(
            betAmount
        )
    );

}


/* ==========================================================
   HIGH ROLL DICE
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
            Math.random() *
            6
        );


    const player =
        1 +
        Math.floor(
            Math.random() *
            6
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
        player >
        house
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
        player <
        house
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
   LEADERBOARD
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
                type ===
                "balance"
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
                type ===
                "wins"
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
                type ===
                "prestige"
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
        (
            row,
            index
        ) => {

            const rank =
                row.querySelector(
                    "td"
                );


            if (rank) {

                rank.textContent =
                    String(
                        index + 1
                    )
                    .padStart(
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
   EXPOSE FUNCTIONS TO HTML
   ========================================================== */

window.claimDaily =
    claimDaily;


window.buyItem =
    buyItem;


window.filterCollection =
    filterCollection;


window.changeUsername =
    changeUsername;


window.resetGildedProfile =
    resetGildedProfile;


window.startBlackjack =
    startBlackjack;


window.blackjackHit =
    blackjackHit;


window.blackjackStand =
    blackjackStand;


window.setBlackjackBet =
    setBlackjackBet;


window.changeBlackjackBet =
    changeBlackjackBet;


window.maxBlackjackBet =
    maxBlackjackBet;


window.spinSlots =
    spinSlots;


window.selectNumberBet =
    selectNumberBet;


window.selectRouletteBet =
    selectRouletteBet;


window.changeBet =
    changeBet;


window.spinRoulette =
    spinRoulette;


window.rollDice =
    rollDice;


window.sortLeaderboard =
    sortLeaderboard;


/* ==========================================================
   INITIALIZE SITE
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        buildRouletteWheel();

        buildRouletteTable();

        renderBlackjack(false);

        setBlackjackControls(
            false
        );

        updateAllDisplays();

        updateBlackjackBetDisplay();


        if (
            profile.balance >=
            100
        ) {

            betAmount =
                Math.min(
                    Math.max(
                        100,
                        betAmount
                    ),
                    profile.balance
                );

        } else {

            betAmount =
                0;

        }


        setText(
            "#betAmount",
            formatCredits(
                betAmount
            )
        );

    }
);
