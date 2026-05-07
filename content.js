// BETOR Extension v15
console.log("[BETOR] Loading...");

var scrapedMemory = [];
var activeApiKey = "";
var isMinimized = false;

var widget = document.createElement("div");
widget.id = "ai-command-widget";
widget.innerHTML = "<div id=\"ai-widget-container\" style=\"background:#111827;color:white;border:1px solid #374151;border-radius:8px;width:320px;box-shadow:0 10px 25px rgba(0,0,0,0.8);font-family:sans-serif;font-size:12px;\"><div id=\"ai-btn-toggle\" style=\"display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #374151;cursor:pointer;background:#1f2937;border-radius:8px 8px 0 0;\"><strong style=\"color:#f59e0b;\">BETOR AI</strong><div style=\"display:flex;gap:10px;align-items:center;\"><span id=\"ai-mem-status\" style=\"color:#fbbf24;font-size:10px;font-weight:bold;\">Mem: 0</span><span id=\"ai-toggle-icon\" style=\"color:white;font-weight:bold;\">[—]</span></div></div><div id=\"ai-widget-body\" style=\"padding:12px;\"><select id=\"api-provider\" style=\"width:100%;padding:8px;margin-bottom:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;\"><option value=\"cohere\">Cohere (FREE)</option><option value=\"github\">GitHub Models</option><option value=\"groq\">Groq</option><option value=\"together\">Together</option></select><input type=\"password\" id=\"hud-api-key\" placeholder=\"API Key\" style=\"width:93%;padding:8px;margin-bottom:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;\"><button id=\"ai-btn-record\" style=\"width:100%;margin-bottom:8px;background:#3b82f6;color:white;border:none;padding:10px;border-radius:4px;font-weight:bold;\">REKAM</button><div style=\"display:flex;gap:5px;margin-bottom:8px;\"><button id=\"ai-btn-analyze\" style=\"flex:2;background:#10b981;color:white;border:none;padding:8px;border-radius:4px;font-weight:bold;\">ANALYZE</button><button id=\"ai-btn-test\" style=\"flex:1;background:#6b7280;color:white;border:none;padding:8px;border-radius:4px;\">TEST</button></div><button id=\"ai-btn-clear\" style=\"width:100%;padding:8px;background:#ef4444;color:white;border:none;border-radius:4px;margin-bottom:8px;\">HAPUS</button><div id=\"ai-result-screen\" style=\"background:#000;padding:8px;border-radius:4px;height:150px;overflow-y:auto;color:#34d399;font-family:monospace;\">[ BETOR READY ]</div></div></div>";

Object.assign(widget.style, {position: "fixed", bottom: "20px", left: "20px", zIndex: "2147483647"});

function enforceHUD() {
    if (document.body && !document.getElementById("ai-command-widget")) {
        document.body.appendChild(widget);
    }
}
setInterval(enforceHUD, 1000);

function updateHudUI(msg) {
    var memStatus = document.getElementById("ai-mem-status");
    var screen = document.getElementById("ai-result-screen");
    if (memStatus) memStatus.innerText = "Mem: " + scrapedMemory.length;
    if (screen && msg) screen.innerText = "[" + new Date().toLocaleTimeString() + "] " + msg + "\n\n" + screen.innerText.substring(0, 800);
}

function scrapeStakeData() {
    var btns = document.querySelectorAll("button[data-testid=\"fixture-outcome\"]");
    if (btns.length === 0) throw new Error("Data market tdk ditemukan");
    var data = [];
    btns.forEach(function(b) {
        var name = b.querySelector("[data-testid=\"outcome-button-name\"]");
        var odd = b.querySelector("[data-testid=\"fixture-odds\"]");
        if (name && odd) data.push(name.innerText.trim() + ": " + odd.innerText.trim());
    });
    return data.join("\n");
}

async function getLiveH2H() {
    var text = document.body.innerText || "";
    var idx = text.indexOf("HEAD TO HEAD");
    if (idx === -1) idx = text.indexOf("H2H");
    return idx !== -1 ? "H2H: " + text.substring(idx, idx + 1000).replace(/\n/g, " | ") : "H2H: tdk ada";
}

