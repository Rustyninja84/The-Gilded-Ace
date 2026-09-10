/* ==========================================================
   THE GILDED ACE
   COMPLETE SITE SCRIPT
   ========================================================== */


/* ==========================================================
   HELPERS
   ========================================================== */

const $ = (selector) =>
    document.querySelector(selector);


const $$ = (selector) =>
    document.querySelectorAll(selector);


function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value;

    }

}


function formatCredits(
    amount
) {

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

    username:
        "Gilded Player",

    balance:
        10000,

    wins:
        0,

    losses:
        0,

    gamesPlayed:
        0,

    blackjackWins:
        0,

    slotWins:
        0,

    rouletteWins:
        0,

    diceWins:
        0,

    collection:
        []

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
                "Could not load profile.",
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


    const fresh = {

        ...DEFAULT_PROFILE,

        collection:
            []

    };


    if (
        Number.isFinite(
            oldBalance
        )
        &&
        oldBalance > 0
    ) {

        fresh.balance =
            oldBalance;

    }


    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(
            fresh
        )
    );


    return fresh;

}



let profile =
    loadProfile();



function saveProfile() {

    localStorage.setItem(
        "gildedAceProfile",
        JSON.stringify(
            profile
        )
    );


    updateAllDisplays();

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


    if (
        lastClaim === today
    ) {

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
   STORE
   ========================================================== */

const STORE_ITEMS = {

    "Gold Profile Frame":{
        category:"profile",
        price:10000
    },

    "Diamond Nameplate":{
        category:"profile",
        price:25000
    },

    "High Roller Title":{
        category:"profile",
        price:50000
    },

    "Gilded Watch":{
        category:"collectible",
        price:75000
    },

    "Golden Ace Card":{
        category:"collectible",
        price:100000
    },

    "Diamond Crown":{
        category:"collectible",
        price:350000
    },

    "Grand Touring Coupe":{
        category:"vehicle",
        price:150000
    },

    "Gilded Supercar":{
        category:"vehicle",
        price:500000
    },

    "Executive Limousine":{
        category:"vehicle",
        price:750000
    },

    "Private Yacht":{
        category:"vehicle",
        price:2500000
    },

    "Private Jet":{
        category:"vehicle",
        price:5000000
    },

    "Club Hotel Suite":{
        category:"property",
        price:50000
    },

    "Luxury Penthouse":{
        category:"property",
        price:1000000
    },

    "Private Estate":{
        category:"property",
        price:3000000
    },

    "Gilded Card Back":{
        category:"casino",
        price:15000
    },

    "Gold Blackjack Table":{
        category:"casino",
        price:100000
    },

    "Midnight Roulette":{
        category:"casino",
        price:150000
    },

    "High Roller Membership":{
        category:"prestige",
        price:250000
    },

    "Diamond Club":{
        category:"prestige",
        price:1000000
    },

    "Casino Ownership":{
        category:"prestige",
        price:10000000
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


    price =
        Number(price);


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

            category:
                "collectible",

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


    grid.innerHTML =
        "";


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
        "#collectionValue",
        formatCredits(
            value
        )
    );


    let highest =
        null;


    profile.collection.forEach(
        (item) => {

            if (
                !highest ||
                Number(item.price) >
                Number(highest.price)
            ) {

                highest =
                    item;

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
            "Reset your entire Gilded Ace profile?"
        );


    if (!confirmed) {
        return;
    }


    profile = {

        ...DEFAULT_PROFILE,

        collection:
            []

    };


    localStorage.removeItem(
        "gildedAceDailyReward"
    );


    saveProfile();


    location.reload();

}



/* ==========================================================
   GAME STATISTICS
   ========================================================== */

function recordResult(
    won,
    game
) {

    profile.gamesPlayed++;


    if (
        won === true
    ) {

        profile.wins++;

    }


    else if (
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
   ==========================================================
   BLACKJACK
   ==========================================================
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
    0;


let blackjackLockedBet =
    0;



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


    const deck =
        [];


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
        let i =
            deck.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            deck[i],
            deck[j]
        ]
        =
        [
            deck[j],
            deck[i]
        ];

    }


    return deck;

}



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

    let total =
        0;


    let aces =
        0;


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

        total -=
            10;


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



function createBlackjackCard(
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


        element.innerHTML = `

            <div class="card-back-inner">
                A
            </div>

        `;


        return element;

    }


    const red =
        card.suit === "♥" ||
        card.suit === "♦";


    element.className =
        red
            ? "playing-card red-card"
            : "playing-card black-card";


    element.innerHTML = `

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


    return element;

}



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
            blackjackPlayer.length ===
            0
        ) {

            playerArea.innerHTML = `

                <div class="playing-card card-back">
                    <div class="card-back-inner">A</div>
                </div>

                <div class="playing-card card-back">
                    <div class="card-back-inner">A</div>
                </div>

            `;

        }

        else {

            blackjackPlayer.forEach(
                (card) => {

                    playerArea.appendChild(
                        createBlackjackCard(
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
            blackjackDealer.length ===
            0
        ) {

            dealerArea.innerHTML = `

                <div class="playing-card card-back">
                    <div class="card-back-inner">A</div>
                </div>

                <div class="playing-card card-back">
                    <div class="card-back-inner">A</div>
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
            ? blackjackHandValue(
                blackjackPlayer
            )
            : "—"
    );


    if (
        blackjackDealer.length ===
        0
    ) {

        setText(
            "#dealerTotal",
            "—"
        );

    }

    else if (
        hideDealer
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



function updateBlackjackBetDisplay() {

    if (
        !blackjackActive &&
        blackjackBet >
        profile.balance
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


    blackjackBet +=
        Number(amount);


    blackjackBet =
        Math.min(
            blackjackBet,
            profile.balance
        );


    updateBlackjackBetDisplay();


    setText(
        "#blackjackMessage",

        blackjackBet > 0

            ? `Bet: ${formatCredits(blackjackBet)}`

            : "Select chips to place your bet."
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
        "Bet cleared."
    );

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
            blackjackBet,
            profile.balance
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

}



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
        profile.balance <
        blackjackBet
    ) {

        alert(
            "Not enough Ace Credits."
        );

        return;

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
        "Choose HIT or STAND."
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

                resolveBlackjackNatural(
                    playerBJ,
                    dealerBJ
                );

            },
            700
        );

    }

}



