const GA_SUPABASE_URL = "https://wrmiylynviujwdoecvcn.supabase.co";
const GA_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";

const gaPokerSupabase = window.supabase.createClient(
    GA_SUPABASE_URL,
    GA_SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

let pokerUser = null;
let pokerProfile = null;
let pokerRoom = null;
let pokerSeats = [];
let pokerHoleCards = [];
let pokerChannel = null;
let pokerRefreshTimer = null;
let pokerBotTimer = null;
let pokerNextHandTimer = null;
let actionBusy = false;
let leavingTable = false;
let lastWinnerNotificationKey = null;
let pokerRefreshGeneration = 0;

document.addEventListener("DOMContentLoaded", initializePoker);

function $(id) {
    return document.getElementById(id);
}

function fmt(value) {
    return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString();
}

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function pokerSessionGet(key) {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function pokerSessionSet(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // Storage may be blocked; winner notification still works in-memory.
    }
}

function setMessage(text, type = "") {
    const el = $("pokerStatusMessage") || $("lobbyMessage");
    if (!el) return;
    el.textContent = text || "";
    el.className = "poker-message" + (type ? ` ${type}` : "");
}

function setLobbyMessage(text, type = "") {
    const el = $("lobbyMessage");
    if (!el) return;
    el.textContent = text || "";
    el.className = "poker-message" + (type ? ` ${type}` : "");
}

function showOnly(id) {
    ["pokerLoading", "pokerLoginRequired", "pokerLobby", "pokerWaitingRoom", "pokerTableView"]
        .forEach(name => {
            const el = $(name);
            if (el) el.classList.toggle("hidden", name !== id);
        });
}

async function initializePoker() {
    bindPokerButtons();

    const { data: { session }, error } = await gaPokerSupabase.auth.getSession();

    if (error || !session?.user) {
        showOnly("pokerLoginRequired");
        return;
    }

    pokerUser = session.user;
    await loadPokerProfile();

    if (!pokerProfile) {
        showOnly("pokerLoginRequired");
        return;
    }

    const roomId = new URLSearchParams(window.location.search).get("room");

    if (roomId) {
        try {
            await enterPokerRoom(roomId);
            return;
        } catch (error) {
            console.error(error);
            history.replaceState({}, "", "poker.html");
        }
    }

    showOnly("pokerLobby");
    await loadPokerRooms();
}

function bindPokerButtons() {
    $("refreshRoomsButton")?.addEventListener("click", loadPokerRooms);
    $("createRoomButton")?.addEventListener("click", createPokerRoom);
    $("fillBotsButton")?.addEventListener("click", fillPokerBots);
    $("leaveTableButton")?.addEventListener("click", leavePokerRoom);
    $("startHandButton")?.addEventListener("click", startPokerHand);
    $("waitingStartButton")?.addEventListener("click", startPokerHand);
    $("waitingFillBotsButton")?.addEventListener("click", fillPokerBots);
    $("waitingPlayBotsButton")?.addEventListener("click", playPokerWithBots);
    $("waitingLeaveButton")?.addEventListener("click", leavePokerRoom);
    $("copyInviteButton")?.addEventListener("click", copyPokerInvite);
    $("foldButton")?.addEventListener("click", () => pokerAction("fold"));
    $("checkButton")?.addEventListener("click", () => pokerAction("check"));
    $("callButton")?.addEventListener("click", () => pokerAction("call"));
    $("allInButton")?.addEventListener("click", pokerAllIn);
    $("raiseButton")?.addEventListener("click", () => {
        const amount = Number($("raiseAmount")?.value || 0);
        pokerAction("raise", amount);
    });

    // Safe delegated room actions. Avoid inline onclick strings so a table
    // name can never become executable JavaScript.
    $("pokerRoomList")?.addEventListener("click", event => {
        const button = event.target.closest("[data-poker-room-action]");
        if (!button) return;

        const roomId = button.dataset.roomId;
        const action = button.dataset.pokerRoomAction;

        if (!roomId) return;

        if (action === "enter") {
            enterPokerRoom(roomId);
        } else if (action === "join") {
            joinPokerRoom(roomId);
        } else if (action === "delete") {
            deletePokerRoom(roomId, button.dataset.roomName || "this table");
        }
    });
}

async function loadPokerProfile() {
    const { data, error } = await gaPokerSupabase
        .from("profiles")
        .select("*")
        .eq("id", pokerUser.id)
        .maybeSingle();

    if (error) {
        console.error("Profile load failed:", error);
        return;
    }

    pokerProfile = data;

    const name = pokerProfile?.username || pokerUser.email || "Gilded Player";
    const balance = Number(pokerProfile?.balance || 0);

    if ($("pokerPlayerName")) $("pokerPlayerName").textContent = name;
    if ($("pokerPlayerBalance")) $("pokerPlayerBalance").textContent = `${fmt(balance)} AC`;
    if ($("pokerHeaderBalance")) $("pokerHeaderBalance").textContent = `${fmt(balance)} AC`;
}

async function loadPokerRooms() {
    const list = $("pokerRoomList");
    if (!list) return;

    list.innerHTML = `<div class="poker-message">Loading tables...</div>`;

    const { data: rooms, error } = await gaPokerSupabase
        .from("poker_rooms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        list.innerHTML = `<div class="poker-message error">${esc(error.message)}</div>`;
        return;
    }

    const roomIds = (rooms || []).map(r => r.id);
    let seatRows = [];

    if (roomIds.length) {
        const { data } = await gaPokerSupabase
            .from("poker_seats")
            .select("room_id,seat_no,user_id,is_bot")
            .in("room_id", roomIds);
        seatRows = data || [];
    }

    if (!rooms?.length) {
        list.innerHTML = `<div class="poker-message">No tables yet. Create the first one.</div>`;
        return;
    }

    list.innerHTML = rooms.map(room => {
        const occupied = seatRows.filter(s => s.room_id === room.id).length;
        const mine = seatRows.some(s => s.room_id === room.id && s.user_id === pokerUser.id);

        const roomName = room.name || "Gilded Table";

        return `
            <div class="poker-room">
                <div>
                    <div class="poker-room-name">${esc(roomName)}</div>
                    <div class="poker-room-meta">
                        ${occupied}/${room.max_seats} seats •
                        Buy-in ${fmt(room.buy_in)} AC •
                        Blinds ${fmt(room.small_blind)}/${fmt(room.big_blind)} •
                        <strong class="${Number(room.hand_no || 0) === 0 ? "poker-room-open" : "poker-room-live"}">
                            ${Number(room.hand_no || 0) === 0 ? "LOBBY OPEN" : "IN GAME"}
                        </strong>
                    </div>
                </div>
                <div class="poker-room-actions">
                    <button
                        class="poker-primary-button"
                        type="button"
                        data-poker-room-action="${mine ? "enter" : "join"}"
                        data-room-id="${esc(room.id)}"
                        ${!mine && Number(room.hand_no || 0) > 0 ? "disabled" : ""}
                    >
                        ${mine ? "RETURN" : (Number(room.hand_no || 0) > 0 ? "IN GAME" : "JOIN LOBBY")}
                    </button>
                    ${room.created_by === pokerUser.id ? `
                        <button
                            class="poker-danger-button poker-delete-table-button"
                            type="button"
                            data-poker-room-action="delete"
                            data-room-id="${esc(room.id)}"
                            data-room-name="${esc(roomName)}"
                        >
                            DELETE
                        </button>
                    ` : ""}
                </div>
            </div>
        `;
    }).join("");
}

async function createPokerRoom() {
    if (actionBusy) return;
    actionBusy = true;

    try {
        const name = ($("createRoomName")?.value || "Gilded Table").trim().slice(0, 30);
        const buyIn = Number($("createRoomBuyIn")?.value || 5000);
        const [smallBlind, bigBlind] = String($("createRoomBlinds")?.value || "50,100")
            .split(",")
            .map(Number);
        const maxSeats = Number($("createRoomSeats")?.value || 6);

        setLobbyMessage("Creating table...");

        const { data: roomId, error } = await gaPokerSupabase.rpc("poker_create_room", {
            p_name: name,
            p_buy_in: buyIn,
            p_small_blind: smallBlind,
            p_big_blind: bigBlind,
            p_max_seats: maxSeats
        });

        if (error) throw error;

        const id = Array.isArray(roomId) ? roomId[0] : roomId;
        await joinPokerRoom(id, false);
        await enterPokerRoom(id);
    } catch (error) {
        console.error(error);
        setLobbyMessage(error.message || "Could not create table.", "error");
    } finally {
        actionBusy = false;

        // enterPokerRoom() refreshes the waiting lobby while createPokerRoom()
        // is still marked busy. Re-render once busy clears so host controls
        // immediately become clickable.
        if (pokerRoom?.id && isPregameLobby()) {
            renderPokerWaitingRoom();
        }
    }
}

async function joinPokerRoom(roomId, enter = true) {
    if (actionBusy && enter) return;

    try {
        if (enter) actionBusy = true;
        setLobbyMessage("Joining table...");

        const { error } = await gaPokerSupabase.rpc("poker_lobby_join_room", {
            p_room: roomId
        });

        if (error) throw error;

        if (enter) await enterPokerRoom(roomId);
    } catch (error) {
        console.error(error);
        setLobbyMessage(error.message || "Could not join table.", "error");
    } finally {
        if (enter) {
            actionBusy = false;

            // Same protection for normal lobby joins/returns.
            if (pokerRoom?.id && isPregameLobby()) {
                renderPokerWaitingRoom();
            }
        }
    }
}

async function enterPokerRoom(roomId) {
    leavingTable = false;
    clearPokerTimers();

    const { data: room, error: roomError } = await gaPokerSupabase
        .from("poker_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

    if (roomError || !room) {
        throw roomError || new Error("Poker room was not found.");
    }

    pokerRoom = room;

    history.replaceState({}, "", `poker.html?room=${encodeURIComponent(roomId)}`);

    await subscribePokerRoom(roomId);
    await refreshPokerTable(roomId);
}

async function refreshPokerTable(roomId = pokerRoom?.id) {
    if (!roomId || leavingTable) return;

    const generation = ++pokerRefreshGeneration;

    const [roomResult, seatsResult, cardsResult, myCardsResult] = await Promise.all([
        gaPokerSupabase.from("poker_rooms").select("*").eq("id", roomId).maybeSingle(),
        gaPokerSupabase.from("poker_seats").select("*").eq("room_id", roomId).order("seat_no"),
        gaPokerSupabase.from("poker_hole_cards").select("*").eq("room_id", roomId),
        gaPokerSupabase.rpc("poker_get_my_hole_cards", { p_room: roomId })
    ]);

    // If another refresh finished after this one started, do not let an
    // older network response overwrite newer table state.
    if (generation !== pokerRefreshGeneration || leavingTable) {
        return;
    }

    if (roomResult.error) {
        console.error(roomResult.error);
        return;
    }

    if (!roomResult.data) {
        await returnToLobby();
        return;
    }

    if (seatsResult.error) {
        console.error("Could not load poker seats:", seatsResult.error);
        setMessage(seatsResult.error.message || "Could not load table seats.", "error");
        return;
    }

    if (cardsResult.error) {
        // Unrevealed cards may be hidden by RLS. A real error is logged, but
        // private cards are still loaded through poker_get_my_hole_cards().
        console.debug("Public hole-card query:", cardsResult.error.message);
    }

    pokerRoom = roomResult.data;
    pokerSeats = seatsResult.data || [];
    pokerHoleCards = cardsResult.data || [];

    if (!myCardsResult.error && Array.isArray(myCardsResult.data) && myCardsResult.data.length) {
        const mine = myCardsResult.data[0];

        pokerHoleCards = pokerHoleCards.filter(row =>
            Number(row.seat_no) !== Number(mine.seat_no)
        );

        pokerHoleCards.push({
            room_id: roomId,
            seat_no: mine.seat_no,
            user_id: pokerUser.id,
            cards: mine.cards,
            revealed: false
        });
    } else if (myCardsResult.error) {
        console.error("Could not load your private hole cards:", myCardsResult.error);
    }

    const mySeat = pokerSeats.find(s => s.user_id === pokerUser.id);
    if (!mySeat && !leavingTable) {
        setMessage("You are no longer seated at this table.", "error");
    }

    syncPokerRoomView();
    renderPokerWaitingRoom();
    renderPokerTable();
    maybeShowWinnerNotification();
    handlePokerAutomation();
}

async function subscribePokerRoom(roomId) {
    if (pokerChannel) {
        await gaPokerSupabase.removeChannel(pokerChannel);
        pokerChannel = null;
    }

    pokerChannel = gaPokerSupabase
        .channel(`poker-room-${roomId}-${pokerUser.id}`)
        .on("postgres_changes",
            { event: "*", schema: "public", table: "poker_rooms", filter: `id=eq.${roomId}` },
            queuePokerRefresh
        )
        .on("postgres_changes",
            { event: "*", schema: "public", table: "poker_seats", filter: `room_id=eq.${roomId}` },
            queuePokerRefresh
        )
        .on("postgres_changes",
            { event: "*", schema: "public", table: "poker_hole_cards", filter: `room_id=eq.${roomId}` },
            queuePokerRefresh
        )
        .subscribe();
}

function queuePokerRefresh() {
    clearTimeout(pokerRefreshTimer);
    pokerRefreshTimer = setTimeout(() => {
        if (pokerRoom?.id && !leavingTable) refreshPokerTable(pokerRoom.id);
    }, 120);
}


function isPregameLobby() {
    return Boolean(
        pokerRoom &&
        Number(pokerRoom.hand_no || 0) === 0 &&
        String(pokerRoom.street || "waiting").toLowerCase() === "waiting"
    );
}

function isPokerHost() {
    return Boolean(pokerRoom && pokerUser && pokerRoom.created_by === pokerUser.id);
}

function syncPokerRoomView() {
    if (!pokerRoom) return;
    showOnly(isPregameLobby() ? "pokerWaitingRoom" : "pokerTableView");
}

function renderPokerWaitingRoom() {
    if (!pokerRoom || !isPregameLobby()) return;

    const hostSeat = pokerSeats.find(seat => seat.user_id === pokerRoom.created_by);
    const hostName = hostSeat?.display_name || "Table Host";
    const occupied = pokerSeats.length;
    const maxSeats = Number(pokerRoom.max_seats || 6);
    const playable = pokerSeats.filter(seat => Number(seat.stack || 0) > 0).length;
    const host = isPokerHost();

    if ($("waitingRoomName")) $("waitingRoomName").textContent = pokerRoom.name || "Gilded Table";
    if ($("waitingHostName")) $("waitingHostName").textContent = hostName;
    if ($("waitingPlayerCount")) $("waitingPlayerCount").textContent = `${occupied} / ${maxSeats}`;
    if ($("waitingBuyIn")) $("waitingBuyIn").textContent = `${fmt(pokerRoom.buy_in)} AC`;
    if ($("waitingBlinds")) $("waitingBlinds").textContent = `${fmt(pokerRoom.small_blind)} / ${fmt(pokerRoom.big_blind)}`;

    const badge = $("waitingReadyBadge");
    if (badge) {
        badge.textContent = playable >= 2 ? "READY" : "WAITING";
        badge.classList.toggle("ready", playable >= 2);
    }

    const list = $("waitingSeatList");
    if (list) {
        const rows = [];
        for (let seatNo = 1; seatNo <= maxSeats; seatNo++) {
            const seat = pokerSeats.find(row => Number(row.seat_no) === seatNo);
            if (!seat) {
                rows.push(`
                    <div class="poker-waiting-seat open">
                        <span class="poker-waiting-seat-number">${seatNo}</span>
                        <div><strong>OPEN SEAT</strong><small>Waiting for player</small></div>
                        <span class="poker-waiting-seat-state">OPEN</span>
                    </div>
                `);
                continue;
            }

            const mine = seat.user_id === pokerUser.id;
            const seatHost = seat.user_id === pokerRoom.created_by;
            rows.push(`
                <div class="poker-waiting-seat ${mine ? "mine" : ""}">
                    <span class="poker-waiting-seat-number">${seatNo}</span>
                    <div>
                        <strong>${esc(seat.display_name || (seat.is_bot ? "House Bot" : "Player"))}</strong>
                        <small>${seatHost ? "HOST" : (mine ? "YOU" : (seat.is_bot ? `BOT • ${esc(seat.bot_style || "balanced")}` : "PLAYER"))}</small>
                    </div>
                    <span class="poker-waiting-seat-state seated">${fmt(seat.stack)} AC</span>
                </div>
            `);
        }
        list.innerHTML = rows.join("");
    }

    if ($("waitingHostTitle")) {
        $("waitingHostTitle").textContent = host ? "YOUR TABLE" : "WAITING FOR HOST";
    }
    if ($("waitingHostHelp")) {
        $("waitingHostHelp").textContent = host
            ? "Invite real players, fill open seats with bots, or start immediately with a full bot table."
            : `${hostName} will start the first hand when the table is ready.`;
    }

    if ($("waitingFillBotsButton")) {
        $("waitingFillBotsButton").classList.toggle("hidden", !host);
        $("waitingFillBotsButton").disabled = !host || occupied >= maxSeats || actionBusy;
    }

    if ($("waitingPlayBotsButton")) {
        $("waitingPlayBotsButton").classList.toggle("hidden", !host);
        $("waitingPlayBotsButton").disabled = !host || actionBusy;
        $("waitingPlayBotsButton").textContent =
            occupied >= maxSeats
                ? "START WITH CURRENT TABLE"
                : "PLAY NOW WITH BOTS";
    }

    if ($("waitingStartButton")) {
        $("waitingStartButton").classList.toggle("hidden", !host);
        $("waitingStartButton").disabled = !host || playable < 2 || actionBusy;
    }

    const message = $("waitingRoomMessage");
    if (message && !message.classList.contains("error") && !message.classList.contains("success")) {
        message.textContent = host
            ? (playable >= 2 ? "Table ready. Start the hand, or fill any remaining seats with bots." : "Invite another player or click PLAY NOW WITH BOTS to start immediately.")
            : "Waiting for the host to start the first hand...";
    }
}

async function copyPokerInvite() {
    if (!pokerRoom?.id) return;
    const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(pokerRoom.id)}`;
    try {
        await navigator.clipboard.writeText(url);
        const el = $("waitingRoomMessage");
        if (el) {
            el.textContent = "Invite link copied. Send it to another signed-in player.";
            el.className = "poker-message success";
        }
    } catch {
        window.prompt("Copy this poker lobby link:", url);
    }
}

function renderPokerTable() {
    if (!pokerRoom) return;

    const mySeatForBalance = pokerSeats.find(s => s.user_id === pokerUser.id);
    const walletBalance = Number(pokerProfile?.balance || 0);
    const tableStack = Number(mySeatForBalance?.stack || 0);
    const tableWealth = walletBalance + tableStack;

    if ($("pokerHeaderBalance")) {
        $("pokerHeaderBalance").textContent = `${fmt(tableWealth)} AC`;
    }

    if ($("pokerPlayerBalance")) {
        $("pokerPlayerBalance").textContent = `${fmt(tableWealth)} AC`;
    }

    $("pokerRoomName").textContent = pokerRoom.name || "Gilded Table";
    $("pokerStreet").textContent = String(pokerRoom.street || "waiting").toUpperCase();
    $("pokerPot").textContent = `${fmt(pokerRoom.pot)} AC`;
    $("pokerCurrentBet").textContent = `${fmt(pokerRoom.current_bet)} AC`;

    const turnSeat = pokerSeats.find(s => Number(s.seat_no) === Number(pokerRoom.current_turn));
    $("pokerTurnName").textContent = turnSeat?.display_name || "—";

    renderCommunityCards();
    renderSeats();
    renderMyCards();
    renderPokerActionControls();
    renderPokerStatus();
}

function renderCommunityCards() {
    const cards = Array.isArray(pokerRoom.community_cards)
        ? pokerRoom.community_cards.filter(Boolean)
        : [];

    const target = $("communityCards");
    if (!target) return;

    /*
      Professional Hold'em board:
      - Pre-flop: no community cards
      - Flop: 3 visible cards
      - Turn: 4 visible cards
      - River: 5 visible cards

      Unrevealed board cards are NOT shown face-down.
    */
    target.innerHTML = cards
        .slice(0, 5)
        .map(card => pokerCardHTML(card))
        .join("");
}

function renderSeats() {
    for (let i = 1; i <= 6; i++) {
        const el = $(`seat${i}`);
        if (!el) continue;

        const seat = pokerSeats.find(s => Number(s.seat_no) === i);
        if (!seat) {
            el.className = `poker-seat seat-${i}`;
            el.innerHTML = `<div class="seat-name">OPEN SEAT</div><div class="seat-tag">AVAILABLE</div>`;
            continue;
        }

        const current = Number(pokerRoom.current_turn) === i;
        const mine = seat.user_id === pokerUser.id;
        el.className =
            `poker-seat seat-${i}` +
            (current ? " current-turn" : "") +
            (mine ? " me" : "") +
            (seat.folded ? " folded" : "");

        el.innerHTML = `
            ${Number(pokerRoom.dealer_seat) === i ? `<div class="dealer-chip">D</div>` : ""}
            <div class="seat-name">${esc(seat.display_name || (seat.is_bot ? "House Bot" : "Player"))}</div>
            <div class="seat-stack">${fmt(seat.stack)} AC</div>
            <div class="seat-bet">Bet: ${fmt(seat.bet_round)} AC</div>
            <div class="seat-tag">${seat.is_bot ? `BOT • ${esc(seat.bot_style || "balanced")}` : (mine ? "YOU" : "PLAYER")}</div>
        `;
    }
}

function renderMyCards() {
    const target = $("myHoleCards");
    if (!target) return;

    const mine = pokerSeats.find(s => s.user_id === pokerUser.id);
    if (!mine) {
        target.innerHTML = `<div class="poker-message">You are not seated.</div>`;
        return;
    }

    const row = pokerHoleCards.find(c =>
        Number(c.seat_no) === Number(mine.seat_no) ||
        c.user_id === pokerUser.id
    );

    const cards = row?.cards || row?.hole_cards || [];

    if (!Array.isArray(cards) || cards.length < 2) {
        target.innerHTML = `<div class="poker-card back">A</div><div class="poker-card back">A</div>`;
        return;
    }

    target.innerHTML = cards.map(pokerCardHTML).join("");
}

function pokerCardHTML(card) {
    /*
      Poker cards are stored internally as strings such as:
      "AS", "KH", "TD", "10C".

      The evaluator correctly uses "T" for Ten, but the table should
      always DISPLAY that rank as "10".
    */

    let rawRank = "";
    let suitCode = "";

    if (
        card &&
        typeof card === "object" &&
        !Array.isArray(card)
    ) {
        rawRank = String(card.rank || "").trim().toUpperCase();
        suitCode = String(card.suit || "").trim().slice(-1).toUpperCase();
    } else {
        const text = String(card || "").trim().toUpperCase();
        rawRank = text.slice(0, -1) || "?";
        suitCode = text.slice(-1).toUpperCase();
    }

    const displayRank =
        rawRank === "T"
            ? "10"
            : rawRank;

    const suits = {
        H: ["♥", true],
        D: ["♦", true],
        C: ["♣", false],
        S: ["♠", false]
    };

    const [suit, red] =
        suits[suitCode] ||
        [suitCode, false];

    return `
        <div class="poker-card ${red ? "red" : ""}">
            <span>${esc(displayRank)}</span>
            <span>${esc(suit)}</span>
        </div>
    `;
}

function renderPokerActionControls() {
    const mySeat = pokerSeats.find(s => s.user_id === pokerUser.id);
    const myTurn =
        mySeat &&
        !mySeat.folded &&
        !pokerRoom.hand_complete &&
        Number(pokerRoom.current_turn) === Number(mySeat.seat_no);

    const callAmount = mySeat
        ? Math.max(0, Number(pokerRoom.current_bet || 0) - Number(mySeat.bet_round || 0))
        : 0;

    const stack = Number(mySeat?.stack || 0);
    const canCheck = myTurn && callAmount === 0;
    const canCall = myTurn && callAmount > 0 && stack > 0;
    const canRaise = myTurn && stack > callAmount;
    const canAllIn = myTurn && stack > 0;

    $("foldButton").disabled = !myTurn || actionBusy;
    $("checkButton").disabled = !canCheck || actionBusy;
    $("callButton").disabled = !canCall || actionBusy;
    $("raiseButton").disabled = !canRaise || actionBusy;
    if ($("allInButton")) $("allInButton").disabled = !canAllIn || actionBusy;

    if (callAmount > 0) {
        $("callButton").textContent =
            stack < callAmount
                ? `ALL-IN CALL ${fmt(stack)}`
                : `CALL ${fmt(callAmount)}`;
    } else {
        $("callButton").textContent = "CALL";
    }

    if ($("allInButton")) {
        $("allInButton").textContent = stack > 0 ? `ALL IN ${fmt(stack)}` : "ALL IN";
    }

    const minRaiseTo =
        Math.max(
            Number(pokerRoom.current_bet || 0) + Number(pokerRoom.minimum_raise || pokerRoom.big_blind || 1),
            Number(pokerRoom.big_blind || 1)
        );

    if ($("raiseAmount")) {
        $("raiseAmount").min = String(minRaiseTo);
        if (Number($("raiseAmount").value) < minRaiseTo) {
            $("raiseAmount").value = String(minRaiseTo);
        }
    }

    const enoughPlayers = pokerSeats.filter(s => Number(s.stack || 0) > 0).length >= 2;
    if ($("startHandButton")) {
        $("startHandButton").disabled =
            !enoughPlayers ||
            isPregameLobby() ||
            (!pokerRoom.hand_complete && String(pokerRoom.street || "").toLowerCase() !== "waiting") ||
            actionBusy;
    }
}

function renderPokerStatus() {
    const alive = pokerSeats.filter(s => !s.folded && Number(s.stack || 0) >= 0);

    if (pokerRoom.hand_complete) {
        setMessage(pokerRoom.winner_text || "Hand complete.", "success");
        return;
    }

    if (String(pokerRoom.street || "").toLowerCase() === "waiting") {
        setMessage(pokerSeats.length < 2 ? "Waiting for at least two players." : "Table ready. Start the hand.");
        return;
    }

    if (alive.length <= 1 && pokerSeats.length >= 2) {
        setMessage("Resolving hand...");
        return;
    }

    const turnSeat = pokerSeats.find(s => Number(s.seat_no) === Number(pokerRoom.current_turn));
    if (turnSeat) {
        setMessage(`${turnSeat.display_name}'s turn • ${String(pokerRoom.street || "").toUpperCase()}`);
    } else {
        setMessage("Advancing the hand...");
    }
}

