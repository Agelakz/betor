// Betor Extension - Multi-API Support
var scrapedMemory = [];
var activeApiKey = "";
var isMinimized = false;
var isProcessing = false;
var savedAnalysis = [];

// Widget
var widget = document.createElement("div");
widget.id = "ai-command-widget";
widget.innerHTML = '<div id="ai-widget-container" style="background:#111827;color:#fff;border:1px solid #374151;border-radius:8px;width:320px;"><div id="ai-btn-toggle" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #374151;cursor:pointer;background:#1f2937;"><strong style="color:#f59e0b;">BETOR AI</strong><span id="ai-toggle-icon">[-]</span></div><div id="ai-widget-body" style="padding:12px;"><select id="api-provider" style="width:93%;padding:5px;margin-bottom:5px;background:#374151;color:#fff;border:1px solid #4b5563;"><option value="groq">Groq ($5 free)</option><option value="together">Together ($5 free)</option><option value="cohere">Cohere (1000/mo FREE)</option><option value="ollama">Ollama (Lokal)</option></select><input type="password" id="hud-api-key" placeholder="API Key" style="width:93%;padding:8px;margin-bottom:8px;background:#374151;color:#fff;"><input type="text" id="api-endpoint" placeholder="Endpoint (Ollama)" style="width:93%;padding:8px;margin-bottom:8px;background:#374151;color:#fff;display:none;"><button id="ai-btn-record" style="width:100%;margin-bottom:8px;background:#3b82f6;color:#fff;border:none;padding:10px;cursor:pointer;">[REKAM]</button><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-analyze" style="flex:2;background:#10b981;color:#fff;border:none;padding:8px;cursor:pointer;">[ANALYZE]</button><button id="ai-btn-test" style="flex:1;background:#6b7280;color:#fff;border:none;padding:8px;cursor:pointer;">[TEST]</button></div><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-clear" style="flex:1;background:#ef4444;color:#fff;border:none;padding:8px;cursor:pointer;">[DEL]</button><button id="ai-btn-save" style="flex:1;background:#f59e0b;color:#fff;border:none;padding:8px;cursor:pointer;">[SAVE]</button><button id="ai-btn-history" style="flex:1;background:#6366f1;color:#fff;border:none;padding:8px;cursor:pointer;">[HIST]</button></div><button id="ai-btn-export" style="width:100%;margin-bottom:8px;background:#8b5cf6;color:#fff;border:none;padding:8px;cursor:pointer;">[COPY]</button></div><div id="ai-result-screen" style="background:#000;padding:8px;border-radius:4px;height:200px;overflow-y:auto;white-space:pre-wrap;color:#34d399;font-family:monospace;">[BETOR AI]\nGroq | Together | Cohere | Ollama</div><div id="ai-history-panel" style="display:none;background:#1f2937;padding:8px;margin-top:8px;max-height:150px;overflow-y:auto;"></div></div></div>';

Object.assign(widget.style,{position:"fixed",bottom:"20px",left:"20px",zIndex:"2147483647"});

