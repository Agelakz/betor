// BETOR Extension v13 - WITH API
// ============================

console.log('[BETOR] v13: Loaded');

var widget = document.createElement("div");
widget.id = "betor-widget";
widget.style.cssText = "position:fixed;bottom:10px;left:10px;z-index:2147483647;width:240px;background:#1a1a2e;border-radius:8px;color:#fff;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,0.5);";

widget.innerHTML = '<div id="bh" style="background:#ff6b35;padding:8px;font-weight:bold;cursor:pointer;">BETOR <span id="bt">[▼]</span></div>' +
'<div id="bb" style="padding:8px;">' +
'<select id="api-provider" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;">' +
'<option value="cohere">Cohere (FREE)</option>' +
'<option value="groq">Groq ($5)</option>' +
'<option value="together">Together ($5)</option>' +
'</select>' +
'<input type="password" id="hud-api-key" placeholder="API Key" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;">' +
'<button id="ai-btn-record" style="width:48%;padding:6px;background:#667eea;color:#fff;border:none;">REKAM</button>' +
'<button id="ai-btn-analyze" style="width:48%;padding:6px;background:#10b981;color:#fff;border:none;">GO</button>' +
'<button id="ai-btn-test" style="width:48%;padding:6px;background:#444;color:#fff;border:none;">TEST</button>' +
'<button id="ai-btn-clear" style="width:48%;padding:6px;background:#ef4444;color:#fff;border:none;">DEL</button>' +
'<div id="ai-result-screen" style="background:#000;padding:8px;margin-top:6px;height:100px;overflow-y:auto;color:#22c55e;font-size:11px;">[ BETOR v13 ]\nTekan REKAM</div>' +
'</div>';

function initWidget() {
    if (document.getElementById("betor-widget") || !document.body) {
        setTimeout(initWidget, 500);
        return;
    }
    document.body.appendChild(widget);
    console.log('[BETOR] Widget added');
}

initWidget();
setTimeout(initWidget, 2000);

// Get PROMPT
function getPrompt() {
    return "Analisa odds:\n1.Prob=(1/Odds)x100%\n2.Risk:RENDAH>50%,SEDANG30-50%,TINGGI<30%\n3.Kelly:prob x odds>1=VALUE\n\nRekom:RUTE@odds-T PICK@odds\nOver/Under:T\nBTTS:Y/N\nRisk:RENDAH/SEDANG/TINGGI";
}

// ANALYZE WITH API
async function analyzeWithAPI(key, data, provider) {
    var prompt = getPrompt();
    var url, body, modelName, headers = {"Content-Type": "application/json"};
    
    if (provider === "cohere") {
        url = "https://api.cohere.com/v2/chat";
        body = {model: "c4ai-aya-expanse-32b", messages: [{role: "user", content: "PROMPT:\n" + prompt + "\n\nDATA:\n" + data}], temperature: 0.3};
        modelName = "aya-expanse-32b";
        headers["Authorization"] = "Bearer " + key;
    } else if (provider === "together") {
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
    
    var screen = document.getElementById("ai-result-screen");
    screen.innerText = "Calling " + provider + "...";
    
    try {
        var res = await fetch(url, {method: "POST", headers: headers, body: JSON.stringify(body)});
        var d = await res.json();
        var content = "";
        
        if (provider === "cohere") {
            content = d.message && d.message.content ? d.message.content : (d.text || "") || "Error: " + JSON.stringify(d).substring(0, 100);
        } else {
            content = d.choices && d.choices[0] ? d.choices[0].message.content : (d.error ? d.error.message : "Error: " + JSON.stringify(d)).substring(0, 100);
        }
        
        screen.innerText = "[ " + provider.toUpperCase() + " ]\n" + modelName + "\n----------\n" + content;
    } catch(e) {
        screen.innerText = "ERROR: " + e.message;
    }
}

// Toggle
document.getElementById("bh").onclick = function() {
    var bb = document.getElementById("bb");
    var bt = document.getElementById("bt");
    bb.style.display = bb.style.display === "none" ? "block" : "none";
    bt.innerText = bb.style.display === "none" ? "[▲]" : "[▼]";
};

// REKAM - scrape
var scrapedData = "";
document.getElementById("ai-btn-record").onclick = function() {
    var screen = document.getElementById("ai-result-screen");
    screen.innerText = "Scanning...";
    
    var btns = document.querySelectorAll("button[data-testid='fixture-outcome']");
    if (!btns.length) btns = document.querySelectorAll("button[class*='odd']");
    if (!btns.length) btns = document.querySelectorAll("[class*='market'] button");
    
    var odds = [];
    btns.forEach(function(b) {
        var txt = b.innerText.trim();
        if (txt && !isNaN(txt) && parseFloat(txt) > 1 && parseFloat(txt) < 15) odds.push(txt);
    });
    
    if (odds.length > 0) {
        scrapedData = odds.join(", ");
        screen.innerText = "OK: " + odds.length + " odds\n" + scrapedData;
    } else {
        var all = document.querySelectorAll("button");
        var data = [];
        all.forEach(function(b) {
            var t = b.innerText.trim();
            if (t && !isNaN(t) && parseFloat(t) > 1.01 && parseFloat(t) < 15) data.push(t);
        });
        scrapedData = data.join(", ");
        screen.innerText = "FOUND: " + data.length + "\n" + scrapedData;
    }
};

// TEST
document.getElementById("ai-btn-test").onclick = function() {
    var provider = document.getElementById("api-provider").value;
    document.getElementById("ai-result-screen").innerText = "[TEST]\nProvider: " + provider + "\nData: " + (scrapedData || "Belum Rekam") + "\n\nClick GO untuk proses";
};

// ANALYZE - PAKE API
document.getElementById("ai-btn-analyze").onclick = function() {
    var key = document.getElementById("hud-api-key").value;
    var provider = document.getElementById("api-provider").value;
    
    if (!key) {
        document.getElementById("ai-result-screen").innerText = "ERROR: Masukin API Key!";
        return;
    }
    if (!scrapedData) {
        document.getElementById("ai-result-screen").innerText = "ERROR: Tekan REKAM dulu!";
        return;
    }
    
    analyzeWithAPI(key, scrapedData, provider);
};

// DEL
document.getElementById("ai-btn-clear").onclick = function() {
    scrapedData = "";
    document.getElementById("ai-result-screen").innerText = "[CLEARED]\nTekan REKAM";
};

console.log('[BETOR] v13 Ready');