function getPrompt() {
    return "ATURAN:\n1. WAJIB 100% BAHASA INDONESIA!\n2. TIDAK PAKAI TAG BERPIKIR.\n3. BLACKLIST: Liga Turki = NO BET.\n\nTUGAS: Analisis odds, H2H, FORM. JANGAN MEMAKSA!\n\nFORMAT:\nMATCH: [Home] vs [Away]\nH2H & FORM: [statistik]\nODDS: [H%|D%|A%]\n1x2: [HOME/DRAW/AWAY/NO BET]\nSkor: [estimasi]\nOU: [OVER/UNDER@odds]\nBTTS: [YES/NO@odds]\nRisk: [RENDAH/SEDANG/TINGGI]";
}

async function analyzeWithAPI(key, data, provider) {
    var url, body, modelName, headers = {"Content-Type": "application/json"};
    
    if (provider === "cohere") {
        url = "https://api.cohere.com/v2/chat";
        body = {model: "c4ai-aya-expanse-32b", messages: [{role: "user", content: getPrompt() + "\n\n" + data}]};
        modelName = "aya-expanse-32b";
        headers["Authorization"] = "Bearer " + key;
    } else if (provider === "github") {
        url = "https://models.github.ai/inference/chat/completions";
        body = {model: "openai/gpt-4o", messages: [{role: "user", content: getPrompt() + "\n\n" + data}]};
        modelName = "GPT-4o";
        headers["Accept"] = "application/vnd.github+json";
        headers["X-GitHub-Api-Version"] = "2022-11-28";
        headers["Authorization"] = "Bearer " + key;
    } else if (provider === "together") {
        url = "https://api.together.ai/v1/chat/completions";
        body = {model: "Meta-Llama-3.1-70B-Instruct", messages: [{role: "user", content: getPrompt() + "\n\n" + data}]};
        modelName = "Llama-3.1-70B";
        headers["Authorization"] = "Bearer " + key;
    } else {
        url = "https://api.groq.com/openai/v1/chat/completions";
        body = {model: "llama-3.3-70b-versatile", messages: [{role: "user", content: getPrompt() + "\n\n" + data}]};
        modelName = "llama-3.3-70b";
        headers["Authorization"] = "Bearer " + key;
    }
    
    var screen = document.getElementById("ai-result-screen");
    screen.innerText = "Calling " + provider + "...";
    
    try {
        var res = await fetch(url, {method: "POST", headers: headers, body: JSON.stringify(body)});
        var d = await res.json();
        var content = d.choices ? d.choices[0].message.content : d.message ? d.message.content : "Error: " + d.error;
        screen.innerText = "[ " + provider.toUpperCase() + " ]\n" + modelName + "\n\n" + (content || "").substring(0, 500);
    } catch(e) {
        screen.innerText = "ERROR: " + e.message;
    }
}

document.addEventListener("click", function(e) {
    if (e.target && e.target.closest("#ai-btn-toggle")) {
        var body = document.getElementById("ai-widget-body");
        var icon = document.getElementById("ai-toggle-icon");
        body.style.display = body.style.display === "none" ? "block" : "none";
        icon.innerText = body.style.display === "none" ? "[+]" : "[—]";
    }
    if (e.target && e.target.id === "ai-btn-record") {
        try {
            var d = scrapeStakeData();
            scrapedMemory.push(d);
            updateHudUI("OK: " + scrapedMemory.length + " market");
        } catch(err) { updateHudUI("ERR: " + err.message); }
    }
    if (e.target && e.target.id === "ai-btn-clear") { scrapedMemory = []; updateHudUI("Cleared"); }
    if (e.target && e.target.id === "ai-btn-test") {
        if (scrapedMemory.length === 0) { updateHudUI("Rekam dulu!"); return; }
        getLiveH2H().then(function(h) {
            document.getElementById("ai-result-screen").innerText = "[TEST]\n" + scrapedMemory.join("\n") + "\n\n" + h;
        });
    }
    if (e.target && e.target.id === "ai-btn-analyze") {
        var key = document.getElementById("hud-api-key").value;
        if (!key || scrapedMemory.length === 0) { updateHudUI("API Key / Data!"); return; }
        getLiveH2H().then(function(h) {
            var d = scrapedMemory.join("\n") + "\n\n" + h;
            var prov = document.getElementById("api-provider").value;
            analyzeWithAPI(key, d, prov);
        });
    }
});

console.log("[BETOR] v15 Ready!");