function resolveBlackjackNatural(
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


        prepareNextBlackjack();

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
            `BLACKJACK! +${formatCredits(profit)}`
        );


        recordResult(
            true,
            "blackjack"
        );


        prepareNextBlackjack();

        return;

    }


    setText(
        "#blackjackMessage",
        "Dealer Blackjack."
    );


    recordResult(
        false,
        "blackjack"
    );


    prepareNextBlackjack();

}



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


    const total =
        blackjackHandValue(
            blackjackPlayer
        );


    if (
        total > 21
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
            `BUST — ${total}.`
        );


        recordResult(
            false,
            "blackjack"
        );


        prepareNextBlackjack();

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
            350
        );


        return;

    }


    setText(
        "#blackjackMessage",
        `${total}. HIT or STAND.`
    );

}



function blackjackStand() {

    if (
        !blackjackActive
    ) {

        return;

    }


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


    const player =
        blackjackHandValue(
            blackjackPlayer
        );


    const dealer =
        blackjackHandValue(
            blackjackDealer
        );


    if (
        dealer > 21 ||
        player > dealer
    ) {

        profile.balance +=
            blackjackLockedBet *
            2;


        blackjackWinEffect();


        setText(
            "#blackjackMessage",

            dealer > 21

                ? `Dealer busts with ${dealer}. You win!`

                : `${player} beats ${dealer}. You win!`
        );


        recordResult(
            true,
            "blackjack"
        );

    }


    else if (
        dealer > player
    ) {

        setText(
            "#blackjackMessage",
            `${dealer} beats ${player}. House wins.`
        );


        recordResult(
            false,
            "blackjack"
        );

    }


    else {

        profile.balance +=
            blackjackLockedBet;


        setText(
            "#blackjackMessage",
            "PUSH."
        );


        recordResult(
            null,
            "blackjack"
        );

    }


    prepareNextBlackjack();

}



