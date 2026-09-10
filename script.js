/* ==========================================================
   THE GILDED ACE
   COMPLETE SCRIPT.JS
   ========================================================== */


/* ==========================================================
   HELPERS
   ========================================================== */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


function setText(selector, value) {

    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }

}


function formatCredits(amount) {

    return (
        Math.floor(
            Number(amount) || 0
        ).toLocaleString()
        +
        " AC"
    );

}


/* ==========================================================
   PROFILE
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


    if (saved) {

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

        }

        catch (error) {

            console.error(
                "Profile load error:",
                error
            );

        }

    }


    const oldBalance =
        Number(
            localStorage.getItem(
                "ga_balance"
            )
        );


    const freshProfile = {

        ...DEFAULT_PROFILE,

        collection: []

    };


    if (
        Number.isFinite(oldBalance) &&
        oldBalance > 0
    ) {

        freshProfile.balance =
            oldBalance;

    }


    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(
            freshProfile
        )
    );


    return freshProfile;

}


let profile =
    loadProfile();


function saveProfile() {

    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(profile)
    );


    updateBalanceDisplays();

    updateProfilePage();

    updateCollectionPage();

    updateStoreButtons();

}


function updateBalanceDisplays() {

    document
        .querySelectorAll(
            "[data-balance]"
        )
        .forEach(
            (element) => {

                element.textContent =
                    formatCredits(
                        profile.balance
                    );

            }
        );

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
            "You already claimed today's reward."
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
   GAME STATS
   ========================================================== */

function recordResult(
    won,
    game
) {

    profile.gamesPlayed++;


    if (won === true) {

        profile.wins++;

    }

    else if (won === false) {

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
        Number(price)
    ) {

        alert(
            "You do not have enough Ace Credits."
        );

        return;

    }


    const storeItem =
        STORE_ITEMS[name] || {

            category:
                "collectible",

            price:
                Number(price)

        };


    profile.balance -=
        Number(price);


    profile.collection.push({

        name,

        price:
            Number(price),

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

    document
        .querySelectorAll(
            "button[onclick*='buyItem']"
        )
        .forEach(
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


                const itemName =
                    match[1];


                const owned =
                    profile.collection.some(
                        (item) =>
                            item.name ===
                            itemName
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


    document
        .querySelectorAll(
            ".collection-filter"
        )
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
        document.getElementById(
            "collectionGrid"
        );


    if (!grid) {
        return;
    }


    const items =
        currentCollectionFilter ===
        "all"

            ? profile.collection

            : profile.collection.filter(
                (item) =>
                    item.category ===
                    currentCollectionFilter
            );


    grid.innerHTML = "";


    items.forEach(
        (item) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card collection-item";


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
        document.getElementById(
            "emptyCollection"
        );


    if (empty) {

        empty.style.display =
            items.length
                ? "none"
                : "block";

    }


    setText(
        "#collectionCount",
        profile.collection.length
    );


    const collectionValue =
        profile.collection.reduce(
            (total, item) =>
                total +
                Number(
                    item.price || 0
                ),
            0
        );


    setText(
        "#collectionValue",
        formatCredits(
            collectionValue
        )
    );


    let highest = null;


    profile.collection.forEach(
        (item) => {

            if (
                !highest ||
                item.price >
                highest.price
            ) {

                highest = item;

            }

        }
    );


    setText(
        "#highestPurchase",
        highest
            ? highest.name
            : "—"
    );

}


/* ==========================================================
   PROFILE / MEMBERSHIP
   ========================================================== */

function getMembershipTier(
    balance
) {

    if (
        balance >=
        10000000
    ) {

        return {

            current:
                "CASINO OWNER",

            next:
                "MAXIMUM TIER",

            progress:
                100

        };

    }


    if (
        balance >=
        5000000
    ) {

        return {

            current:
                "DIAMOND CLUB",

            next:
                "CASINO OWNER",

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

            current:
                "HIGH ROLLER",

            next:
                "DIAMOND CLUB",

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

            current:
                "GOLD MEMBER",

            next:
                "HIGH ROLLER",

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

        current:
            "STANDARD",

        next:
            "GOLD MEMBER",

        progress:
            Math.min(
                100,
                (
                    balance /
                    100000
                )
                *
                100
            )

    };

}


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
        tier.current ===
        "STANDARD"

            ? "STANDARD MEMBER"

            : tier.current
    );


    setText(
        "#currentTier",
        tier.current
    );


    setText(
        "#nextTier",
        tier.next
    );


    const progress =
        document.getElementById(
            "membershipProgress"
        );


    if (progress) {

        progress.style.width =
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

}


function changeUsername() {

    const input =
        document.getElementById(
            "newUsername"
        );


    if (!input) {
        return;
    }


    const username =
        input.value.trim();


    if (
        username.length < 3
    ) {

        alert(
            "Username must be at least 3 characters."
        );

        return;

    }


    profile.username =
        username.substring(
            0,
            20
        );


    input.value = "";


    saveProfile();


    alert(
        "Username updated."
    );

}


function resetGildedProfile() {

    if (
        !confirm(
            "Reset your entire Gilded Ace profile?"
        )
    ) {

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


    location.reload();

}


/* ==========================================================
   ==========================================================
   BLACKJACK
   ==========================================================
   ========================================================== */

let blackjackDeck = [];

let blackjackPlayer = [];

let blackjackDealer = [];

let blackjackActive = false;


/*
    START AT ZERO.

    USERS BUILD THEIR BET
    BY CLICKING CHIPS.
*/

let blackjackBet = 0;

let blackjackLockedBet = 0;


/* ==========================================================
   BUILD BLACKJACK DECK
   ========================================================== */

function buildBlackjackDeck() {

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
                        rank,
                        suit
                    });

                }
            );

        }
    );


    for (
        let i = deck.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        const temp =
            deck[i];


        deck[i] =
            deck[j];


        deck[j] =
            temp;

    }


    return deck;

}


