// BETOR Extension - Based on user's working script
console.log('[BETOR] Loading...');

var scrapedMemory = [];
var activeApiKey = "";
var isMinimized = false;

// Widget
var widget = document.createElement('div');
widget.id = "ai-command-widget";
widget.innerHTML = '<div id="ai-widget-container" style="background:#111827;color:white;border:1px solid #374151;border-radius:8px;width:320px;box-shadow:0 10px 25px rgba(0,0,0,0.8);font-family:sans-serif;font-size:12px;"><div id="ai-btn-toggle" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #374151;cursor:pointer;background:#1f2937;border-radius:8px 8px 0 0;"><strong style="color:#f59e0b;">BETOR AI</strong><div style="display:flex;gap:10px;align-items:center;"><span id="ai-mem-status" style="color:#fbbf24;font-size:10px;font-weight:bold;">Mem: 0</span><span id="ai-toggle-icon" style="color:white;font-weight:bold;">[—]</span></div></div><div id="ai-widget-body" style="padding:12px;"><select id="api-provider" style="width:100%;padding:8px;margin-bottom:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;"><option value="cohere">Cohere (FREE)</option><option value="github">GitHub Models</option><option value="groq">Groq ($5)</option><option value="together">Together ($5)</option></select><input type="password" id="hud-api-key" placeholder="API Key" style="width:93%;padding:8px;margin-bottom:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;"><button id="ai-btn-record" style="width:100%;margin-bottom:8px;background:#3b82f6;color:white;border:none;padding:10px;border-radius:4px;font-weight:bold;">REKAM DATA</button><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-analyze" style="flex:2;background:#10b981;color:white;border:none;padding:8px;border-radius:4px;font-weight:bold;">ANALYZE</button><button id="ai-btn-test" style="flex:1;background:#6b7280;color:white;border:none;padding:8px;border-radius:4px;">TEST</button></div><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-clear" style="flex:1;background:#ef4444;color:white;border:none;padding:8px;border-radius:4px;">HAPUS</button><button id="ai-btn-save" style="flex:1;background:#f59e0b;color:white;border:none;padding:8px;border-radius:4px;">SAVE</button></div><button id="ai-btn-export" style="width:100%;padding:8px;background:#8b5cf6;color:white;border:none;border-radius:4px;margin-bottom:8px;">COPY</button><div id="ai-result-screen" style="background:#000;padding:8px;border-radius:4px;height:200px;overflow-y:auto;white-space:pre-wrap;color:#34d399;font-family:monospace;border:1px solid #065f46;">[ BETOR READY ]\nRekam dulu lalu Analisa</div></div></div>';

Object.assign(widget.style, {position: 'fixed', bottom: '20px', left: '20px', zIndex: '2147483647'});

function enforceHUD() {
    if (document.body && !document.getElementById('ai-command-widget')) {
        document.body.appendChild(widget);
        console.log('[BETOR] Widget added');
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['betorApiKey'], function(res) {
                if (res.betorApiKey) {
                    activeApiKey = res.betorApiKey;
                    document.getElementById('hud-api-key').value = activeApiKey;
                }
            });
        }
    }
}
setInterval(enforceHUD, 1000);

function updateHudUI(message) {
    var memStatus = document.getElementById('ai-mem-status');
    var screen = document.getElementById('ai-result-screen');
    if(memStatus) memStatus.innerText = 'Mem: ' + scrapedMemory.length;
    if(screen && message) {
        var time = new Date().toLocaleTimeString();
        screen.innerText = '[' + time + '] ' + message + '\n\n' + screen.innerText.substring(0, 1200);
    }
}

function scrapeStakeData() {
    var result = [];
    var oddsButtons = document.querySelectorAll('button[data-testid="fixture-outcome"]');
    if (oddsButtons.length === 0) throw new Error("Data market tidak ditemukan");
    var matchGroups = new Map();
    oddsButtons.forEach(function(btn) {
        var parentBox = btn.closest('.market, [data-testid="market-row"]') || btn.parentElement;
        if (!matchGroups.has(parentBox)) matchGroups.set(parentBox, []);
        var teamName = btn.querySelector('[data-testid="outcome-button-name"]').innerText.trim();
        var oddsValue = btn.querySelector('[data-testid="fixture-odds"]').innerText.trim();
        matchGroups.get(parentBox).push(teamName + ': ' + oddsValue);
    });
    matchGroups.forEach(function(oddsArray) {
        result.push('MATCH: ' + oddsArray.join(' | '));
    });
    var uniqueResult = result.filter(function(item, index) { return result.indexOf(item) === index; });
    return uniqueResult.join('\n');
}

async function getLiveH2H() {
    try {
        var bodyText = document.body.innerText || "";
        var h2hIndex = bodyText.indexOf("HEAD TO HEAD");
        if (h2hIndex === -1) h2hIndex = bodyText.indexOf("PREVIOUS");
        if (h2hIndex === -1) h2hIndex = bodyText.indexOf("H2H");
        if (h2hIndex !== -1) {
            var rawH2H = bodyText.substring(h2hIndex, h2hIndex + 1500);
            return 'H2H DATA: ' + rawH2H.replace(/\n+/g, ' | ').replace(/\s+/g, ' ');
        } else {
            return "H2H: Tidak ada";
        }
    } catch(err) {
        return "H2H: Error - " + err.message;
    }
}

