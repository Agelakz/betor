
// DEBUG: Start
console.log('[BETOR] Loading...');
// Betor AI Extension
var scrapedMemory = [];
var activeApiKey = "";
var isMinimized = false;
var isProcessing = false;
var savedAnalysis = [];

// Widget - Modern UI
var widget = document.createElement("div");
widget.id = "betor-widget";
widget.innerHTML = '<div id="betor-container" style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;width:340px;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);overflow:hidden;border:1px solid rgba(255,255,255,0.1);"><div id="betor-header" style="background:linear-gradient(90deg,#ff6b35,#f7931e);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:20px;">BETOR</span><span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:10px;font-size:10px;color:#fff;">AI</span></div><span id="betor-toggle" style="color:#fff;font-size:18px;font-weight:bold;">▼</span></div><div id="betor-body" style="padding:16px;"><select id="api-provider" style="width:100%;padding:10px 12px;margin-bottom:12px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;font-size:13px;cursor:pointer;"><option value="cohere">Cohere (1000/mo FREE)</option><option value="groq">Groq ($5 free)</option><option value="together">Together ($5 free)</option><option value="ollama">Ollama (Lokal)</option></select><input type="password" id="hud-api-key" placeholder="Paste API Key..." style="width:100%;padding:10px 12px;margin-bottom:12px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;font-size:13px;box-sizing:border-box;"><input type="text" id="api-endpoint" placeholder="http://localhost:11434" style="width:100%;padding:10px 12px;margin-bottom:12px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;font-size:13px;box-sizing:border-box;display:none;"><div style="display:flex;gap:8px;margin-bottom:10px;"><button id="ai-btn-record" style="flex:1;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">REKAM</button></div><div style="display:flex;gap:8px;margin-bottom:10px;"><button id="ai-btn-analyze" style="flex:2;padding:12px;background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">ANALYZE</button><button id="ai-btn-test" style="flex:1;padding:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;">TEST</button></div><div style="display:flex;gap:8px;margin-bottom:10px;"><button id="ai-btn-clear" style="flex:1;padding:10px;background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid #ef4444;border-radius:10px;font-size:12px;cursor:pointer;">DEL</button><button id="ai-btn-save" style="flex:1;padding:10px;background:rgba(245,158,11,0.2);color:#f59e0b;border:1px solid #f59e0b;border-radius:10px;font-size:12px;cursor:pointer;">SAVE</button><button id="ai-btn-history" style="flex:1;padding:10px;background:rgba(99,102,241,0.2);color:#818cf8;border:1px solid #6366f1;border-radius:10px;font-size:12px;cursor:pointer;">HIST</button></div><button id="ai-btn-export" style="width:100%;padding:10px;background:rgba(139,92,246,0.2);color:#a78bfa;border:1px solid #8b5cf6;border-radius:10px;font-size:12px;cursor:pointer;">COPY</button></div><div id="ai-result-screen" style="background:#0d0d1a;padding:14px;border-radius:12px;height:180px;overflow-y:auto;color:#22c55e;font-size:12px;font-family:SF Mono,Monaco,Courier New,monospace;line-height:1.5;border:1px solid rgba(34,197,94,0.2);margin:8px 16px 16px;">[ BETOR AI ]\nPilih provider > Rekam > Analisa</div><div id="ai-history-panel" style="display:none;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;margin:0 16px 16px;max-height:120px;overflow-y:auto;"></div></div></div>';

Object.assign(widget.style,{position:"fixed",bottom:"20px",right:"20px",zIndex:"2147483647"});
// Make widget draggable
var isDragging = false;
var dragOffsetX, dragOffsetY;

widget.addEventListener('mousedown', function(e){
    if(e.target.closest('#betor-header')){
        isDragging = true;
        dragOffsetX = e.clientX - widget.offsetLeft;
        dragOffsetY = e.clientY - widget.offsetTop;
        widget.style.cursor = 'move';
    }
});

document.addEventListener('mousemove', function(e){
    if(isDragging){
        widget.style.left = (e.clientX - dragOffsetX) + 'px';
        widget.style.top = (e.clientY - dragOffsetY) + 'px';
        widget.style.bottom = 'auto';
    }
});

document.addEventListener('mouseup', function(){
    isDragging = false;
    widget.style.cursor = 'default';
});


function enforceHUD(){ console.log("[BETOR] enforceHUD called");
    if(document.body && !document.getElementById("betor-widget")){
        document.body.appendChild(widget);
        if(typeof chrome !== "undefined" && chrome.storage){
            chrome.storage.local.get(["groqApiKey"], function(res){
                if(res.groqApiKey){
                    activeApiKey = res.groqApiKey;
                    var input = document.getElementById("hud-api-key");
                    if(input) input.value = activeApiKey;
                }
            });
        }
    }
}
setInterval(enforceHUD, 1000);

function setLoading(loading){
    var screen = document.getElementById("ai-result-screen");
    var btns = ["ai-btn-analyze","ai-btn-record","ai-btn-export","ai-btn-save","ai-btn-history","ai-btn-clear","ai-btn-test"];
    isProcessing = loading;
    btns.forEach(function(id){
        var btn = document.getElementById(id);
        if(btn) btn.disabled = loading;
    });
    if(screen) screen.style.color = loading ? "#fbbf24" : "#22c55e";
}