function prepareNextBlackjack() {

    blackjackActive =
        false;


    if (
        blackjackBet >
        profile.balance
    ) {

        blackjackBet =
            profile.balance;

    }


    if (
        profile.balance <=
        0
    ) {

        blackjackBet =
            0;

    }


    updateBlackjackBetDisplay();


    setBlackjackControls(
        false
    );


    saveProfile();

}



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
        1800
    );

}



/* ==========================================================
   ==========================================================
   ARCADE SLOT MACHINE
   ==========================================================
   ========================================================== */

const GA_SLOT_SYMBOLS = [

    {
        id:"CHERRY",
        text:"🍒",
        weight:28
    },

    {
        id:"BELL",
        text:"🔔",
        weight:22
    },

    {
        id:"BAR",
        text:"BAR",
        weight:19
    },

    {
        id:"CROWN",
        text:"👑",
        weight:14
    },

    {
        id:"DIAMOND",
        text:"💎",
        weight:10
    },

    {
        id:"SEVEN",
        text:"7",
        weight:7
    }

];


const GA_SLOT_PAYOUTS = {

    CHERRY:3,

    BELL:4,

    BAR:5,

    CROWN:6,

    DIAMOND:8,

    SEVEN:10

};


let gaSlotBet =
    100;


let gaSlotSpinning =
    false;


let gaSlotLastWin =
    0;



function gaGetRandomSymbol() {

    const total =
        GA_SLOT_SYMBOLS.reduce(
            (sum, symbol) =>
                sum +
                symbol.weight,
            0
        );


    let random =
        Math.random() *
        total;


    for (
        const symbol of
        GA_SLOT_SYMBOLS
    ) {

        random -=
            symbol.weight;


        if (
            random <= 0
        ) {

            return symbol;

        }

    }


    return GA_SLOT_SYMBOLS[0];

}



function gaCreateRandomReel() {

    return [

        gaGetRandomSymbol(),

        gaGetRandomSymbol(),

        gaGetRandomSymbol()

    ];

}



function gaRenderSlotReel(
    reelNumber,
    symbols
) {

    const reel =
        document.getElementById(
            `gaSlotReel${reelNumber}`
        );


    if (!reel) {
        return;
    }


    reel.innerHTML =
        "";


    symbols.forEach(
        (
            symbol,
            index
        ) => {

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "ga-slot-symbol";


            if (
                index === 1
            ) {

                cell.classList.add(
                    "ga-slot-center-symbol"
                );

            }


            cell.dataset.symbol =
                symbol.text;


            cell.textContent =
                symbol.text;


            reel.appendChild(
                cell
            );

        }
    );

}



function gaUpdateSlotDisplays() {

    setText(
        "#gaSlotBetAmount",
        formatCredits(
            gaSlotBet
        )
    );


    setText(
        "#gaSlotWinnings",
        formatCredits(
            gaSlotLastWin
        )
    );

}



function gaSetSlotControls(
    enabled
) {

    const ids = [

        "gaSlotBetMinus",

        "gaSlotBetPlus",

        "gaSlotSpinButton",

        "gaSlotLever"

    ];


    ids.forEach(
        (id) => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.disabled =
                    !enabled;

            }

        }
    );

}



function gaChangeSlotBet(
    amount
) {

    if (
        gaSlotSpinning
    ) {

        return;

    }


    if (
        profile.balance <
        100
    ) {

        gaSlotBet =
            0;


        gaUpdateSlotDisplays();

        return;

    }


    gaSlotBet +=
        Number(amount);


    gaSlotBet =
        Math.max(
            100,
            gaSlotBet
        );


    gaSlotBet =
        Math.min(
            gaSlotBet,
            profile.balance
        );


    gaUpdateSlotDisplays();

}



