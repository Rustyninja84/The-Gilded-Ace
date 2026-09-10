"use strict";


// ============================================================
// THE GILDED ACE
// MULTIPLAYER TEXAS HOLD'EM
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const GA_SUPABASE_URL =
    "https://wrmiylynviujwdoecvcn.supabase.co";


const GA_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";


const gaPokerSupabase =
    window.supabase.createClient(

        GA_SUPABASE_URL,

        GA_SUPABASE_PUBLISHABLE_KEY

    );


// ============================================================
// APPLICATION STATE
// ============================================================

let pokerUser = null;

let pokerProfile = null;

let pokerRoom = null;

let pokerSeats = [];

let pokerHoleCards = [];

let pokerMySeat = null;

let pokerRealtimeChannel = null;

let pokerBotTimer = null;

let pokerRefreshTimer = null;

let pokerAutomaticStartTimer = null;

let pokerAutoBotsEnabled = true;

let pokerBusy = false;


// ============================================================
// DOM
// ============================================================

const pokerLoginRequired =
    document.getElementById(
        "pokerLoginRequired"
    );


const pokerApp =
    document.getElementById(
        "pokerApp"
    );


const pokerLobby =
    document.getElementById(
        "pokerLobby"
    );


const pokerTableScreen =
    document.getElementById(
        "pokerTableScreen"
    );


const pokerRoomList =
    document.getElementById(
        "pokerRoomList"
    );


const pokerLobbyMessage =
    document.getElementById(
        "pokerLobbyMessage"
    );


const pokerTableMessage =
    document.getElementById(
        "pokerTableMessage"
    );


// ============================================================
// FORMAT MONEY
// ============================================================

function pokerMoney(value){

    const amount =
        Number(value || 0);


    return (
        amount.toLocaleString()
        +
        " AC"
    );

}


// ============================================================
// ERROR MESSAGE
// ============================================================

function pokerErrorMessage(error){

    if(!error){

        return "Something went wrong.";

    }


    return (
        error.message
        ||
        error.details
        ||
        String(error)
    );

}


// ============================================================
// LOBBY MESSAGE
// ============================================================

function setPokerLobbyMessage(
    text,
    type = ""
){

    pokerLobbyMessage.textContent =
        text || "";


    pokerLobbyMessage.className =
        "poker-message";


    if(type){

        pokerLobbyMessage.classList.add(
            type
        );

    }

}


// ============================================================
// TABLE MESSAGE
// ============================================================

function setPokerTableMessage(
    text,
    type = ""
){

    pokerTableMessage.textContent =
        text || "";


    pokerTableMessage.className =
        "poker-table-message";


    if(type){

        pokerTableMessage.classList.add(
            type
        );

    }

}


// ============================================================
// INITIALIZE
// ============================================================

async function initializePoker(){

    try{


        const {
            data,
            error
        } =
            await gaPokerSupabase.auth
                .getSession();


        if(error){

            throw error;

        }


        const session =
            data.session;


        if(!session){

            showPokerLoginRequired();

            return;

        }


        pokerUser =
            session.user;


        pokerApp.hidden =
            false;


        pokerLoginRequired.hidden =
            true;


        await loadPokerProfile();


        await loadPokerRooms();


        checkPokerRoomFromURL();


    }
    catch(error){

        console.error(
            error
        );


        showPokerLoginRequired();

    }

}


// ============================================================
// LOGIN SCREEN
// ============================================================

function showPokerLoginRequired(){

    pokerApp.hidden =
        true;


    pokerLoginRequired.hidden =
        false;

}


// ============================================================
// PROFILE
// ============================================================

async function loadPokerProfile(){

    const {
        data,
        error
    } =
        await gaPokerSupabase

            .from("profiles")

            .select(
                "id, username, balance"
            )

            .eq(
                "id",
                pokerUser.id
            )

            .single();


    if(error){

        throw error;

    }


    pokerProfile =
        data;


    updatePokerProfileDisplay();

}


