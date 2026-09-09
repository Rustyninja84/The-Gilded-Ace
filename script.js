document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       THE GILDED ACE
       GLOBAL PLAY-MONEY SYSTEM
    ========================================================= */

    const STARTING_BALANCE = 10000;
    const DAILY_REWARD = 1000;
    const REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

    const BALANCE_KEY = "gildedAceBalance";
    const DAILY_KEY = "gildedAceLastDailyReward";
    const INVENTORY_KEY = "gildedAceOwnedItems";
    const STATS_KEY = "gildedAceStats";

    const BET_LEVELS = [
        50,
        100,
        250,
        500,
        1000,
        2500,
        5000
    ];


    /* =========================================================
       RANDOM NUMBER
    ========================================================= */

    function randomInt(max) {

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const array =
                new Uint32Array(1);

            window.crypto.getRandomValues(
                array
            );

            return array[0] % max;
        }

        return Math.floor(
            Math.random() * max
        );
    }


    /* =========================================================
       NUMBER FORMAT
    ========================================================= */

    function formatNumber(value) {

        return Math.floor(
            Number(value) || 0
        ).toLocaleString();
    }


    /* =========================================================
       BALANCE SYSTEM
    ========================================================= */

    function getBalance() {

        const stored =
            Number(
                localStorage.getItem(
                    BALANCE_KEY
                )
            );

        if (
            !Number.isFinite(stored) ||
            stored < 0
        ) {

            localStorage.setItem(
                BALANCE_KEY,
                STARTING_BALANCE
            );

            return STARTING_BALANCE;
        }

        return stored;
    }


    let balance =
        getBalance();


    function setBalance(value) {

        balance =
            Math.max(
                0,
                Math.floor(
                    Number(value) || 0
                )
            );

        localStorage.setItem(
            BALANCE_KEY,
            balance
        );

        updateBalanceDisplays();
        updateProfile();
    }


    function addBalance(amount) {

        setBalance(
            balance + amount
        );
    }


    function canAfford(amount) {

        return (
            balance >=
            Number(amount)
        );
    }


    function updateBalanceDisplays() {

        document
            .querySelectorAll(
                ".balance-value"
            )
            .forEach(
                (element) => {

                    element.textContent =
                        `${formatNumber(balance)} AC`;

                }
            );


        document
            .querySelectorAll(
                ".casino-balance"
            )
            .forEach(
                (element) => {

                    element.textContent =
                        `${formatNumber(balance)} AC`;

                }
            );


        document
            .querySelectorAll(
                ".credit-balance"
            )
            .forEach(
                (element) => {

                    element.innerHTML =
                        `${formatNumber(balance)} <span>AC</span>`;

                }
            );
    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        message,
        type = "gold"
    ) {

        const oldToast =
            document.querySelector(
                ".gilded-toast"
            );

        if (oldToast) {
            oldToast.remove();
        }


        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "gilded-toast";

        toast.textContent =
            message;


        let borderColor =
            "#d6b35a";

        let textColor =
            "#d6b35a";


        if (type === "success") {

            borderColor =
                "#5b936a";

            textColor =
                "#7fba8d";
        }


        if (type === "error") {

            borderColor =
                "#9e4d4d";

            textColor =
                "#d47777";
        }


        Object.assign(
            toast.style,
            {

                position:
                    "fixed",

                top:
                    "105px",

                left:
                    "50%",

                transform:
                    "translateX(-50%)",

                zIndex:
                    "99999",

                minWidth:
                    "260px",

                maxWidth:
                    "90%",

                padding:
                    "14px 24px",

                background:
                    "#111",

                border:
                    `1px solid ${borderColor}`,

                color:
                    textColor,

                textAlign:
                    "center",

                fontSize:
                    "11px",

                fontWeight:
                    "700",

                letterSpacing:
                    "1.3px",

                boxShadow:
                    "0 18px 45px rgba(0,0,0,.55)"
            }
        );


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.transition =
                    "opacity .35s ease";

                toast.style.opacity =
                    "0";


                setTimeout(
                    () => {
                        toast.remove();
                    },
                    350
                );

            },
            2200
        );
    }


    /* =========================================================
       DAILY REWARD
    ========================================================= */

    const dailyRewardButton =
        document.getElementById(
            "dailyRewardButton"
        );


    function getLastRewardTime() {

        return Number(
            localStorage.getItem(
                DAILY_KEY
            ) || 0
        );
    }


    function isRewardAvailable() {

        const lastReward =
            getLastRewardTime();

        if (!lastReward) {
            return true;
        }

        return (
            Date.now() -
            lastReward >=
            REWARD_COOLDOWN
        );
    }


    function getRewardRemaining() {

        const lastReward =
            getLastRewardTime();

        if (!lastReward) {
            return 0;
        }

        return Math.max(
            0,
            lastReward +
            REWARD_COOLDOWN -
            Date.now()
        );
    }


    function formatCountdown(ms) {

        const seconds =
            Math.floor(
                ms / 1000
            );

        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    seconds %
                    3600
                ) / 60
            );

        const remainingSeconds =
            seconds % 60;


        return (
            String(hours)
                .padStart(2, "0") +
            ":" +
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(remainingSeconds)
                .padStart(2, "0")
        );
    }


    function updateDailyRewardButton() {

        if (!dailyRewardButton) {
            return;
        }


        if (isRewardAvailable()) {

            dailyRewardButton.disabled =
                false;

            dailyRewardButton.textContent =
                "CLAIM DAILY REWARD";

        } else {

            dailyRewardButton.disabled =
                true;

            dailyRewardButton.textContent =
                "NEXT REWARD " +
                formatCountdown(
                    getRewardRemaining()
                );
        }
    }


    if (dailyRewardButton) {

        dailyRewardButton
            .addEventListener(
                "click",
                () => {

                    if (
                        !isRewardAvailable()
                    ) {
                        return;
                    }


                    localStorage.setItem(
                        DAILY_KEY,
                        Date.now()
                    );


                    addBalance(
                        DAILY_REWARD
                    );


                    updateDailyRewardButton();


                    showToast(
                        `+${formatNumber(
                            DAILY_REWARD
                        )} AC DAILY REWARD`,
                        "success"
                    );

                }
            );


        updateDailyRewardButton();


        setInterval(
            updateDailyRewardButton,
            1000
        );
    }


    /* =========================================================
       INVENTORY
    ========================================================= */

    function getOwnedItems() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        INVENTORY_KEY
                    ) || "[]"
                );

            return Array.isArray(saved)
                ? saved
                : [];

        } catch {

            return [];
        }
    }


    function saveOwnedItems(items) {

        localStorage.setItem(
            INVENTORY_KEY,
            JSON.stringify(items)
        );

        renderCollection();
        updateProfile();
    }


    function playerOwnsItem(itemId) {

        return getOwnedItems()
            .some(
                item =>
                    item.id === itemId
            );
    }


    /* =========================================================
       PLAYER STATISTICS
    ========================================================= */

    function defaultStats() {

        return {

            totalWins: 0,
            totalLosses: 0,
            gamesPlayed: 0,

            blackjack: {
                wins: 0,
                losses: 0,
                played: 0
            },

            slots: {
                wins: 0,
                losses: 0,
                played: 0
            },

            roulette: {
                wins: 0,
                losses: 0,
                played: 0
            },

            dice: {
                wins: 0,
                losses: 0,
                played: 0
            }

        };
    }


    function getStats() {

        const defaults =
            defaultStats();


        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        STATS_KEY
                    ) || "{}"
                );


            return {

                totalWins:
                    Number(
                        saved.totalWins
                    ) || 0,

                totalLosses:
                    Number(
                        saved.totalLosses
                    ) || 0,

                gamesPlayed:
                    Number(
                        saved.gamesPlayed
                    ) || 0,

                blackjack: {
                    ...defaults.blackjack,
                    ...saved.blackjack
                },

                slots: {
                    ...defaults.slots,
                    ...saved.slots
                },

                roulette: {
                    ...defaults.roulette,
                    ...saved.roulette
                },

                dice: {
                    ...defaults.dice,
                    ...saved.dice
                }

            };

        } catch {

            return defaults;
        }
    }


    function saveStats(stats) {

        localStorage.setItem(
            STATS_KEY,
            JSON.stringify(stats)
        );

        updateProfile();
    }


    function recordGame(
        game,
        result
    ) {

        const stats =
            getStats();


        if (!stats[game]) {
            return;
        }


        stats.gamesPlayed += 1;

        stats[game].played += 1;


        if (result === "win") {

            stats.totalWins += 1;

            stats[game].wins += 1;
        }


        if (result === "loss") {

            stats.totalLosses += 1;

            stats[game].losses += 1;
        }


        saveStats(
            stats
        );
    }


    /* =========================================================
       STORE FILTERS
    ========================================================= */

    const storeCategoryButtons =
        document.querySelectorAll(
            ".store-category"
        );


    const storeProducts =
        document.querySelectorAll(
            ".store-product"
        );


    const storeSections =
        document.querySelectorAll(
            ".store-category-section"
        );


    function updateStoreButtons() {

        storeProducts.forEach(
            product => {

                const itemId =
                    product.dataset.itemId;


                const button =
                    product.querySelector(
                        ".buy-item-button"
                    );


                if (!button) {
                    return;
                }


                if (
                    playerOwnsItem(
                        itemId
                    )
                ) {

                    button.textContent =
                        "OWNED";

                    button.disabled =
                        true;

                    button.classList.add(
                        "owned"
                    );

                } else {

                    button.textContent =
                        "PURCHASE";

                    button.disabled =
                        false;

                    button.classList.remove(
                        "owned"
                    );
                }

            }
        );
    }


    function filterStore(category) {

        storeProducts.forEach(
            product => {

                const show =
                    category === "all" ||
                    product.dataset.category ===
                        category;


                product.classList.toggle(
                    "store-hidden",
                    !show
                );

            }
        );


        storeSections.forEach(
            section => {

                const visible =
                    section.querySelectorAll(
                        ".store-product:not(.store-hidden)"
                    );


                section.classList.toggle(
                    "store-hidden",
                    visible.length === 0
                );

            }
        );
    }


    storeCategoryButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    storeCategoryButtons
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    filterStore(
                        button.dataset
                            .storeCategory
                    );

                }
            );

        }
    );


    document
        .querySelectorAll(
            ".buy-item-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const product =
                            button.closest(
                                ".store-product"
                            );


                        if (!product) {
                            return;
                        }


                        const itemId =
                            product.dataset
                                .itemId;


                        const itemName =
                            product.dataset
                                .itemName;


                        const category =
                            product.dataset
                                .category;


                        const price =
                            Number(
                                product.dataset
                                    .price
                            );


                        if (
                            !itemId ||
                            !itemName ||
                            !Number.isFinite(
                                price
                            )
                        ) {

                            showToast(
                                "STORE ITEM ERROR",
                                "error"
                            );

                            return;
                        }


                        if (
                            playerOwnsItem(
                                itemId
                            )
                        ) {

                            showToast(
                                "YOU ALREADY OWN THIS ITEM"
                            );

                            return;
                        }


                        if (
                            !canAfford(
                                price
                            )
                        ) {

                            showToast(
                                `NOT ENOUGH ACE CREDITS — NEED ${formatNumber(
                                    price
                                )} AC`,
                                "error"
                            );

                            return;
                        }


                        const confirmed =
                            window.confirm(
                                `Purchase ${itemName} for ${formatNumber(
                                    price
                                )} AC?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        setBalance(
                            balance - price
                        );


                        const owned =
                            getOwnedItems();


                        owned.push({

                            id:
                                itemId,

                            name:
                                itemName,

                            category:
                                category,

                            price:
                                price,

                            purchasedAt:
                                new Date()
                                    .toISOString()

                        });


                        saveOwnedItems(
                            owned
                        );


                        updateStoreButtons();


                        showToast(
                            `${itemName.toUpperCase()} PURCHASED`,
                            "success"
                        );

                    }
                );

            }
        );


    if (
        storeCategoryButtons.length
    ) {

        updateStoreButtons();

        filterStore(
            "all"
        );
    }


    /* =========================================================
       COLLECTION
    ========================================================= */

    const collectionGrid =
        document.getElementById(
            "collectionGrid"
        );


    const collectionEmptyState =
        document.getElementById(
            "collectionEmptyState"
        );


    const collectionOwnedCount =
        document.getElementById(
            "collectionOwnedCount"
        );


    const collectionItemCount =
        document.getElementById(
            "collectionItemCount"
        );


    const collectionValue =
        document.getElementById(
            "collectionValue"
        );


    const collectionHighestPurchase =
        document.getElementById(
            "collectionHighestPurchase"
        );


    const collectionFilters =
        document.querySelectorAll(
            ".collection-filter"
        );


    const collectionArt = {

        "gold-profile-frame":
            "◇",

        "diamond-nameplate":
            "♦",

        "high-roller-title":
            "★",

        "gilded-watch":
            "◉",

        "golden-ace-card":
            "♠",

        "diamond-crown":
            "♛",

        "grand-touring-coupe":
            "GT",

        "gilded-supercar":
            "GA",

        "executive-limousine":
            "XL",

        "private-yacht":
            "Y",

        "private-jet":
            "JET",

        "hotel-suite":
            "01",

        "luxury-penthouse":
            "PH",

        "private-estate":
            "EST",

        "gilded-card-back":
            "A",

        "gold-blackjack-table":
            "21",

        "midnight-roulette":
            "0",

        "high-roller-membership":
            "HR",

        "diamond-club":
            "♦",

        "casino-ownership":
            "♛"

    };


    function getCollectionCategoryName(
        category
    ) {

        const names = {

            profile:
                "PROFILE COSMETIC",

            collectible:
                "LUXURY COLLECTIBLE",

            vehicle:
                "VEHICLE",

            property:
                "PROPERTY",

            casino:
                "CASINO COSMETIC",

            prestige:
                "PRESTIGE"

        };


        return (
            names[category] ||
            "COLLECTIBLE"
        );
    }


    function escapeText(value) {

        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    function formatPurchaseDate(
        value
    ) {

        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "UNKNOWN";
        }


        return date.toLocaleDateString(
            undefined,
            {

                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric"

            }
        );
    }


    function createCollectionCard(
        item
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "collection-item";


        card.dataset.collectionCategory =
            item.category ||
            "collectible";


        const art =
            collectionArt[item.id] ||
            "♠";


        card.innerHTML = `

            <div class="collection-item-art">
                ${escapeText(art)}
            </div>

            <div class="collection-item-details">

                <span class="collection-item-category">
                    ${escapeText(
                        getCollectionCategoryName(
                            item.category
                        )
                    )}
                </span>

                <h3 class="collection-item-name">
                    ${escapeText(
                        item.name
                    )}
                </h3>

                <div class="collection-item-date">
                    ACQUIRED
                    ${escapeText(
                        formatPurchaseDate(
                            item.purchasedAt
                        )
                    )}
                </div>

                <div class="collection-item-bottom">

                    <span class="collection-item-price">
                        ${formatNumber(
                            item.price
                        )} AC
                    </span>

                    <span class="collection-owned-badge">
                        OWNED
                    </span>

                </div>

            </div>

        `;


        return card;
    }


    function updateCollectionStatistics(
        items
    ) {

        const totalValue =
            items.reduce(
                (
                    total,
                    item
                ) => {

                    return (
                        total +
                        (
                            Number(
                                item.price
                            ) || 0
                        )
                    );

                },
                0
            );


        let highest =
            null;


        items.forEach(
            item => {

                if (
                    !highest ||
                    Number(
                        item.price
                    ) >
                    Number(
                        highest.price
                    )
                ) {

                    highest =
                        item;
                }

            }
        );


        if (
            collectionOwnedCount
        ) {

            collectionOwnedCount
                .textContent =
                formatNumber(
                    items.length
                );
        }


        if (
            collectionItemCount
        ) {

            collectionItemCount
                .textContent =
                `${items.length} ${
                    items.length === 1
                        ? "ITEM"
                        : "ITEMS"
                }`;
        }


        if (
            collectionValue
        ) {

            collectionValue
                .textContent =
                `${formatNumber(
                    totalValue
                )} AC`;
        }


        if (
            collectionHighestPurchase
        ) {

            collectionHighestPurchase
                .textContent =
                highest
                    ? highest.name
                    : "—";
        }
    }


    function filterCollection(
        category
    ) {

        if (!collectionGrid) {
            return;
        }


        const cards =
            collectionGrid
                .querySelectorAll(
                    ".collection-item"
                );


        let visible =
            0;


        cards.forEach(
            card => {

                const show =
                    category === "all" ||
                    card.dataset
                        .collectionCategory ===
                        category;


                card.classList.toggle(
                    "collection-hidden",
                    !show
                );


                if (show) {
                    visible++;
                }

            }
        );


        if (
            collectionEmptyState
        ) {

            const heading =
                collectionEmptyState
                    .querySelector(
                        "h2"
                    );


            const paragraph =
                collectionEmptyState
                    .querySelector(
                        "p:not(.section-kicker)"
                    );


            if (
                cards.length === 0
            ) {

                collectionEmptyState
                    .style.display =
                    "block";


                if (heading) {

                    heading.textContent =
                        "YOUR VAULT IS EMPTY";
                }


                if (paragraph) {

                    paragraph.textContent =
                        "Purchase virtual items from The Gilded Store and they will automatically appear in your personal collection.";
                }

            } else if (
                visible === 0
            ) {

                collectionEmptyState
                    .style.display =
                    "block";


                if (heading) {

                    heading.textContent =
                        "NO ITEMS IN THIS CATEGORY";
                }


                if (paragraph) {

                    paragraph.textContent =
                        "You do not currently own any items in this collection category.";
                }

            } else {

                collectionEmptyState
                    .style.display =
                    "none";
            }
        }
    }


    function renderCollection() {

        if (!collectionGrid) {
            return;
        }


        const owned =
            getOwnedItems();


        collectionGrid.innerHTML =
            "";


        owned.forEach(
            item => {

                collectionGrid
                    .appendChild(
                        createCollectionCard(
                            item
                        )
                    );

            }
        );


        updateCollectionStatistics(
            owned
        );


        const active =
            document.querySelector(
                ".collection-filter.active"
            );


        filterCollection(
            active
                ? active.dataset
                    .collectionCategory
                : "all"
        );
    }


    collectionFilters.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    collectionFilters
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    filterCollection(
                        button.dataset
                            .collectionCategory
                    );

                }
            );

        }
    );


    /* =========================================================
       CASINO TABS
    ========================================================= */

    const casinoTabs =
        document.querySelectorAll(
            ".casino-tab"
        );


    const casinoPanels =
        document.querySelectorAll(
            ".casino-game-panel"
        );


    function activateGame(
        gameName
    ) {

        casinoTabs.forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.game ===
                        gameName
                );

            }
        );


        casinoPanels.forEach(
            panel => {

                const match =
                    panel.id === gameName ||
                    panel.dataset
                        .gamePanel ===
                        gameName;


                panel.classList.toggle(
                    "active",
                    match
                );

            }
        );
    }


    casinoTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    const game =
                        tab.dataset.game;


                    activateGame(
                        game
                    );


                    history.replaceState(
                        null,
                        "",
                        `#${game}`
                    );

                }
            );

        }
    );


    if (
        window.location.hash
    ) {

        const game =
            window.location.hash
                .replace(
                    "#",
                    ""
                );


        if (
            [
                "blackjack",
                "slots",
                "roulette",
                "dice"
            ].includes(
                game
            )
        ) {

            activateGame(
                game
            );
        }
    }


    /* =========================================================
       BET CONTROLS
    ========================================================= */

    function createBetControl(
        displayId,
        downId,
        upId,
        startingBet = 100
    ) {

        const display =
            document.getElementById(
                displayId
            );


        const down =
            document.getElementById(
                downId
            );


        const up =
            document.getElementById(
                upId
            );


        let index =
            BET_LEVELS.indexOf(
                startingBet
            );


        if (index === -1) {
            index = 1;
        }


        function update() {

            if (display) {

                display.textContent =
                    `${formatNumber(
                        BET_LEVELS[index]
                    )} AC`;
            }
        }


        if (down) {

            down.addEventListener(
                "click",
                () => {

                    index =
                        Math.max(
                            0,
                            index - 1
                        );

                    update();

                }
            );
        }


        if (up) {

            up.addEventListener(
                "click",
                () => {

                    index =
                        Math.min(
                            BET_LEVELS.length -
                                1,
                            index + 1
                        );

                    update();

                }
            );
        }


        update();


        return {

            getBet() {

                return (
                    BET_LEVELS[index]
                );
            },

            setDisabled(
                disabled
            ) {

                if (down) {
                    down.disabled =
                        disabled;
                }

                if (up) {
                    up.disabled =
                        disabled;
                }
            }

        };
    }


    /* =========================================================
       BLACKJACK
    ========================================================= */

    const blackjackDeal =
        document.getElementById(
            "blackjackDeal"
        );


    if (blackjackDeal) {

        const betControl =
            createBetControl(
                "blackjackBet",
                "blackjackBetDown",
                "blackjackBetUp",
                100
            );


        const dealerCards =
            document.getElementById(
                "dealerCards"
            );


        const playerCards =
            document.getElementById(
                "playerCards"
            );


        const dealerValue =
            document.getElementById(
                "dealerValue"
            );


        const playerValue =
            document.getElementById(
                "playerValue"
            );


        const message =
            document.getElementById(
                "blackjackMessage"
            );


        const hit =
            document.getElementById(
                "blackjackHit"
            );


        const stand =
            document.getElementById(
                "blackjackStand"
            );


        const double =
            document.getElementById(
                "blackjackDouble"
            );


        let deck = [];
        let playerHand = [];
        let dealerHand = [];

        let currentBet = 0;
        let active = false;


        function createDeck() {

            const suits =
                [
                    "♠",
                    "♥",
                    "♦",
                    "♣"
                ];


            const ranks =
                [
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


            const cards =
                [];


            suits.forEach(
                suit => {

                    ranks.forEach(
                        rank => {

                            cards.push({
                                suit,
                                rank
                            });

                        }
                    );

                }
            );


            for (
                let i =
                    cards.length - 1;
                i > 0;
                i--
            ) {

                const j =
                    randomInt(
                        i + 1
                    );


                [
                    cards[i],
                    cards[j]
                ] =
                [
                    cards[j],
                    cards[i]
                ];
            }


            return cards;
        }


        function drawCard() {

            if (
                deck.length < 10
            ) {

                deck =
                    createDeck();
            }

            return deck.pop();
        }


        function cardValue(
            card
        ) {

            if (
                [
                    "J",
                    "Q",
                    "K"
                ].includes(
                    card.rank
                )
            ) {

                return 10;
            }


            if (
                card.rank ===
                "A"
            ) {

                return 11;
            }


            return Number(
                card.rank
            );
        }


        function handValue(
            hand
        ) {

            let total =
                hand.reduce(
                    (
                        sum,
                        card
                    ) =>
                        sum +
                        cardValue(
                            card
                        ),
                    0
                );


            let aces =
                hand.filter(
                    card =>
                        card.rank ===
                            "A"
                ).length;


            while (
                total > 21 &&
                aces > 0
            ) {

                total -= 10;

                aces--;
            }


            return total;
        }


        function isBlackjack(
            hand
        ) {

            return (
                hand.length === 2 &&
                handValue(
                    hand
                ) === 21
            );
        }


        function cardHtml(
            card,
            hidden = false
        ) {

            if (hidden) {

                return `

                    <div class="playing-card card-back">
                        <span>A</span>
                    </div>

                `;
            }


            const red =
                card.suit === "♥" ||
                card.suit === "♦";


            return `

                <div class="playing-card">

                    <span class="card-rank">
                        ${card.rank}
                    </span>

                    <span class="card-suit ${red ? "red" : ""}">
                        ${card.suit}
                    </span>

                </div>

            `;
        }


        function render(
            hideDealer = true
        ) {

            dealerCards.innerHTML =
                dealerHand
                    .map(
                        (
                            card,
                            index
                        ) =>
                            cardHtml(
                                card,
                                hideDealer &&
                                index === 1
                            )
                    )
                    .join("");


            playerCards.innerHTML =
                playerHand
                    .map(
                        card =>
                            cardHtml(
                                card
                            )
                    )
                    .join("");


            playerValue.textContent =
                `Your Hand: ${handValue(
                    playerHand
                )}`;


            if (hideDealer) {

                dealerValue.textContent =
                    dealerHand.length
                        ? `Dealer: ${cardValue(
                            dealerHand[0]
                        )}`
                        : "Dealer: —";

            } else {

                dealerValue.textContent =
                    `Dealer: ${handValue(
                        dealerHand
                    )}`;
            }
        }


        function setMessage(
            text,
            type = ""
        ) {

            message.textContent =
                text;

            message.className =
                "game-message";


            if (type) {

                message.classList.add(
                    type
                );
            }
        }


        function setButtons(
            roundActive
        ) {

            active =
                roundActive;


            hit.disabled =
                !roundActive;

            stand.disabled =
                !roundActive;

            double.disabled =
                !roundActive;

            blackjackDeal.disabled =
                roundActive;


            betControl.setDisabled(
                roundActive
            );
        }


        function finish(
            result
        ) {

            render(
                false
            );


            setButtons(
                false
            );


            if (
                result ===
                "blackjack"
            ) {

                const payout =
                    Math.floor(
                        currentBet *
                        2.5
                    );


                addBalance(
                    payout
                );


                recordGame(
                    "blackjack",
                    "win"
                );


                setMessage(
                    `BLACKJACK! You won ${formatNumber(
                        payout -
                        currentBet
                    )} AC.`,
                    "win"
                );


                return;
            }


            if (
                result ===
                "win"
            ) {

                addBalance(
                    currentBet * 2
                );


                recordGame(
                    "blackjack",
                    "win"
                );


                setMessage(
                    `You won ${formatNumber(
                        currentBet
                    )} AC.`,
                    "win"
                );


                return;
            }


            if (
                result ===
                "push"
            ) {

                addBalance(
                    currentBet
                );


                recordGame(
                    "blackjack",
                    "push"
                );


                setMessage(
                    "Push. Your bet was returned."
                );


                return;
            }


            recordGame(
                "blackjack",
                "loss"
            );


            setMessage(
                `House wins. You lost ${formatNumber(
                    currentBet
                )} AC.`,
                "loss"
            );
        }


        function dealerPlay() {

            while (
                handValue(
                    dealerHand
                ) < 17
            ) {

                dealerHand.push(
                    drawCard()
                );
            }


            const player =
                handValue(
                    playerHand
                );


            const dealer =
                handValue(
                    dealerHand
                );


            if (
                dealer > 21 ||
                player > dealer
            ) {

                finish(
                    "win"
                );

            } else if (
                player < dealer
            ) {

                finish(
                    "loss"
                );

            } else {

                finish(
                    "push"
                );
            }
        }


        blackjackDeal
            .addEventListener(
                "click",
                () => {

                    if (active) {
                        return;
                    }


                    currentBet =
                        betControl
                            .getBet();


                    if (
                        !canAfford(
                            currentBet
                        )
                    ) {

                        setMessage(
                            "You do not have enough Ace Credits.",
                            "loss"
                        );

                        return;
                    }


                    setBalance(
                        balance -
                        currentBet
                    );


                    deck =
                        createDeck();


                    playerHand =
                        [
                            drawCard(),
                            drawCard()
                        ];


                    dealerHand =
                        [
                            drawCard(),
                            drawCard()
                        ];


                    render(
                        true
                    );


                    setButtons(
                        true
                    );


                    setMessage(
                        "Choose HIT, STAND, or DOUBLE."
                    );


                    const playerBJ =
                        isBlackjack(
                            playerHand
                        );


                    const dealerBJ =
                        isBlackjack(
                            dealerHand
                        );


                    if (
                        playerBJ &&
                        dealerBJ
                    ) {

                        finish(
                            "push"
                        );

                    } else if (
                        playerBJ
                    ) {

                        finish(
                            "blackjack"
                        );

                    } else if (
                        dealerBJ
                    ) {

                        finish(
                            "loss"
                        );
                    }

                }
            );


        hit.addEventListener(
            "click",
            () => {

                if (!active) {
                    return;
                }


                playerHand.push(
                    drawCard()
                );


                double.disabled =
                    true;


                render(
                    true
                );


                const value =
                    handValue(
                        playerHand
                    );


                if (
                    value > 21
                ) {

                    finish(
                        "loss"
                    );

                } else if (
                    value === 21
                ) {

                    dealerPlay();
                }

            }
        );


        stand.addEventListener(
            "click",
            () => {

                if (!active) {
                    return;
                }

                dealerPlay();

            }
        );


        double.addEventListener(
            "click",
            () => {

                if (
                    !active ||
                    playerHand.length !==
                        2
                ) {

                    return;
                }


                if (
                    !canAfford(
                        currentBet
                    )
                ) {

                    setMessage(
                        "Not enough Ace Credits to double.",
                        "loss"
                    );

                    return;
                }


                setBalance(
                    balance -
                    currentBet
                );


                currentBet *=
                    2;


                playerHand.push(
                    drawCard()
                );


                render(
                    true
                );


                if (
                    handValue(
                        playerHand
                    ) > 21
                ) {

                    finish(
                        "loss"
                    );

                    return;
                }


                dealerPlay();

            }
        );


        setButtons(
            false
        );
    }


    /* =========================================================
       SLOTS
    ========================================================= */

    const slotSpin =
        document.getElementById(
            "slotSpin"
        );


    if (slotSpin) {

        const betControl =
            createBetControl(
                "slotBet",
                "slotBetDown",
                "slotBetUp",
                100
            );


        const reels =
            [
                document.getElementById(
                    "slotReel1"
                ),
                document.getElementById(
                    "slotReel2"
                ),
                document.getElementById(
                    "slotReel3"
                )
            ];


        const message =
            document.getElementById(
                "slotMessage"
            );


        const symbols =
            [
                "♠",
                "♥",
                "♦",
                "♣",
                "7",
                "A"
            ];


        function symbol() {

            return symbols[
                randomInt(
                    symbols.length
                )
            ];
        }


        function setMessage(
            text,
            type = ""
        ) {

            message.textContent =
                text;

            message.className =
                "game-message";


            if (type) {

                message.classList.add(
                    type
                );
            }
        }


        slotSpin.addEventListener(
            "click",
            () => {

                const bet =
                    betControl.getBet();


                if (
                    !canAfford(
                        bet
                    )
                ) {

                    setMessage(
                        "You do not have enough Ace Credits.",
                        "loss"
                    );

                    return;
                }


                setBalance(
                    balance - bet
                );


                slotSpin.disabled =
                    true;


                betControl.setDisabled(
                    true
                );


                reels.forEach(
                    reel =>
                        reel.classList.add(
                            "spinning"
                        )
                );


                setMessage(
                    "Spinning..."
                );


                const animation =
                    setInterval(
                        () => {

                            reels.forEach(
                                reel => {

                                    reel.textContent =
                                        symbol();

                                }
                            );

                        },
                        90
                    );


                setTimeout(
                    () => {

                        clearInterval(
                            animation
                        );


                        reels.forEach(
                            reel =>
                                reel.classList.remove(
                                    "spinning"
                                )
                        );


                        const result =
                            [
                                symbol(),
                                symbol(),
                                symbol()
                            ];


                        reels.forEach(
                            (
                                reel,
                                index
                            ) => {

                                reel.textContent =
                                    result[index];

                            }
                        );


                        let multiplier =
                            0;


                        if (
                            result.every(
                                value =>
                                    value ===
                                    "7"
                            )
                        ) {

                            multiplier =
                                10;

                        } else if (
                            result.every(
                                value =>
                                    value ===
                                    "A"
                            )
                        ) {

                            multiplier =
                                7;

                        } else if (
                            result[0] ===
                                result[1] &&
                            result[1] ===
                                result[2]
                        ) {

                            multiplier =
                                5;

                        } else if (
                            result[0] ===
                                result[1] ||
                            result[1] ===
                                result[2] ||
                            result[0] ===
                                result[2]
                        ) {

                            multiplier =
                                2;
                        }


                        if (
                            multiplier > 0
                        ) {

                            const payout =
                                bet *
                                multiplier;


                            addBalance(
                                payout
                            );


                            recordGame(
                                "slots",
                                "win"
                            );


                            setMessage(
                                `WIN! ${formatNumber(
                                    payout
                                )} AC paid.`,
                                "win"
                            );

                        } else {

                            recordGame(
                                "slots",
                                "loss"
                            );


                            setMessage(
                                `No match. You lost ${formatNumber(
                                    bet
                                )} AC.`,
                                "loss"
                            );
                        }


                        slotSpin.disabled =
                            false;


                        betControl.setDisabled(
                            false
                        );

                    },
                    1200
                );

            }
        );
    }


    /* =========================================================
       ROULETTE
    ========================================================= */

    const rouletteSpin =
        document.getElementById(
            "rouletteSpin"
        );


    if (rouletteSpin) {

        const betControl =
            createBetControl(
                "rouletteBet",
                "rouletteBetDown",
                "rouletteBetUp",
                100
            );


        const choices =
            document.querySelectorAll(
                ".roulette-choice"
            );


        const resultDisplay =
            document.getElementById(
                "rouletteResult"
            );


        const message =
            document.getElementById(
                "rouletteMessage"
            );


        const wheel =
            document.querySelector(
                ".roulette-wheel"
            );


        let selected =
            null;


        const reds =
            new Set(
                [
                    1,3,5,7,9,
                    12,14,16,18,
                    19,21,23,25,
                    27,30,32,34,
                    36
                ]
            );


        function color(
            number
        ) {

            if (
                number === 0
            ) {

                return "green";
            }


            return reds.has(
                number
            )
                ? "red"
                : "black";
        }


        function wins(
            selection,
            number
        ) {

            if (
                number === 0
            ) {

                return false;
            }


            if (
                selection ===
                "red"
            ) {

                return (
                    color(number) ===
                    "red"
                );
            }


            if (
                selection ===
                "black"
            ) {

                return (
                    color(number) ===
                    "black"
                );
            }


            if (
                selection ===
                "odd"
            ) {

                return (
                    number %
                    2 !== 0
                );
            }


            if (
                selection ===
                "even"
            ) {

                return (
                    number %
                    2 === 0
                );
            }


            if (
                selection ===
                "low"
            ) {

                return (
                    number >= 1 &&
                    number <= 18
                );
            }


            if (
                selection ===
                "high"
            ) {

                return (
                    number >= 19 &&
                    number <= 36
                );
            }


            return false;
        }


        choices.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        choices.forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );


                        button.classList.add(
                            "selected"
                        );


                        selected =
                            button.dataset
                                .rouletteChoice;


                        message.textContent =
                            `${button.textContent.trim()} selected.`;


                        message.className =
                            "game-message";

                    }
                );

            }
        );


        rouletteSpin
            .addEventListener(
                "click",
                () => {

                    if (!selected) {

                        message.textContent =
                            "Choose RED, BLACK, ODD, EVEN, 1-18, or 19-36 first.";

                        message.className =
                            "game-message loss";

                        return;
                    }


                    const bet =
                        betControl.getBet();


                    if (
                        !canAfford(
                            bet
                        )
                    ) {

                        message.textContent =
                            "You do not have enough Ace Credits.";

                        message.className =
                            "game-message loss";

                        return;
                    }


                    setBalance(
                        balance - bet
                    );


                    rouletteSpin.disabled =
                        true;


                    betControl.setDisabled(
                        true
                    );


                    choices.forEach(
                        button =>
                            button.disabled =
                                true
                    );


                    if (wheel) {

                        wheel.classList.add(
                            "spinning"
                        );
                    }


                    message.textContent =
                        "Wheel spinning...";


                    message.className =
                        "game-message";


                    const animation =
                        setInterval(
                            () => {

                                resultDisplay.textContent =
                                    randomInt(
                                        37
                                    );

                            },
                            80
                        );


                    setTimeout(
                        () => {

                            clearInterval(
                                animation
                            );


                            if (wheel) {

                                wheel.classList.remove(
                                    "spinning"
                                );
                            }


                            const number =
                                randomInt(
                                    37
                                );


                            const resultColor =
                                color(
                                    number
                                );


                            resultDisplay.textContent =
                                number;


                            if (
                                wins(
                                    selected,
                                    number
                                )
                            ) {

                                addBalance(
                                    bet * 2
                                );


                                recordGame(
                                    "roulette",
                                    "win"
                                );


                                message.textContent =
                                    `${number} ${resultColor.toUpperCase()} — You won ${formatNumber(
                                        bet
                                    )} AC.`;


                                message.className =
                                    "game-message win";

                            } else {

                                recordGame(
                                    "roulette",
                                    "loss"
                                );


                                message.textContent =
                                    `${number} ${resultColor.toUpperCase()} — You lost ${formatNumber(
                                        bet
                                    )} AC.`;


                                message.className =
                                    "game-message loss";
                            }


                            rouletteSpin.disabled =
                                false;


                            betControl.setDisabled(
                                false
                            );


                            choices.forEach(
                                button =>
                                    button.disabled =
                                        false
                            );

                        },
                        1500
                    );

                }
            );
    }


    /* =========================================================
       HIGH ROLL / DICE
    ========================================================= */

    const diceRoll =
        document.getElementById(
            "diceRoll"
        );


    if (diceRoll) {

        const betControl =
            createBetControl(
                "diceBet",
                "diceBetDown",
                "diceBetUp",
                100
            );


        const houseDie =
            document.getElementById(
                "houseDie"
            );


        const playerDie =
            document.getElementById(
                "playerDie"
            );


        const houseValue =
            document.getElementById(
                "houseDieValue"
            );


        const playerValue =
            document.getElementById(
                "playerDieValue"
            );


        const message =
            document.getElementById(
                "diceMessage"
            );


        const faces =
            [
                "⚀",
                "⚁",
                "⚂",
                "⚃",
                "⚄",
                "⚅"
            ];


        function roll() {

            return (
                randomInt(
                    6
                ) + 1
            );
        }


        diceRoll.addEventListener(
            "click",
            () => {

                const bet =
                    betControl.getBet();


                if (
                    !canAfford(
                        bet
                    )
                ) {

                    message.textContent =
                        "You do not have enough Ace Credits.";

                    message.className =
                        "game-message loss";

                    return;
                }


                setBalance(
                    balance - bet
                );


                diceRoll.disabled =
                    true;


                betControl.setDisabled(
                    true
                );


                houseDie.classList.add(
                    "rolling"
                );


                playerDie.classList.add(
                    "rolling"
                );


                message.textContent =
                    "Rolling...";


                message.className =
                    "game-message";


                const animation =
                    setInterval(
                        () => {

                            houseDie.textContent =
                                faces[
                                    roll() - 1
                                ];


                            playerDie.textContent =
                                faces[
                                    roll() - 1
                                ];

                        },
                        90
                    );


                setTimeout(
                    () => {

                        clearInterval(
                            animation
                        );


                        houseDie.classList.remove(
                            "rolling"
                        );


                        playerDie.classList.remove(
                            "rolling"
                        );


                        const house =
                            roll();


                        const player =
                            roll();


                        houseDie.textContent =
                            faces[
                                house - 1
                            ];


                        playerDie.textContent =
                            faces[
                                player - 1
                            ];


                        houseValue.textContent =
                            house;


                        playerValue.textContent =
                            player;


                        if (
                            player > house
                        ) {

                            addBalance(
                                bet * 2
                            );


                            recordGame(
                                "dice",
                                "win"
                            );


                            message.textContent =
                                `You rolled ${player}. House rolled ${house}. You won ${formatNumber(
                                    bet
                                )} AC.`;


                            message.className =
                                "game-message win";

                        } else if (
                            player === house
                        ) {

                            addBalance(
                                bet
                            );


                            recordGame(
                                "dice",
                                "push"
                            );


                            message.textContent =
                                `Tie at ${player}. Your bet was returned.`;


                            message.className =
                                "game-message";

                        } else {

                            recordGame(
                                "dice",
                                "loss"
                            );


                            message.textContent =
                                `You rolled ${player}. House rolled ${house}. You lost ${formatNumber(
                                    bet
                                )} AC.`;


                            message.className =
                                "game-message loss";
                        }


                        diceRoll.disabled =
                            false;


                        betControl.setDisabled(
                            false
                        );

                    },
                    1000
                );

            }
        );
    }


    /* =========================================================
       PROFILE SYSTEM
    ========================================================= */

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.textContent =
                value;
        }
    }


    function getHighestOwnedItem() {

        const owned =
            getOwnedItems();


        if (!owned.length) {
            return null;
        }


        return owned.reduce(
            (
                highest,
                item
            ) => {

                if (
                    !highest ||
                    Number(
                        item.price
                    ) >
                    Number(
                        highest.price
                    )
                ) {

                    return item;
                }


                return highest;

            },
            null
        );
    }


    function getCollectionValue() {

        return getOwnedItems()
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    (
                        Number(
                            item.price
                        ) || 0
                    ),
                0
            );
    }


    function getTier() {

        if (
            balance >=
            10000000
        ) {

            return {
                name:
                    "CASINO OWNER",
                next:
                    "MAXIMUM STATUS",
                start:
                    10000000,
                target:
                    10000000
            };
        }


        if (
            balance >=
            1000000
        ) {

            return {
                name:
                    "DIAMOND CLUB",
                next:
                    "CASINO OWNER",
                start:
                    1000000,
                target:
                    10000000
            };
        }


        if (
            balance >=
            500000
        ) {

            return {
                name:
                    "HIGH ROLLER",
                next:
                    "DIAMOND CLUB",
                start:
                    500000,
                target:
                    1000000
            };
        }


        if (
            balance >=
            250000
        ) {

            return {
                name:
                    "VIP",
                next:
                    "HIGH ROLLER",
                start:
                    250000,
                target:
                    500000
            };
        }


        if (
            balance >=
            100000
        ) {

            return {
                name:
                    "GOLD MEMBER",
                next:
                    "VIP",
                start:
                    100000,
                target:
                    250000
            };
        }


        return {
            name:
                "STANDARD",
            next:
                "GOLD MEMBER",
            start:
                0,
            target:
                100000
        };
    }


    function updateProfileProgress() {

        const tier =
            getTier();


        const membership =
            document.querySelector(
                ".profile-membership"
            );


        if (membership) {

            membership.textContent =
                `${tier.name} MEMBER`;
        }


        const tierLabel =
            document.querySelector(
                ".profile-tier-label"
            );


        if (tierLabel) {

            tierLabel.textContent =
                tier.name;
        }


        const top =
            document.querySelectorAll(
                ".profile-progress-top > div"
            );


        if (
            top.length >= 2
        ) {

            const currentStrong =
                top[0]
                    .querySelector(
                        "strong"
                    );


            const nextStrong =
                top[1]
                    .querySelector(
                        "strong"
                    );


            if (currentStrong) {

                currentStrong.textContent =
                    tier.name;
            }


            if (nextStrong) {

                nextStrong.textContent =
                    tier.next;
            }
        }


        const bottom =
            document.querySelectorAll(
                ".profile-progress-bottom span"
            );


        if (
            bottom.length >= 2
        ) {

            bottom[0].textContent =
                `${formatNumber(
                    balance
                )} AC`;


            bottom[1].textContent =
                `${formatNumber(
                    tier.target
                )} AC`;
        }


        const progress =
            document.querySelector(
                ".profile-progress-bar"
            );


        if (progress) {

            let percentage =
                100;


            if (
                tier.target >
                tier.start
            ) {

                percentage =
                    (
                        (
                            balance -
                            tier.start
                        ) /
                        (
                            tier.target -
                            tier.start
                        )
                    ) *
                    100;
            }


            percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                );


            progress.style.width =
                `${percentage}%`;
        }
    }


    function updateAchievements() {

        const cards =
            document.querySelectorAll(
                ".achievement-card"
            );


        if (!cards.length) {
            return;
        }


        const stats =
            getStats();


        const unlocked =
            [
                true,
                stats.totalWins >= 1,
                balance >= 100000,
                balance >= 1000000
            ];


        cards.forEach(
            (
                card,
                index
            ) => {

                const status =
                    card.querySelector(
                        ":scope > span"
                    );


                if (
                    unlocked[index]
                ) {

                    card.classList.add(
                        "unlocked"
                    );

                    card.classList.remove(
                        "locked"
                    );


                    if (status) {

                        status.textContent =
                            "UNLOCKED";
                    }

                } else {

                    card.classList.remove(
                        "unlocked"
                    );

                    card.classList.add(
                        "locked"
                    );


                    if (status) {

                        status.textContent =
                            "LOCKED";
                    }
                }

            }
        );
    }


    function updateProfile() {

        const profilePage =
            document.querySelector(
                ".profile-page"
            );


        if (!profilePage) {
            return;
        }


        const stats =
            getStats();


        const owned =
            getOwnedItems();


        const highest =
            getHighestOwnedItem();


        setText(
            "profileTotalWins",
            formatNumber(
                stats.totalWins
            )
        );


        setText(
            "profileTotalLosses",
            formatNumber(
                stats.totalLosses
            )
        );


        setText(
            "profileGamesPlayed",
            formatNumber(
                stats.gamesPlayed
            )
        );


        setText(
            "profileCollectionCount",
            formatNumber(
                owned.length
            )
        );


        setText(
            "profileBlackjackWins",
            formatNumber(
                stats.blackjack.wins
            )
        );


        setText(
            "profileBlackjackPlayed",
            formatNumber(
                stats.blackjack.played
            )
        );


        setText(
            "profileSlotsWins",
            formatNumber(
                stats.slots.wins
            )
        );


        setText(
            "profileSlotsPlayed",
            formatNumber(
                stats.slots.played
            )
        );


        setText(
            "profileRouletteWins",
            formatNumber(
                stats.roulette.wins
            )
        );


        setText(
            "profileRoulettePlayed",
            formatNumber(
                stats.roulette.played
            )
        );


        setText(
            "profileDiceWins",
            formatNumber(
                stats.dice.wins
            )
        );


        setText(
            "profileDicePlayed",
            formatNumber(
                stats.dice.played
            )
        );


        setText(
            "profileOwnedItems",
            formatNumber(
                owned.length
            )
        );


        setText(
            "profileCollectionValue",
            `${formatNumber(
                getCollectionValue()
            )} AC`
        );


        setText(
            "profileRarestAsset",
            highest
                ? highest.name
                : "—"
        );


        updateProfileProgress();

        updateAchievements();
    }


    /* =========================================================
       INITIAL PAGE LOAD
    ========================================================= */

    updateBalanceDisplays();

    renderCollection();

    updateProfile();

});