function gaAnimateSlotLever() {

    const lever =
        document.getElementById(
            "gaSlotLever"
        );


    if (!lever) {
        return;
    }


    lever.classList.add(
        "ga-slot-lever-pulled"
    );


    setTimeout(
        () => {

            lever.classList.remove(
                "ga-slot-lever-pulled"
            );

        },
        500
    );

}



function gaStartReelAnimation(
    reelNumber
) {

    const reel =
        document.getElementById(
            `gaSlotReel${reelNumber}`
        );


    if (!reel) {
        return null;
    }


    reel.classList.add(
        "ga-slot-spinning"
    );


    return setInterval(
        () => {

            gaRenderSlotReel(
                reelNumber,
                gaCreateRandomReel()
            );

        },
        70
    );

}



function gaStopReelAnimation(
    reelNumber,
    timer,
    result
) {

    if (timer) {

        clearInterval(
            timer
        );

    }


    const reel =
        document.getElementById(
            `gaSlotReel${reelNumber}`
        );


    if (reel) {

        reel.classList.remove(
            "ga-slot-spinning"
        );

    }


    gaRenderSlotReel(
        reelNumber,
        result
    );

}



function gaEvaluateSlotWin(
    reels
) {

    const first =
        reels[0][1];


    const second =
        reels[1][1];


    const third =
        reels[2][1];


    if (
        first.id === second.id &&
        second.id === third.id
    ) {

        const multiplier =
            GA_SLOT_PAYOUTS[
                first.id
            ] || 3;


        return {

            won:true,

            multiplier,

            message:
                `${first.text} ${first.text} ${first.text} — ${multiplier}× WIN!`

        };

    }


    if (
        first.id === second.id ||
        second.id === third.id ||
        first.id === third.id
    ) {

        return {

            won:true,

            multiplier:1,

            message:
                "Two matching symbols — wager returned."

        };

    }


    return {

        won:false,

        multiplier:0,

        message:
            "No winning match."

    };

}



function gaHighlightWinningReels() {

    for (
        let i = 1;
        i <= 3;
        i++
    ) {

        const reel =
            document.getElementById(
                `gaSlotReel${i}`
            );


        if (reel) {

            reel.classList.add(
                "ga-slot-winner"
            );


            setTimeout(
                () => {

                    reel.classList.remove(
                        "ga-slot-winner"
                    );

                },
                1800
            );

        }

    }

}



function gaSpinSlots() {

    if (
        gaSlotSpinning
    ) {

        return;

    }


    if (
        gaSlotBet <
        100
    ) {

        alert(
            "Minimum slot wager is 100 AC."
        );

        return;

    }


    if (
        profile.balance <
        gaSlotBet
    ) {

        alert(
            "You do not have enough Ace Credits."
        );

        return;

    }


    gaSlotSpinning =
        true;


    gaSlotLastWin =
        0;


    gaUpdateSlotDisplays();


    gaSetSlotControls(
        false
    );


    gaAnimateSlotLever();


    setText(
        "#gaSlotMessage",
        `Spinning for ${formatCredits(gaSlotBet)}...`
    );


    const lockedBet =
        gaSlotBet;


    profile.balance -=
        lockedBet;


    saveProfile();


    const finalReels = [

        gaCreateRandomReel(),

        gaCreateRandomReel(),

        gaCreateRandomReel()

    ];


    const timer1 =
        gaStartReelAnimation(
            1
        );


    const timer2 =
        gaStartReelAnimation(
            2
        );


    const timer3 =
        gaStartReelAnimation(
            3
        );


    setTimeout(
        () => {

            gaStopReelAnimation(
                1,
                timer1,
                finalReels[0]
            );

        },
        950
    );


    setTimeout(
        () => {

            gaStopReelAnimation(
                2,
                timer2,
                finalReels[1]
            );

        },
        1350
    );


    setTimeout(
        () => {

            gaStopReelAnimation(
                3,
                timer3,
                finalReels[2]
            );

        },
        1750
    );


    setTimeout(
        () => {

            const result =
                gaEvaluateSlotWin(
                    finalReels
                );


            if (
                result.won
            ) {

                gaSlotLastWin =
                    lockedBet *
                    result.multiplier;


                profile.balance +=
                    gaSlotLastWin;


                gaHighlightWinningReels();


                setText(
                    "#gaSlotMessage",

                    `${result.message} ${formatCredits(gaSlotLastWin)} returned.`
                );


                recordResult(
                    true,
                    "slots"
                );

            }


            else {

                gaSlotLastWin =
                    0;


                setText(
                    "#gaSlotMessage",

                    `No win. You lost ${formatCredits(lockedBet)}.`
                );


                recordResult(
                    false,
                    "slots"
                );

            }


            if (
                profile.balance <
                100
            ) {

                gaSlotBet =
                    0;

            }

            else if (
                gaSlotBet >
                profile.balance
            ) {

                gaSlotBet =
                    profile.balance;

            }


            gaSlotSpinning =
                false;


            gaUpdateSlotDisplays();


            gaSetSlotControls(
                true
            );


            saveProfile();

        },
        1950
    );

}



