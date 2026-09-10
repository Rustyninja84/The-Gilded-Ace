(() => {
"use strict";

/*
  THE GILDED ACE — COMPLIANCE LAYER v2
  Designed to be additive and isolated:
  - does not replace existing HTML
  - does not touch game/account/Supabase code
  - does not rename existing IDs/classes
  - does not modify existing footers
  - uses unique GA compliance IDs/classes only
*/

const AGE_KEY = "gildedAceAge18Confirmed";
const EXIT_URL = "https://www.google.com/";
const LEGAL_PAGES = new Set([
  "terms.html",
  "privacy.html",
  "play-money-policy.html"
]);

function currentPage(){
  const raw = location.pathname.split("/").pop() || "index.html";
  return raw.toLowerCase();
}

function isLegalPage(){
  return LEGAL_PAGES.has(currentPage());
}

function safeSessionGet(key){
  try{
    return window.sessionStorage.getItem(key);
  }catch(error){
    return null;
  }
}

function safeSessionSet(key,value){
  try{
    window.sessionStorage.setItem(key,value);
  }catch(error){
    /* If storage is unavailable, allow this page session without throwing. */
  }
}

function addComplianceFooter(){
  if(document.getElementById("gaComplianceFooter")) return;

  const footer = document.createElement("section");
  footer.id = "gaComplianceFooter";
  footer.setAttribute("aria-label","Play-money and legal information");

  const notice = isLegalPage()
    ? ""
    : `
      <div class="ga-compliance-notice">
        <strong>18+ • PLAY-MONEY ENTERTAINMENT ONLY</strong><br>
        Ace Credits are fictional virtual credits with no monetary value.
        They cannot be purchased, sold, transferred, withdrawn, redeemed,
        exchanged, or converted into cash, cryptocurrency, prizes, gift cards,
        goods, services, or anything else of real-world value.
      </div>
    `;

  footer.innerHTML = `
    ${notice}
    <div class="ga-compliance-links">
      <a href="terms.html">TERMS OF USE</a>
      <a href="privacy.html">PRIVACY POLICY</a>
      <a href="play-money-policy.html">PLAY-MONEY POLICY</a>
      <span>18+ ONLY</span>
      <span>NO PURCHASE • NO CASH VALUE • NO PRIZES</span>
    </div>
  `;

  /*
    Append only after the existing document content.
    We intentionally DO NOT insert into or before the site's footer,
    grids, game layouts, forms, tables, modals or navigation.
  */
  document.body.appendChild(footer);
}

function unlockPage(){
  document.documentElement.classList.remove("ga-age-locked");
}

function buildAgeGate(){
  if(isLegalPage()) return;
  if(safeSessionGet(AGE_KEY)==="yes") return;
  if(document.getElementById("gaAgeGate")) return;

  const gate = document.createElement("div");
  gate.id = "gaAgeGate";
  gate.setAttribute("role","dialog");
  gate.setAttribute("aria-modal","true");
  gate.setAttribute("aria-labelledby","gaAgeTitle");

  gate.innerHTML = `
    <div class="ga-age-card">
      <div class="ga-age-mark" aria-hidden="true">A</div>
      <div class="ga-age-kicker">THE GILDED ACE</div>
      <h1 id="gaAgeTitle">18+ ACCESS ONLY</h1>

      <p>
        The Gilded Ace is an adult-oriented simulated casino and social gaming
        experience using fictional play-money credits.
      </p>

      <div class="ga-age-notice">
        <strong>NO REAL-MONEY GAMBLING.</strong><br>
        Ace Credits cannot be purchased, cashed out, sold, transferred or
        redeemed for money, cryptocurrency, prizes, gift cards, goods or services.
      </div>

      <p>
        By entering, you confirm that you are at least 18 years old and agree
        to the Terms of Use.
      </p>

      <div class="ga-age-actions">
        <button id="gaAgeEnter" type="button">
          I AM 18 OR OLDER — ENTER
        </button>
        <a id="gaAgeExit" href="${EXIT_URL}">
          I AM UNDER 18 — EXIT
        </a>
      </div>

      <div class="ga-age-links">
        <a href="terms.html">Terms</a> ·
        <a href="privacy.html">Privacy</a> ·
        <a href="play-money-policy.html">Play-Money Policy</a>
      </div>
    </div>
  `;

  document.documentElement.classList.add("ga-age-locked");
  document.body.appendChild(gate);

  const enter = document.getElementById("gaAgeEnter");

  if(enter){
    enter.addEventListener("click",()=>{
      safeSessionSet(AGE_KEY,"yes");
      gate.remove();
      unlockPage();
    },{once:true});
  }
}

function initCompliance(){
  /*
    One isolated init. Failure here is contained and never blocks
    the site's existing game/account code.
  */
  try{
    addComplianceFooter();
    buildAgeGate();
  }catch(error){
    console.error("Gilded Ace compliance layer error:",error);
    unlockPage();
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",initCompliance,{once:true});
}else{
  initCompliance();
}

window.addEventListener("pageshow",()=>{
  /*
    Protect against a browser restoring an old page from back/forward cache
    while leaving a stale scroll-lock class behind.
  */
  if(!document.getElementById("gaAgeGate")){
    unlockPage();
  }
});
})();