function getPrompt() {
    return "Analisa odds betting:\n1. Prob = (1/Odds) x 100%\n2. Risk: >50%=RENDAH, 30-50%=SEDANG, <30%=TINGGI\n3. Kelly: prob x odds >1 = VALUE\n\nFORMAT:\n- REKOMENDASI: [HOME/DRAW/AWAY]@odds\n- OU: [OVER/UNDER]@odds\n- BTTS: YES/NO@odds\n- Risk: RENDAH/SEDANG/TINGGI\n- Kelly: 2-5% atau SKIP";
}

async function analyzeWithAPI(key, data, provider) {
    var prompt = getPrompt();
    var url, body, modelName, headers = {"Content-Type": "application/json"};
    
    if (provider === "cohere") {
        url = "https://api.cohere.com/v2/chat";
        body = {model: "c4ai-aya-expanse-32b", messages: [{role: "user", content: "PROMPT: " + prompt + "\n\nDATA: " + data}], temperature: 0.3, max_tokens: 1500};
        modelName = "aya-expanse-32b";
        headers["Authorization"] = "Bearer " + key;
    } else if (provider === "together") {
    } else if (provider === "github") {
        url = "https://models.github.ai/v1/chat/completions";
        body = {model: "Llama-3.1-70B-Instruct", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:
" + data}], temperature: 0.1, max_tokens: 1500};
        modelName = "Llama-3.1-70B";
        headers["Authorization"] = "Bearer " + key;
        url = "https://api.together.ai/v1/chat/completions";
        body = {model: "Meta-Llama-3.1-70B-Instruct", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], max_tokens: 1500};
        modelName = "Llama-3.1-70B";
        headers["Authorization"] = "Bearer " + key;
    } else {
        url = "https://api.groq.com/openai/v1/chat/completions";
        body = {model: "llama-3.3-70b-versatile", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], temperature: 0, max_tokens: 1500};
        modelName = "llama-3.3-70b";
        headers["Authorization"] = "Bearer " + key;
    }
    
    var screen = document.getElementById('ai-result-screen');
    screen.innerText = "Calling " + provider + "...";
    
    try {
        var res = await fetch(url, {method: "POST", headers: headers, body: JSON.stringify(body)});
        var d = await res.json();
        var content = "";
        
        if (provider === "cohere") {
            content = d.message ? d.message.content : (d.text || "Error: " + JSON.stringify(d).substring(0, 150));
        } else {
            content = d.choices ? d.choices[0].message.content : (d.error ? d.error.message : "Error: " + JSON.stringify(d)).substring(0, 150);
        }
        
        screen.innerText = "[ " + provider.toUpperCase() + " - " + modelName + " ]\n\n" + content;
    } catch(e) {
        screen.innerText = "ERROR: " + e.message;
    }
}

document.addEventListener('click', async function(event) {
    if (event.target && event.target.closest('#ai-btn-toggle')) {
        var body = document.getElementById('ai-widget-body');
        var icon = document.getElementById('ai-toggle-icon');
        var container = document.getElementById('ai-widget-container');
        if (!isMinimized) {
            body.style.display = 'none'; icon.innerText = '[+]'; container.style.width = '200px'; isMinimized = true;
        } else {
            body.style.display = 'block'; icon.innerText = '[—]'; container.style.width = '320px'; isMinimized = false;
        }
        return;
    }

    if (event.target && event.target.id === 'ai-btn-record') {
        try {
            var cleanData = scrapeStakeData();
            scrapedMemory.push(cleanData);
            updateHudUI('OK: ' + cleanData.split('\n').length + ' market');
        } catch(error) { updateHudUI('ERROR: ' + error.message); }
    }

    if (event.target && event.target.id === 'ai-btn-clear') {
        scrapedMemory = []; updateHudUI("Cleared");
    }

    if (event.target && event.target.id === 'ai-btn-test') {
        var provider = document.getElementById('api-provider').value;
        if (scrapedMemory.length === 0) {
            updateHudUI("ERROR: Rekam dulu!");
            return;
        }
        var h2h = await getLiveH2H();
        var data = scrapedMemory.join('\n\n') + "\n\n" + h2h;
        document.getElementById('ai-result-screen').innerText = "[TEST]\nProvider: " + provider + "\n\nDATA:\n" + data.substring(0, 500) + "...\n\n[Tidak bakar API]";
    }

    if (event.target && event.target.id === 'ai-btn-analyze') {
        try {
            activeApiKey = document.getElementById('hud-api-key').value.trim();
            if (!activeApiKey) throw new Error("API Key kosong!");
            if (scrapedMemory.length === 0) throw new Error("Rekam dulu!");
            
            updateHudUI("processing...");
            var h2h = await getLiveH2H();
            var data = scrapedMemory.join('\n\n') + "\n\n" + h2h;
            var provider = document.getElementById('api-provider').value;
            await analyzeWithAPI(activeApiKey, data, provider);
        } catch(error) { updateHudUI('ERROR: ' + error.message); }
    }

    if (event.target && event.target.id === 'ai-btn-save') {
        var txt = document.getElementById('ai-result-screen').innerText;
        if (txt && txt.length > 10) {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({betorSaved: txt});
            }
            updateHudUI("Saved!");
        }
    }

    if (event.target && event.target.id === 'ai-btn-export') {
        var txt = document.getElementById('ai-result-screen').innerText;
        navigator.clipboard.writeText(txt).then(function() { updateHudUI("Copied!"); });
    }
});

console.log('[BETOR] Ready!');