/*
    OLD SLOT COMPATIBILITY
*/

function spinSlots() {

    gaSpinSlots();

}



/* ==========================================================
   ==========================================================
   ROULETTE
   ==========================================================
   ========================================================== */

const EUROPEAN_WHEEL = [

    0,32,15,19,4,21,2,25,17,
    34,6,27,13,36,11,30,8,23,
    10,5,24,16,33,1,20,14,31,
    9,22,18,29,7,28,12,35,3,26

];


const RED_NUMBERS =
    new Set([

        1,3,5,7,9,
        12,14,16,18,
        19,21,23,25,27,
        30,32,34,36

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
                `translate(-50%,-50%) rotate(${angle}deg)`;


            layer.appendChild(
                label
            );

        }
    );

}



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
        "35:1 PAYOUT"
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

        low:{
            label:"1 TO 18",
            payout:1
        },

        even:{
            label:"EVEN",
            payout:1
        },

        red:{
            label:"RED",
            payout:1
        },

        black:{
            label:"BLACK",
            payout:1
        },

        odd:{
            label:"ODD",
            payout:1
        },

        high:{
            label:"19 TO 36",
            payout:1
        },

        dozen1:{
            label:"1ST 12",
            payout:2
        },

        dozen2:{
            label:"2ND 12",
            payout:2
        },

        dozen3:{
            label:"3RD 12",
            payout:2
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
                rouletteBetAmount,
                profile.balance
            );

    }


    setText(
        "#betAmount",

        formatCredits(
            rouletteBetAmount
        )
    );

}



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


    switch(
        rouletteBet.type
    ) {

        case "red":

            return RED_NUMBERS.has(
                number
            );


        case "black":

            return !RED_NUMBERS.has(
                number
            );


        case "even":

            return (
                number % 2 === 0
            );


        case "odd":

            return (
                number % 2 !== 0
            );


        case "low":

            return (
                number >= 1 &&
                number <= 18
            );


        case "high":

            return (
                number >= 19 &&
                number <= 36
            );


        case "dozen1":

            return (
                number >= 1 &&
                number <= 12
            );


        case "dozen2":

            return (
                number >= 13 &&
                number <= 24
            );


        case "dozen3":

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
        100
        ||
        profile.balance <
        rouletteBetAmount
    ) {

        alert(
            "Not enough Ace Credits."
        );

        return;

    }


    const wheel =
        document.getElementById(
            "rouletteWheel"
        );


    const ball =
        document.getElementById(
            "ballTrack"
        );


    const button =
        document.getElementById(
            "rouletteSpinButton"
        );


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


    const lockedBet =
        rouletteBetAmount;


    profile.balance -=
        lockedBet;


    saveProfile();


    const winningIndex =
        Math.floor(
            Math.random() *
            POCKET_COUNT
        );


    const winningNumber =
        EUROPEAN_WHEEL[
            winningIndex
        ];


    const target =
        winningIndex *
        POCKET_ANGLE;


    const difference =
        normalizeAngle(
            (
                -target
            )
            -
            normalizeAngle(
                rouletteWheelRotation
            )
        );


    rouletteWheelRotation +=
        7 *
        360 +
        difference;


    rouletteBallRotation -=
        11 *
        360;


    setText(
        "#rouletteResult",
        "SPINNING"
    );


    ball.classList.remove(
        "ball-drop"
    );


    void ball.offsetWidth;


    wheel.style.transform =
        `rotate(${rouletteWheelRotation}deg)`;


    ball.style.transform =
        `rotate(${rouletteBallRotation}deg)`;


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
                winningNumber,
                lockedBet
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



