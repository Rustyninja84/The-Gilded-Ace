document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       THE GILDED ACE
       LUXURY ROULETTE SYSTEM
    ========================================================= */

    const STARTING_BALANCE = 10000;

    const ACCOUNTS_KEY =
        "gildedAceAccounts";

    const SESSION_KEY =
        "gildedAceActiveAccountId";

    const LEGACY_BALANCE_KEY =
        "gildedAceBalance";

    const LEGACY_STATS_KEY =
        "gildedAceStats";


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
       EUROPEAN ROULETTE WHEEL ORDER
    ========================================================= */

    const WHEEL_ORDER = [
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


    /* =========================================================
       ELEMENTS
    ========================================================= */

    const wheel =
        document.getElementById(
            "gildedRouletteWheel"
        );

    const numberRing =
        document.getElementById(
            "rouletteNumberRing"
        );

    const ballTrack =
        document.getElementById(
            "rouletteBallTrack"
        );

    const spinButton =
        document.getElementById(
            "luxuryRouletteSpin"
        );

    const betDown =
        document.getElementById(
            "luxuryRouletteBetDown"
        );

    const betUp =
        document.getElementById(
            "luxuryRouletteBetUp"
        );

    const betDisplay =
        document.getElementById(
            "luxuryRouletteBetDisplay"
        );

    const selectedBetDisplay =
        document.getElementById(
            "rouletteSelectedBet"
        );

    const statusDisplay =
        document.getElementById(
            "luxuryRouletteStatus"
        );

    const messageDisplay =
        document.getElementById(
            "luxuryRouletteMessage"
        );

    const historyList =
        document.getElementById(
            "rouletteHistoryList"
        );

    const numberBoard =
        document.getElementById(
            "rouletteNumberBoard"
        );


    if (
        !wheel ||
        !numberRing ||
        !ballTrack ||
        !spinButton ||
        !numberBoard
    ) {
        return;
    }


    /* =========================================================
       STATE
    ========================================================= */

    let betIndex = 1;

    let selectedBet = null;

    let spinning = false;

    let currentBallRotation = 0;

    let resultHistory = [];


    /* =========================================================
       RANDOM
    ========================================================= */

    function randomInt(max) {

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
       ACCOUNT / BALANCE
    ========================================================= */

    function getActiveAccountId() {

        return localStorage.getItem(
            SESSION_KEY
        ) || "";
    }


    function balanceKey() {

        const accountId =
            getActiveAccountId();

        if (accountId) {

            return (
                "gildedAce:" +
                accountId +
                ":balance"
            );
        }

        return LEGACY_BALANCE_KEY;
    }


    function statsKey() {

        const accountId =
            getActiveAccountId();

        if (accountId) {

            return (
                "gildedAce:" +
                accountId +
                ":stats"
            );
        }

        return LEGACY_STATS_KEY;
    }


    function getBalance() {

        let balance =
            Number(
                localStorage.getItem(
                    balanceKey()
                )
            );

        if (
            !Number.isFinite(balance) ||
            balance < 0
        ) {

            balance =
                STARTING_BALANCE;

            localStorage.setItem(
                balanceKey(),
                balance
            );
        }

        return balance;
    }


    function setBalance(value) {

        const balance =
            Math.max(
                0,
                Math.floor(
                    Number(value) || 0
                )
            );


        localStorage.setItem(
            balanceKey(),
            balance
        );


        updateBalanceDisplays();

        return balance;
    }


    function updateBalanceDisplays() {

        const balance =
            getBalance();


        document
            .querySelectorAll(
                ".balance-value"
            )
            .forEach(
                element => {

                    element.textContent =
                        balance.toLocaleString() +
                        " AC";
                }
            );
    }


    /* =========================================================
       STATS
    ========================================================= */

    function getStats() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        statsKey()
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
                    wins:
                        Number(
                            saved.blackjack?.wins
                        ) || 0,

                    losses:
                        Number(
                            saved.blackjack?.losses
                        ) || 0,

                    played:
                        Number(
                            saved.blackjack?.played
                        ) || 0
                },

                slots: {
                    wins:
                        Number(
                            saved.slots?.wins
                        ) || 0,

                    losses:
                        Number(
                            saved.slots?.losses
                        ) || 0,

                    played:
                        Number(
                            saved.slots?.played
                        ) || 0
                },

                roulette: {
                    wins:
                        Number(
                            saved.roulette?.wins
                        ) || 0,

                    losses:
                        Number(
                            saved.roulette?.losses
                        ) || 0,

                    played:
                        Number(
                            saved.roulette?.played
                        ) || 0
                },

                dice: {
                    wins:
                        Number(
                            saved.dice?.wins
                        ) || 0,

                    losses:
                        Number(
                            saved.dice?.losses
                        ) || 0,

                    played:
                        Number(
                            saved.dice?.played
                        ) || 0
                }
            };

        } catch {

            return {
                totalWins:0,
                totalLosses:0,
                gamesPlayed:0,

                blackjack:{
                    wins:0,
                    losses:0,
                    played:0
                },

                slots:{
                    wins:0,
                    losses:0,
                    played:0
                },

                roulette:{
                    wins:0,
                    losses:0,
                    played:0
                },

                dice:{
                    wins:0,
                    losses:0,
                    played:0
                }
            };
        }
    }


    function recordRouletteGame(
        result
    ) {

        const stats =
            getStats();


        stats.gamesPlayed++;

        stats.roulette.played++;


        if (
            result === "win"
        ) {

            stats.totalWins++;

            stats.roulette.wins++;

        } else {

            stats.totalLosses++;

            stats.roulette.losses++;
        }


        localStorage.setItem(
            statsKey(),
            JSON.stringify(stats)
        );
    }


    /* =========================================================
       COLORS
    ========================================================= */

    function rouletteColor(number) {

        if (
            Number(number) === 0
        ) {
            return "green";
        }

        return RED_NUMBERS.has(
            Number(number)
        )
            ? "red"
            : "black";
    }


    /* =========================================================
       BUILD PHYSICAL WHEEL
    ========================================================= */

    function buildWheel() {

        numberRing.innerHTML =
            "";


        const total =
            WHEEL_ORDER.length;

        const step =
            360 / total;


        WHEEL_ORDER.forEach(
            (
                number,
                index
            ) => {

                const pocket =
                    document.createElement(
                        "div"
                    );


                const color =
                    rouletteColor(
                        number
                    );


                const angle =
                    index * step;


                pocket.className =
                    "roulette-pocket " +
                    color;


                pocket.style.transform =
                    `rotate(${angle}deg) translateY(-220px)`;


                const inner =
                    document.createElement(
                        "div"
                    );


                inner.className =
                    "roulette-pocket-inner";


                inner.textContent =
                    number;


                inner.style.transform =
                    `translate(-50%, -50%) rotate(${-angle}deg)`;


                pocket.appendChild(
                    inner
                );


                numberRing.appendChild(
                    pocket
                );
            }
        );
    }


    /* =========================================================
       BUILD NUMBER BETTING BOARD
    ========================================================= */

    function buildNumberBoard() {

        numberBoard.innerHTML =
            "";


        const zero =
            document.createElement(
                "button"
            );


        zero.type =
            "button";


        zero.textContent =
            "0";


        zero.className =
            "roulette-board-number green zero";


        zero.dataset.number =
            "0";


        numberBoard.appendChild(
            zero
        );


        /*
            Board arrangement:

            Top:
            3 6 9 ... 36

            Middle:
            2 5 8 ... 35

            Bottom:
            1 4 7 ... 34
        */

        for (
            let row = 0;
            row < 3;
            row++
        ) {

            const rowStart =
                3 - row;


            for (
                let column = 0;
                column < 12;
                column++
            ) {

                const number =
                    rowStart +
                    column * 3;


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.textContent =
                    number;


                button.dataset.number =
                    String(number);


                button.className =
                    "roulette-board-number " +
                    rouletteColor(
                        number
                    );


                button.style.gridColumn =
                    String(
                        column + 2
                    );


                button.style.gridRow =
                    String(
                        row + 1
                    );


                numberBoard.appendChild(
                    button
                );
            }
        }
    }


    /* =========================================================
       BET SELECTION
    ========================================================= */

    function clearSelections() {

        document
            .querySelectorAll(
                ".roulette-board-number"
            )
            .forEach(
                element => {

                    element.classList.remove(
                        "selected"
                    );
                }
            );


        document
            .querySelectorAll(
                ".luxury-roulette-choice"
            )
            .forEach(
                element => {

                    element.classList.remove(
                        "selected"
                    );
                }
            );
    }


    function selectNumber(
        number,
        button
    ) {

        if (spinning) {
            return;
        }


        clearSelections();


        button.classList.add(
            "selected"
        );


        selectedBet = {
            type:"number",
            value:Number(number)
        };


        selectedBetDisplay.textContent =
            "NUMBER " +
            number;


        messageDisplay.textContent =
            "Straight-up number bet selected.";
    }


    function selectOutsideBet(
        type,
        button
    ) {

        if (spinning) {
            return;
        }


        clearSelections();


        button.classList.add(
            "selected"
        );


        selectedBet = {
            type:type
        };


        const names = {
            red:"RED",
            black:"BLACK",
            odd:"ODD",
            even:"EVEN",
            low:"1 TO 18",
            high:"19 TO 36"
        };


        selectedBetDisplay.textContent =
            names[type] || type.toUpperCase();


        messageDisplay.textContent =
            "Outside bet selected.";
    }


    numberBoard.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".roulette-board-number"
                );


            if (!button) {
                return;
            }


            selectNumber(
                button.dataset.number,
                button
            );
        }
    );


    document
        .querySelectorAll(
            ".luxury-roulette-choice"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectOutsideBet(
                            button.dataset.betType,
                            button
                        );
                    }
                );
            }
        );


    /* =========================================================
       BET AMOUNT
    ========================================================= */

    function getBetAmount() {

        return BET_LEVELS[
            betIndex
        ];
    }


    function updateBetDisplay() {

        betDisplay.textContent =
            getBetAmount()
                .toLocaleString() +
            " AC";
    }


    betDown.addEventListener(
        "click",
        () => {

            if (spinning) {
                return;
            }


            betIndex =
                Math.max(
                    0,
                    betIndex - 1
                );


            updateBetDisplay();
        }
    );


    betUp.addEventListener(
        "click",
        () => {

            if (spinning) {
                return;
            }


            betIndex =
                Math.min(
                    BET_LEVELS.length - 1,
                    betIndex + 1
                );


            updateBetDisplay();
        }
    );


    /* =========================================================
       DETERMINE BET WIN
    ========================================================= */

    function betWins(
        bet,
        number
    ) {

        if (!bet) {
            return false;
        }


        if (
            bet.type === "number"
        ) {

            return (
                Number(bet.value) ===
                Number(number)
            );
        }


        if (
            number === 0
        ) {
            return false;
        }


        const color =
            rouletteColor(
                number
            );


        if (
            bet.type === "red"
        ) {

            return (
                color === "red"
            );
        }


        if (
            bet.type === "black"
        ) {

            return (
                color === "black"
            );
        }


        if (
            bet.type === "odd"
        ) {

            return (
                number % 2 !== 0
            );
        }


        if (
            bet.type === "even"
        ) {

            return (
                number % 2 === 0
            );
        }


        if (
            bet.type === "low"
        ) {

            return (
                number >= 1 &&
                number <= 18
            );
        }


        if (
            bet.type === "high"
        ) {

            return (
                number >= 19 &&
                number <= 36
            );
        }


        return false;
    }


    /* =========================================================
       PAYOUT
    ========================================================= */

    function getPayoutMultiplier(
        bet
    ) {

        if (
            bet.type === "number"
        ) {

            /*
                Player receives stake back
                plus 35:1 winnings.
            */

            return 36;
        }


        /*
            1:1 outside bet.
            Player receives original stake
            plus equal winnings.
        */

        return 2;
    }


    /* =========================================================
       RESULT HISTORY
    ========================================================= */

    function addHistoryResult(
        number
    ) {

        resultHistory.unshift(
            number
        );


        resultHistory =
            resultHistory.slice(
                0,
                10
            );


        historyList.innerHTML =
            "";


        resultHistory.forEach(
            result => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "roulette-history-number " +
                    rouletteColor(
                        result
                    );


                item.textContent =
                    result;


                historyList.appendChild(
                    item
                );
            }
        );
    }


    /* =========================================================
       DISABLE CONTROLS
    ========================================================= */

    function setControlsDisabled(
        disabled
    ) {

        spinButton.disabled =
            disabled;

        betDown.disabled =
            disabled;

        betUp.disabled =
            disabled;


        document
            .querySelectorAll(
                ".roulette-board-number, .luxury-roulette-choice"
            )
            .forEach(
                button => {

                    button.disabled =
                        disabled;
                }
            );
    }


    /* =========================================================
       BALL ANIMATION
    ========================================================= */

    function animateBallToNumber(
        winningNumber
    ) {

        return new Promise(
            resolve => {

                const index =
                    WHEEL_ORDER.indexOf(
                        winningNumber
                    );


                const segment =
                    360 /
                    WHEEL_ORDER.length;


                /*
                    The ball will complete several
                    full rotations before settling
                    into the target pocket.
                */

                const target =
                    index * segment;


                const extraSpins =
                    7 +
                    randomInt(4);


                const finalRotation =
                    currentBallRotation +
                    extraSpins * 360 +
                    target;


                const animation =
                    ballTrack.animate(
                        [
                            {
                                transform:
                                    `rotate(${currentBallRotation}deg)`
                            },

                            {
                                transform:
                                    `rotate(${finalRotation}deg)`
                            }
                        ],
                        {
                            duration:6200,
                            easing:
                                "cubic-bezier(.08,.65,.12,1)",
                            fill:"forwards"
                        }
                    );


                wheel.classList.add(
                    "wheel-spinning"
                );


                animation.onfinish =
                    () => {

                        currentBallRotation =
                            finalRotation %
                            360;


                        ballTrack.style.transform =
                            `rotate(${currentBallRotation}deg)`;


                        wheel.classList.remove(
                            "wheel-spinning"
                        );


                        resolve();
                    };
            }
        );
    }


    /* =========================================================
       SPIN
    ========================================================= */

    spinButton.addEventListener(
        "click",
        async () => {

            if (spinning) {
                return;
            }


            if (!selectedBet) {

                messageDisplay.textContent =
                    "Select a number or outside bet first.";

                messageDisplay.className =
                    "roulette-luxury-message loss";

                return;
            }


            const bet =
                getBetAmount();


            const currentBalance =
                getBalance();


            if (
                currentBalance < bet
            ) {

                messageDisplay.textContent =
                    "You do not have enough Ace Credits.";

                messageDisplay.className =
                    "roulette-luxury-message loss";

                return;
            }


            spinning =
                true;


            setControlsDisabled(
                true
            );


            setBalance(
                currentBalance -
                bet
            );


            messageDisplay.textContent =
                "The wheel is spinning...";

            messageDisplay.className =
                "roulette-luxury-message";


            statusDisplay.textContent =
                "SPINNING...";


            /*
                Pick the winning pocket
                before the animation begins.
            */

            const winningNumber =
                randomInt(37);


            await animateBallToNumber(
                winningNumber
            );


            const color =
                rouletteColor(
                    winningNumber
                );


            addHistoryResult(
                winningNumber
            );


            const won =
                betWins(
                    selectedBet,
                    winningNumber
                );


            if (won) {

                const multiplier =
                    getPayoutMultiplier(
                        selectedBet
                    );


                const payout =
                    bet *
                    multiplier;


                setBalance(
                    getBalance() +
                    payout
                );


                recordRouletteGame(
                    "win"
                );


                statusDisplay.textContent =
                    winningNumber +
                    " " +
                    color.toUpperCase();


                if (
                    selectedBet.type ===
                    "number"
                ) {

                    messageDisplay.textContent =
                        "STRAIGHT-UP WIN! " +
                        payout.toLocaleString() +
                        " AC paid.";

                } else {

                    messageDisplay.textContent =
                        "WIN! " +
                        (
                            payout -
                            bet
                        ).toLocaleString() +
                        " AC profit.";
                }


                messageDisplay.className =
                    "roulette-luxury-message win";

            } else {

                recordRouletteGame(
                    "loss"
                );


                statusDisplay.textContent =
                    winningNumber +
                    " " +
                    color.toUpperCase();


                messageDisplay.textContent =
                    "House wins. You lost " +
                    bet.toLocaleString() +
                    " AC.";


                messageDisplay.className =
                    "roulette-luxury-message loss";
            }


            spinning =
                false;


            setControlsDisabled(
                false
            );


            updateBalanceDisplays();
        }
    );


    /* =========================================================
       INITIALIZE
    ========================================================= */

    buildWheel();

    buildNumberBoard();

    updateBetDisplay();

    updateBalanceDisplays();

});
