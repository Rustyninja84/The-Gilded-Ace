(() => {
    "use strict";

    const minus500 = document.getElementById("luxuryRouletteBetMinus500");
    const normalDown = document.getElementById("luxuryRouletteBetDown");
    const clearButton = document.getElementById("luxuryRouletteClearBet");
    const spinButton = document.getElementById("luxuryRouletteSpin");
    const selectedBetDisplay = document.getElementById("rouletteSelectedBet");
    const message = document.getElementById("luxuryRouletteMessage");

    let betWasCleared = false;

    function setMessage(text) {
        if (message) {
            message.textContent = text;
        }
    }

    function clearVisualSelection() {
        document
            .querySelectorAll(
                ".luxury-roulette-choice, " +
                ".roulette-number-choice, " +
                ".roulette-number-button, " +
                "#rouletteNumberBoard button"
            )
            .forEach(button => {
                button.classList.remove(
                    "selected",
                    "active",
                    "is-selected"
                );
                button.removeAttribute("aria-pressed");
            });

        if (selectedBetDisplay) {
            selectedBetDisplay.textContent = "NONE";
        }
    }

    minus500?.addEventListener("click", () => {
        if (!normalDown) return;

        /*
         * Use the roulette's own existing decrement handler five times.
         * This preserves whatever minimum/clamp rules roulette.js already uses.
         */
        for (let i = 0; i < 5; i += 1) {
            normalDown.click();
        }
    });

    clearButton?.addEventListener("click", () => {
        betWasCleared = true;
        clearVisualSelection();
        setMessage("Bet cleared. Select a new number or outside bet.");
    });

    /*
     * As soon as the player selects another roulette position,
     * the cleared state ends and SPIN works normally again.
     */
    document.addEventListener("click", event => {
        const target = event.target.closest(
            ".luxury-roulette-choice, " +
            ".roulette-number-choice, " +
            ".roulette-number-button, " +
            "#rouletteNumberBoard button"
        );

        if (!target) return;
        betWasCleared = false;
    });

    /*
     * Capture phase intentionally runs before the existing roulette.js
     * SPIN handler. If CLEAR BET was used and no replacement wager was
     * selected, an old internal selection cannot accidentally be spun.
     */
    spinButton?.addEventListener(
        "click",
        event => {
            if (!betWasCleared) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            setMessage("Select a bet before spinning.");
        },
        true
    );
})();