function finishRoulette(
    number,
    lockedBet
) {

    const won =
        rouletteBetWins(
            number
        );


    if (won) {

        profile.balance +=
            lockedBet *
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
   ==========================================================
   HIGH ROLL DICE
   ==========================================================
   ========================================================== */

const GA_DICE_SYMBOLS = [

    "⚀",
    "⚁",
    "⚂",
    "⚃",
    "⚄",
    "⚅"

];


let gaDiceBet =
    100;


let gaDiceRolling =
    false;


let gaDiceLastWin =
    0;


let gaDiceAnimationTimer =
    null;



function gaUpdateDiceDisplays() {

    setText(
        "#gaDiceBetAmount",

        formatCredits(
            gaDiceBet
        )
    );


    setText(
        "#gaDiceLastWin",

        formatCredits(
            gaDiceLastWin
        )
    );

}



function gaSetDiceControls(
    enabled
) {

    const controls = [

        "gaDiceMinus",

        "gaDicePlus",

        "gaDiceMax",

        "gaDiceRollButton"

    ];


    controls.forEach(
        (id) => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.disabled =
                    !enabled;

            }

        }
    );


    document
        .querySelectorAll(
            ".ga-dice-chip, .ga-dice-clear-button"
        )
        .forEach(
            (button) => {

                button.disabled =
                    !enabled;

            }
        );

}



function gaChangeDiceBet(
    amount
) {

    if (
        gaDiceRolling
    ) {

        return;

    }


    if (
        profile.balance <
        100
    ) {

        gaDiceBet =
            0;


        gaUpdateDiceDisplays();

        return;

    }


    gaDiceBet +=
        Number(amount);


    gaDiceBet =
        Math.max(
            100,
            gaDiceBet
        );


    gaDiceBet =
        Math.min(
            gaDiceBet,
            profile.balance
        );


    gaUpdateDiceDisplays();


    setText(
        "#gaDiceMessage",

        `Current wager: ${formatCredits(gaDiceBet)}`
    );

}



function gaAddDiceChip(
    amount
) {

    if (
        gaDiceRolling
    ) {

        return;

    }


    if (
        profile.balance <= 0
    ) {

        gaDiceBet =
            0;


        gaUpdateDiceDisplays();

        return;

    }


    gaDiceBet +=
        Number(amount);


    gaDiceBet =
        Math.min(
            gaDiceBet,
            profile.balance
        );


    gaUpdateDiceDisplays();


    setText(
        "#gaDiceMessage",

        `Current wager: ${formatCredits(gaDiceBet)}`
    );

}



function gaClearDiceBet() {

    if (
        gaDiceRolling
    ) {

        return;

    }


    gaDiceBet =
        0;


    gaUpdateDiceDisplays();


    setText(
        "#gaDiceMessage",
        "Bet cleared. Select a new wager."
    );

}