async function pokerAction(action, amount = null) {
    if (actionBusy || !pokerRoom?.id) return;

    actionBusy = true;
    renderPokerActionControls();

    try {
        const args = {
            p_room: pokerRoom.id,
            p_action: action,
            p_amount: amount === null ? null : Number(amount)
        };

        const { error } = await gaPokerSupabase.rpc("poker_player_action", args);
        if (error) throw error;

        await refreshPokerTable(pokerRoom.id);
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Poker action failed.", "error");
    } finally {
        actionBusy = false;
        renderPokerActionControls();
    }
}


async function pokerAllIn() {
    if (actionBusy || !pokerRoom?.id) return;

    const mySeat = pokerSeats.find(s => s.user_id === pokerUser.id);

    if (!mySeat || Number(mySeat.stack || 0) <= 0) {
        setMessage("You do not have chips available to move all-in.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Move ALL IN for ${fmt(mySeat.stack)} AC?`
    );

    if (!confirmed) return;

    actionBusy = true;
    renderPokerActionControls();

    try {
        const { error } = await gaPokerSupabase.rpc(
            "poker_player_all_in",
            { p_room: pokerRoom.id }
        );

        if (error) throw error;

        await refreshPokerTable(pokerRoom.id);
    } catch (error) {
        console.error("ALL IN failed:", error);
        setMessage(
            error.message || "ALL IN failed.",
            "error"
        );
    } finally {
        actionBusy = false;
        renderPokerActionControls();
    }
}


async function startPokerHand() {
    if (actionBusy || !pokerRoom?.id) return;
    actionBusy = true;

    try {
        const { error } = await gaPokerSupabase.rpc("poker_request_start_hand", {
            p_room: pokerRoom.id
        });
        if (error) throw error;
        await refreshPokerTable(pokerRoom.id);
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Could not start the hand.", "error");
    } finally {
        actionBusy = false;
    }
}

async function fillPokerBots() {
    if (actionBusy || !pokerRoom?.id) return;
    actionBusy = true;

    try {
        const { error } = await gaPokerSupabase.rpc("poker_lobby_fill_bots", {
            p_room: pokerRoom.id
        });

        if (error) throw error;

        await refreshPokerTable(pokerRoom.id);

        const message = $("waitingRoomMessage");
        if (message) {
            message.textContent = "Open seats filled with bots. The table is ready to start.";
            message.className = "poker-message success";
        }
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Could not add bots.", "error");
    } finally {
        actionBusy = false;
        renderPokerWaitingRoom();
    }
}

async function playPokerWithBots() {
    if (actionBusy || !pokerRoom?.id || !isPokerHost()) return;

    actionBusy = true;

    const message = $("waitingRoomMessage");

    try {
        if (message) {
            message.textContent = "Preparing bot players...";
            message.className = "poker-message";
        }

        // Fill every currently open seat with a bot.
        const fillResult = await gaPokerSupabase.rpc("poker_lobby_fill_bots", {
            p_room: pokerRoom.id
        });

        if (fillResult.error) throw fillResult.error;

        await refreshPokerTable(pokerRoom.id);

        if (message) {
            message.textContent = "Bots seated. Starting the first hand...";
            message.className = "poker-message success";
        }

        // Host starts the first hand immediately.
        const startResult = await gaPokerSupabase.rpc("poker_request_start_hand", {
            p_room: pokerRoom.id
        });

        if (startResult.error) throw startResult.error;

        await refreshPokerTable(pokerRoom.id);
    } catch (error) {
        console.error(error);

        if (message) {
            message.textContent = error.message || "Could not start a bot table.";
            message.className = "poker-message error";
        } else {
            setMessage(error.message || "Could not start a bot table.", "error");
        }
    } finally {
        actionBusy = false;
        renderPokerWaitingRoom();
    }
}

function handlePokerAutomation() {
    clearTimeout(pokerBotTimer);
    clearTimeout(pokerNextHandTimer);

    if (!pokerRoom || leavingTable) return;
    if (isPregameLobby()) return;

    if (pokerRoom.hand_complete) {
        const playable = pokerSeats.filter(s => Number(s.stack || 0) > 0).length;
        if (playable >= 2) {
            pokerNextHandTimer = setTimeout(async () => {
                if (!pokerRoom?.id || leavingTable) return;
                try {
                    await gaPokerSupabase.rpc("poker_request_start_hand", { p_room: pokerRoom.id });
                    await refreshPokerTable(pokerRoom.id);
                } catch (error) {
                    console.debug("Automatic next hand did not start:", error.message);
                }
            }, 3500);
        }
        return;
    }

    const turnSeat = pokerSeats.find(s =>
        Number(s.seat_no) === Number(pokerRoom.current_turn)
    );

    if (turnSeat?.is_bot) {
        pokerBotTimer = setTimeout(async () => {
            if (!pokerRoom?.id || leavingTable) return;
            try {
                const { error } = await gaPokerSupabase.rpc("poker_bot_act", {
                    p_room: pokerRoom.id
                });

                if (error) {
                    console.error("Bot action failed:", error);
                    setMessage(`Bot action error: ${error.message}`, "error");
                    return;
                }

                await refreshPokerTable(pokerRoom.id);
            } catch (error) {
                console.error(error);
            }
        }, 700 + Math.floor(Math.random() * 650));
    }
}

async function leavePokerRoom() {
    if (!pokerRoom?.id || leavingTable) return;

    const confirmed = window.confirm(
        isPregameLobby()
            ? "Leave this poker lobby? Your full remaining table stack will be returned to your Ace Credits."
            : "Leave this poker table? Your remaining table stack will be returned to your Ace Credits."
    );

    if (!confirmed) return;

    leavingTable = true;
    actionBusy = true;
    clearPokerTimers();
    $("leaveTableButton").disabled = true;
    $("leaveTableButton").textContent = "LEAVING...";

    const roomId = pokerRoom.id;

    try {
        // Backend patch returns the remaining player's table stack to profiles.balance,
        // removes their hole cards, and deletes their seat.
        const { error } = await gaPokerSupabase.rpc("poker_leave_room", {
            p_room: roomId
        });

        if (error) throw error;

        if (pokerChannel) {
            await gaPokerSupabase.removeChannel(pokerChannel);
            pokerChannel = null;
        }

        pokerRoom = null;
        pokerSeats = [];
        pokerHoleCards = [];

        history.replaceState({}, "", "poker.html");
        await loadPokerProfile();
        showOnly("pokerLobby");
        await loadPokerRooms();
        setLobbyMessage("You left the table and your remaining stack was returned.", "success");
    } catch (error) {
        console.error(error);
        leavingTable = false;
        setMessage(error.message || "Could not leave the table.", "error");
        $("leaveTableButton").disabled = false;
        $("leaveTableButton").textContent = "LEAVE TABLE";
    } finally {
        actionBusy = false;
    }
}


function maybeShowWinnerNotification() {
    if (!pokerRoom?.hand_complete || !pokerRoom?.winner_text) {
        return;
    }

    const key = `${pokerRoom.id}:${pokerRoom.hand_no}:${pokerRoom.winner_text}`;

    if (lastWinnerNotificationKey === key) {
        return;
    }

    const storageKey = `gildedAcePokerWinner:${key}`;

    if (pokerSessionGet(storageKey) === "shown") {
        lastWinnerNotificationKey = key;
        return;
    }

    lastWinnerNotificationKey = key;
    pokerSessionSet(storageKey, "shown");
    showPokerWinnerNotification(pokerRoom.winner_text);
}


function showPokerWinnerNotification(message) {
    document.querySelector(".poker-winner-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.className = "poker-winner-overlay";

    overlay.innerHTML = `
        <div class="poker-winner-modal" role="dialog" aria-modal="true" aria-label="Poker winner">
            <button class="poker-winner-close" type="button" aria-label="Close">×</button>
            <div class="poker-winner-kicker">HAND COMPLETE</div>
            <div class="poker-winner-icon">♠</div>
            <h2>WINNER</h2>
            <p>${esc(message)}</p>
            <button class="poker-primary-button poker-winner-ok" type="button">CONTINUE</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    overlay.querySelector(".poker-winner-close")?.addEventListener("click", close);
    overlay.querySelector(".poker-winner-ok")?.addEventListener("click", close);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
    });

    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.classList.add("poker-winner-fade");
            setTimeout(close, 300);
        }
    }, 6500);
}


async function deletePokerRoom(roomId, roomName = "this table") {
    if (actionBusy) return;

    const confirmed = window.confirm(
        `Delete ${roomName}? This permanently removes the table. Human players will be refunded safely before deletion.`
    );

    if (!confirmed) return;

    actionBusy = true;
    setLobbyMessage(`Deleting ${roomName}...`);

    try {
        const { error } = await gaPokerSupabase.rpc("poker_delete_room", {
            p_room: roomId
        });

        if (error) throw error;

        setLobbyMessage(`${roomName} was deleted.`, "success");
        await loadPokerProfile();
        await loadPokerRooms();
    } catch (error) {
        console.error(error);
        setLobbyMessage(
            error.message || "Could not delete this table.",
            "error"
        );
    } finally {
        actionBusy = false;
    }
}


async function returnToLobby() {
    clearPokerTimers();

    if (pokerChannel) {
        await gaPokerSupabase.removeChannel(pokerChannel);
        pokerChannel = null;
    }

    pokerRoom = null;
    pokerSeats = [];
    pokerHoleCards = [];
    history.replaceState({}, "", "poker.html");
    await loadPokerProfile();
    showOnly("pokerLobby");
    await loadPokerRooms();
}

function clearPokerTimers() {
    clearTimeout(pokerRefreshTimer);
    clearTimeout(pokerBotTimer);
    clearTimeout(pokerNextHandTimer);
    pokerRefreshTimer = null;
    pokerBotTimer = null;
    pokerNextHandTimer = null;
}

window.joinPokerRoom = joinPokerRoom;
window.enterPokerRoom = enterPokerRoom;

window.deletePokerRoom = deletePokerRoom;