// ============================================================
// PROFILE DISPLAY
// ============================================================

function updatePokerProfileDisplay(){

    if(!pokerProfile){

        return;

    }


    const name =
        pokerProfile.username
        ||
        "Gilded Player";


    const balance =
        pokerMoney(
            pokerProfile.balance
        );


    const nameElement =
        document.getElementById(
            "pokerMemberName"
        );


    const balanceElement =
        document.getElementById(
            "pokerMemberBalance"
        );


    const navBalance =
        document.getElementById(
            "pokerNavBalance"
        );


    if(nameElement){

        nameElement.textContent =
            name;

    }


    if(balanceElement){

        balanceElement.textContent =
            balance;

    }


    if(navBalance){

        navBalance.textContent =
            balance;

    }

}


// ============================================================
// LOAD ROOMS
// ============================================================

async function loadPokerRooms(){

    const {
        data,
        error
    } =
        await gaPokerSupabase

            .from(
                "poker_rooms"
            )

            .select(
                `
                id,
                name,
                max_seats,
                buy_in,
                small_blind,
                big_blind,
                status,
                hand_complete,
                created_at,
                poker_seats(
                    seat_no,
                    is_bot,
                    user_id
                )
                `
            )

            .order(
                "created_at",
                {
                    ascending:false
                }
            );


    if(error){

        console.error(
            error
        );

        return;

    }


    renderPokerRooms(
        data || []
    );

}


// ============================================================
// RENDER ROOMS
// ============================================================

function renderPokerRooms(rooms){

    pokerRoomList.innerHTML =
        "";


    if(!rooms.length){

        pokerRoomList.innerHTML = `

            <div class="poker-empty-state">

                <span>♠</span>

                <h3>
                    No Open Tables
                </h3>

                <p>
                    Create the first table and
                    house players can fill the
                    empty seats.
                </p>

            </div>

        `;

        return;

    }


    rooms.forEach(room => {

        const seats =
            room.poker_seats
            ||
            [];


        const humanCount =
            seats.filter(
                seat =>
                    !seat.is_bot
            ).length;


        const botCount =
            seats.filter(
                seat =>
                    seat.is_bot
            ).length;


        const total =
            seats.length;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "poker-room-card";


        card.innerHTML = `

            <div class="poker-room-title">

                <strong>
                    ${escapePokerHTML(room.name)}
                </strong>

                <span>
                    ${humanCount} HUMAN
                    •
                    ${botCount} HOUSE PLAYERS
                </span>

            </div>


            <div class="poker-room-stat">

                <span>
                    SEATS
                </span>

                <strong>
                    ${total} / ${room.max_seats}
                </strong>

            </div>


            <div class="poker-room-stat">

                <span>
                    BUY-IN
                </span>

                <strong>
                    ${pokerMoney(room.buy_in)}
                </strong>

            </div>


            <div class="poker-room-stat">

                <span>
                    BLINDS
                </span>

                <strong>
                    ${Number(room.small_blind).toLocaleString()}
                    /
                    ${Number(room.big_blind).toLocaleString()}
                </strong>

            </div>


            <div class="poker-room-stat">

                <span>
                    STATUS
                </span>

                <strong>
                    ${String(room.status).toUpperCase()}
                </strong>

            </div>


            <button
                type="button"
                class="btn secondary poker-room-join"
                data-room-id="${room.id}"
            >
                JOIN
            </button>

        `;


        card
            .querySelector(
                ".poker-room-join"
            )
            .addEventListener(
                "click",
                () => joinPokerRoom(
                    room.id
                )
            );


        pokerRoomList.appendChild(
            card
        );

    });

}


// ============================================================
// CREATE ROOM
// ============================================================