function gaMaxDiceBet() {

    if (
        gaDiceRolling
    ) {

        return;

    }


    gaDiceBet =
        profile.balance;


    gaUpdateDiceDisplays();


    setText(
        "#gaDiceMessage",

        `Maximum wager: ${formatCredits(gaDiceBet)}`
    );

}



function gaSetDie(
    elementId,
    value
) {

    const die =
        document.getElementById(
            elementId
        );


    if (!die) {
        return;
    }


    const face =
        die.querySelector(
            ".ga-die-face"
        );


    if (!face) {
        return;
    }


    face.textContent =
        GA_DICE_SYMBOLS[
            value - 1
        ];

}



function gaStartDiceAnimation() {

    const houseDie =
        document.getElementById(
            "gaHouseDie"
        );


    const playerDie =
        document.getElementById(
            "gaPlayerDie"
        );


    if (houseDie) {

        houseDie.classList.remove(
            "ga-dice-winner"
        );


        houseDie.classList.add(
            "ga-dice-rolling"
        );

    }


    if (playerDie) {

        playerDie.classList.remove(
            "ga-dice-winner"
        );


        playerDie.classList.add(
            "ga-dice-rolling"
        );

    }


    gaDiceAnimationTimer =
        setInterval(
            () => {

                gaSetDie(
                    "gaHouseDie",

                    Math.floor(
                        Math.random() *
                        6
                    )
                    +
                    1
                );


                gaSetDie(
                    "gaPlayerDie",

                    Math.floor(
                        Math.random() *
                        6
                    )
                    +
                    1
                );

            },
            85
        );

}



function gaStopDiceAnimation(
    houseRoll,
    playerRoll
) {

    if (
        gaDiceAnimationTimer
    ) {

        clearInterval(
            gaDiceAnimationTimer
        );

    }


    gaDiceAnimationTimer =
        null;


    const houseDie =
        document.getElementById(
            "gaHouseDie"
        );


    const playerDie =
        document.getElementById(
            "gaPlayerDie"
        );


    if (houseDie) {

        houseDie.classList.remove(
            "ga-dice-rolling"
        );

    }


    if (playerDie) {

        playerDie.classList.remove(
            "ga-dice-rolling"
        );

    }


    gaSetDie(
        "gaHouseDie",
        houseRoll
    );


    gaSetDie(
        "gaPlayerDie",
        playerRoll
    );


    setText(
        "#gaHouseValue",
        houseRoll
    );


    setText(
        "#gaPlayerValue",
        playerRoll
    );

}



function gaHighlightDiceWinner(
    id
) {

    const die =
        document.getElementById(
            id
        );


    if (!die) {
        return;
    }


    die.classList.add(
        "ga-dice-winner"
    );


    setTimeout(
        () => {

            die.classList.remove(
                "ga-dice-winner"
            );

        },
        1800
    );

}



