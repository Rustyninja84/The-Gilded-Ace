document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       THE GILDED ACE
       LUXURY ROULETTE + CASINO TAB SUPPORT
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
       CASINO GAME TABS
    ========================================================= */

    const casinoTabs =
        document.querySelectorAll(
            ".casino-tab"
        );

    const casinoPanels =
        document.querySelectorAll(
            ".casino-game-panel"
        );


    function openCasinoGame(game) {

        casinoTabs.forEach(
            tab => {

                const active =
                    tab.dataset.game ===
                    game;

                tab.classList.toggle(
                    "active",
                    active
                );
            }
        );


        casinoPanels.forEach(
            panel => {

                const active =
                    panel.id ===
                    game;

                panel.classList.toggle(
                    "active",
                    active
                );

                /*
                    Backup display handling in case
                    the main stylesheet is not applying
                    the active panel correctly.
                */

                if (active) {

                    panel.style.display =
                        "block";

                } else {

                    panel.style.display =
                        "none";
                }
            }
        );


        if (
            window.location.hash !==
            "#" + game
        ) {

            history.replaceState(
                null,
                "",
                "#" + game
            );
        }
    }


    casinoTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    const game =
                        tab.dataset.game;

                    if (!game) {
                        return;
                    }

                    openCasinoGame(
                        game
                    );
                }
            );
        }
    );


    /* =========================================================
       OPEN GAME FROM URL
    ========================================================= */

    const requestedGame =
        window.location.hash
            .replace("#", "")
            .toLowerCase();


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

        openCasinoGame(
            requestedGame
        );

    } else {

        openCasinoGame(
            "blackjack"
        );
    }



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


    /*
        If the page does not contain the new
        roulette system, stop here.

        Casino tabs above will still work.
    */

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
       ROULETTE STATE
    ========================================================= */

    let betIndex = 1;

    let selectedBet = null;

    let spinning = false;

    let currentBallRotation = 0;

    let resultHistory = [];


    /* =========================================================
       SECURE RANDOM NUMBER
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
       ACCOUNT BALANCE STORAGE
    ========================================================= */

    function getActiveAccountId() {

        return (
            localStorage.getItem(
                SESSION_KEY
            ) || ""
        );
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

        const stored =
            localStorage.getItem(
                balanceKey()
            );


        if (
            stored === null
        ) {

            localStorage.setItem(
                balanceKey(),
                STARTING_BALANCE
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
                STARTING_BALANCE
            );

            return STARTING_BALANCE;
        }


        return Math.floor(
            value
        );
    }


    function setBalance(value) {

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


        updateBalanceDisplays();


        return newBalance;
    }


    function updateBalanceDisplays() {

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
    }



    /* =========================================================
       STATS
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


    function saveStats(stats) {

        localStorage.setItem(
            statsKey(),
            JSON.stringify(
                stats
            )
        );
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


        saveStats(
            stats
        );
    }



    /* =========================================================
       ROULETTE COLORS
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
       BUILD WHEEL
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


                /*
                    CSS controls wheel size.

                    Instead of relying on a hardcoded
                    pixel radius from the old version,
                    position the pockets using a
                    percentage-based transform.
                */

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
       BUILD ROULETTE TABLE
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
            Standard roulette table:

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
       BET SELECTION
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

            type: "number",

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
            type: type
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
            type.toUpperCase();


        messageDisplay.textContent =
            "Outside bet selected.";


        messageDisplay.className =
            "roulette-luxury-message";
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
       WIN CHECK
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


        if (
            bet.type ===
            "number"
        ) {

            return (
                Number(
                    bet.value
                ) === number
            );
        }


        /*
            Zero loses all normal
            even-money outside bets.
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
       PAYOUT MULTIPLIER
    ========================================================= */

    function payoutMultiplier(
        bet
    ) {

        /*
            Straight-up:
            35:1 profit + stake returned
            = 36x total payout.
        */

        if (
            bet.type ===
            "number"
        ) {

            return 36;
        }


        /*
            Even-money:
            1:1 profit + stake returned
            = 2x total payout.
        */

        return 2;
    }



    /* =========================================================
       HISTORY
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
       DISABLE ROULETTE CONTROLS
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
       BALL LANDING POSITION
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


        /*
            Rotate to the center of
            the selected pocket.
        */

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


                /*
                    Always move forward from the
                    ball's current position.
                */

                const currentNormalized =
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
                    currentNormalized;


                if (
                    delta < 0
                ) {

                    delta += 360;
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
                                offset: 0.2,

                                transform:
                                    `rotate(${currentBallRotation + ((fullSpins * 360) * 0.45)}deg)`
                            },

                            {
                                offset: 0.65,

                                transform:
                                    `rotate(${currentBallRotation + ((fullSpins * 360) * 0.83)}deg)`
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
                currentBalance <
                bet
            ) {

                messageDisplay.textContent =
                    "You do not have enough Ace Credits.";


                messageDisplay.className =
                    "roulette-luxury-message loss";


                return;
            }


            spinning =
                true;


            disableRouletteControls(
                true
            );


            /*
                Deduct wager before spin.
            */

            setBalance(
                currentBalance -
                bet
            );


            messageDisplay.textContent =
                "The ball is spinning...";


            messageDisplay.className =
                "roulette-luxury-message";


            statusDisplay.textContent =
                "SPINNING...";


            /*
                Random result 0–36.
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
                    payoutMultiplier(
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

                    const profit =
                        payout -
                        bet;


                    messageDisplay.textContent =
                        "STRAIGHT-UP WIN! " +
                        profit.toLocaleString() +
                        " AC PROFIT";


                } else {

                    messageDisplay.textContent =
                        "WIN! +" +
                        bet.toLocaleString() +
                        " AC";

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
                    winningNumber +
                    " " +
                    color.toUpperCase() +
                    " — LOST " +
                    bet.toLocaleString() +
                    " AC";


                messageDisplay.className =
                    "roulette-luxury-message loss";
            }


            spinning =
                false;


            disableRouletteControls(
                false
            );


            updateBalanceDisplays();
        }
    );



    /* =========================================================
       INITIALIZE ROULETTE
    ========================================================= */

    buildWheel();

    buildNumberBoard();

    updateBetDisplay();

    updateBalanceDisplays();

});
