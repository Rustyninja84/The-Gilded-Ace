
/* ==========================================================
   THE GILDED ACE — EQUIPMENT RUNTIME v1
   Loads cloud equipment on pages that do not use script.js.
   ========================================================== */
(() => {
    "use strict";

    const SUPABASE_URL = "https://wrmiylynviujwdoecvcn.supabase.co";
    const SUPABASE_KEY = "sb_publishable_x-OPQXsHErbHt8I9eAN1Tw_vRhqUsWX";

    const CLASS_MAP = {
        profile_frame: {
            "Gold Profile Frame": "ga-equip-gold-profile-frame"
        },
        nameplate: {
            "Diamond Nameplate": "ga-equip-diamond-nameplate"
        },
        title: {
            "High Roller Title": "ga-equip-high-roller-title"
        },
        card_back: {
            "Gilded Card Back": "ga-equip-gilded-card-back"
        },
        blackjack_table: {
            "Gold Blackjack Table": "ga-equip-gold-blackjack-table"
        },
        roulette_theme: {
            "Midnight Roulette": "ga-equip-midnight-roulette"
        }
    };

    function localEquipped(){
        try{
            const saved = JSON.parse(localStorage.getItem("gildedAceProfile") || "{}");
            return saved && typeof saved.equipped === "object" && !Array.isArray(saved.equipped)
                ? saved.equipped
                : {};
        }catch{
            return {};
        }
    }

    function applyEquipped(equipped){
        Object.values(CLASS_MAP).forEach(items => {
            Object.values(items).forEach(className => {
                document.body.classList.remove(className);
            });
        });

        Object.entries(equipped || {}).forEach(([slot,item]) => {
            const className = CLASS_MAP[slot]?.[item];
            if(className) document.body.classList.add(className);
        });
    }

    async function getClient(){
        if(window.gaPokerSupabase) return window.gaPokerSupabase;
        if(window.supabase?.createClient){
            return window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
                auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
            });
        }
        return null;
    }

    async function init(){
        const fallback = localEquipped();
        applyEquipped(fallback);

        try{
            const client = await getClient();
            if(!client) return;

            const {data:{session}} = await client.auth.getSession();
            if(!session?.user?.id) return;

            const {data,error} = await client
                .from("profiles")
                .select("equipped")
                .eq("id",session.user.id)
                .maybeSingle();

            if(error) throw error;

            const equipped =
                data?.equipped && typeof data.equipped === "object" && !Array.isArray(data.equipped)
                    ? data.equipped
                    : {};

            applyEquipped(equipped);

            try{
                const profile = JSON.parse(localStorage.getItem("gildedAceProfile") || "{}");
                profile.equipped = equipped;
                localStorage.setItem("gildedAceProfile",JSON.stringify(profile));
            }catch{}
        }catch(error){
            console.debug("Equipment cloud load skipped:", error?.message || error);
        }
    }

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",init,{once:true});
    }else{
        init();
    }
})();