async function createPokerRoom(){

    if(pokerBusy){

        return;

    }


    pokerBusy =
        true;


    setPokerLobbyMessage(
        "Opening your table..."
    );


    try{


        const name =
            document
                .getElementById(
                    "pokerRoomName"
                )
                .value
                .trim();


        const buyIn =
            Number(
                document
                    .getElementById(
                        "pokerBuyIn"
                    )
                    .value
            );


        const smallBlind =
            Number(
                document
                    .getElementById(
                        "pokerSmallBlind"
                    )
                    .value
            );


        const bigBlind =
            Number(
                document
                    .getElementById(
                        "pokerBigBlind"
                    )
                    .value
            );


        const maxSeats =
            Number(
                document
                    .getElementById(
                        "pokerMaxSeats"
                    )
                    .value
            );


        pokerAutoBotsEnabled =
            document
                .getElementById(
                    "pokerAutoBots"
                )
                .checked;


        if(bigBlind <= smallBlind){

            throw new Error(
                "Big blind must be higher than the small blind."
            );

        }


        const {
            data,
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_create_room",
                    {

                        p_name:
                            name
                            ||
                            "Gilded Table",

                        p_buy_in:
                            buyIn,

                        p_small_blind:
                            smallBlind,

                        p_big_blind:
                            bigBlind,

                        p_max_seats:
                            maxSeats

                    }
                );


        if(error){

            throw error;

        }


        setPokerLobbyMessage(
            "Table created.",
            "success"
        );


        await loadPokerProfile();


        await enterPokerRoom(
            data
        );


        if(pokerAutoBotsEnabled){

            window.setTimeout(

                () =>
                    fillPokerBots(),

                2500

            );

        }


    }
    catch(error){

        console.error(
            error
        );


        setPokerLobbyMessage(
            pokerErrorMessage(
                error
            ),
            "error"
        );

    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// JOIN ROOM
// ============================================================

async function joinPokerRoom(roomId){

    if(pokerBusy){

        return;

    }


    pokerBusy =
        true;


    setPokerLobbyMessage(
        "Joining table..."
    );


    try{


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_join_room",
                    {
                        p_room:
                            roomId
                    }
                );


        if(error){

            throw error;

        }


        await loadPokerProfile();


        await enterPokerRoom(
            roomId
        );


        pokerAutoBotsEnabled =
            true;


        window.setTimeout(

            () =>
                fillPokerBots(),

            4000

        );


    }
    catch(error){

        console.error(
            error
        );


        setPokerLobbyMessage(
            pokerErrorMessage(
                error
            ),
            "error"
        );

    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// FILL BOTS
// ============================================================

async function fillPokerBots(){

    if(
        !pokerRoom
        ||
        !pokerAutoBotsEnabled
    ){

        return;

    }


    try{


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_fill_bots",
                    {
                        p_room:
                            pokerRoom.id
                    }
                );


        if(error){

            console.warn(
                "Bot fill:",
                error.message
            );

        }


    }
    catch(error){

        console.warn(
            error
        );

    }

}


// ============================================================
// ENTER ROOM
// ============================================================

async function enterPokerRoom(roomId){

    pokerLobby.hidden =
        true;


    pokerTableScreen.hidden =
        false;


    history.replaceState(
        {},
        "",
        `poker.html?room=${encodeURIComponent(roomId)}`
    );


    await subscribePokerRoom(
        roomId
    );


    await refreshPokerTable(
        roomId
    );

}


// ============================================================
// ROOM FROM URL
// ============================================================

async function checkPokerRoomFromURL(){

    const params =
        new URLSearchParams(
            window.location.search
        );


    const roomId =
        params.get(
            "room"
        );


    if(!roomId){

        return;

    }


    const {
        data
    } =
        await gaPokerSupabase

            .from(
                "poker_seats"
            )

            .select(
                "seat_no"
            )

            .eq(
                "room_id",
                roomId
            )

            .eq(
                "user_id",
                pokerUser.id
            )

            .maybeSingle();


    if(data){

        await enterPokerRoom(
            roomId
        );

    }

}


// ============================================================
// REFRESH TABLE
// ============================================================

async function refreshPokerTable(roomId){

    if(!roomId){

        return;

    }


    try{


        const roomResult =
            await gaPokerSupabase

                .from(
                    "poker_rooms"
                )

                .select("*")

                .eq(
                    "id",
                    roomId
                )

                .single();


        if(roomResult.error){

            throw roomResult.error;

        }


        pokerRoom =
            roomResult.data;


        const seatResult =
            await gaPokerSupabase

                .from(
                    "poker_seats"
                )

                .select("*")

                .eq(
                    "room_id",
                    roomId
                )

                .order(
                    "seat_no"
                );


        if(seatResult.error){

            throw seatResult.error;

        }


        pokerSeats =
            seatResult.data
            ||
            [];


        const cardsResult =
            await gaPokerSupabase

                .from(
                    "poker_hole_cards"
                )

                .select("*")

                .eq(
                    "room_id",
                    roomId
                )

                .eq(
                    "hand_no",
                    pokerRoom.hand_no
                );


        if(cardsResult.error){

            console.warn(
                cardsResult.error
            );

        }


        pokerHoleCards =
            cardsResult.data
            ||
            [];


        pokerMySeat =
            pokerSeats.find(
                seat =>
                    seat.user_id
                    ===
                    pokerUser.id
            )
            ||
            null;


        renderPokerTable();


        handlePokerAutomation();


    }
    catch(error){

        console.error(
            error
        );


        setPokerTableMessage(
            pokerErrorMessage(
                error
            )
        );

    }

}


// ============================================================
// REALTIME
// ============================================================

async function subscribePokerRoom(roomId){

    if(pokerRealtimeChannel){

        await gaPokerSupabase
            .removeChannel(
                pokerRealtimeChannel
            );

    }


    pokerRealtimeChannel =
        gaPokerSupabase

            .channel(
                `poker-room-${roomId}`
            )

            .on(

                "postgres_changes",

                {
                    event:"*",
                    schema:"public",
                    table:"poker_rooms",
                    filter:`id=eq.${roomId}`
                },

                () => {

                    queuePokerRefresh(
                        roomId
                    );

                }

            )

            .on(

                "postgres_changes",

                {
                    event:"*",
                    schema:"public",
                    table:"poker_seats",
                    filter:`room_id=eq.${roomId}`
                },

                () => {

                    queuePokerRefresh(
                        roomId
                    );

                }

            )

            .on(

                "postgres_changes",

                {
                    event:"*",
                    schema:"public",
                    table:"poker_hole_cards",
                    filter:`room_id=eq.${roomId}`
                },

                () => {

                    queuePokerRefresh(
                        roomId
                    );

                }

            )

            .subscribe();

}


// ============================================================
// DEBOUNCED REFRESH
// ============================================================

function queuePokerRefresh(roomId){

    clearTimeout(
        pokerRefreshTimer
    );


    pokerRefreshTimer =
        window.setTimeout(

            () =>
                refreshPokerTable(
                    roomId
                ),

            120

        );

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderPokerTable(){

    if(!pokerRoom){

        return;

    }


    document
        .getElementById(
            "pokerTableName"
        )
        .textContent =
            pokerRoom.name;


    document
        .getElementById(
            "pokerBlindDisplay"
        )
        .textContent =
            `${Number(pokerRoom.small_blind).toLocaleString()} / ${Number(pokerRoom.big_blind).toLocaleString()}`;


    document
        .getElementById(
            "pokerBuyInDisplay"
        )
        .textContent =
            pokerMoney(
                pokerRoom.buy_in
            );


    document
        .getElementById(
            "pokerPot"
        )
        .textContent =
            pokerMoney(
                pokerRoom.pot
            );


    document
        .getElementById(
            "pokerStreet"
        )
        .textContent =
            String(
                pokerRoom.street
                ||
                "waiting"
            )
            .toUpperCase();


    renderCommunityCards();

    renderSeats();

    renderMyCards();

    renderPokerActionControls();

    renderPokerStatus();

}


// ============================================================
// COMMUNITY CARDS
// ============================================================

function renderCommunityCards(){

    const holder =
        document.getElementById(
            "pokerCommunityCards"
        );


    holder.innerHTML =
        "";


    const cards =
        pokerRoom.community_cards
        ||
        [];


    for(let i = 0; i < 5; i++){


        if(cards[i]){

            holder.appendChild(
                createPokerCard(
                    cards[i]
                )
            );

        }
        else{

            const back =
                document.createElement(
                    "div"
                );


            back.className =
                "poker-card poker-card-back";


            holder.appendChild(
                back
            );

        }

    }

}


// ============================================================
// SEATS
// ============================================================

function renderSeats(){

    for(
        let seatNumber = 1;
        seatNumber <= 6;
        seatNumber++
    ){

        const holder =
            document.getElementById(
                `pokerSeat${seatNumber}`
            );


        if(!holder){

            continue;

        }


        holder.innerHTML =
            "";


        if(
            seatNumber
            >
            pokerRoom.max_seats
        ){

            holder.style.display =
                "none";

            continue;

        }


        holder.style.display =
            "";


        const seat =
            pokerSeats.find(
                player =>
                    player.seat_no
                    ===
                    seatNumber
            );


        if(!seat){

            holder.innerHTML = `

                <div class="poker-player-box">

                    <div class="poker-player-name">
                        EMPTY SEAT
                    </div>

                    <div class="poker-player-stack">
                        OPEN
                    </div>

                </div>

            `;

            continue;

        }


        const currentTurn =
            pokerRoom.current_turn
            ===
            seat.seat_no;


        const dealer =
            pokerRoom.dealer_seat
            ===
            seat.seat_no;


        let classes =
            "poker-player-box";


        if(currentTurn){

            classes +=
                " current-turn";

        }


        if(seat.folded){

            classes +=
                " folded";

        }


        const holeCards =
            pokerHoleCards.find(
                row =>
                    row.seat_no
                    ===
                    seat.seat_no
            );


        let cardsHTML =
            "";


        if(
            pokerRoom.hand_no > 0
            &&
            !pokerRoom.hand_complete
        ){

            if(
                holeCards
                &&
                (
                    seat.user_id
                    ===
                    pokerUser.id
                    ||
                    holeCards.revealed
                )
            ){

                cardsHTML =
                    holeCards.cards
                        .map(
                            card =>
                                pokerCardHTML(
                                    card
                                )
                        )
                        .join("");

            }
            else{

                cardsHTML = `

                    <div class="poker-card poker-card-back"></div>

                    <div class="poker-card poker-card-back"></div>

                `;

            }

        }
        else if(
            holeCards
            &&
            holeCards.revealed
        ){

            cardsHTML =
                holeCards.cards
                    .map(
                        card =>
                            pokerCardHTML(
                                card
                            )
                    )
                    .join("");

        }


        holder.innerHTML = `

            <div class="${classes}">

                ${
                    dealer
                    ?
                    '<div class="poker-dealer-chip">D</div>'
                    :
                    ''
                }

                <div class="poker-player-name">

                    ${escapePokerHTML(seat.display_name)}

                    ${
                        seat.is_bot
                        ?
                        '<span class="poker-bot-badge">HOUSE</span>'
                        :
                        ''
                    }

                </div>

                <div class="poker-player-stack">

                    ${pokerMoney(seat.stack)}

                </div>

                <div class="poker-player-bet">

                    ${
                        seat.folded
                        ?
                        "FOLDED"
                        :
                        (
                            seat.bet_round > 0
                            ?
                            `BET ${pokerMoney(seat.bet_round)}`
                            :
                            "&nbsp;"
                        )
                    }

                </div>

                <div class="poker-seat-cards">

                    ${cardsHTML}

                </div>

            </div>

        `;

    }

}


// ============================================================
// MY CARDS
// ============================================================

function renderMyCards(){

    const holder =
        document.getElementById(
            "pokerMyCards"
        );


    holder.innerHTML =
        "";


    if(!pokerMySeat){

        return;

    }


    const cardRecord =
        pokerHoleCards.find(
            row =>
                row.seat_no
                ===
                pokerMySeat.seat_no
        );


    if(
        !cardRecord
        ||
        !cardRecord.cards
        ||
        !cardRecord.cards.length
    ){

        for(let i = 0; i < 2; i++){

            const back =
                document.createElement(
                    "div"
                );


            back.className =
                "poker-card poker-card-back";


            holder.appendChild(
                back
            );

        }

        return;

    }


    cardRecord.cards.forEach(
        card => {

            holder.appendChild(
                createPokerCard(
                    card
                )
            );

        }
    );

}


// ============================================================
// CREATE CARD ELEMENT
// ============================================================

function createPokerCard(card){

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.innerHTML =
        pokerCardHTML(
            card
        );


    return wrapper.firstElementChild;

}


// ============================================================
// CARD HTML
// ============================================================

function pokerCardHTML(card){

    if(!card){

        return `
            <div class="poker-card poker-card-back"></div>
        `;

    }


    const rank =
        card.substring(
            0,
            1
        );


    const suitCode =
        card.substring(
            1,
            2
        );


    const suitMap = {

        S:"♠",

        H:"♥",

        D:"♦",

        C:"♣"

    };


    const rankMap = {

        T:"10",

        J:"J",

        Q:"Q",

        K:"K",

        A:"A"

    };


    const suit =
        suitMap[suitCode]
        ||
        suitCode;


    const displayRank =
        rankMap[rank]
        ||
        rank;


    const red =
        suitCode === "H"
        ||
        suitCode === "D";


    return `

        <div class="poker-card ${red ? "red" : ""}">

            <span class="poker-card-rank">
                ${displayRank}
            </span>

            <span class="poker-card-suit">
                ${suit}
            </span>

        </div>

    `;

}


// ============================================================
// ACTION CONTROLS
// ============================================================

function renderPokerActionControls(){

    const foldButton =
        document.getElementById(
            "pokerFoldButton"
        );


    const checkButton =
        document.getElementById(
            "pokerCheckButton"
        );


    const callButton =
        document.getElementById(
            "pokerCallButton"
        );


    const raiseButton =
        document.getElementById(
            "pokerRaiseButton"
        );


    const raiseInput =
        document.getElementById(
            "pokerRaiseAmount"
        );


    const callDisplay =
        document.getElementById(
            "pokerCallAmount"
        );


    const myTurn = Boolean(

        pokerRoom

        &&
        pokerMySeat

        &&
        !pokerRoom.hand_complete

        &&
        pokerRoom.current_turn
        ===
        pokerMySeat.seat_no

        &&
        !pokerMySeat.folded

    );


    const callAmount =
        pokerMySeat

        ?
        Math.max(

            0,

            Number(
                pokerRoom.current_bet
                ||
                0
            )
            -
            Number(
                pokerMySeat.bet_round
                ||
                0
            )

        )

        :
        0;


    callDisplay.textContent =
        pokerMoney(
            callAmount
        );


    foldButton.disabled =
        !myTurn;


    checkButton.disabled =
        !myTurn
        ||
        callAmount > 0;


    callButton.disabled =
        !myTurn
        ||
        callAmount <= 0
        ||
        callAmount >
            Number(
                pokerMySeat?.stack
                ||
                0
            );


    raiseButton.disabled =
        !myTurn;


    raiseInput.disabled =
        !myTurn;


    const minimumRaiseTo =
        Number(
            pokerRoom.current_bet
            ||
            0
        )
        +
        Number(
            pokerRoom.minimum_raise
            ||
            pokerRoom.big_blind
            ||
            100
        );


    raiseInput.min =
        minimumRaiseTo;


    if(
        document.activeElement
        !==
        raiseInput
    ){

        raiseInput.value =
            minimumRaiseTo;

    }


    callButton.textContent =

        callAmount > 0

        ?
        `CALL ${Number(callAmount).toLocaleString()}`

        :
        "CALL";

}


// ============================================================
// STATUS
// ============================================================

function renderPokerStatus(){

    if(!pokerRoom){

        return;

    }


    if(pokerRoom.hand_complete){

        if(pokerRoom.winner_text){

            setPokerTableMessage(
                pokerRoom.winner_text,
                "win"
            );

        }
        else{

            setPokerTableMessage(
                "Waiting for the next hand."
            );

        }


        return;

    }


    const turnSeat =
        pokerSeats.find(
            seat =>
                seat.seat_no
                ===
                pokerRoom.current_turn
        );


    if(!turnSeat){

        setPokerTableMessage(
            "Preparing the next action..."
        );

        return;

    }


    if(
        pokerMySeat
        &&
        turnSeat.seat_no
        ===
        pokerMySeat.seat_no
    ){

        setPokerTableMessage(
            "YOUR TURN — choose Fold, Check, Call or Raise."
        );

    }
    else if(turnSeat.is_bot){

        setPokerTableMessage(
            `${turnSeat.display_name} is thinking...`
        );

    }
    else{

        setPokerTableMessage(
            `Waiting for ${turnSeat.display_name}...`
        );

    }

}


// ============================================================
// AUTOMATION
// ============================================================

function handlePokerAutomation(){

    clearTimeout(
        pokerBotTimer
    );


    clearTimeout(
        pokerAutomaticStartTimer
    );


    if(!pokerRoom){

        return;

    }


    const playableSeats =
        pokerSeats.filter(
            seat =>
                Number(
                    seat.stack
                ) > 0
        );


    // Start hand automatically

    if(
        pokerRoom.hand_complete
        &&
        playableSeats.length >= 2
    ){

        pokerAutomaticStartTimer =
            window.setTimeout(

                () =>
                    startPokerHand(),

                3500

            );


        return;

    }


    if(pokerRoom.hand_complete){

        return;

    }


    const current =
        pokerSeats.find(
            seat =>
                seat.seat_no
                ===
                pokerRoom.current_turn
        );


    if(
        current
        &&
        current.is_bot
    ){

        pokerBotTimer =
            window.setTimeout(

                () =>
                    runPokerBot(),

                1200
                +
                Math.floor(
                    Math.random()
                    *
                    1300
                )

            );

    }

}


// ============================================================
// START HAND
// ============================================================

async function startPokerHand(){

    if(
        !pokerRoom
        ||
        pokerBusy
    ){

        return;

    }


    pokerBusy =
        true;


    try{


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_start_hand",
                    {
                        p_room:
                            pokerRoom.id
                    }
                );


        if(
            error
            &&
            !String(
                error.message
            )
            .includes(
                "already"
            )
        ){

            console.warn(
                error.message
            );

        }


    }
    catch(error){

        console.warn(
            error
        );

    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// BOT MOVE
// ============================================================

async function runPokerBot(){

    if(
        !pokerRoom
        ||
        pokerBusy
    ){

        return;

    }


    const current =
        pokerSeats.find(
            seat =>
                seat.seat_no
                ===
                pokerRoom.current_turn
        );


    if(
        !current
        ||
        !current.is_bot
        ||
        pokerRoom.hand_complete
    ){

        return;

    }


    pokerBusy =
        true;


    try{


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_bot_act",
                    {
                        p_room:
                            pokerRoom.id
                    }
                );


        if(error){

            console.warn(
                "Bot action:",
                error.message
            );

        }


    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// HUMAN ACTION
// ============================================================

async function pokerAction(
    action,
    amount = null
){

    if(
        !pokerRoom
        ||
        pokerBusy
    ){

        return;

    }


    pokerBusy =
        true;


    disablePokerActions();


    try{


        const args = {

            p_room:
                pokerRoom.id,

            p_action:
                action,

            p_amount:
                amount

        };


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_player_action",
                    args
                );


        if(error){

            throw error;

        }


        await refreshPokerTable(
            pokerRoom.id
        );


    }
    catch(error){

        console.error(
            error
        );


        setPokerTableMessage(
            pokerErrorMessage(
                error
            )
        );

    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// DISABLE ACTIONS
// ============================================================

function disablePokerActions(){

    [
        "pokerFoldButton",
        "pokerCheckButton",
        "pokerCallButton",
        "pokerRaiseButton"

    ].forEach(id => {

        const button =
            document.getElementById(
                id
            );


        if(button){

            button.disabled =
                true;

        }

    });

}


// ============================================================
// LEAVE ROOM
// ============================================================

async function leavePokerRoom(){

    if(
        !pokerRoom
        ||
        pokerBusy
    ){

        return;

    }


    pokerBusy =
        true;


    try{


        const {
            error
        } =
            await gaPokerSupabase
                .rpc(
                    "poker_leave_room",
                    {
                        p_room:
                            pokerRoom.id
                    }
                );


        if(error){

            throw error;

        }


        if(pokerRealtimeChannel){

            await gaPokerSupabase
                .removeChannel(
                    pokerRealtimeChannel
                );

            pokerRealtimeChannel =
                null;

        }


        pokerRoom =
            null;


        pokerSeats =
            [];


        pokerHoleCards =
            [];


        pokerMySeat =
            null;


        pokerTableScreen.hidden =
            true;


        pokerLobby.hidden =
            false;


        history.replaceState(
            {},
            "",
            "poker.html"
        );


        await loadPokerProfile();

        await loadPokerRooms();


    }
    catch(error){

        console.error(
            error
        );


        setPokerTableMessage(
            pokerErrorMessage(
                error
            )
        );

    }
    finally{

        pokerBusy =
            false;

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapePokerHTML(value){

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// EVENT LISTENERS
// ============================================================

document
    .getElementById(
        "pokerCreateRoomButton"
    )
    ?.addEventListener(
        "click",
        createPokerRoom
    );


document
    .getElementById(
        "pokerRefreshRooms"
    )
    ?.addEventListener(
        "click",
        loadPokerRooms
    );


document
    .getElementById(
        "pokerLeaveTable"
    )
    ?.addEventListener(
        "click",
        leavePokerRoom
    );


document
    .getElementById(
        "pokerFoldButton"
    )
    ?.addEventListener(
        "click",
        () =>
            pokerAction(
                "fold"
            )
    );


document
    .getElementById(
        "pokerCheckButton"
    )
    ?.addEventListener(
        "click",
        () =>
            pokerAction(
                "check"
            )
    );


document
    .getElementById(
        "pokerCallButton"
    )
    ?.addEventListener(
        "click",
        () =>
            pokerAction(
                "call"
            )
    );


document
    .getElementById(
        "pokerRaiseButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const value =
                Number(
                    document
                        .getElementById(
                            "pokerRaiseAmount"
                        )
                        .value
                );


            pokerAction(
                "raise",
                value
            );

        }
    );


// ============================================================
// AUTH CHANGES
// ============================================================

gaPokerSupabase.auth.onAuthStateChange(

    (
        event,
        session
    ) => {


        if(
            event === "SIGNED_OUT"
            ||
            !session
        ){

            showPokerLoginRequired();

        }

    }

);


// ============================================================
// START
// ============================================================

document.addEventListener(

    "DOMContentLoaded",

    initializePoker

);
