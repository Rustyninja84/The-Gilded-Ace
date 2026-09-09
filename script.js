document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       THE GILDED ACE
       GLOBAL PLAY-MONEY SYSTEM
    ========================================================= */

    const STARTING_BALANCE = 10000;
    const DAILY_REWARD = 1000;
    const REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

    const MIN_BET = 100;
    const MAX_BET = 5000;
    const BET_STEP = 100;

    let balance = Number(localStorage.getItem("gildedAceBalance"));

    if (
        !Number.isFinite(balance) ||
        balance < 0
    ) {
        balance = STARTING_BALANCE;

        localStorage.setItem(
            "gildedAceBalance",
            balance
        );
    }


    /* =========================================================
       BALANCE
    ========================================================= */

    function formatNumber(value) {
        return Math.floor(value).toLocaleString();
    }

    function saveBalance() {
        balance = Math.max(0, Math.floor(balance));

        localStorage.setItem(
            "gildedAceBalance",
            balance
        );

        updateBalanceDisplays();
    }

    function updateBalanceDisplays() {

        document
            .querySelectorAll(".balance-value")
            .forEach((element) => {

                element.textContent =
                    `${formatNumber(balance)} AC`;

            });


        document
            .querySelectorAll(".casino-balance")
            .forEach((element) => {

                element.textContent =
                    `${formatNumber(balance)} AC`;

            });


        document
            .querySelectorAll(".credit-balance")
            .forEach((element) => {

                element.innerHTML = `
                    ${formatNumber(balance)}
                    <span>AC</span>
                `;

            });

    }

    function canAfford(amount) {
        return balance >= amount;
    }


    /* =========================================================
       POPUP MESSAGE
    ========================================================= */

    function showToast(message) {

        const oldToast =
            document.querySelector(".gilded-toast");

        if (oldToast) {
            oldToast.remove();
        }

        const toast =
            document.createElement("div");

        toast.className = "gilded-toast";

        toast.textContent = message;

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
                border: "1px solid #d6b35a",
                color: "#d6b35a",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1.3px",
                boxShadow: "0 18px 45px rgba(0,0,0,.55)"
            }
        );

        document.body.appendChild(toast);

        setTimeout(() => {

            toast.style.transition =
                "opacity .35s ease";

            toast.style.opacity = "0";

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
                "gildedAceLastDailyReward"
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
            Date.now() - lastReward >=
            REWARD_COOLDOWN
        );

    }

    function getRewardRemaining() {

        const lastReward =
            getLastRewardTime();

        if (!lastReward) {
            return 0;
        }

        const nextReward =
            lastReward + REWARD_COOLDOWN;

        return Math.max(
            0,
            nextReward - Date.now()
        );

    }

    function formatCountdown(ms) {

        const totalSeconds =
            Math.floor(ms / 1000);

        const hours =
            Math.floor(
                totalSeconds / 3600
            );

        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );

        const seconds =
            totalSeconds % 60;

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0")
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

                if (!isRewardAvailable()) {
                    return;
                }

                balance += DAILY_REWARD;

                localStorage.setItem(
                    "gildedAceLastDailyReward",
                    Date.now()
                );

                saveBalance();

                updateDailyRewardButton();

                showToast(
                    `+${formatNumber(DAILY_REWARD)} AC DAILY REWARD`
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

    function activateGame(gameName) {

        casinoTabs.forEach((tab) => {

            tab.classList.toggle(
                "active",
                tab.dataset.game === gameName
            );

        });

        casinoPanels.forEach((panel) => {

            panel.classList.toggle(
                "active",
                panel.dataset.gamePanel ===
                    gameName
            );

        });

    }

    casinoTabs.forEach((tab) => {

        tab.addEventListener(
            "click",
            () => {

                const game =
                    tab.dataset.game;

                activateGame(game);

                history.replaceState(
                    null,
                    "",
                    `#${game}`
                );

            }
        );

    });

    if (window.location.hash) {

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

    }


    /* =========================================================
       BET CONTROL HELPER
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

        let bet = startingBet;

        function update() {

            if (display) {

                display.textContent =
                    `${formatNumber(bet)} AC`;

            }

        }

        if (down) {

            down.addEventListener(
                "click",
                () => {

                    bet = Math.max(
                        MIN_BET,
                        bet - BET_STEP
                    );

                    update();

                }
            );

        }

        if (up) {

            up.addEventListener(
                "click",
                () => {

                    bet = Math.min(
                        MAX_BET,
                        bet + BET_STEP
                    );

                    update();

                }
            );

        }

        update();

        return {

            getBet() {
                return bet;
            },

            setBet(value) {

                bet = Math.max(
                    MIN_BET,
                    Math.min(
                        MAX_BET,
                        value
                    )
                );

                update();

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

        const blackjackBetControl =
            createBetControl(
                "blackjackBet",
                "blackjackBetDown",
                "blackjackBetUp",
                100
            );

        const dealerCardsElement =
            document.getElementById(
                "dealerCards"
            );

        const playerCardsElement =
            document.getElementById(
                "playerCards"
            );

        const dealerValueElement =
            document.getElementById(
                "dealerValue"
            );

        const playerValueElement =
            document.getElementById(
                "playerValue"
            );

        const messageElement =
            document.getElementById(
                "blackjackMessage"
            );

        const hitButton =
            document.getElementById(
                "blackjackHit"
            );

        const standButton =
            document.getElementById(
                "blackjackStand"
            );

        const doubleButton =
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

            const newDeck = [];

            suits.forEach((suit) => {

                ranks.forEach((rank) => {

                    newDeck.push({
                        rank,
                        suit
                    });

                });

            });

            return shuffleArray(
                newDeck
            );

        }


        function shuffleArray(array) {

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
                ] = [
                    array[j],
                    array[i]
                ];

            }

            return array;

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


        function cardValue(card) {

            if (
                ["J", "Q", "K"].includes(
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


        function handValue(hand) {

            let value =
                hand.reduce(
                    (total, card) =>
                        total +
                        cardValue(card),
                    0
                );

            let aces =
                hand.filter(
                    (card) =>
                        card.rank === "A"
                ).length;

            while (
                value > 21 &&
                aces > 0
            ) {

                value -= 10;
                aces--;

            }

            return value;

        }


        function isBlackjack(hand) {

            return (
                hand.length === 2 &&
                handValue(hand) === 21
            );

        }


        function renderCard(
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

            const redSuit =
                card.suit === "♥" ||
                card.suit === "♦";

            return `
                <div class="playing-card">

                    <span class="card-rank">
                        ${card.rank}
                    </span>

                    <span class="card-suit ${
                        redSuit
                            ? "red"
                            : ""
                    }">
                        ${card.suit}
                    </span>

                </div>
            `;

        }


        function renderBlackjack(
            hideDealer = true
        ) {

            dealerCardsElement.innerHTML =
                dealerHand
                    .map(
                        (card, index) =>
                            renderCard(
                                card,
                                hideDealer &&
                                index === 0
                            )
                    )
                    .join("");

            playerCardsElement.innerHTML =
                playerHand
                    .map(
                        (card) =>
                            renderCard(card)
                    )
                    .join("");

            playerValueElement.textContent =
                `Your Hand: ${handValue(
                    playerHand
                )}`;

            if (hideDealer) {

                const visibleCards =
                    dealerHand.slice(1);

                dealerValueElement.textContent =
                    `Dealer: ${handValue(
                        visibleCards
                    )}`;

            } else {

                dealerValueElement.textContent =
                    `Dealer: ${handValue(
                        dealerHand
                    )}`;

            }

        }


        function setBlackjackMessage(
            text,
            type = ""
        ) {

            messageElement.textContent =
                text;

            messageElement.className =
                "game-message";

            if (type) {

                messageElement
                    .classList
                    .add(type);

            }

        }


        function setBlackjackButtons(
            active
        ) {

            hitButton.disabled =
                !active;

            standButton.disabled =
                !active;

            doubleButton.disabled =
                !active;

            blackjackDeal.disabled =
                active;

        }


        function finishBlackjack(
            result
        ) {

            roundActive = false;

            renderBlackjack(false);

            setBlackjackButtons(false);

            blackjackDeal.disabled =
                false;

            if (
                result === "blackjack"
            ) {

                const payout =
                    Math.floor(
                        currentBet * 2.5
                    );

                balance += payout;

                saveBalance();

                setBlackjackMessage(
                    `BLACKJACK! You won ${formatNumber(
                        payout - currentBet
                    )} AC.`,
                    "win"
                );

                return;

            }


            if (
                result === "win"
            ) {

                balance +=
                    currentBet * 2;

                saveBalance();

                setBlackjackMessage(
                    `You won ${formatNumber(
                        currentBet
                    )} AC.`,
                    "win"
                );

                return;

            }


            if (
                result === "push"
            ) {

                balance +=
                    currentBet;

                saveBalance();

                setBlackjackMessage(
                    "Push. Your bet was returned."
                );

                return;

            }


            setBlackjackMessage(
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

            const playerValue =
                handValue(
                    playerHand
                );

            const dealerValue =
                handValue(
                    dealerHand
                );

            if (
                dealerValue > 21
            ) {

                finishBlackjack(
                    "win"
                );

            } else if (
                dealerValue >
                playerValue
            ) {

                finishBlackjack(
                    "loss"
                );

            } else if (
                dealerValue <
                playerValue
            ) {

                finishBlackjack(
                    "win"
                );

            } else {

                finishBlackjack(
                    "push"
                );

            }

        }


        blackjackDeal.addEventListener(
            "click",
            () => {

                if (roundActive) {
                    return;
                }

                currentBet =
                    blackjackBetControl
                        .getBet();

                if (
                    !canAfford(
                        currentBet
                    )
                ) {

                    setBlackjackMessage(
                        "You do not have enough Ace Credits.",
                        "loss"
                    );

                    return;

                }

                balance -=
                    currentBet;

                saveBalance();

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

                roundActive = true;

                renderBlackjack(true);

                setBlackjackButtons(true);

                setBlackjackMessage(
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

                    finishBlackjack(
                        "push"
                    );

                } else if (
                    playerBJ
                ) {

                    finishBlackjack(
                        "blackjack"
                    );

                } else if (
                    dealerBJ
                ) {

                    finishBlackjack(
                        "loss"
                    );

                }

            }
        );


        hitButton.addEventListener(
            "click",
            () => {

                if (!roundActive) {
                    return;
                }

                playerHand.push(
                    drawCard()
                );

                renderBlackjack(true);

                const value =
                    handValue(
                        playerHand
                    );

                doubleButton.disabled =
                    true;

                if (
                    value > 21
                ) {

                    finishBlackjack(
                        "loss"
                    );

                } else if (
                    value === 21
                ) {

                    dealerPlay();

                }

            }
        );


        standButton.addEventListener(
            "click",
            () => {

                if (!roundActive) {
                    return;
                }

                dealerPlay();

            }
        );


        doubleButton.addEventListener(
            "click",
            () => {

                if (
                    !roundActive ||
                    playerHand.length !== 2
                ) {
                    return;
                }

                if (
                    !canAfford(
                        currentBet
                    )
                ) {

                    setBlackjackMessage(
                        "Not enough Ace Credits to double.",
                        "loss"
                    );

                    return;

                }

                balance -=
                    currentBet;

                currentBet *= 2;

                saveBalance();

                playerHand.push(
                    drawCard()
                );

                renderBlackjack(true);

                if (
                    handValue(
                        playerHand
                    ) > 21
                ) {

                    finishBlackjack(
                        "loss"
                    );

                    return;

                }

                dealerPlay();

            }
        );

    }


    /* =========================================================
       SLOTS
    ========================================================= */

    const slotSpinButton =
        document.getElementById(
            "slotSpin"
        );

    if (slotSpinButton) {

        const slotBetControl =
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

        const slotMessage =
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
                Math.floor(
                    Math.random() *
                    symbols.length
                )
            ];

        }


        function setSlotMessage(
            text,
            type = ""
        ) {

            slotMessage.textContent =
                text;

            slotMessage.className =
                "game-message";

            if (type) {

                slotMessage
                    .classList
                    .add(type);

            }

        }


        slotSpinButton.addEventListener(
            "click",
            () => {

                const bet =
                    slotBetControl
                        .getBet();

                if (
                    !canAfford(bet)
                ) {

                    setSlotMessage(
                        "You do not have enough Ace Credits.",
                        "loss"
                    );

                    return;

                }

                balance -= bet;

                saveBalance();

                slotSpinButton.disabled =
                    true;

                reels.forEach(
                    (reel) => {

                        reel.classList.add(
                            "spinning"
                        );

                    }
                );

                setSlotMessage(
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

                        reels.forEach(
                            (reel) => {

                                reel.classList.remove(
                                    "spinning"
                                );

                            }
                        );


                        const result = [
                            randomSymbol(),
                            randomSymbol(),
                            randomSymbol()
                        ];

                        reels.forEach(
                            (reel, index) => {

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

                            multiplier = 20;

                        } else if (
                            result[0] === "A" &&
                            result[1] === "A" &&
                            result[2] === "A"
                        ) {

                            multiplier = 12;

                        } else if (
                            result[0] ===
                                result[1] &&
                            result[1] ===
                                result[2]
                        ) {

                            multiplier = 8;

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

                            balance +=
                                payout;

                            saveBalance();

                            setSlotMessage(
                                `WIN! ${formatNumber(
                                    payout
                                )} AC paid.`,
                                "win"
                            );

                        } else {

                            setSlotMessage(
                                `No match. You lost ${formatNumber(
                                    bet
                                )} AC.`,
                                "loss"
                            );

                        }


                        slotSpinButton.disabled =
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

    const rouletteSpinButton =
        document.getElementById(
            "rouletteSpin"
        );

    if (rouletteSpinButton) {

        const rouletteBetControl =
            createBetControl(
                "rouletteBet",
                "rouletteBetDown",
                "rouletteBetUp",
                100
            );

        const rouletteChoices =
            document.querySelectorAll(
                ".roulette-choice"
            );

        const rouletteResult =
            document.getElementById(
                "rouletteResult"
            );

        const rouletteMessage =
            document.getElementById(
                "rouletteMessage"
            );

        const rouletteWheel =
            document.querySelector(
                ".roulette-wheel"
            );

        let selectedRouletteBet =
            null;


        const redNumbers = new Set([
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


        rouletteChoices.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        rouletteChoices
                            .forEach(
                                (item) => {

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );

                        button.classList.add(
                            "selected"
                        );

                        selectedRouletteBet =
                            button.dataset
                                .rouletteChoice;

                        rouletteMessage
                            .className =
                                "game-message";

                        rouletteMessage
                            .textContent =
                                `${button.textContent.trim()} selected.`;

                    }
                );

            }
        );


        function rouletteColor(
            number
        ) {

            if (
                number === 0
            ) {
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


        function rouletteBetWins(
            selection,
            number
        ) {

            if (
                selection === "red"
            ) {

                return (
                    rouletteColor(
                        number
                    ) === "red"
                );

            }

            if (
                selection === "black"
            ) {

                return (
                    rouletteColor(
                        number
                    ) === "black"
                );

            }

            if (
                number === 0
            ) {
                return false;
            }

            if (
                selection === "odd"
            ) {

                return (
                    number % 2 !== 0
                );

            }

            if (
                selection === "even"
            ) {

                return (
                    number % 2 === 0
                );

            }

            if (
                selection === "low"
            ) {

                return (
                    number >= 1 &&
                    number <= 18
                );

            }

            if (
                selection === "high"
            ) {

                return (
                    number >= 19 &&
                    number <= 36
                );

            }

            return false;

        }


        rouletteSpinButton.addEventListener(
            "click",
            () => {

                if (
                    !selectedRouletteBet
                ) {

                    rouletteMessage.textContent =
                        "Choose RED, BLACK, ODD, EVEN, 1-18, or 19-36 first.";

                    rouletteMessage.className =
                        "game-message loss";

                    return;

                }

                const bet =
                    rouletteBetControl
                        .getBet();

                if (
                    !canAfford(bet)
                ) {

                    rouletteMessage.textContent =
                        "You do not have enough Ace Credits.";

                    rouletteMessage.className =
                        "game-message loss";

                    return;

                }


                balance -= bet;

                saveBalance();

                rouletteSpinButton.disabled =
                    true;

                rouletteWheel.classList.add(
                    "spinning"
                );

                rouletteMessage.className =
                    "game-message";

                rouletteMessage.textContent =
                    "Wheel spinning...";


                let displayInterval =
                    setInterval(
                        () => {

                            rouletteResult.textContent =
                                Math.floor(
                                    Math.random() *
                                    37
                                );

                        },
                        80
                    );


                setTimeout(
                    () => {

                        clearInterval(
                            displayInterval
                        );

                        rouletteWheel.classList.remove(
                            "spinning"
                        );

                        const number =
                            Math.floor(
                                Math.random() *
                                37
                            );

                        const color =
                            rouletteColor(
                                number
                            );

                        rouletteResult.textContent =
                            number;

                        if (
                            rouletteBetWins(
                                selectedRouletteBet,
                                number
                            )
                        ) {

                            const payout =
                                bet * 2;

                            balance += payout;

                            saveBalance();

                            rouletteMessage.textContent =
                                `${number} ${color.toUpperCase()} — You won ${formatNumber(
                                    bet
                                )} AC.`;

                            rouletteMessage.className =
                                "game-message win";

                        } else {

                            rouletteMessage.textContent =
                                `${number} ${color.toUpperCase()} — You lost ${formatNumber(
                                    bet
                                )} AC.`;

                            rouletteMessage.className =
                                "game-message loss";

                        }

                        rouletteSpinButton.disabled =
                            false;

                    },
                    1500
                );

            }
        );

    }


    /* =========================================================
       HIGH ROLL DICE
    ========================================================= */

    const diceRollButton =
        document.getElementById(
            "diceRoll"
        );

    if (diceRollButton) {

        const diceBetControl =
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

        const houseDieValue =
            document.getElementById(
                "houseDieValue"
            );

        const playerDieValue =
            document.getElementById(
                "playerDieValue"
            );

        const diceMessage =
            document.getElementById(
                "diceMessage"
            );

        const diceFaces = [
            "⚀",
            "⚁",
            "⚂",
            "⚃",
            "⚄",
            "⚅"
        ];


        function randomDie() {

            return (
                Math.floor(
                    Math.random() * 6
                ) + 1
            );

        }


        diceRollButton.addEventListener(
            "click",
            () => {

                const bet =
                    diceBetControl
                        .getBet();

                if (
                    !canAfford(bet)
                ) {

                    diceMessage.textContent =
                        "You do not have enough Ace Credits.";

                    diceMessage.className =
                        "game-message loss";

                    return;

                }


                balance -= bet;

                saveBalance();

                diceRollButton.disabled =
                    true;

                houseDie.classList.add(
                    "rolling"
                );

                playerDie.classList.add(
                    "rolling"
                );

                diceMessage.className =
                    "game-message";

                diceMessage.textContent =
                    "Rolling...";


                const animation =
                    setInterval(
                        () => {

                            houseDie.textContent =
                                diceFaces[
                                    randomDie() -
                                    1
                                ];

                            playerDie.textContent =
                                diceFaces[
                                    randomDie() -
                                    1
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
                            randomDie();

                        const player =
                            randomDie();


                        houseDie.textContent =
                            diceFaces[
                                house - 1
                            ];

                        playerDie.textContent =
                            diceFaces[
                                player - 1
                            ];


                        houseDieValue.textContent =
                            house;

                        playerDieValue.textContent =
                            player;


                        if (
                            player > house
                        ) {

                            const payout =
                                bet * 2;

                            balance += payout;

                            saveBalance();

                            diceMessage.textContent =
                                `You rolled ${player}. House rolled ${house}. You won ${formatNumber(
                                    bet
                                )} AC.`;

                            diceMessage.className =
                                "game-message win";

                        } else if (
                            player === house
                        ) {

                            balance += bet;

                            saveBalance();

                            diceMessage.textContent =
                                `Tie at ${player}. Your bet was returned.`;

                            diceMessage.className =
                                "game-message";

                        } else {

                            diceMessage.textContent =
                                `You rolled ${player}. House rolled ${house}. You lost ${formatNumber(
                                    bet
                                )} AC.`;

                            diceMessage.className =
                                "game-message loss";

                        }


                        diceRollButton.disabled =
                            false;

                    },
                    1000
                );

            }
        );

    }


    /* =========================================================
       INITIAL DISPLAY
    ========================================================= */

    updateBalanceDisplays();

});