function updateHudUI(msg, append){
    var screen = document.getElementById("ai-result-screen");
    if(screen && msg){
        if(append){
            var t = new Date().toLocaleTimeString();
            screen.innerText = "[" + t + "] " + msg + "\n\n" + screen.innerText.substring(0, 1200);
        }else{
            screen.innerText = msg;
        }
    }
}

function scrapeStakeData(){
    var result = [];
    var btns = document.querySelectorAll("button[data-testid='fixture-outcome']");
    if(btns.length === 0) btns = document.querySelectorAll("button[class*='odd']");
    if(btns.length === 0) btns = document.querySelectorAll("[class*='market'] button");
    if(btns.length === 0){
        var all = document.querySelectorAll("button");
        all.forEach(function(b){
            var txt = b.innerText ? b.innerText.trim() : "";
            if(txt && !isNaN(txt) && parseFloat(txt) > 1.01 && parseFloat(txt) < 15) btns.push(b);
        });
    }
    if(btns.length === 0) throw new Error("Data tdk ditemukan");
    var groups = new Map();
    btns.forEach(function(btn){
        var parent = btn.closest(".market") || btn.parentElement;
        if(!groups.has(parent)) groups.set(parent, []);
        var name = btn.querySelector("[data-testid='outcome-button-name']");
        var odds = btn.querySelector("[data-testid='fixture-odds']");
        var teamName = name ? name.innerText.trim() : (btn.innerText.split("\n")[0] || "X").trim();
        var oddsVal = odds ? odds.innerText.trim() : btn.innerText.trim();
        if(!isNaN(oddsVal) && parseFloat(oddsVal) > 1) groups.get(parent).push(teamName + ":" + oddsVal);
    });
    groups.forEach(function(arr){
        if(arr.length > 0) result.push("MATCH:" + arr.join("|"));
    });
    return result.filter(function(x,i,a){ return a.indexOf(x) === i; }).join("\n");
}

async function getLiveH2H(){
    try{
        var text = document.body.innerText || "";
        var patterns = ["HEAD TO HEAD","H2H","PREVIOUS"];
        for(var i = 0; i < patterns.length; i++){
            var idx = text.indexOf(patterns[i]);
            if(idx !== -1){
                var raw = text.substring(idx, idx + 2000);
                return "H2H:" + raw.replace(/\n+/g, "|").replace(/\s+/g, " ").substring(0, 1800);
            }
        }
        return "H2H: tdk ada";
    }catch(e){
        return "H2H: Error-" + e.message;
    }
}

function getPrompt(){
    return "ANALISA:\n1.Prob=(1/Odds)x100%\n2.Risk:>50%=RENDAH,30-50%=SEDANG,<30%=TINGGI\n3.Kelly:prob x odds>1=VALUE\n\nREKOMENDASI:\n1x2: [HOME/DRAW/AWAY]@odds\nOU: [OVER/UNDER]@odds\nBTTS: YES/NO@odds\nRisk: RENDAH/SEDANG/TINGGI\nKelly: 2-5% atau SKIP";
}

