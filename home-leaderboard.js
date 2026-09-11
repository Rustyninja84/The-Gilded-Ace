/* ==========================================================
   THE GILDED ACE — HOME LEADERBOARD ISOLATED LOADER v40

   This file intentionally handles ONLY the Home Top Players table.
   It is isolated from the main profile/account script so unrelated
   account code cannot stop leaderboard rendering.
   ========================================================== */

(() => {
    "use strict";

    const SUPABASE_URL =
        "https://wrmiylynviujwdoecvcn.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";


    function findTopPlayersTable() {

        const headings =
            [...document.querySelectorAll("h1,h2,h3")];

        const heading =
            headings.find(
                node =>
                    String(node.textContent || "")
                        .trim()
                        .toUpperCase()
                    ===
                    "TOP PLAYERS"
            );

        if (!heading) return null;

        const section =
            heading.closest("section");

        return section?.querySelector("table") || null;
    }


    function tierForBalance(balance) {

        const value =
            Math.max(0, Number(balance) || 0);

        if (value >= 10000000) return "CASINO OWNER";
        if (value >= 5000000) return "DIAMOND CLUB";
        if (value >= 1000000) return "HIGH ROLLER";
        if (value >= 100000) return "GOLD MEMBER";

        return "STANDARD";
    }


    function money(value) {

        return `${Math.max(
            0,
            Number(value) || 0
        ).toLocaleString("en-US")} AC`;
    }


    function showState(
        tbody,
        text,
        color = "#8f897e"
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    style="
                        text-align:center;
                        padding:30px 20px;
                        color:${color};
                        letter-spacing:.5px;
                    "
                >
                    ${text}
                </td>
            </tr>
        `;
    }


    async function requestWithSdk() {

        if (!window.supabase?.createClient) {

            throw new Error(
                "Supabase JavaScript library is unavailable."
            );
        }

        const client =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

        const { data, error } =
            await client.rpc(
                "get_public_leaderboard"
            );

        if (error) throw error;

        return data;
    }


    async function requestWithRestFallback() {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_public_leaderboard`,
                {
                    method: "POST",
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: "{}",
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                `REST ${response.status}: ${text}`
            );
        }

        return await response.json();
    }


    async function getLeaderboardRows() {

        let sdkError = null;

        try {

            return await requestWithSdk();

        } catch (error) {

            sdkError = error;

            console.warn(
                "Leaderboard SDK request failed; trying REST fallback:",
                error
            );
        }

        try {

            return await requestWithRestFallback();

        } catch (restError) {

            const combined =
                new Error(
                    `SDK: ${sdkError?.message || sdkError}; REST: ${restError?.message || restError}`
                );

            combined.sdkError = sdkError;
            combined.restError = restError;

            throw combined;
        }
    }


    async function loadHomeLeaderboard() {

        const table =
            findTopPlayersTable();

        if (!table) return;

        const tbody =
            table.querySelector("tbody");

        if (!tbody) return;

        showState(
            tbody,
            "LOADING LIVE CLUB RANKINGS..."
        );

        try {

            const data =
                await getLeaderboardRows();

            const players =
                (Array.isArray(data) ? data : [])
                    .map(
                        row => ({
                            username:
                                String(
                                    row?.username ||
                                    "Gilded Player"
                                ),
                            balance:
                                Math.max(
                                    0,
                                    Number(row?.balance) || 0
                                ),
                            wins:
                                Math.max(
                                    0,
                                    Number(row?.wins) || 0
                                )
                        })
                    )
                    .sort(
                        (a, b) =>
                            b.balance - a.balance ||
                            b.wins - a.wins ||
                            a.username.localeCompare(
                                b.username
                            )
                    )
                    .slice(0, 3);

            if (!players.length) {

                showState(
                    tbody,
                    "NO PLAYER PROFILES FOUND"
                );

                return;
            }

            tbody.innerHTML = "";

            players.forEach(
                (player, index) => {

                    const tr =
                        document.createElement("tr");

                    const rank =
                        document.createElement("td");

                    const name =
                        document.createElement("td");

                    const status =
                        document.createElement("td");

                    const balance =
                        document.createElement("td");

                    rank.textContent =
                        String(index + 1)
                            .padStart(2, "0");

                    name.textContent =
                        player.username;

                    status.textContent =
                        tierForBalance(
                            player.balance
                        );

                    balance.textContent =
                        money(
                            player.balance
                        );

                    tr.append(
                        rank,
                        name,
                        status,
                        balance
                    );

                    tbody.appendChild(tr);
                }
            );

        } catch (error) {

            console.error(
                "HOME LEADERBOARD v40 FAILED:",
                error
            );

            showState(
                tbody,
                "LIVE RANKINGS COULD NOT LOAD",
                "#df6e6e"
            );
        }
    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            loadHomeLeaderboard,
            { once: true }
        );

    } else {

        loadHomeLeaderboard();
    }

})();