/* ==========================================================
   BLACKJACK CARD VALUES
   ========================================================== */

function blackjackCardValue(
    card
) {

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


function blackjackHandValue(
    hand
) {

    let total = 0;

    let aces = 0;


    hand.forEach(
        (card) => {

            total +=
                blackjackCardValue(
                    card
                );


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


function blackjackNatural(
    hand
) {

    return (
        hand.length === 2 &&
        blackjackHandValue(
            hand
        ) === 21
    );

}


/* ==========================================================
   CREATE BLACKJACK CARD
   ========================================================== */

function createBlackjackCard(
    card,
    hidden = false
) {

    const cardElement =
        document.createElement(
            "div"
        );


    if (hidden) {

        cardElement.className =
            "playing-card card-back";


        cardElement.innerHTML = `

            <div class="card-back-inner">

                <span>
                    A
                </span>

            </div>

        `;


        return cardElement;

    }


    const isRed =
        card.suit === "♥" ||
        card.suit === "♦";


    cardElement.className =
        isRed
            ? "playing-card red-card"
            : "playing-card black-card";


    cardElement.innerHTML = `

        <div
            class="
                card-corner
                card-corner-top
            "
        >

            <span class="card-rank">
                ${card.rank}
            </span>

            <span class="card-small-suit">
                ${card.suit}
            </span>

        </div>


        <div class="card-center-suit">

            ${card.suit}

        </div>


        <div
            class="
                card-corner
                card-corner-bottom
            "
        >

            <span class="card-rank">
                ${card.rank}
            </span>

            <span class="card-small-suit">
                ${card.suit}
            </span>

        </div>

    `;


    return cardElement;

}


/* ==========================================================
   RENDER BLACKJACK
   ========================================================== */

function renderBlackjack(
    hideDealerCard = false
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

                <div class="playing-card card-back">

                    <div class="card-back-inner">
                        <span>A</span>
                    </div>

                </div>

                <div class="playing-card card-back">

                    <div class="card-back-inner">
                        <span>A</span>
                    </div>

                </div>

            `;

        }

        else {

            blackjackPlayer.forEach(
                (card) => {

                    playerArea.appendChild(
                        createBlackjackCard(
                            card,
                            false
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

                <div class="playing-card card-back">

                    <div class="card-back-inner">
                        <span>A</span>
                    </div>

                </div>

                <div class="playing-card card-back">

                    <div class="card-back-inner">
                        <span>A</span>
                    </div>

                </div>

            `;

        }

        else {

            blackjackDealer.forEach(
                (
                    card,
                    index
                ) => {

                    dealerArea.appendChild(
                        createBlackjackCard(
                            card,
                            hideDealerCard &&
                            index === 1
                        )
                    );

                }
            );

        }

    }


    if (
        blackjackPlayer.length
    ) {

        setText(
            "#playerTotal",
            blackjackHandValue(
                blackjackPlayer
            )
        );

    }

    else {

        setText(
            "#playerTotal",
            "—"
        );

    }


    if (
        blackjackDealer.length === 0
    ) {

        setText(
            "#dealerTotal",
            "—"
        );

    }

    else if (
        hideDealerCard
    ) {

        setText(
            "#dealerTotal",
            blackjackCardValue(
                blackjackDealer[0]
            )
        );

    }

    else {

        setText(
            "#dealerTotal",
            blackjackHandValue(
                blackjackDealer
            )
        );

    }

}


/* ==========================================================
   BLACKJACK BUTTON CONTROLS
   ========================================================== */

function setBlackjackControls(
    gameActive
) {

    const dealButton =
        document.getElementById(
            "blackjackDealButton"
        );


    const hitButton =
        document.getElementById(
            "blackjackHitButton"
        );


    const standButton =
        document.getElementById(
            "blackjackStandButton"
        );


    if (gameActive) {

        if (dealButton) {

            dealButton.disabled =
                true;

        }


        if (hitButton) {

            hitButton.disabled =
                false;

            hitButton.removeAttribute(
                "disabled"
            );

            hitButton.style.pointerEvents =
                "auto";

        }


        if (standButton) {

            standButton.disabled =
                false;

            standButton.removeAttribute(
                "disabled"
            );

            standButton.style.pointerEvents =
                "auto";

        }

    }

    else {

        if (dealButton) {

            dealButton.disabled =
                false;

            dealButton.removeAttribute(
                "disabled"
            );

        }


        if (hitButton) {

            hitButton.disabled =
                true;

        }


        if (standButton) {

            standButton.disabled =
                true;

        }

    }

}


/* ==========================================================
   BLACKJACK CHIP CONTROLS
   ========================================================== */

function updateBlackjackBetDisplay() {

    if (
        blackjackBet >
        profile.balance &&
        !blackjackActive
    ) {

        blackjackBet =
            profile.balance;

    }


    setText(
        "#blackjackBetAmount",
        formatCredits(
            blackjackBet
        )
    );

}


function addBlackjackChip(
    amount
) {

    if (
        blackjackActive
    ) {

        return;

    }


    amount =
        Number(amount);


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return;

    }


    const newBet =
        blackjackBet +
        amount;


    blackjackBet =
        Math.min(
            newBet,
            profile.balance
        );


    updateBlackjackBetDisplay();


    setText(
        "#blackjackMessage",
        blackjackBet > 0
            ? `Bet set to ${formatCredits(blackjackBet)}.`
            : "Place your bet and press DEAL."
    );

}


function clearBlackjackBet() {

    if (
        blackjackActive
    ) {

        return;

    }


    blackjackBet =
        0;


    updateBlackjackBetDisplay();


    setText(
        "#blackjackMessage",
        "Bet cleared. Select your chips."
    );

}


/*
    KEPT FOR COMPATIBILITY
    WITH ANY OLD BUTTONS
*/

function setBlackjackBet(
    amount
) {

    if (
        blackjackActive
    ) {

        return;

    }


    amount =
        Number(amount);


    blackjackBet =
        Math.min(
            Math.max(
                0,
                amount
            ),
            profile.balance
        );


    updateBlackjackBetDisplay();

}


function changeBlackjackBet(
    amount
) {

    if (
        blackjackActive
    ) {

        return;

    }


    blackjackBet +=
        Number(amount);


    blackjackBet =
        Math.max(
            0,
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

    if (
        blackjackActive
    ) {

        return;

    }


    blackjackBet =
        profile.balance;


    updateBlackjackBetDisplay();


    setText(
        "#blackjackMessage",
        `Maximum bet selected: ${formatCredits(blackjackBet)}.`
    );

}


/* ==========================================================
   START BLACKJACK
   ========================================================== */

function startBlackjack() {

    if (
        blackjackActive
    ) {

        return;

    }


    if (
        blackjackBet < 100
    ) {

        alert(
            "Minimum Blackjack bet is 100 AC."
        );

        return;

    }


    if (
        blackjackBet >
        profile.balance
    ) {

        alert(
            "You do not have enough Ace Credits for that bet."
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
        buildBlackjackDeck();


    blackjackPlayer = [
        blackjackDeck.pop(),
        blackjackDeck.pop()
    ];


    blackjackDealer = [
        blackjackDeck.pop(),
        blackjackDeck.pop()
    ];


    blackjackLockedBet =
        blackjackBet;


    blackjackActive =
        true;


    profile.balance -=
        blackjackLockedBet;


    saveProfile();


    renderBlackjack(
        true
    );


    setBlackjackControls(
        true
    );


    setText(
        "#blackjackMessage",
        "Cards dealt. Choose HIT or STAND."
    );


    const playerBJ =
        blackjackNatural(
            blackjackPlayer
        );


    const dealerBJ =
        blackjackNatural(
            blackjackDealer
        );


    if (
        playerBJ ||
        dealerBJ
    ) {

        setTimeout(
            () => {

                resolveNaturalBlackjack(
                    playerBJ,
                    dealerBJ
                );

            },
            900
        );

    }

}


/* ==========================================================
   NATURAL BLACKJACK
   ========================================================== */

function resolveNaturalBlackjack(
    playerBJ,
    dealerBJ
) {

    if (
        !blackjackActive
    ) {

        return;

    }


    blackjackActive =
        false;


    renderBlackjack(
        false
    );


    setBlackjackControls(
        false
    );


    if (
        playerBJ &&
        dealerBJ
    ) {

        profile.balance +=
            blackjackLockedBet;


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


    if (
        playerBJ
    ) {

        const profit =
            blackjackLockedBet *
            1.5;


        profile.balance +=
            blackjackLockedBet +
            profit;


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

    if (
        !blackjackActive
    ) {

        return;

    }


    blackjackPlayer.push(
        blackjackDeck.pop()
    );


    renderBlackjack(
        true
    );


    const playerTotal =
        blackjackHandValue(
            blackjackPlayer
        );


    if (
        playerTotal > 21
    ) {

        blackjackActive =
            false;


        renderBlackjack(
            false
        );


        setBlackjackControls(
            false
        );


        setText(
            "#blackjackMessage",
            `BUST — ${playerTotal}. House wins.`
        );


        recordResult(
            false,
            "blackjack"
        );


        prepareNextBlackjackBet();

        return;

    }


    if (
        playerTotal === 21
    ) {

        setText(
            "#blackjackMessage",
            "21! Dealer's turn."
        );


        setTimeout(
            () => {

                blackjackStand();

            },
            450
        );


        return;

    }


    setText(
        "#blackjackMessage",
        `Your total is ${playerTotal}. HIT or STAND.`
    );


    setBlackjackControls(
        true
    );

}


/* ==========================================================
   BLACKJACK STAND
   ========================================================== */

function blackjackStand() {

    if (
        !blackjackActive
    ) {

        return;

    }


    /*
        KEEP ACTIVE UNTIL DEALER
        FINISHES. THIS ALSO FIXES
        THE AUTOMATIC STAND AT 21.
    */

    while (
        blackjackHandValue(
            blackjackDealer
        ) < 17
    ) {

        blackjackDealer.push(
            blackjackDeck.pop()
        );

    }


    blackjackActive =
        false;


    renderBlackjack(
        false
    );


    setBlackjackControls(
        false
    );


    const playerTotal =
        blackjackHandValue(
            blackjackPlayer
        );


    const dealerTotal =
        blackjackHandValue(
            blackjackDealer
        );


    if (
        dealerTotal > 21
    ) {

        payBlackjackNormalWin();


        blackjackWinEffect();


        setText(
            "#blackjackMessage",
            `Dealer busts with ${dealerTotal}. You win ${formatCredits(blackjackLockedBet)}.`
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

        payBlackjackNormalWin();


        blackjackWinEffect();


        setText(
            "#blackjackMessage",
            `${playerTotal} beats ${dealerTotal}. You win ${formatCredits(blackjackLockedBet)}.`
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
        blackjackLockedBet;


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
   BLACKJACK NORMAL WIN
   ========================================================== */

function payBlackjackNormalWin() {

    profile.balance +=
        blackjackLockedBet *
        2;

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
   BLACKJACK NEXT HAND
   ========================================================== */

function prepareNextBlackjackBet() {

    blackjackActive =
        false;


    setBlackjackControls(
        false
    );


    if (
        blackjackBet >
        profile.balance
    ) {

        blackjackBet =
            profile.balance;

    }


    if (
        profile.balance <= 0
    ) {

        blackjackBet =
            0;

    }


    saveProfile();


    updateBlackjackBetDisplay();

}


/* ==========================================================
   ==========================================================
   SLOTS
   ==========================================================
   ========================================================== */

function spinSlots() {

    const display =
        document.getElementById(
            "slotDisplay"
        );


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


    const result = [

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
        result.join(" ");


    const jackpot =
        result[0] === result[1] &&
        result[1] === result[2];


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

    }

    else {

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
   ==========================================================
   EUROPEAN ROULETTE
   ==========================================================
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


let rouletteBet =
    null;


let rouletteBetAmount =
    100;


let rouletteSpinning =
    false;


let rouletteWheelRotation =
    0;


let rouletteBallRotation =
    0;


/* ==========================================================
   ROULETTE COLORS
   ========================================================== */

function rouletteColor(
    number
) {

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
        `conic-gradient(
            from ${-POCKET_ANGLE / 2}deg,
            ${sectors.join(",")}
        )`;


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
                `translate(-50%, -50%) rotate(${angle}deg)`;


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

        const first =
            column *
            3 +
            1;


        const numbers = [
            first + 2,
            first + 1,
            first
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
                    `roulette-number-cell ${rouletteColor(number)}`;


                button.textContent =
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
        );

    }

}


/* ==========================================================
   ROULETTE BET SELECTION
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


    rouletteBet = {

        type:
            "number",

        number:
            Number(number),

        payout:
            35

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


    if (
        !bets[type]
    ) {

        return;

    }


    clearRouletteSelection();


    rouletteBet = {

        type,

        payout:
            bets[type].payout

    };


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    setText(
        "#selectedBet",
        bets[type].label
    );


    setText(
        "#selectedPayout",
        `${bets[type].payout}:1 PAYOUT`
    );

}


/* ==========================================================
   ROULETTE WAGER
   ========================================================== */

function changeBet(
    amount
) {

    if (
        rouletteSpinning
    ) {

        return;

    }


    if (
        profile.balance <
        100
    ) {

        rouletteBetAmount =
            0;

    }

    else {

        rouletteBetAmount +=
            Number(amount);


        rouletteBetAmount =
            Math.max(
                100,
                rouletteBetAmount
            );


        rouletteBetAmount =
            Math.min(
                profile.balance,
                rouletteBetAmount
            );

    }


    setText(
        "#betAmount",
        formatCredits(
            rouletteBetAmount
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
        !rouletteBet
    ) {

        return false;

    }


    if (
        rouletteBet.type ===
        "number"
    ) {

        return (
            number ===
            rouletteBet.number
        );

    }


    if (
        number === 0
    ) {

        return false;

    }


    if (
        rouletteBet.type ===
        "red"
    ) {

        return RED_NUMBERS.has(
            number
        );

    }


    if (
        rouletteBet.type ===
        "black"
    ) {

        return !RED_NUMBERS.has(
            number
        );

    }


    if (
        rouletteBet.type ===
        "even"
    ) {

        return (
            number %
            2 ===
            0
        );

    }


    if (
        rouletteBet.type ===
        "odd"
    ) {

        return (
            number %
            2 !==
            0
        );

    }


    if (
        rouletteBet.type ===
        "low"
    ) {

        return (
            number >= 1 &&
            number <= 18
        );

    }


    if (
        rouletteBet.type ===
        "high"
    ) {

        return (
            number >= 19 &&
            number <= 36
        );

    }


    if (
        rouletteBet.type ===
        "dozen1"
    ) {

        return (
            number >= 1 &&
            number <= 12
        );

    }


    if (
        rouletteBet.type ===
        "dozen2"
    ) {

        return (
            number >= 13 &&
            number <= 24
        );

    }


    if (
        rouletteBet.type ===
        "dozen3"
    ) {

        return (
            number >= 25 &&
            number <= 36
        );

    }


    return false;

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
        !rouletteBet
    ) {

        alert(
            "Select a roulette bet first."
        );

        return;

    }


    if (
        rouletteBetAmount <
        100 ||
        profile.balance <
        rouletteBetAmount
    ) {

        alert(
            "You do not have enough Ace Credits."
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


    const button =
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


    if (button) {

        button.disabled =
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


    const targetAngle =
        winningIndex *
        POCKET_ANGLE;


    const current =
        normalizeAngle(
            rouletteWheelRotation
        );


    const desired =
        normalizeAngle(
            -targetAngle
        );


    const difference =
        normalizeAngle(
            desired -
            current
        );


    rouletteWheelRotation +=
        (
            7 *
            360
        )
        +
        difference;


    rouletteBallRotation -=
        11 *
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
        `rotate(${rouletteWheelRotation}deg)`;


    ballTrack.style.transform =
        `rotate(${rouletteBallRotation}deg)`;


    setTimeout(
        () => {

            ballTrack.classList.add(
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


            rouletteSpinning =
                false;


            if (button) {

                button.disabled =
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
    number
) {

    const won =
        rouletteBetWins(
            number
        );


    profile.balance -=
        rouletteBetAmount;


    if (won) {

        profile.balance +=

            rouletteBetAmount *

            (
                rouletteBet.payout +
                1
            );

    }


    const color =
        number === 0
            ? "GREEN"
            : RED_NUMBERS.has(
                number
            )
                ? "RED"
                : "BLACK";


    setText(
        "#rouletteResult",
        `${number} • ${color}`
    );


    recordResult(
        won,
        "roulette"
    );


    if (
        profile.balance <
        100
    ) {

        rouletteBetAmount =
            0;

    }

    else if (
        rouletteBetAmount >
        profile.balance
    ) {

        rouletteBetAmount =
            profile.balance;

    }


    setText(
        "#betAmount",
        formatCredits(
            rouletteBetAmount
        )
    );

}


/* ==========================================================
   HIGH ROLL DICE
   ========================================================== */

function rollDice() {

    const symbols = [
        "⚀",
        "⚁",
        "⚂",
        "⚃",
        "⚄",
        "⚅"
    ];


    const house =
        Math.floor(
            Math.random() *
            6
        )
        +
        1;


    const player =
        Math.floor(
            Math.random() *
            6
        )
        +
        1;


    setText(
        "#houseDice",
        symbols[
            house - 1
        ]
    );


    setText(
        "#playerDice",
        symbols[
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

    }

    else if (
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

    }

    else {

        setText(
            "#diceMessage",
            "Tie game."
        );


        recordResult(
            null,
            "dice"
        );

    }

}


/* ==========================================================
   LEADERBOARD
   ========================================================== */

function sortLeaderboard(
    type
) {

    const table =
        document.getElementById(
            "leaderboardTable"
        );


    if (!table) {
        return;
    }


    const body =
        table.querySelector(
            "tbody"
        );


    if (!body) {
        return;
    }


    const rows =
        Array.from(
            body.querySelectorAll(
                "tr"
            )
        );


    rows.sort(
        (a, b) => {

            return (
                Number(
                    b.dataset[type] || 0
                )
                -
                Number(
                    a.dataset[type] || 0
                )
            );

        }
    );


    rows.forEach(
        (
            row,
            index
        ) => {

            const cell =
                row.querySelector(
                    "td"
                );


            if (cell) {

                cell.textContent =
                    String(
                        index + 1
                    )
                    .padStart(
                        2,
                        "0"
                    );

            }


            body.appendChild(
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


/* BLACKJACK */

window.startBlackjack =
    startBlackjack;


window.blackjackHit =
    blackjackHit;


window.blackjackStand =
    blackjackStand;


window.addBlackjackChip =
    addBlackjackChip;


window.clearBlackjackBet =
    clearBlackjackBet;


window.setBlackjackBet =
    setBlackjackBet;


window.changeBlackjackBet =
    changeBlackjackBet;


window.maxBlackjackBet =
    maxBlackjackBet;


/* SLOTS */

window.spinSlots =
    spinSlots;


/* ROULETTE */

window.selectNumberBet =
    selectNumberBet;


window.selectRouletteBet =
    selectRouletteBet;


window.changeBet =
    changeBet;


window.spinRoulette =
    spinRoulette;


/* DICE */

window.rollDice =
    rollDice;


window.sortLeaderboard =
    sortLeaderboard;


/* ==========================================================
   INITIALIZE
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateBalanceDisplays();

        updateProfilePage();

        updateCollectionPage();

        updateStoreButtons();


        /*
            BLACKJACK
        */

        renderBlackjack(
            false
        );


        setBlackjackControls(
            false
        );


        updateBlackjackBetDisplay();


        /*
            ROULETTE
        */

        buildRouletteWheel();

        buildRouletteTable();


        if (
            profile.balance <
            100
        ) {

            rouletteBetAmount =
                0;

        }

        else if (
            rouletteBetAmount >
            profile.balance
        ) {

            rouletteBetAmount =
                profile.balance;

        }


        setText(
            "#betAmount",
            formatCredits(
                rouletteBetAmount
            )
        );

    }
);
