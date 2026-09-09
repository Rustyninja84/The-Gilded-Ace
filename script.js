document.addEventListener("DOMContentLoaded", () => {
    const dailyRewardButton = document.getElementById("dailyRewardButton");

    if (!dailyRewardButton) {
        return;
    }

    const balanceElements = document.querySelectorAll(
        ".balance-value, .credit-balance"
    );

    const DAILY_REWARD = 1000;
    const STARTING_BALANCE = 10000;
    const REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

    let balance = Number(localStorage.getItem("gildedAceBalance"));

    if (!balance || Number.isNaN(balance)) {
        balance = STARTING_BALANCE;
        localStorage.setItem("gildedAceBalance", balance);
    }

    function formatBalance(value) {
        return value.toLocaleString();
    }

    function updateBalanceDisplay() {
        balanceElements.forEach((element) => {
            if (element.classList.contains("balance-value")) {
                element.textContent = `${formatBalance(balance)} AC`;
            }

            if (element.classList.contains("credit-balance")) {
                element.innerHTML = `
                    ${formatBalance(balance)}
                    <span>AC</span>
                `;
            }
        });
    }

    function getLastRewardTime() {
        return Number(
            localStorage.getItem("gildedAceLastDailyReward") || 0
        );
    }

    function rewardAvailable() {
        const lastReward = getLastRewardTime();

        if (!lastReward) {
            return true;
        }

        return Date.now() - lastReward >= REWARD_COOLDOWN;
    }

    function getRemainingTime() {
        const lastReward = getLastRewardTime();

        if (!lastReward) {
            return 0;
        }

        const nextReward = lastReward + REWARD_COOLDOWN;
        return Math.max(0, nextReward - Date.now());
    }

    function formatRemainingTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(2, "0")}`;
    }

    function updateRewardButton() {
        if (rewardAvailable()) {
            dailyRewardButton.disabled = false;
            dailyRewardButton.textContent = "CLAIM DAILY REWARD";
            dailyRewardButton.style.opacity = "1";
            dailyRewardButton.style.cursor = "pointer";
            return;
        }

        dailyRewardButton.disabled = true;

        const remaining = getRemainingTime();

        dailyRewardButton.textContent =
            `NEXT REWARD ${formatRemainingTime(remaining)}`;

        dailyRewardButton.style.opacity = ".55";
        dailyRewardButton.style.cursor = "not-allowed";
    }

    function showRewardMessage() {
        const existingMessage = document.querySelector(
            ".reward-message"
        );

        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement("div");

        message.className = "reward-message";
        message.textContent =
            `+${DAILY_REWARD.toLocaleString()} AC CLAIMED`;

        Object.assign(message.style, {
            position: "fixed",
            top: "110px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            border: "1px solid #d6b35a",
            color: "#d6b35a",
            padding: "14px 24px",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            zIndex: "5000",
            boxShadow: "0 15px 40px rgba(0,0,0,.45)"
        });

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.opacity = "0";
            message.style.transition = "opacity .4s ease";

            setTimeout(() => {
                message.remove();
            }, 400);
        }, 2500);
    }

    dailyRewardButton.addEventListener("click", () => {
        if (!rewardAvailable()) {
            return;
        }

        balance += DAILY_REWARD;

        localStorage.setItem(
            "gildedAceBalance",
            balance
        );

        localStorage.setItem(
            "gildedAceLastDailyReward",
            Date.now()
        );

        updateBalanceDisplay();
        updateRewardButton();
        showRewardMessage();
    });

    updateBalanceDisplay();
    updateRewardButton();

    setInterval(() => {
        updateRewardButton();
    }, 1000);
});