function enforceHUD(){
    if(document.body && !document.getElementById("ai-command-widget")){
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

function setLoading(isLoading){
    var screen = document.getElementById("ai-result-screen");
    var btns = ["ai-btn-analyze","ai-btn-record","ai-btn-export","ai-btn-save","ai-btn-history","ai-btn-clear","ai-btn-test"];
    isProcessing = isLoading;
    btns.forEach(function(id){
        var btn = document.getElementById(id);
        if(btn) btn.disabled = isLoading;
    });
    if(screen) screen.style.color = isLoading ? "#fbbf24" : "#34d399";
}

function updateHudUI(msg, append){
    var screen = document.getElementById("ai-result-screen");
    if(screen && msg){
        if(append){
            var t = new Date().toLocaleTimeString();
            screen.innerText = "[" + t + "] " + msg + "\n\n" + screen.innerText.substring(0, 1500);
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
                return "DATA:" + raw.replace(/\n+/g, "|").replace(/\s+/g, " ").substring(0, 1800);
            }
        }
        return "INFO:H2H tdk ada";
    }catch(e){
        return "INFO:Error-" + e.message;
    }
}

function getPrompt(){
    return "HITUNG SENDIRI!\n1. Prob=(1/Odds)x100%\n2. Risk:>50%=RENDAH,30-50%=SEDANG,<30%=TINGGI\n3.Kelly:prob x odds>1=VALUE,<1=SKIP\n\nFORMAT:\nRECOMMENDED:[HOME/DRAW/AWAY]@odds-prob%-alasan\nOU:[OVER/UNDER]@odds-prob%-alasan\nBTTS:[YES/NO]@odds-prob%-alasan\nRISK:[RENDAH/SEDANG/TINGGI]\nKELLY:[2%|3%|4%|5%|SKIP]";
}

document.addEventListener("click", async function(e){
    if(e.target && e.target.id === "api-provider"){
        var provider = e.target.value;
        var endpoint = document.getElementById("api-endpoint");
        if(provider === "ollama") endpoint.style.display = "block";
        else endpoint.style.display = "none";
        return;
    }
    if(e.target && e.target.closest("#ai-btn-toggle")){
        var body = document.getElementById("ai-widget-body");
        var icon = document.getElementById("ai-toggle-icon");
        isMinimized = !isMinimized;
        body.style.display = isMinimized ? "none" : "block";
        icon.innerText = isMinimized ? "[+]" : "[-]";
        return;
    }
    if(e.target && e.target.id === "ai-btn-record"){
        if(isProcessing) return;
        try{
            setLoading(true);
            updateHudUI("Recording...", false);
            var d = scrapeStakeData();
            scrapedMemory.push(d);
            updateHudUI("OK:" + d.split("\n").length + " market", true);
        }catch(err){ updateHudUI("ERR:" + err.message, true); }
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
        if(txt.length < 50){ updateHudUI("WARN:No data", true); return; }
        savedAnalysis.push({id: Date.now(), waktu: new Date().toLocaleString(), hasil: txt});
        if(chrome && chrome.storage){
            chrome.storage.local.set({groqSavedAnalysis: savedAnalysis}, function(){
                updateHudUI("Saved(" + savedAnalysis.length + ")", true);
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
                var html = savedAnalysis.length === 0 ? "<div>Empty</div>" : "";
                savedAnalysis.slice().reverse().forEach(function(it){
                    html += "<div onclick='loadH(" + it.id + ")' style='cursor:pointer;padding:5px;margin:3px;background:#374151;'>" + it.waktu + "</div>";
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
        if(scrapedMemory.length === 0) throw new Error("Rekam dulu");
        try{
            var input = document.getElementById("hud-api-key");
            activeApiKey = input ? input.value.trim() : "";
            var h2h = await getLiveH2H();
            var data = scrapedMemory.join("\n\n") + "\n\nH2H:" + h2h;
            var provider = document.getElementById("api-provider").value;
            var prompt = getPrompt();
            document.getElementById("ai-result-screen").innerText = "[TEST]\nProvider:" + provider + "\n\nPROMPT:\n" + prompt + "\n\nDATA:\n" + data.substring(0, 500) + "...\n\n[Tidak bakar API]";
        }catch(err){ updateHudUI("ERR:" + err.message, true); }
        return;
    }
    if(e.target && e.target.id === "ai-btn-analyze"){
        if(isProcessing) return;
        try{
            var input = document.getElementById("hud-api-key");
            activeApiKey = input ? input.value.trim() : "";
            if(!activeApiKey) throw new Error("API Key kosong");
            if(scrapedMemory.length === 0) throw new Error("Rekam dulu");
            setLoading(true);
            updateHudUI("Analysing...", false);
            var h2h = await getLiveH2H();
            var data = scrapedMemory.join("\n\n") + "\n\nH2H:" + h2h;
            var provider = document.getElementById("api-provider").value;
            var endpoint = document.getElementById("api-endpoint").value;
            await analyzeWithAPI(activeApiKey, data, provider, endpoint);
        }catch(err){ updateHudUI("ERR:" + err.message, true); }
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
        // Cohere - FREE 1000 calls/month!
        url = "https://api.cohere.ai/v1/chat";
        body = {model: "command-r-plus", message: "PROMPT:\n" + prompt + "\n\nDATA:\n" + data, max_tokens: 1500};
        modelName = "Command R+";
        headers["Authorization"] = "Bearer " + key;
    }else{
        // Groq default
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
            content = d.text || (d.message ? d.message.content : "") || (d.generations && d.generations[0] ? d.generations[0].text : "") || "Error: " + JSON.stringify(d).substring(0, 200);
        }else{
            content = d.choices && d.choices[0] ? d.choices[0].message.content : (d.error ? d.error.message : "Error: " + JSON.stringify(d).substring(0, 200));
        }
        
        document.getElementById("ai-result-screen").innerText = "[Provider:" + provider + "]\nModel:" + modelName + "\n\n" + content;
    }catch(e){
        document.getElementById("ai-result-screen").innerText = "ERROR: " + e.message;
    }
}