document.addEventListener("click", async function(e){
    if(e.target && e.target.id === "api-provider"){
        var provider = e.target.value;
        var endpoint = document.getElementById("api-endpoint");
        endpoint.style.display = provider === "ollama" ? "block" : "none";
        return;
    }
    if(e.target && e.target.closest("#betor-header")){
        var body = document.getElementById("betor-body");
        var icon = document.getElementById("betor-toggle");
        isMinimized = !isMinimized;
        body.style.display = isMinimized ? "none" : "block";
        icon.innerText = isMinimized ? ">" : "▼";
        return;
    }
    if(e.target && e.target.id === "ai-btn-record"){
        if(isProcessing) return;
        try{
            setLoading(true);
            updateHudUI("Recording...", false);
            var d = scrapeStakeData();
            scrapedMemory.push(d);
            updateHudUI("OK: " + d.split("\n").length + " market", true);
        }catch(err){ updateHudUI("ERR: " + err.message, true); }
        finally{ setLoading(false); }
        return;
    }
    if(e.target && e.target.id === "ai-btn-clear"){
        scrapedMemory = [];
        updateHudUI("Cleared", true);
        return;
    }
    if(e.target && e.target.id === "ai-btn-save"){
        var screen = document.getElementById("ai-result-screen");
        var txt = screen ? screen.innerText : "";
        if(txt.length < 30){ updateHudUI("No data", true); return; }
        savedAnalysis.push({id: Date.now(), waktu: new Date().toLocaleString(), hasil: txt});
        if(chrome && chrome.storage){
            chrome.storage.local.set({groqSavedAnalysis: savedAnalysis}, function(){
                updateHudUI("Saved (" + savedAnalysis.length + ")", true);
            });
        }
        return;
    }
    if(e.target && e.target.id === "ai-btn-history"){
        var panel = document.getElementById("ai-history-panel");
        var show = panel && panel.style.display === "none";
        if(show && chrome && chrome.storage){
            chrome.storage.local.get(["groqSavedAnalysis"], function(res){
                savedAnalysis = res.groqSavedAnalysis || [];
                var html = savedAnalysis.length === 0 ? "<div style='color:#888;'>No history</div>" : "";
                savedAnalysis.slice().reverse().forEach(function(it){
                    html += "<div onclick='loadH(" + it.id + ")' style='padding:8px;margin:4px 0;background:rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:11px;color:#aaa;'>" + it.waktu + "</div>";
                });
                panel.innerHTML = html;
                panel.style.display = "block";
            });
        }else if(panel) panel.style.display = "none";
        return;
    }
    window.loadH = function(id){
        var it = savedAnalysis.find(function(x){ return x.id === id; });
        if(it){
            var s = document.getElementById("ai-result-screen");
            if(s) s.innerText = it.hasil;
            var p = document.getElementById("ai-history-panel");
            if(p) p.style.display = "none";
        }
    };
    if(e.target && e.target.id === "ai-btn-export"){
        var s = document.getElementById("ai-result-screen");
        var t = s ? s.innerText : "";
        try{ navigator.clipboard.writeText(t); updateHudUI("Copied!", true); }
        catch(err){
            var ta = document.createElement("textarea");
            ta.value = t;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            updateHudUI("Copied!", true);
        }
        return;
    }
    if(e.target && e.target.id === "ai-btn-test"){
        if(scrapedMemory.length === 0) throw new Error("Rekam dulu!");
        try{
            var h2h = await getLiveH2H();
            var data = scrapedMemory.join("\n\n") + "\n\n" + h2h;
            var provider = document.getElementById("api-provider").value;
            var prompt = getPrompt();
            document.getElementById("ai-result-screen").innerText = "[ TEST MODE ]\nProvider: " + provider + "\n\nPROMPT:\n" + prompt + "\n\nDATA:\n" + data.substring(0, 400) + "...\n\n[ TIDAK BAKAR API ]";
        }catch(err){ updateHudUI("ERR: " + err.message, true); }
        return;
    }
    if(e.target && e.target.id === "ai-btn-analyze"){
        if(isProcessing) return;
        try{
            var input = document.getElementById("hud-api-key");
            activeApiKey = input ? input.value.trim() : "";
            if(!activeApiKey) throw new Error("Isi API Key!");
            if(scrapedMemory.length === 0) throw new Error("Rekam dulu!");
            setLoading(true);
            updateHudUI("Analysing...", false);
            var h2h = await getLiveH2H();
            var data = scrapedMemory.join("\n\n") + "\n\n" + h2h;
            var provider = document.getElementById("api-provider").value;
            var endpoint = document.getElementById("api-endpoint").value;
            await analyzeWithAPI(activeApiKey, data, provider, endpoint);
        }catch(err){ updateHudUI("ERR: " + err.message, true); }
        finally{ setLoading(false); }
        return;
    }
});

async function analyzeWithAPI(key, data, provider, endpoint){
    var prompt = getPrompt();
    var url, body, modelName, headers = {"Content-Type": "application/json"};
    
    if(provider === "ollama"){
        url = (endpoint || "http://localhost:11434") + "/api/chat";
        body = {model: "llama3.1", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], stream: false};
        modelName = "llama3.1";
    }else if(provider === "together"){
        url = "https://api.together.ai/v1/chat/completions";
        body = {model: "Meta-Llama-3.1-70B-Instruct", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], max_tokens: 1500, temperature: 0};
        modelName = "Llama-3.1-70B";
        headers["Authorization"] = "Bearer " + key;
    }else if(provider === "cohere"){
        url = "https://api.cohere.ai/v1/chat";
        body = {model: "command-r-plus", message: "PROMPT:\n" + prompt + "\n\nDATA:\n" + data, max_tokens: 1500};
        modelName = "Command R+";
        headers["Authorization"] = "Bearer " + key;
    }else{
        url = "https://api.groq.com/openai/v1/chat/completions";
        body = {model: "llama-3.3-70b-versatile", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], temperature: 0, max_tokens: 1500};
        modelName = "llama-3.3-70b";
        headers["Authorization"] = "Bearer " + key;
    }
    
    try{
        var res = await fetch(url, {method: "POST", headers: headers, body: JSON.stringify(body)});
        var d = await res.json();
        var content = "";
        
        if(provider === "ollama"){
            content = d.message ? d.message.content : "";
        }else if(provider === "cohere"){
            content = d.text || (d.message ? d.message.content : "") || (d.generations && d.generations[0] ? d.generations[0].text : "") || "Error: " + JSON.stringify(d).substring(0, 150);
        }else{
            content = d.choices && d.choices[0] ? d.choices[0].message.content : (d.error ? d.error.message : "Error: " + JSON.stringify(d)).substring(0, 300);
        }
        
        document.getElementById("ai-result-screen").innerText = "[ " + provider.toUpperCase() + " ]\n" + modelName + "\n------------\n" + content;
    }catch(e){
        document.getElementById("ai-result-screen").innerText = "ERROR: " + e.message;
    }
}
