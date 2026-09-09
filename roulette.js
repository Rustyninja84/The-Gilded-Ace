document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       THE GILDED ACE
       LUXURY ROULETTE ONLY
       
       IMPORTANT:
       Casino tabs are controlled by script.js.
       This file controls ONLY the new roulette game.
    ========================================================= */

    const STARTING_BALANCE = 10000;

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
       ROULETTE ELEMENTS
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


    /* =========================================================
       STOP IF NEW ROULETTE IS NOT ON PAGE
    ========================================================= */

    if (
        !wheel ||
        !numberRing ||
        !ballTrack ||
        !spinButton ||
        !betDown ||
        !betUp ||
        !betDisplay ||
        !selectedBetDisplay ||
        !statusDisplay ||
        !messageDisplay ||
        !historyList ||
        !numberBoard
    ) {
        return;
    }


    /* =========================================================
       ROULETTE STATE
    ========================================================= */

    let betIndex = 1;

    let selectedBet = null;

    let spinning = false;

    let currentBallRotation = 0;

    let resultHistory = [];


    /* =========================================================
       RANDOM NUMBER
    ========================================================= */

    function randomInt(max) {

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const maximum =
                0x100000000;

            const limit =
                maximum -
                (
                    maximum %
                    max
                );

            const values =
                new Uint32Array(1);

            let value;


            do {

                window.crypto.getRandomValues(
                    values
                );

                value =
                    values[0];

            } while (
                value >= limit
            );


            return (
                value %
                max
            );
        }


        return Math.floor(
            Math.random() *
            max
        );
    }


    /* =========================================================
       ACTIVE ACCOUNT
    ========================================================= */

    function getActiveAccountId() {

        return (
            localStorage.getItem(
                SESSION_KEY
            ) || ""
        );
    }


    /* =========================================================
       BALANCE KEY
    ========================================================= */

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


    /* =========================================================
       STATS KEY
    ========================================================= */

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


    /* =========================================================
       GET BALANCE
    ========================================================= */

    function getBalance() {

        const stored =
            localStorage.getItem(
                balanceKey()
            );


        if (
            stored === null
        ) {

            localStorage.setItem(
                balanceKey(),
                String(
                    STARTING_BALANCE
                )
            );

            return STARTING_BALANCE;
        }


        const value =
            Number(stored);


        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            localStorage.setItem(
                balanceKey(),
                String(
                    STARTING_BALANCE
                )
            );

            return STARTING_BALANCE;
        }


        return Math.floor(
            value
        );
    }


    /* =========================================================
       SET BALANCE
    ========================================================= */

    function setRouletteBalance(value) {

        const newBalance =
            Math.max(
                0,
                Math.floor(
                    Number(value) || 0
                )
            );


        localStorage.setItem(
            balanceKey(),
            String(
                newBalance
            )
        );


        updateRouletteBalanceDisplays();


        return newBalance;
    }


    /* =========================================================
       UPDATE BALANCE DISPLAY
    ========================================================= */

    function updateRouletteBalanceDisplays() {

        const currentBalance =
            getBalance();


        document
            .querySelectorAll(
                ".balance-value"
            )
            .forEach(
                element => {

                    element.textContent =
                        currentBalance
                            .toLocaleString() +
                        " AC";
                }
            );


        document
            .querySelectorAll(
                ".casino-balance"
            )
            .forEach(
                element => {

                    element.textContent =
                        currentBalance
                            .toLocaleString() +
                        " AC";
                }
            );
    }


    /* =========================================================
       DEFAULT STATS
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


    /* =========================================================
       GET STATS
    ========================================================= */

    function getStats() {

        const defaults =
            defaultStats();


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
                    ...defaults.blackjack,
                    ...(saved.blackjack || {})
                },


                slots: {
                    ...defaults.slots,
                    ...(saved.slots || {})
                },


                roulette: {
                    ...defaults.roulette,
                    ...(saved.roulette || {})
                },


                dice: {
                    ...defaults.dice,
                    ...(saved.dice || {})
                }

            };


        } catch {

            return defaults;
        }
    }


    /* =========================================================
       SAVE ROULETTE STAT
    ========================================================= */

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
        }


        if (
            result === "loss"
        ) {

            stats.totalLosses++;

            stats.roulette.losses++;
        }


        localStorage.setItem(
            statsKey(),
            JSON.stringify(
                stats
            )
        );
    }


    /* =========================================================
       NUMBER COLOR
    ========================================================= */

    function rouletteColor(
        number
    ) {

        number =
            Number(number);


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


    /* =========================================================
       BUILD NUMBERED WHEEL
    ========================================================= */

    function buildWheel() {

        numberRing.innerHTML =
            "";


        const total =
            WHEEL_ORDER.length;


        const step =
            360 /
            total;


        WHEEL_ORDER.forEach(
            (
                number,
                index
            ) => {

                const pocket =
                    document.createElement(
                        "div"
                    );


                const inner =
                    document.createElement(
                        "div"
                    );


                const color =
                    rouletteColor(
                        number
                    );


                const angle =
                    index *
                    step;


                pocket.className =
                    "roulette-pocket " +
                    color;


                pocket.style.transform =
                    `rotate(${angle}deg) translateY(-245%)`;


                inner.className =
                    "roulette-pocket-inner";


                inner.textContent =
                    String(number);


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
            STANDARD ROULETTE LAYOUT

            3  6  9  12 ... 36
            2  5  8  11 ... 35
            1  4  7  10 ... 34
        */

        for (
            let row = 0;
            row < 3;
            row++
        ) {

            const firstNumber =
                3 - row;


            for (
                let column = 0;
                column < 12;
                column++
            ) {

                const number =
                    firstNumber +
                    (
                        column *
                        3
                    );


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.textContent =
                    String(number);


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
       CLEAR SELECTED BET
    ========================================================= */

    function clearSelections() {

        document
            .querySelectorAll(
                ".roulette-board-number"
            )
            .forEach(
                button => {

                    button.classList.remove(
                        "selected"
                    );
                }
            );


        document
            .querySelectorAll(
                ".luxury-roulette-choice"
            )
            .forEach(
                button => {

                    button.classList.remove(
                        "selected"
                    );
                }
            );
    }


    /* =========================================================
       SELECT NUMBER
    ========================================================= */

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

            type:
                "number",

            value:
                Number(number)

        };


        selectedBetDisplay.textContent =
            "NUMBER " +
            number;


        messageDisplay.textContent =
            "Straight-up number bet selected.";


        messageDisplay.className =
            "roulette-luxury-message";
    }


    /* =========================================================
       SELECT OUTSIDE BET
    ========================================================= */

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

            type:
                type

        };


        const labels = {

            red:
                "RED",

            black:
                "BLACK",

            odd:
                "ODD",

            even:
                "EVEN",

            low:
                "1 TO 18",

            high:
                "19 TO 36"

        };


        selectedBetDisplay.textContent =
            labels[type] ||
            String(type)
                .toUpperCase();


        messageDisplay.textContent =
            "Outside bet selected.";


        messageDisplay.className =
            "roulette-luxury-message";
    }


    /* =========================================================
       NUMBER BOARD CLICKS
    ========================================================= */

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


    /* =========================================================
       OUTSIDE BET CLICKS
    ========================================================= */

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
       CHECK WIN
    ========================================================= */

    function betWins(
        bet,
        number
    ) {

        if (!bet) {
            return false;
        }


        number =
            Number(number);


        /* NUMBER BET */

        if (
            bet.type ===
            "number"
        ) {

            return (
                Number(
                    bet.value
                ) ===
                number
            );
        }


        /*
            ZERO LOSES:
            red
            black
            odd
            even
            low
            high
        */

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
            bet.type ===
            "red"
        ) {

            return (
                color ===
                "red"
            );
        }


        if (
            bet.type ===
            "black"
        ) {

            return (
                color ===
                "black"
            );
        }


        if (
            bet.type ===
            "odd"
        ) {

            return (
                number %
                2 !== 0
            );
        }


        if (
            bet.type ===
            "even"
        ) {

            return (
                number %
                2 === 0
            );
        }


        if (
            bet.type ===
            "low"
        ) {

            return (
                number >= 1 &&
                number <= 18
            );
        }


        if (
            bet.type ===
            "high"
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

    function payoutMultiplier(
        bet
    ) {

        /*
            NUMBER:
            35:1 profit
            + original bet returned
            = 36x total returned
        */

        if (
            bet.type ===
            "number"
        ) {

            return 36;
        }


        /*
            OUTSIDE BET:
            1:1 profit
            + original bet returned
            = 2x total returned
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
                    String(result);


                historyList.appendChild(
                    item
                );
            }
        );
    }


    /* =========================================================
       DISABLE ROULETTE ONLY
    ========================================================= */

    function disableRouletteControls(
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
                ".roulette-board-number"
            )
            .forEach(
                button => {

                    button.disabled =
                        disabled;
                }
            );


        document
            .querySelectorAll(
                ".luxury-roulette-choice"
            )
            .forEach(
                button => {

                    button.disabled =
                        disabled;
                }
            );
    }


    /* =========================================================
       FIND POCKET ANGLE
    ========================================================= */

    function getPocketAngle(
        winningNumber
    ) {

        const index =
            WHEEL_ORDER.indexOf(
                Number(
                    winningNumber
                )
            );


        const pocketSize =
            360 /
            WHEEL_ORDER.length;


        return (
            index *
            pocketSize
        );
    }


    /* =========================================================
       BALL SPIN
    ========================================================= */

    function animateBallToNumber(
        winningNumber
    ) {

        return new Promise(
            resolve => {

                const pocketAngle =
                    getPocketAngle(
                        winningNumber
                    );


                const fullSpins =
                    7 +
                    randomInt(4);


                const normalized =
                    (
                        (
                            currentBallRotation %
                            360
                        ) +
                        360
                    ) %
                    360;


                let delta =
                    pocketAngle -
                    normalized;


                if (
                    delta < 0
                ) {

                    delta +=
                        360;
                }


                const finalRotation =
                    currentBallRotation +
                    (
                        fullSpins *
                        360
                    ) +
                    delta;


                wheel.classList.add(
                    "wheel-spinning"
                );


                statusDisplay.textContent =
                    "SPINNING...";


                const animation =
                    ballTrack.animate(
                        [

                            {
                                transform:
                                    `rotate(${currentBallRotation}deg)`
                            },

                            {
                                offset:
                                    0.20,

                                transform:
                                    `rotate(${
                                        currentBallRotation +
                                        (
                                            fullSpins *
                                            360 *
                                            0.45
                                        )
                                    }deg)`
                            },

                            {
                                offset:
                                    0.65,

                                transform:
                                    `rotate(${
                                        currentBallRotation +
                                        (
                                            fullSpins *
                                            360 *
                                            0.83
                                        )
                                    }deg)`
                            },

                            {
                                transform:
                                    `rotate(${finalRotation}deg)`
                            }

                        ],
                        {

                            duration:
                                6200,

                            easing:
                                "cubic-bezier(.08,.62,.15,1)",

                            fill:
                                "forwards"

                        }
                    );


                animation.onfinish =
                    () => {

                        currentBallRotation =
                            finalRotation;


                        ballTrack.style.transform =
                            `rotate(${finalRotation}deg)`;


                        wheel.classList.remove(
                            "wheel-spinning"
                        );


                        resolve();
                    };


                animation.oncancel =
                    () => {

                        wheel.classList.remove(
                            "wheel-spinning"
                        );


                        resolve();
                    };
            }
        );
    }


    /* =========================================================
       SPIN BUTTON
    ========================================================= */

    spinButton.addEventListener(
        "click",
        async () => {

            if (spinning) {
                return;
            }


            /* ---------------------------------------------
               MUST SELECT BET
            ---------------------------------------------- */

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


            /* ---------------------------------------------
               CHECK MONEY
            ---------------------------------------------- */

            if (
                currentBalance <
                bet
            ) {

                messageDisplay.textContent =
                    "You do not have enough Ace Credits.";


                messageDisplay.className =
                    "roulette-luxury-message loss";


                return;
            }


            /* ---------------------------------------------
               BEGIN
            ---------------------------------------------- */

            spinning =
                true;


            disableRouletteControls(
                true
            );


            /* ---------------------------------------------
               REMOVE BET
            ---------------------------------------------- */

            setRouletteBalance(
                currentBalance -
                bet
            );


            statusDisplay.textContent =
                "SPINNING...";


            messageDisplay.textContent =
                "The ball is spinning...";


            messageDisplay.className =
                "roulette-luxury-message";


            /* ---------------------------------------------
               PICK WINNER 0-36
            ---------------------------------------------- */

            const winningNumber =
                randomInt(
                    37
                );


            /* ---------------------------------------------
               ANIMATE TO WINNER
            ---------------------------------------------- */

            await animateBallToNumber(
                winningNumber
            );


            const color =
                rouletteColor(
                    winningNumber
                );


            /* ---------------------------------------------
               ADD HISTORY
            ---------------------------------------------- */

            addHistoryResult(
                winningNumber
            );


            /* ---------------------------------------------
               CHECK WIN
            ---------------------------------------------- */

            const won =
                betWins(
                    selectedBet,
                    winningNumber
                );


            if (won) {

                const multiplier =
                    payoutMultiplier(
                        selectedBet
                    );


                const totalReturned =
                    bet *
                    multiplier;


                setRouletteBalance(
                    getBalance() +
                    totalReturned
                );


                recordRouletteGame(
                    "win"
                );


                statusDisplay.textContent =
                    winningNumber +
                    " " +
                    color.toUpperCase();


                /* NUMBER WIN */

                if (
                    selectedBet.type ===
                    "number"
                ) {

                    const profit =
                        totalReturned -
                        bet;


                    messageDisplay.textContent =
                        "STRAIGHT-UP WIN! +" +
                        profit.toLocaleString() +
                        " AC";


                /* OUTSIDE WIN */

                } else {

                    messageDisplay.textContent =
                        "WIN! +" +
                        bet.toLocaleString() +
                        " AC";
                }


                messageDisplay.className =
                    "roulette-luxury-message win";


            } else {


                /* -----------------------------------------
                   LOSS
                ------------------------------------------ */

                recordRouletteGame(
                    "loss"
                );


                statusDisplay.textContent =
                    winningNumber +
                    " " +
                    color.toUpperCase();


                messageDisplay.textContent =
                    winningNumber +
                    " " +
                    color.toUpperCase() +
                    " — LOST " +
                    bet.toLocaleString() +
                    " AC";


                messageDisplay.className =
                    "roulette-luxury-message loss";
            }


            /* ---------------------------------------------
               FINISH
            ---------------------------------------------- */

            spinning =
                false;


            disableRouletteControls(
                false
            );


            updateRouletteBalanceDisplays();
        }
    );


    /* =========================================================
       START ROULETTE
    ========================================================= */

    buildWheel();

    buildNumberBoard();

    updateBetDisplay();

    updateRouletteBalanceDisplays();

});