function gaRollDice() {

    if (
        gaDiceRolling
    ) {

        return;

    }


    if (
        gaDiceBet <
        100
    ) {

        alert(
            "Minimum Dice Challenge wager is 100 AC."
        );

        return;

    }


    if (
        profile.balance <
        gaDiceBet
    ) {

        alert(
            "You do not have enough Ace Credits for that wager."
        );

        return;

    }


    gaDiceRolling =
        true;


    gaDiceLastWin =
        0;


    gaUpdateDiceDisplays();


    gaSetDiceControls(
        false
    );


    const lockedBet =
        gaDiceBet;


    profile.balance -=
        lockedBet;


    saveProfile();


    setText(
        "#gaDiceMessage",

        `Rolling for ${formatCredits(lockedBet)}...`
    );


    setText(
        "#gaHouseValue",
        "..."
    );


    setText(
        "#gaPlayerValue",
        "..."
    );


    const houseRoll =
        Math.floor(
            Math.random() *
            6
        )
        +
        1;


    const playerRoll =
        Math.floor(
            Math.random() *
            6
        )
        +
        1;


    gaStartDiceAnimation();


    setTimeout(
        () => {

            gaStopDiceAnimation(
                houseRoll,
                playerRoll
            );


            if (
                playerRoll >
                houseRoll
            ) {

                profile.balance +=
                    lockedBet *
                    2;


                gaDiceLastWin =
                    lockedBet;


                gaHighlightDiceWinner(
                    "gaPlayerDie"
                );


                setText(
                    "#gaDiceMessage",

                    `You rolled ${playerRoll}. House rolled ${houseRoll}. YOU WIN +${formatCredits(lockedBet)}`
                );


                recordResult(
                    true,
                    "dice"
                );

            }


            else if (
                houseRoll >
                playerRoll
            ) {

                gaDiceLastWin =
                    0;


                gaHighlightDiceWinner(
                    "gaHouseDie"
                );


                setText(
                    "#gaDiceMessage",

                    `House rolled ${houseRoll}. You rolled ${playerRoll}. You lost ${formatCredits(lockedBet)}.`
                );


                recordResult(
                    false,
                    "dice"
                );

            }


            else {

                profile.balance +=
                    lockedBet;


                gaDiceLastWin =
                    0;


                setText(
                    "#gaDiceMessage",

                    `Both rolled ${playerRoll}. PUSH — ${formatCredits(lockedBet)} returned.`
                );


                recordResult(
                    null,
                    "dice"
                );

            }


            if (
                profile.balance <
                100
            ) {

                gaDiceBet =
                    0;

            }


            else if (
                gaDiceBet >
                profile.balance
            ) {

                gaDiceBet =
                    profile.balance;

            }


            gaDiceRolling =
                false;


            gaUpdateDiceDisplays();


            gaSetDiceControls(
                true
            );


            saveProfile();

        },
        1400
    );

}



/*
    OLD DICE COMPATIBILITY
*/

function rollDice() {

    gaRollDice();

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
        (a,b) => {

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

            const firstCell =
                row.querySelector(
                    "td"
                );


            if (firstCell) {

                firstCell.textContent =
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
   EXPORT FUNCTIONS
   ========================================================== */


/* GENERAL */

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


window.sortLeaderboard =
    sortLeaderboard;


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


window.changeBlackjackBet =
    changeBlackjackBet;


window.maxBlackjackBet =
    maxBlackjackBet;


/* SLOT MACHINE */

window.gaSpinSlots =
    gaSpinSlots;


window.gaChangeSlotBet =
    gaChangeSlotBet;


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

window.gaRollDice =
    gaRollDice;


window.gaChangeDiceBet =
    gaChangeDiceBet;


window.gaAddDiceChip =
    gaAddDiceChip;


window.gaClearDiceBet =
    gaClearDiceBet;


window.gaMaxDiceBet =
    gaMaxDiceBet;


window.rollDice =
    rollDice;



/* ==========================================================
   INITIALIZE EVERYTHING
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* ================================================
           GENERAL
           ================================================ */

        updateBalanceDisplays();

        updateProfilePage();

        updateCollectionPage();

        updateStoreButtons();



        /* ================================================
           BLACKJACK
           ================================================ */

        renderBlackjack(
            false
        );


        setBlackjackControls(
            false
        );


        updateBlackjackBetDisplay();



        /* ================================================
           SLOT MACHINE
           ================================================ */

        if (
            profile.balance <
            100
        ) {

            gaSlotBet =
                0;

        }


        else if (
            gaSlotBet >
            profile.balance
        ) {

            gaSlotBet =
                profile.balance;

        }


        gaUpdateSlotDisplays();


        gaSetSlotControls(
            true
        );



        /* ================================================
           ROULETTE
           ================================================ */

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



        /* ================================================
           HIGH ROLL DICE
           ================================================ */

        if (
            profile.balance <
            100
        ) {

            gaDiceBet =
                0;

        }


        else if (
            gaDiceBet >
            profile.balance
        ) {

            gaDiceBet =
                profile.balance;

        }


        gaUpdateDiceDisplays();


        gaSetDiceControls(
            true
        );

    }
);
