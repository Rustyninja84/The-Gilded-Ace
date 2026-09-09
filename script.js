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

        if (max <= 0) {
            return 0;
        }

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const values =
                new Uint32Array(1);

            window.crypto.getRandomValues(
                values
            );

            return values[0] % max;
        }

        return Math.floor(
            Math.random() * max
        );
    }


    /* =========================================================
       BALANCE
    ========================================================= */

    let balance =
        Number(
            localStorage.getItem(
                BALANCE_KEY
            )
        );

    if (
        !Number.isFinite(balance) ||
        balance < 0
    ) {

        balance =
            STARTING_BALANCE;

        localStorage.setItem(
            BALANCE_KEY,
            String(balance)
        );
    }


    function formatNumber(value) {

        return Math.floor(
            Number(value) || 0
        ).toLocaleString();
    }


    function getBalance() {

        return balance;
    }


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
            String(balance)
        );

        updateBalanceDisplays();
    }


    function addBalance(amount) {

        setBalance(
            balance + Number(amount || 0)
        );
    }


    function canAfford(amount) {

        return (
            balance >= Number(amount || 0)
        );
    }


    function updateBalanceDisplays() {

        document
            .querySelectorAll(
                ".balance-value"
            )
            .forEach((element) => {

                element.textContent =
                    `${formatNumber(balance)} AC`;

            });


        document
            .querySelectorAll(
                ".casino-balance"
            )
            .forEach((element) => {

                element.textContent =
                    `${formatNumber(balance)} AC`;

            });


        document
            .querySelectorAll(
                ".credit-balance"
            )
            .forEach((element) => {

                element.innerHTML =
                    `${formatNumber(balance)} <span>AC</span>`;

            });
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
                position: "fixed",
                top: "105px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: "99999",
                minWidth: "260px",
                maxWidth: "90%",
                padding: "14px 24px",
                background: "#111",
                border: `1px solid ${borderColor}`,
                color: textColor,
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1.3px",
                boxShadow:
                    "0 18px 45px rgba(0,0,0,.55)"
            }
        );


        document.body.appendChild(
            toast
        );


        setTimeout(() => {

            toast.style.transition =
                "opacity .35s ease";

            toast.style.opacity =
                "0";


            setTimeout(() => {

                toast.remove();

            }, 350);

        }, 2200);
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
            (
                lastReward +
                REWARD_COOLDOWN
            ) -
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
                (seconds % 3600) /
                60
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

            dailyRewardButton.style.opacity =
                "1";

            dailyRewardButton.style.cursor =
                "pointer";

        } else {

            dailyRewardButton.disabled =
                true;

            dailyRewardButton.textContent =
                "NEXT REWARD " +
                formatCountdown(
                    getRewardRemaining()
                );

            dailyRewardButton.style.opacity =
                ".55";

            dailyRewardButton.style.cursor =
                "not-allowed";
        }
    }


    if (dailyRewardButton) {

        dailyRewardButton.addEventListener(
            "click",
            () => {

                if (
                    !isRewardAvailable()
                ) {
                    return;
                }


                addBalance(
                    DAILY_REWARD
                );


                localStorage.setItem(
                    DAILY_KEY,
                    String(Date.now())
                );


                updateDailyRewardButton();


                showToast(
                    `+${formatNumber(DAILY_REWARD)} AC DAILY REWARD`,
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
    }


    function playerOwnsItem(itemId) {

        return getOwnedItems()
            .some(
                (item) =>
                    item.id === itemId
            );
    }


    /* =========================================================
       STORE
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
            (product) => {

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
                    playerOwnsItem(itemId)
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
            (product) => {

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
            (section) => {

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
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    storeCategoryButtons
                        .forEach(
                            (otherButton) => {

                                otherButton
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            }
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
            (button) => {

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
                                `NOT ENOUGH ACE CREDITS — NEED ${formatNumber(price)} AC`,
                                "error"
                            );

                            return;
                        }


                        const confirmed =
                            window.confirm(
                                `Purchase ${itemName} for ${formatNumber(price)} AC?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        setBalance(
                            getBalance() -
                            price
                        );


                        const items =
                            getOwnedItems();


                        items.push({
                            id: itemId,
                            name: itemName,
                            category: category,
                            price: price,
                            purchasedAt:
                                new Date()
                                    .toISOString()
                        });


                        saveOwnedItems(
                            items
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

        filterStore("all");
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

        "gold-profile-frame": "◇",
        "diamond-nameplate": "♦",
        "high-roller-title": "★",

        "gilded-watch": "◉",
        "golden-ace-card": "♠",
        "diamond-crown": "♛",

        "grand-touring-coupe": "GT",
        "gilded-supercar": "GA",
        "executive-limousine": "XL",
        "private-yacht": "Y",
        "private-jet": "JET",

        "hotel-suite": "01",
        "luxury-penthouse": "PH",
        "private-estate": "EST",

        "gilded-card-back": "A",
        "gold-blackjack-table": "21",
        "midnight-roulette": "0",

        "high-roller-membership": "HR",
        "diamond-club": "♦",
        "casino-ownership": "♛"
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


    function formatPurchaseDate(
        dateString
    ) {

        if (!dateString) {
            return "DATE UNAVAILABLE";
        }


        const date =
            new Date(dateString);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "DATE UNAVAILABLE";
        }


        return date.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
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


        card.dataset
            .collectionCategory =
            item.category ||
            "collectible";


        const art =
            collectionArt[item.id] ||
            "♠";


        const price =
            Number(item.price) || 0;


        const artElement =
            document.createElement(
                "div"
            );

        artElement.className =
            "collection-item-art";

        artElement.textContent =
            art;


        const details =
            document.createElement(
                "div"
            );

        details.className =
            "collection-item-details";


        const category =
            document.createElement(
                "span"
            );

        category.className =
            "collection-item-category";

        category.textContent =
            getCollectionCategoryName(
                item.category
            );


        const name =
            document.createElement(
                "h3"
            );

        name.className =
            "collection-item-name";

        name.textContent =
            item.name ||
            "Gilded Item";


        const date =
            document.createElement(
                "div"
            );

        date.className =
            "collection-item-date";

        date.textContent =
            "ACQUIRED " +
            formatPurchaseDate(
                item.purchasedAt
            );


        const bottom =
            document.createElement(
                "div"
            );

        bottom.className =
            "collection-item-bottom";


        const priceElement =
            document.createElement(
                "span"
            );

        priceElement.className =
            "collection-item-price";

        priceElement.textContent =
            `${formatNumber(price)} AC`;


        const owned =
            document.createElement(
                "span"
            );

        owned.className =
            "collection-owned-badge";

        owned.textContent =
            "OWNED";


        bottom.appendChild(
            priceElement
        );

        bottom.appendChild(
            owned
        );


        details.appendChild(
            category
        );

        details.appendChild(
            name
        );

        details.appendChild(
            date
        );

        details.appendChild(
            bottom
        );


        card.appendChild(
            artElement
        );

        card.appendChild(
            details
        );


        return card;
    }


    function updateCollectionStatistics(
        items
    ) {

        const totalItems =
            items.length;


        const totalValue =
            items.reduce(
                (total, item) =>
                    total +
                    (
                        Number(
                            item.price
                        ) || 0
                    ),
                0
            );


        let highestItem =
            null;


        items.forEach(
            (item) => {

                if (
                    !highestItem ||
                    (
                        Number(
                            item.price
                        ) || 0
                    ) >
                    (
                        Number(
                            highestItem.price
                        ) || 0
                    )
                ) {

                    highestItem =
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
                    totalItems
                );
        }


        if (
            collectionItemCount
        ) {

            collectionItemCount
                .textContent =
                `${formatNumber(totalItems)} ${
                    totalItems === 1
                        ? "ITEM"
                        : "ITEMS"
                }`;
        }


        if (
            collectionValue
        ) {

            collectionValue.textContent =
                `${formatNumber(totalValue)} AC`;
        }


        if (
            collectionHighestPurchase
        ) {

            collectionHighestPurchase
                .textContent =
                highestItem
                    ? highestItem.name
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


        let visibleItems = 0;


        cards.forEach(
            (card) => {

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
                    visibleItems++;
                }
            }
        );


        if (
            collectionEmptyState
        ) {

            if (
                cards.length === 0
            ) {

                collectionEmptyState
                    .style.display =
                    "block";

            } else if (
                visibleItems === 0
            ) {

                collectionEmptyState
                    .style.display =
                    "block";

                const heading =
                    collectionEmptyState
                        .querySelector(
                            "h2"
                        );

                const text =
                    collectionEmptyState
                        .querySelector(
                            "p:not(.section-kicker)"
                        );


                if (heading) {

                    heading.textContent =
                        "NO ITEMS IN THIS CATEGORY";
                }


                if (text) {

                    text.textContent =
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


        const items =
            getOwnedItems();


        collectionGrid.innerHTML =
            "";


        items.forEach(
            (item) => {

                collectionGrid.appendChild(
                    createCollectionCard(
                        item
                    )
                );
            }
        );


        updateCollectionStatistics(
            items
        );


        const active =
            document.querySelector(
                ".collection-filter.active"
            );


        const category =
            active
                ? active.dataset
                    .collectionCategory
                : "all";


        filterCollection(
            category
        );
    }


    collectionFilters.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    collectionFilters
                        .forEach(
                            (otherButton) => {

                                otherButton
                                    .classList
                                    .remove(
                                        "active"
                                    );
                            }
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
            (tab) => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.game ===
                    gameName
                );
            }
        );


        casinoPanels.forEach(
            (panel) => {

                panel.classList.toggle(
                    "active",
                    panel.id === gameName ||
                    panel.dataset
                        .gamePanel ===
                    gameName
                );
            }
        );
    }


    casinoTabs.forEach(
        (tab) => {

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


    const requestedGame =
        window.location.hash
            .replace("#", "");


    const validGames = [
        "blackjack",
        "slots",
        "roulette",
        "dice"
    ];


    if (
        validGames.includes(
            requestedGame
        )
    ) {

        activateGame(
            requestedGame
        );
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


        if (index < 0) {
            index = 1;
        }


        function update() {

            if (display) {

                display.textContent =
                    `${formatNumber(BET_LEVELS[index])} AC`;
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

                return BET_LEVELS[
                    index
                ];
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
        let roundActive = false;


        function createDeck() {

            const suits = [
                "♠",
                "♥",
                "♦",
                "♣"
            ];

            const ranks = [
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
                "K",
                "A"
            ];


            const cards = [];


            suits.forEach(
                (suit) => {

                    ranks.forEach(
                        (rank) => {

                            cards.push({
                                rank,
                                suit
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
                ] = [
                    cards[j],
                    cards[i]
                ];
            }


            return cards;
        }


        function drawCard() {

            if (
                deck.length === 0
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
                card.rank === "A"
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
                        cardValue(card),
                    0
                );


            let aces =
                hand.filter(
                    (card) =>
                        card.rank === "A"
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
                handValue(hand) ===
                21
            );
        }


        function renderCard(
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

                element.innerHTML =
                    "<span>A</span>";

                return element;
            }


            element.className =
                "playing-card";


            const rank =
                document.createElement(
                    "span"
                );

            rank.className =
                "card-rank";

            rank.textContent =
                card.rank;


            const suit =
                document.createElement(
                    "span"
                );

            suit.className =
                "card-suit";

            suit.textContent =
                card.suit;


            if (
                card.suit === "♥" ||
                card.suit === "♦"
            ) {

                suit.classList.add(
                    "red"
                );
            }


            element.appendChild(
                rank
            );

            element.appendChild(
                suit
            );


            return element;
        }


        function renderBlackjack(
            hideDealer = true
        ) {

            dealerCards.innerHTML =
                "";

            playerCards.innerHTML =
                "";


            dealerHand.forEach(
                (card, index) => {

                    dealerCards
                        .appendChild(
                            renderCard(
                                card,
                                hideDealer &&
                                index === 1
                            )
                        );
                }
            );


            playerHand.forEach(
                (card) => {

                    playerCards
                        .appendChild(
                            renderCard(
                                card
                            )
                        );
                }
            );


            playerValue.textContent =
                `Your Hand: ${handValue(playerHand)}`;


            dealerValue.textContent =
                hideDealer
                    ? "Dealer: ?"
                    : `Dealer: ${handValue(dealerHand)}`;
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
            active
        ) {

            hit.disabled =
                !active;

            stand.disabled =
                !active;

            double.disabled =
                !active;

            blackjackDeal.disabled =
                active;

            betControl.setDisabled(
                active
            );
        }


        function finish(
            result
        ) {

            roundActive =
                false;

            renderBlackjack(
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
                        currentBet * 2.5
                    );

                addBalance(
                    payout
                );

                setMessage(
                    `BLACKJACK! You won ${formatNumber(payout - currentBet)} AC.`,
                    "win"
                );

                return;
            }


            if (
                result === "win"
            ) {

                addBalance(
                    currentBet * 2
                );

                setMessage(
                    `You won ${formatNumber(currentBet)} AC.`,
                    "win"
                );

                return;
            }


            if (
                result === "push"
            ) {

                addBalance(
                    currentBet
                );

                setMessage(
                    "Push. Your bet was returned."
                );

                return;
            }


            setMessage(
                `House wins. You lost ${formatNumber(currentBet)} AC.`,
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


            const playerTotal =
                handValue(
                    playerHand
                );

            const dealerTotal =
                handValue(
                    dealerHand
                );


            if (
                dealerTotal > 21
            ) {

                finish("win");

            } else if (
                dealerTotal >
                playerTotal
            ) {

                finish("loss");

            } else if (
                dealerTotal <
                playerTotal
            ) {

                finish("win");

            } else {

                finish("push");
            }
        }


        blackjackDeal.addEventListener(
            "click",
            () => {

                if (roundActive) {
                    return;
                }


                currentBet =
                    betControl.getBet();


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
                    getBalance() -
                    currentBet
                );


                deck =
                    createDeck();

                playerHand = [
                    drawCard(),
                    drawCard()
                ];

                dealerHand = [
                    drawCard(),
                    drawCard()
                ];

                roundActive =
                    true;


                renderBlackjack(
                    true
                );

                setButtons(
                    true
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

                    finish("push");

                } else if (
                    playerBJ
                ) {

                    finish(
                        "blackjack"
                    );

                } else if (
                    dealerBJ
                ) {

                    finish("loss");

                } else {

                    setMessage(
                        "Choose HIT, STAND, or DOUBLE."
                    );
                }
            }
        );


        hit.addEventListener(
            "click",
            () => {

                if (!roundActive) {
                    return;
                }


                playerHand.push(
                    drawCard()
                );


                double.disabled =
                    true;


                renderBlackjack(
                    true
                );


                const value =
                    handValue(
                        playerHand
                    );


                if (
                    value > 21
                ) {

                    finish("loss");

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

                if (!roundActive) {
                    return;
                }

                dealerPlay();
            }
        );


        double.addEventListener(
            "click",
            () => {

                if (
                    !roundActive ||
                    playerHand.length !== 2
                ) {
                    return;
                }


                const extraBet =
                    currentBet;


                if (
                    !canAfford(
                        extraBet
                    )
                ) {

                    setMessage(
                        "Not enough Ace Credits to double.",
                        "loss"
                    );

                    return;
                }


                setBalance(
                    getBalance() -
                    extraBet
                );


                currentBet *= 2;


                playerHand.push(
                    drawCard()
                );


                double.disabled =
                    true;


                renderBlackjack(
                    true
                );


                if (
                    handValue(
                        playerHand
                    ) > 21
                ) {

                    finish("loss");

                    return;
                }


                dealerPlay();
            }
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


        const reels = [
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


        const symbols = [
            "♠",
            "♥",
            "♦",
            "♣",
            "7",
            "A"
        ];


        function randomSymbol() {

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
                    getBalance() -
                    bet
                );


                slotSpin.disabled =
                    true;


                reels.forEach(
                    (reel) => {

                        reel.classList.add(
                            "spinning"
                        );
                    }
                );


                setMessage(
                    "Spinning..."
                );


                const animation =
                    setInterval(
                        () => {

                            reels.forEach(
                                (reel) => {

                                    reel.textContent =
                                        randomSymbol();
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


                        const result = [
                            randomSymbol(),
                            randomSymbol(),
                            randomSymbol()
                        ];


                        reels.forEach(
                            (reel, index) => {

                                reel.classList.remove(
                                    "spinning"
                                );

                                reel.textContent =
                                    result[index];
                            }
                        );


                        let multiplier = 0;


                        if (
                            result[0] === "7" &&
                            result[1] === "7" &&
                            result[2] === "7"
                        ) {

                            multiplier = 10;

                        } else if (
                            result[0] === "A" &&
                            result[1] === "A" &&
                            result[2] === "A"
                        ) {

                            multiplier = 7;

                        } else if (
                            result[0] ===
                            result[1] &&
                            result[1] ===
                            result[2]
                        ) {

                            multiplier = 5;

                        } else if (
                            result[0] ===
                            result[1] ||
                            result[1] ===
                            result[2] ||
                            result[0] ===
                            result[2]
                        ) {

                            multiplier = 2;
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


                            setMessage(
                                `WIN! ${formatNumber(payout)} AC paid.`,
                                "win"
                            );

                        } else {

                            setMessage(
                                `No match. You lost ${formatNumber(bet)} AC.`,
                                "loss"
                            );
                        }


                        slotSpin.disabled =
                            false;

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

        const result =
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


        const redNumbers =
            new Set([
                1, 3, 5, 7, 9,
                12, 14, 16, 18,
                19, 21, 23, 25,
                27, 30, 32, 34,
                36
            ]);


        function rouletteColor(
            number
        ) {

            if (number === 0) {
                return "green";
            }

            if (
                redNumbers.has(
                    number
                )
            ) {
                return "red";
            }

            return "black";
        }


        function rouletteWins(
            choice,
            number
        ) {

            if (number === 0) {
                return false;
            }


            if (
                choice === "red"
            ) {

                return (
                    rouletteColor(
                        number
                    ) === "red"
                );
            }


            if (
                choice === "black"
            ) {

                return (
                    rouletteColor(
                        number
                    ) === "black"
                );
            }


            if (
                choice === "odd"
            ) {

                return (
                    number % 2 !== 0
                );
            }


            if (
                choice === "even"
            ) {

                return (
                    number % 2 === 0
                );
            }


            if (
                choice === "low"
            ) {

                return (
                    number >= 1 &&
                    number <= 18
                );
            }


            if (
                choice === "high"
            ) {

                return (
                    number >= 19 &&
                    number <= 36
                );
            }


            return false;
        }


        choices.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        choices.forEach(
                            (other) => {

                                other.classList
                                    .remove(
                                        "selected"
                                    );
                            }
                        );


                        button.classList.add(
                            "selected"
                        );


                        selected =
                            button.dataset
                                .rouletteChoice;


                        message.className =
                            "game-message";

                        message.textContent =
                            `${button.textContent.trim()} selected.`;
                    }
                );
            }
        );


        rouletteSpin.addEventListener(
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
                    getBalance() -
                    bet
                );


                rouletteSpin.disabled =
                    true;


                choices.forEach(
                    (choice) => {

                        choice.disabled =
                            true;
                    }
                );


                if (wheel) {

                    wheel.classList.add(
                        "spinning"
                    );
                }


                message.className =
                    "game-message";

                message.textContent =
                    "Wheel spinning...";


                const animation =
                    setInterval(
                        () => {

                            result.textContent =
                                randomInt(37);

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
                            randomInt(37);

                        const color =
                            rouletteColor(
                                number
                            );


                        result.textContent =
                            number;


                        if (
                            rouletteWins(
                                selected,
                                number
                            )
                        ) {

                            addBalance(
                                bet * 2
                            );


                            message.textContent =
                                `${number} ${color.toUpperCase()} — You won ${formatNumber(bet)} AC.`;

                            message.className =
                                "game-message win";

                        } else {

                            message.textContent =
                                `${number} ${color.toUpperCase()} — You lost ${formatNumber(bet)} AC.`;

                            message.className =
                                "game-message loss";
                        }


                        rouletteSpin.disabled =
                            false;


                        choices.forEach(
                            (choice) => {

                                choice.disabled =
                                    false;
                            }
                        );

                    },
                    1500
                );
            }
        );
    }


    /* =========================================================
       HIGH ROLL
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


        const faces = [
            "⚀",
            "⚁",
            "⚂",
            "⚃",
            "⚄",
            "⚅"
        ];


        function rollDie() {

            return (
                randomInt(6) + 1
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
                    getBalance() -
                    bet
                );


                diceRoll.disabled =
                    true;


                houseDie.classList.add(
                    "rolling"
                );

                playerDie.classList.add(
                    "rolling"
                );


                message.className =
                    "game-message";

                message.textContent =
                    "Rolling...";


                const animation =
                    setInterval(
                        () => {

                            houseDie.textContent =
                                faces[
                                    rollDie() - 1
                                ];

                            playerDie.textContent =
                                faces[
                                    rollDie() - 1
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
                            rollDie();

                        const player =
                            rollDie();


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


                            message.textContent =
                                `You rolled ${player}. House rolled ${house}. You won ${formatNumber(bet)} AC.`;

                            message.className =
                                "game-message win";

                        } else if (
                            player === house
                        ) {

                            addBalance(
                                bet
                            );


                            message.textContent =
                                `Tie at ${player}. Your bet was returned.`;

                            message.className =
                                "game-message";

                        } else {

                            message.textContent =
                                `You rolled ${player}. House rolled ${house}. You lost ${formatNumber(bet)} AC.`;

                            message.className =
                                "game-message loss";
                        }


                        diceRoll.disabled =
                            false;

                    },
                    1000
                );
            }
        );
    }


    /* =========================================================
       INITIAL PAGE LOAD
    ========================================================= */

    updateBalanceDisplays();

    renderCollection();

});
