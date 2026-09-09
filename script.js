document.addEventListener("DOMContentLoaded", async () => {

    /* =========================================================
       THE GILDED ACE
       ACCOUNT + PLAY-MONEY SYSTEM
    ========================================================= */

    const STARTING_BALANCE = 10000;
    const DAILY_REWARD = 1000;
    const REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

    const ACCOUNTS_KEY = "gildedAceAccounts";
    const SESSION_KEY = "gildedAceActiveAccountId";

    const LEGACY_BALANCE_KEY = "gildedAceBalance";
    const LEGACY_DAILY_KEY = "gildedAceLastDailyReward";
    const LEGACY_INVENTORY_KEY = "gildedAceOwnedItems";
    const LEGACY_STATS_KEY = "gildedAceStats";

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
       HELPERS
    ========================================================= */

    function formatNumber(value) {
        return Math.floor(Number(value) || 0).toLocaleString();
    }


    function randomInt(max) {

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {
            const values = new Uint32Array(1);
            window.crypto.getRandomValues(values);
            return values[0] % max;
        }

        return Math.floor(
            Math.random() * max
        );
    }


    function escapeText(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    /* =========================================================
       ACCOUNT STORAGE
    ========================================================= */

    function getAccounts() {

        try {

            const value =
                JSON.parse(
                    localStorage.getItem(
                        ACCOUNTS_KEY
                    ) || "[]"
                );

            return Array.isArray(value)
                ? value
                : [];

        } catch {
            return [];
        }
    }


    function saveAccounts(accounts) {

        localStorage.setItem(
            ACCOUNTS_KEY,
            JSON.stringify(accounts)
        );
    }


    function getActiveAccountId() {

        return localStorage.getItem(
            SESSION_KEY
        ) || "";
    }


    function setActiveAccountId(id) {

        if (id) {

            localStorage.setItem(
                SESSION_KEY,
                id
            );

        } else {

            localStorage.removeItem(
                SESSION_KEY
            );
        }
    }


    function getActiveAccount() {

        const id =
            getActiveAccountId();

        if (!id) {
            return null;
        }

        return (
            getAccounts().find(
                account =>
                    account.id === id
            ) || null
        );
    }


    function accountKey(
        accountId,
        type
    ) {

        return `gildedAce:${accountId}:${type}`;
    }


    function currentKey(type) {

        const account =
            getActiveAccount();

        if (account) {

            return accountKey(
                account.id,
                type
            );
        }

        const legacy = {
            balance: LEGACY_BALANCE_KEY,
            daily: LEGACY_DAILY_KEY,
            inventory: LEGACY_INVENTORY_KEY,
            stats: LEGACY_STATS_KEY
        };

        return legacy[type];
    }


    /* =========================================================
       PASSWORD SECURITY
    ========================================================= */

    function bytesToBase64(bytes) {

        let binary = "";

        bytes.forEach(
            byte => {
                binary += String.fromCharCode(byte);
            }
        );

        return btoa(binary);
    }


    function base64ToBytes(base64) {

        const binary =
            atob(base64);

        return Uint8Array.from(
            binary,
            character =>
                character.charCodeAt(0)
        );
    }


    function createSalt() {

        const salt =
            new Uint8Array(16);

        crypto.getRandomValues(
            salt
        );

        return bytesToBase64(
            salt
        );
    }


    async function hashPassword(
        password,
        saltBase64
    ) {

        if (
            !window.crypto ||
            !window.crypto.subtle
        ) {
            throw new Error(
                "Secure password hashing is unavailable in this browser."
            );
        }

        const encoder =
            new TextEncoder();

        const passwordKey =
            await crypto.subtle.importKey(
                "raw",
                encoder.encode(password),
                "PBKDF2",
                false,
                [
                    "deriveBits"
                ]
            );

        const salt =
            base64ToBytes(
                saltBase64
            );

        const derivedBits =
            await crypto.subtle.deriveBits(
                {
                    name: "PBKDF2",
                    salt,
                    iterations: 120000,
                    hash: "SHA-256"
                },
                passwordKey,
                256
            );

        return bytesToBase64(
            new Uint8Array(
                derivedBits
            )
        );
    }


    async function verifyPassword(
        password,
        account
    ) {

        const hash =
            await hashPassword(
                password,
                account.salt
            );

        return (
            hash ===
            account.passwordHash
        );
    }


    /* =========================================================
       USERNAME RULES
    ========================================================= */

    function cleanUsername(value) {

        return String(
            value || ""
        ).trim();
    }


    function normalizeUsername(value) {

        return cleanUsername(
            value
        ).toLowerCase();
    }


    function validUsername(username) {

        return /^[A-Za-z0-9_ ]{3,20}$/.test(
            username
        );
    }


    function usernameExists(
        username,
        ignoreId = ""
    ) {

        const normalized =
            normalizeUsername(
                username
            );

        return getAccounts().some(
            account =>
                account.id !== ignoreId &&
                account.usernameNormalized ===
                    normalized
        );
    }


    /* =========================================================
       MIGRATE EXISTING PLAYER DATA
    ========================================================= */

    function migrateGuestDataToAccount(
        accountId
    ) {

        const mappings = [
            {
                oldKey: LEGACY_BALANCE_KEY,
                newKey: accountKey(
                    accountId,
                    "balance"
                )
            },
            {
                oldKey: LEGACY_DAILY_KEY,
                newKey: accountKey(
                    accountId,
                    "daily"
                )
            },
            {
                oldKey: LEGACY_INVENTORY_KEY,
                newKey: accountKey(
                    accountId,
                    "inventory"
                )
            },
            {
                oldKey: LEGACY_STATS_KEY,
                newKey: accountKey(
                    accountId,
                    "stats"
                )
            }
        ];

        mappings.forEach(
            mapping => {

                if (
                    localStorage.getItem(
                        mapping.newKey
                    ) !== null
                ) {
                    return;
                }

                const existing =
                    localStorage.getItem(
                        mapping.oldKey
                    );

                if (
                    existing !== null
                ) {

                    localStorage.setItem(
                        mapping.newKey,
                        existing
                    );
                }
            }
        );


        const balanceKey =
            accountKey(
                accountId,
                "balance"
            );

        if (
            localStorage.getItem(
                balanceKey
            ) === null
        ) {

            localStorage.setItem(
                balanceKey,
                STARTING_BALANCE
            );
        }
    }


    /* =========================================================
       BALANCE
    ========================================================= */

    function loadBalance() {

        const key =
            currentKey(
                "balance"
            );

        let stored =
            Number(
                localStorage.getItem(
                    key
                )
            );

        if (
            !Number.isFinite(stored) ||
            stored < 0
        ) {

            stored =
                STARTING_BALANCE;

            localStorage.setItem(
                key,
                stored
            );
        }

        return stored;
    }


    let balance =
        loadBalance();


    function updateBalanceDisplays() {

        document
            .querySelectorAll(
                ".balance-value"
            )
            .forEach(
                element => {

                    element.textContent =
                        `${formatNumber(
                            balance
                        )} AC`;
                }
            );


        document
            .querySelectorAll(
                ".casino-balance"
            )
            .forEach(
                element => {

                    element.textContent =
                        `${formatNumber(
                            balance
                        )} AC`;
                }
            );


        document
            .querySelectorAll(
                ".credit-balance"
            )
            .forEach(
                element => {

                    element.innerHTML =
                        `${formatNumber(
                            balance
                        )} <span>AC</span>`;
                }
            );
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
            currentKey(
                "balance"
            ),
            balance
        );

        updateBalanceDisplays();
        updateProfile();
    }


    function addBalance(amount) {

        setBalance(
            balance +
            Number(amount)
        );
    }


    function canAfford(amount) {

        return (
            balance >=
            Number(amount)
        );
    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        message,
        type = "gold"
    ) {

        const existing =
            document.querySelector(
                ".gilded-toast"
            );

        if (existing) {
            existing.remove();
        }


        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "gilded-toast";

        toast.textContent =
            message;


        let border =
            "#d6b35a";

        let color =
            "#d6b35a";


        if (type === "success") {

            border =
                "#5b936a";

            color =
                "#7fba8d";
        }


        if (type === "error") {

            border =
                "#9e4d4d";

            color =
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
                border: `1px solid ${border}`,
                color: color,
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
       INVENTORY
    ========================================================= */

    function getOwnedItems() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        currentKey(
                            "inventory"
                        )
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
            currentKey(
                "inventory"
            ),
            JSON.stringify(
                items
            )
        );

        renderCollection();
        updateProfile();
    }


    function playerOwnsItem(
        itemId
    ) {

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
                        currentKey(
                            "stats"
                        )
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
            currentKey(
                "stats"
            ),
            JSON.stringify(
                stats
            )
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


        stats.gamesPlayed++;
        stats[game].played++;


        if (
            result === "win"
        ) {

            stats.totalWins++;
            stats[game].wins++;
        }


        if (
            result === "loss"
        ) {

            stats.totalLosses++;
            stats[game].losses++;
        }


        saveStats(
            stats
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
                currentKey(
                    "daily"
                )
            ) || 0
        );
    }


    function isRewardAvailable() {

        const previous =
            getLastRewardTime();

        if (!previous) {
            return true;
        }

        return (
            Date.now() -
            previous >=
            REWARD_COOLDOWN
        );
    }


    function getRewardRemaining() {

        const previous =
            getLastRewardTime();

        if (!previous) {
            return 0;
        }

        return Math.max(
            0,
            previous +
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
                ) /
                60
            );

        const remaining =
            seconds % 60;


        return (
            String(hours)
                .padStart(2, "0") +
            ":" +
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(remaining)
                .padStart(2, "0")
        );
    }


    function updateDailyRewardButton() {

        if (!dailyRewardButton) {
            return;
        }


        if (
            isRewardAvailable()
        ) {

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
                        currentKey(
                            "daily"
                        ),
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


        setInterval(
            updateDailyRewardButton,
            1000
        );
    }


    /* =========================================================
       PROFILE ACCOUNT INTERFACE
    ========================================================= */

    const profileAuthScreen =
        document.getElementById(
            "profileAuthScreen"
        );

    const profileDashboard =
        document.getElementById(
            "profileDashboard"
        );

    const createAccountPanel =
        document.getElementById(
            "createAccountPanel"
        );

    const loginPanel =
        document.getElementById(
            "loginPanel"
        );

    const showLoginButton =
        document.getElementById(
            "showLoginButton"
        );

    const showCreateButton =
        document.getElementById(
            "showCreateButton"
        );


    function showCreatePanel() {

        if (createAccountPanel) {
            createAccountPanel.hidden =
                false;
        }

        if (loginPanel) {
            loginPanel.hidden =
                true;
        }
    }


    function showLoginPanel() {

        if (createAccountPanel) {
            createAccountPanel.hidden =
                true;
        }

        if (loginPanel) {
            loginPanel.hidden =
                false;
        }
    }


    function renderProfileAccess() {

        if (
            !profileAuthScreen ||
            !profileDashboard
        ) {
            return;
        }


        const account =
            getActiveAccount();


        if (account) {

            profileAuthScreen.hidden =
                true;

            profileDashboard.hidden =
                false;

            loadActiveProfileState();

            return;
        }


        profileAuthScreen.hidden =
            false;

        profileDashboard.hidden =
            true;


        if (
            getAccounts().length > 0
        ) {

            showLoginPanel();

        } else {

            showCreatePanel();
        }
    }


    if (showLoginButton) {

        showLoginButton
            .addEventListener(
                "click",
                showLoginPanel
            );
    }


    if (showCreateButton) {

        showCreateButton
            .addEventListener(
                "click",
                showCreatePanel
            );
    }


    /* =========================================================
       CREATE ACCOUNT
    ========================================================= */

    const createUsername =
        document.getElementById(
            "createUsername"
        );

    const createPassword =
        document.getElementById(
            "createPassword"
        );

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );

    const createAccountButton =
        document.getElementById(
            "createAccountButton"
        );

    const createAccountMessage =
        document.getElementById(
            "createAccountMessage"
        );


    if (createAccountButton) {

        createAccountButton
            .addEventListener(
                "click",
                async () => {

                    const username =
                        cleanUsername(
                            createUsername.value
                        );

                    const password =
                        createPassword.value;

                    const confirmation =
                        confirmPassword.value;


                    createAccountMessage.textContent =
                        "";


                    if (
                        !validUsername(
                            username
                        )
                    ) {

                        createAccountMessage.textContent =
                            "Username must be 3–20 characters and contain only letters, numbers, spaces, or underscores.";

                        return;
                    }


                    if (
                        usernameExists(
                            username
                        )
                    ) {

                        createAccountMessage.textContent =
                            "That username already exists on this device.";

                        return;
                    }


                    if (
                        password.length < 6
                    ) {

                        createAccountMessage.textContent =
                            "Password must contain at least 6 characters.";

                        return;
                    }


                    if (
                        password !==
                        confirmation
                    ) {

                        createAccountMessage.textContent =
                            "Passwords do not match.";

                        return;
                    }


                    createAccountButton.disabled =
                        true;

                    createAccountButton.textContent =
                        "CREATING ACCOUNT...";


                    try {

                        const id =
                            crypto.randomUUID
                                ? crypto.randomUUID()
                                : (
                                    Date.now().toString(36) +
                                    Math.random()
                                        .toString(36)
                                        .slice(2)
                                );


                        const salt =
                            createSalt();


                        const passwordHash =
                            await hashPassword(
                                password,
                                salt
                            );


                        const account = {
                            id,
                            username,
                            usernameNormalized:
                                normalizeUsername(
                                    username
                                ),
                            salt,
                            passwordHash,
                            createdAt:
                                new Date()
                                    .toISOString()
                        };


                        const accounts =
                            getAccounts();

                        accounts.push(
                            account
                        );

                        saveAccounts(
                            accounts
                        );


                        migrateGuestDataToAccount(
                            id
                        );


                        setActiveAccountId(
                            id
                        );


                        createUsername.value =
                            "";

                        createPassword.value =
                            "";

                        confirmPassword.value =
                            "";


                        showToast(
                            "ACCOUNT CREATED",
                            "success"
                        );


                        renderProfileAccess();

                    } catch (error) {

                        console.error(
                            "Account creation error:",
                            error
                        );

                        createAccountMessage.textContent =
                            "Account could not be created.";

                    } finally {

                        createAccountButton.disabled =
                            false;

                        createAccountButton.textContent =
                            "CREATE ACCOUNT";
                    }
                }
            );
    }


    /* =========================================================
       LOGIN
    ========================================================= */

    const loginUsername =
        document.getElementById(
            "loginUsername"
        );

    const loginPassword =
        document.getElementById(
            "loginPassword"
        );

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );


    if (loginButton) {

        loginButton
            .addEventListener(
                "click",
                async () => {

                    const username =
                        normalizeUsername(
                            loginUsername.value
                        );

                    const password =
                        loginPassword.value;


                    loginMessage.textContent =
                        "";


                    const account =
                        getAccounts().find(
                            item =>
                                item.usernameNormalized ===
                                    username
                        );


                    if (!account) {

                        loginMessage.textContent =
                            "Username or password is incorrect.";

                        return;
                    }


                    loginButton.disabled =
                        true;

                    loginButton.textContent =
                        "SIGNING IN...";


                    try {

                        const valid =
                            await verifyPassword(
                                password,
                                account
                            );


                        if (!valid) {

                            loginMessage.textContent =
                                "Username or password is incorrect.";

                            return;
                        }


                        setActiveAccountId(
                            account.id
                        );


                        loginPassword.value =
                            "";


                        showToast(
                            `WELCOME BACK, ${account.username.toUpperCase()}`,
                            "success"
                        );


                        renderProfileAccess();

                    } catch (error) {

                        console.error(
                            "Login error:",
                            error
                        );

                        loginMessage.textContent =
                            "Unable to sign in.";

                    } finally {

                        loginButton.disabled =
                            false;

                        loginButton.textContent =
                            "SIGN IN";
                    }
                }
            );
    }


    /* =========================================================
       ENTER KEY LOGIN / CREATE
    ========================================================= */

    [
        createUsername,
        createPassword,
        confirmPassword
    ]
        .filter(Boolean)
        .forEach(
            element => {

                element.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            createAccountButton?.click();
                        }
                    }
                );
            }
        );


    [
        loginUsername,
        loginPassword
    ]
        .filter(Boolean)
        .forEach(
            element => {

                element.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            loginButton?.click();
                        }
                    }
                );
            }
        );


    /* =========================================================
       LOGOUT
    ========================================================= */

    const logoutProfileButton =
        document.getElementById(
            "logoutProfileButton"
        );


    if (logoutProfileButton) {

        logoutProfileButton
            .addEventListener(
                "click",
                () => {

                    setActiveAccountId(
                        ""
                    );


                    balance =
                        loadBalance();


                    updateBalanceDisplays();


                    showToast(
                        "SIGNED OUT"
                    );


                    renderProfileAccess();
                }
            );
    }


    /* =========================================================
       EDIT USERNAME
    ========================================================= */

    const editUsername =
        document.getElementById(
            "editUsername"
        );

    const saveUsernameButton =
        document.getElementById(
            "saveUsernameButton"
        );

    const editUsernameMessage =
        document.getElementById(
            "editUsernameMessage"
        );


    if (saveUsernameButton) {

        saveUsernameButton
            .addEventListener(
                "click",
                () => {

                    const account =
                        getActiveAccount();

                    if (!account) {
                        return;
                    }


                    const username =
                        cleanUsername(
                            editUsername.value
                        );


                    editUsernameMessage.textContent =
                        "";


                    if (
                        !validUsername(
                            username
                        )
                    ) {

                        editUsernameMessage.textContent =
                            "Username must be 3–20 characters.";

                        return;
                    }


                    if (
                        usernameExists(
                            username,
                            account.id
                        )
                    ) {

                        editUsernameMessage.textContent =
                            "That username is already in use.";

                        return;
                    }


                    const accounts =
                        getAccounts();


                    const index =
                        accounts.findIndex(
                            item =>
                                item.id ===
                                account.id
                        );


                    if (
                        index === -1
                    ) {
                        return;
                    }


                    accounts[index].username =
                        username;

                    accounts[index].usernameNormalized =
                        normalizeUsername(
                            username
                        );


                    saveAccounts(
                        accounts
                    );


                    editUsername.value =
                        "";


                    editUsernameMessage.textContent =
                        "Username updated.";


                    updateProfile();


                    showToast(
                        "USERNAME UPDATED",
                        "success"
                    );
                }
            );
    }


    /* =========================================================
       CHANGE PASSWORD
    ========================================================= */

    const currentPassword =
        document.getElementById(
            "currentPassword"
        );

    const newPassword =
        document.getElementById(
            "newPassword"
        );

    const confirmNewPassword =
        document.getElementById(
            "confirmNewPassword"
        );

    const changePasswordButton =
        document.getElementById(
            "changePasswordButton"
        );

    const changePasswordMessage =
        document.getElementById(
            "changePasswordMessage"
        );


    if (changePasswordButton) {

        changePasswordButton
            .addEventListener(
                "click",
                async () => {

                    const account =
                        getActiveAccount();

                    if (!account) {
                        return;
                    }


                    changePasswordMessage.textContent =
                        "";


                    if (
                        newPassword.value.length <
                        6
                    ) {

                        changePasswordMessage.textContent =
                            "New password must contain at least 6 characters.";

                        return;
                    }


                    if (
                        newPassword.value !==
                        confirmNewPassword.value
                    ) {

                        changePasswordMessage.textContent =
                            "New passwords do not match.";

                        return;
                    }


                    changePasswordButton.disabled =
                        true;

                    changePasswordButton.textContent =
                        "UPDATING...";


                    try {

                        const validCurrent =
                            await verifyPassword(
                                currentPassword.value,
                                account
                            );


                        if (!validCurrent) {

                            changePasswordMessage.textContent =
                                "Current password is incorrect.";

                            return;
                        }


                        const salt =
                            createSalt();


                        const passwordHash =
                            await hashPassword(
                                newPassword.value,
                                salt
                            );


                        const accounts =
                            getAccounts();


                        const index =
                            accounts.findIndex(
                                item =>
                                    item.id ===
                                    account.id
                            );


                        if (
                            index === -1
                        ) {
                            return;
                        }


                        accounts[index].salt =
                            salt;

                        accounts[index].passwordHash =
                            passwordHash;


                        saveAccounts(
                            accounts
                        );


                        currentPassword.value =
                            "";

                        newPassword.value =
                            "";

                        confirmNewPassword.value =
                            "";


                        changePasswordMessage.textContent =
                            "Password updated successfully.";


                        showToast(
                            "PASSWORD UPDATED",
                            "success"
                        );

                    } catch (error) {

                        console.error(
                            "Password change error:",
                            error
                        );

                        changePasswordMessage.textContent =
                            "Password could not be changed.";

                    } finally {

                        changePasswordButton.disabled =
                            false;

                        changePasswordButton.textContent =
                            "CHANGE PASSWORD";
                    }
                }
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
            product => {

                const id =
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
                        id
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
                            product.dataset.itemId;

                        const itemName =
                            product.dataset.itemName;

                        const category =
                            product.dataset.category;

                        const price =
                            Number(
                                product.dataset.price
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
                            id: itemId,
                            name: itemName,
                            category,
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


    function collectionCategoryName(
        category
    ) {

        const names = {
            profile: "PROFILE COSMETIC",
            collectible: "LUXURY COLLECTIBLE",
            vehicle: "VEHICLE",
            property: "PROPERTY",
            casino: "CASINO COSMETIC",
            prestige: "PRESTIGE"
        };

        return (
            names[category] ||
            "COLLECTIBLE"
        );
    }


    function formatPurchaseDate(
        value
    ) {

        const date =
            new Date(value);

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
                        collectionCategoryName(
                            item.category
                        )
                    )}
                </span>

                <h3 class="collection-item-name">
                    ${escapeText(item.name)}
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
                ) =>
                    total +
                    (
                        Number(
                            item.price
                        ) || 0
                    ),
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


        setText(
            "collectionOwnedCount",
            formatNumber(
                items.length
            )
        );


        if (collectionItemCount) {

            collectionItemCount.textContent =
                `${items.length} ${
                    items.length === 1
                        ? "ITEM"
                        : "ITEMS"
                }`;
        }


        if (collectionValue) {

            collectionValue.textContent =
                `${formatNumber(
                    totalValue
                )} AC`;
        }


        if (
            collectionHighestPurchase
        ) {

            collectionHighestPurchase.textContent =
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


        if (!collectionEmptyState) {
            return;
        }


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

            collectionEmptyState.style.display =
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

            collectionEmptyState.style.display =
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

            collectionEmptyState.style.display =
                "none";
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

                collectionGrid.appendChild(
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
        game
    ) {

        casinoTabs.forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.game ===
                        game
                );
            }
        );


        casinoPanels.forEach(
            panel => {

                const match =
                    panel.id === game ||
                    panel.dataset.gamePanel ===
                        game;

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

                    activateGame(game);

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
                .replace("#", "");

        if (
            [
                "blackjack",
                "slots",
                "roulette",
                "dice"
            ].includes(game)
        ) {

            activateGame(game);
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

        if (
            index === -1
        ) {
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


        down?.addEventListener(
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


        up?.addEventListener(
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


        update();


        return {

            getBet() {
                return BET_LEVELS[index];
            },

            setDisabled(disabled) {

                if (down) {
                    down.disabled = disabled;
                }

                if (up) {
                    up.disabled = disabled;
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

            const cards = [];


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
                ] = [
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


        function cardValue(card) {

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


        function handValue(hand) {

            let value =
                hand.reduce(
                    (
                        total,
                        card
                    ) =>
                        total +
                        cardValue(card),
                    0
                );

            let aces =
                hand.filter(
                    card =>
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


        function renderBlackjack(
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
                    `Dealer: ${
                        dealerHand.length
                            ? cardValue(
                                dealerHand[0]
                            )
                            : "—"
                    }`;

            } else {

                dealerValue.textContent =
                    `Dealer: ${handValue(
                        dealerHand
                    )}`;
            }
        }


        function blackjackMessage(
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


        function blackjackButtons(
            enabled
        ) {

            active =
                enabled;

            hit.disabled =
                !enabled;

            stand.disabled =
                !enabled;

            double.disabled =
                !enabled;

            blackjackDeal.disabled =
                enabled;

            betControl.setDisabled(
                enabled
            );
        }


        function finishBlackjack(
            result
        ) {

            renderBlackjack(
                false
            );

            blackjackButtons(
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

                blackjackMessage(
                    `BLACKJACK! You won ${formatNumber(
                        payout -
                        currentBet
                    )} AC.`,
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

                recordGame(
                    "blackjack",
                    "win"
                );

                blackjackMessage(
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

                addBalance(
                    currentBet
                );

                recordGame(
                    "blackjack",
                    "push"
                );

                blackjackMessage(
                    "Push. Your bet was returned."
                );

                return;
            }


            recordGame(
                "blackjack",
                "loss"
            );

            blackjackMessage(
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

                finishBlackjack(
                    "win"
                );

            } else if (
                player < dealer
            ) {

                finishBlackjack(
                    "loss"
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

                if (active) {
                    return;
                }


                currentBet =
                    betControl.getBet();


                if (
                    !canAfford(
                        currentBet
                    )
                ) {

                    blackjackMessage(
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

                playerHand = [
                    drawCard(),
                    drawCard()
                ];

                dealerHand = [
                    drawCard(),
                    drawCard()
                ];


                renderBlackjack(
                    true
                );

                blackjackButtons(
                    true
                );

                blackjackMessage(
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
                    playerHand.length !== 2
                ) {
                    return;
                }


                if (
                    !canAfford(
                        currentBet
                    )
                ) {

                    blackjackMessage(
                        "Not enough Ace Credits to double.",
                        "loss"
                    );

                    return;
                }


                setBalance(
                    balance -
                    currentBet
                );

                currentBet *= 2;


                playerHand.push(
                    drawCard()
                );

                renderBlackjack(
                    true
                );


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


        blackjackButtons(
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


        function symbol() {

            return symbols[
                randomInt(
                    symbols.length
                )
            ];
        }


        function slotMessage(
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
                    !canAfford(bet)
                ) {

                    slotMessage(
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


                slotMessage(
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


                        const result = [
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
                                    value === "7"
                            )
                        ) {

                            multiplier = 10;

                        } else if (
                            result.every(
                                value =>
                                    value === "A"
                            )
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

                            recordGame(
                                "slots",
                                "win"
                            );

                            slotMessage(
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

                            slotMessage(
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


        const redNumbers =
            new Set([
                1,3,5,7,9,
                12,14,16,18,
                19,21,23,25,
                27,30,32,34,
                36
            ]);


        let selected =
            null;


        function rouletteColor(
            number
        ) {

            if (
                number === 0
            ) {
                return "green";
            }

            return redNumbers.has(
                number
            )
                ? "red"
                : "black";
        }


        function rouletteWins(
            selection,
            number
        ) {

            if (
                number === 0
            ) {
                return false;
            }


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
                    !canAfford(bet)
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
                    button => {
                        button.disabled = true;
                    }
                );


                wheel?.classList.add(
                    "spinning"
                );


                message.textContent =
                    "Wheel spinning...";

                message.className =
                    "game-message";


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


                        wheel?.classList.remove(
                            "spinning"
                        );


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

                            recordGame(
                                "roulette",
                                "win"
                            );

                            message.textContent =
                                `${number} ${color.toUpperCase()} — You won ${formatNumber(
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
                                `${number} ${color.toUpperCase()} — You lost ${formatNumber(
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
                            button => {
                                button.disabled =
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
       DICE / HIGH ROLL
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
                    !canAfford(bet)
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
       PROFILE STATISTICS
    ========================================================= */

    function getHighestOwnedItem() {

        const items =
            getOwnedItems();

        if (
            items.length === 0
        ) {
            return null;
        }


        return items.reduce(
            (
                highest,
                item
            ) => {

                if (
                    !highest ||
                    Number(item.price) >
                    Number(highest.price)
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
                name: "CASINO OWNER",
                next: "MAXIMUM STATUS",
                start: 10000000,
                target: 10000000
            };
        }


        if (
            balance >=
            1000000
        ) {

            return {
                name: "DIAMOND CLUB",
                next: "CASINO OWNER",
                start: 1000000,
                target: 10000000
            };
        }


        if (
            balance >=
            500000
        ) {

            return {
                name: "HIGH ROLLER",
                next: "DIAMOND CLUB",
                start: 500000,
                target: 1000000
            };
        }


        if (
            balance >=
            250000
        ) {

            return {
                name: "VIP",
                next: "HIGH ROLLER",
                start: 250000,
                target: 500000
            };
        }


        if (
            balance >=
            100000
        ) {

            return {
                name: "GOLD MEMBER",
                next: "VIP",
                start: 100000,
                target: 250000
            };
        }


        return {
            name: "STANDARD",
            next: "GOLD MEMBER",
            start: 0,
            target: 100000
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


        const groups =
            document.querySelectorAll(
                ".profile-progress-top > div"
            );


        if (
            groups.length >= 2
        ) {

            const current =
                groups[0]
                    .querySelector(
                        "strong"
                    );

            const next =
                groups[1]
                    .querySelector(
                        "strong"
                    );

            if (current) {
                current.textContent =
                    tier.name;
            }

            if (next) {
                next.textContent =
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


        const bar =
            document.querySelector(
                ".profile-progress-bar"
            );


        if (bar) {

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


            bar.style.width =
                `${percentage}%`;
        }
    }


    function updateAchievements() {

        const cards =
            document.querySelectorAll(
                ".achievement-card"
            );

        if (
            cards.length === 0
        ) {
            return;
        }


        const stats =
            getStats();


        const unlocked = [
            Boolean(
                getActiveAccount()
            ),
            stats.totalWins >= 1,
            balance >= 100000,
            balance >= 1000000
        ];


        cards.forEach(
            (
                card,
                index
            ) => {

                const label =
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

                    if (label) {
                        label.textContent =
                            "UNLOCKED";
                    }

                } else {

                    card.classList.remove(
                        "unlocked"
                    );

                    card.classList.add(
                        "locked"
                    );

                    if (label) {
                        label.textContent =
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


        const account =
            getActiveAccount();

        const stats =
            getStats();

        const items =
            getOwnedItems();

        const highest =
            getHighestOwnedItem();


        if (account) {

            setText(
                "profileUsername",
                account.username
            );


            const avatar =
                document.getElementById(
                    "profileAvatarLetter"
                );

            if (avatar) {

                avatar.textContent =
                    account.username
                        .charAt(0)
                        .toUpperCase() ||
                    "A";
            }
        }


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
                items.length
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
                items.length
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
       RELOAD ACTIVE PROFILE DATA
    ========================================================= */

    function loadActiveProfileState() {

        balance =
            loadBalance();

        updateBalanceDisplays();
        updateDailyRewardButton();
        updateStoreButtons();
        renderCollection();
        updateProfile();
    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    balance =
        loadBalance();

    updateBalanceDisplays();

    updateDailyRewardButton();

    updateStoreButtons();

    if (
        storeCategoryButtons.length
    ) {
        filterStore("all");
    }

    renderCollection();

    updateProfile();

    renderProfileAccess();

});
