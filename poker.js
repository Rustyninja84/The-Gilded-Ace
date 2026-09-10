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
    ["pokerLoading", "pokerLoginRequired", "pokerLobby", "pokerTableView"]
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
    $("foldButton")?.addEventListener("click", () => pokerAction("fold"));
    $("checkButton")?.addEventListener("click", () => pokerAction("check"));
    $("callButton")?.addEventListener("click", () => pokerAction("call"));
    $("raiseButton")?.addEventListener("click", () => {
        const amount = Number($("raiseAmount")?.value || 0);
        pokerAction("raise", amount);
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

        return `
            <div class="poker-room">
                <div>
                    <div class="poker-room-name">${esc(room.name || "Gilded Table")}</div>
                    <div class="poker-room-meta">
                        ${occupied}/${room.max_seats} seats •
                        Buy-in ${fmt(room.buy_in)} AC •
                        Blinds ${fmt(room.small_blind)}/${fmt(room.big_blind)}
                    </div>
                </div>
                <button class="poker-primary-button" type="button"
                    onclick="${mine ? `enterPokerRoom('${room.id}')` : `joinPokerRoom('${room.id}')`}">
                    ${mine ? "RETURN" : "JOIN"}
                </button>
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

        if ($("createRoomFillBots")?.checked) {
            await gaPokerSupabase.rpc("poker_fill_bots", { p_room: id });
        }

        await enterPokerRoom(id);
    } catch (error) {
        console.error(error);
        setLobbyMessage(error.message || "Could not create table.", "error");
    } finally {
        actionBusy = false;
    }
}

async function joinPokerRoom(roomId, enter = true) {
    if (actionBusy && enter) return;

    try {
        if (enter) actionBusy = true;
        setLobbyMessage("Joining table...");

        const { error } = await gaPokerSupabase.rpc("poker_join_room", {
            p_room: roomId
        });

        if (error) throw error;

        if (enter) await enterPokerRoom(roomId);
    } catch (error) {
        console.error(error);
        setLobbyMessage(error.message || "Could not join table.", "error");
    } finally {
        if (enter) actionBusy = false;
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
    showOnly("pokerTableView");

    await subscribePokerRoom(roomId);
    await refreshPokerTable(roomId);
}

async function refreshPokerTable(roomId = pokerRoom?.id) {
    if (!roomId || leavingTable) return;

    const [roomResult, seatsResult, cardsResult, myCardsResult] = await Promise.all([
        gaPokerSupabase.from("poker_rooms").select("*").eq("id", roomId).maybeSingle(),
        gaPokerSupabase.from("poker_seats").select("*").eq("room_id", roomId).order("seat_no"),
        gaPokerSupabase.from("poker_hole_cards").select("*").eq("room_id", roomId),
        gaPokerSupabase.rpc("poker_get_my_hole_cards", { p_room: roomId })
    ]);

    if (roomResult.error) {
        console.error(roomResult.error);
        return;
    }

    if (!roomResult.data) {
        await returnToLobby();
        return;
    }

    pokerRoom = roomResult.data;
    pokerSeats = seatsResult.data || [];
    pokerHoleCards = cardsResult.data || [];

    // Secure fallback for the logged-in player's own cards.
    // This fixes browsers receiving no visible hole-card row because of RLS.
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

    renderPokerTable();
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

function renderPokerTable() {
    if (!pokerRoom) return;

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
    const cards = Array.isArray(pokerRoom.community_cards) ? pokerRoom.community_cards : [];
    const target = $("communityCards");
    if (!target) return;

    const display = [...cards];
    while (display.length < 5) display.push(null);

    target.innerHTML = display.map(card => card ? pokerCardHTML(card) : `<div class="poker-card back">A</div>`).join("");
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
        target.innerHTML =
            `<div class="poker-message error">Your cards could not be loaded.</div>`;
        return;
    }

    target.innerHTML = cards.map(pokerCardHTML).join("");
}

function pokerCardHTML(card) {
    const text = String(card || "");
    const rank = text.slice(0, -1) || "?";
    const suitCode = text.slice(-1).toUpperCase();

    const suits = {
        H: ["♥", true],
        D: ["♦", true],
        C: ["♣", false],
        S: ["♠", false]
    };

    const [suit, red] = suits[suitCode] || [suitCode, false];

    return `
        <div class="poker-card ${red ? "red" : ""}">
            <span>${esc(rank)}</span>
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

    const canCheck = myTurn && callAmount === 0;
    const canCall = myTurn && callAmount > 0 && Number(mySeat.stack || 0) >= callAmount;
    const canRaise = myTurn && Number(mySeat.stack || 0) > callAmount;

    $("foldButton").disabled = !myTurn || actionBusy;
    $("checkButton").disabled = !canCheck || actionBusy;
    $("callButton").disabled = !canCall || actionBusy;
    $("raiseButton").disabled = !canRaise || actionBusy;

    $("callButton").textContent = callAmount > 0 ? `CALL ${fmt(callAmount)}` : "CALL";

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
    $("startHandButton").disabled =
        !enoughPlayers ||
        (!pokerRoom.hand_complete && String(pokerRoom.street || "").toLowerCase() !== "waiting") ||
        actionBusy;
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

async function startPokerHand() {
    if (actionBusy || !pokerRoom?.id) return;
    actionBusy = true;

    try {
        const { error } = await gaPokerSupabase.rpc("poker_start_hand", {
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
        const { error } = await gaPokerSupabase.rpc("poker_fill_bots", {
            p_room: pokerRoom.id
        });
        if (error) throw error;
        await refreshPokerTable(pokerRoom.id);
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Could not add bots.", "error");
    } finally {
        actionBusy = false;
    }
}

function handlePokerAutomation() {
    clearTimeout(pokerBotTimer);
    clearTimeout(pokerNextHandTimer);

    if (!pokerRoom || leavingTable) return;

    if (pokerRoom.hand_complete) {
        const playable = pokerSeats.filter(s => Number(s.stack || 0) > 0).length;
        if (playable >= 2) {
            pokerNextHandTimer = setTimeout(async () => {
                if (!pokerRoom?.id || leavingTable) return;
                try {
                    await gaPokerSupabase.rpc("poker_start_hand", { p_room: pokerRoom.id });
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
        "Leave this poker table? Your remaining table stack will be returned to your Ace Credits."
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
