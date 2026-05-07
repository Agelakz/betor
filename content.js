// Groq Stake Extension - Clean Version
var scrapedMemory = [];
var activeApiKey = "";
var isMinimized = false;
var isProcessing = false;
var savedAnalysis = [];

// Widget
var widget = document.createElement("div");
widget.id = "ai-command-widget";
widget.innerHTML = '<div id="ai-widget-container" style="background:#111827;color:#fff;border:1px solid #374151;border-radius:8px;width:320px;"><div id="ai-btn-toggle" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #374151;cursor:pointer;background:#1f2937;"><strong style="color:#f59e0b;">GROQ VIP</strong><span id="ai-toggle-icon">[-]</span></div><div id="ai-widget-body" style="padding:12px;"><select id="api-provider" style="width:93%;padding:5px;margin-bottom:5px;background:#374151;color:#fff;border:1px solid #4b5563;"><option value="groq">Groq (Default)</option><option value="ollama">Ollama (Lokal/Gratis)</option><option value="openai">OpenAI Compatible</option></select><input type="password" id="hud-api-key" placeholder="API Key" style="width:93%;padding:8px;margin-bottom:8px;background:#374151;color:#fff;"><input type="text" id="api-endpoint" placeholder="Endpoint URL" style="width:93%;padding:8px;margin-bottom:8px;background:#374151;color:#fff;display:none;"><button id="ai-btn-record" style="width:100%;margin-bottom:8px;background:#3b82f6;color:#fff;border:none;padding:10px;cursor:pointer;">[RECORD]</button><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-analyze" style="flex:2;background:#10b981;color:#fff;border:none;padding:8px;cursor:pointer;">[ANALYZE]</button><button id="ai-btn-clear" style="flex:1;background:#ef4444;color:#fff;border:none;padding:8px;cursor:pointer;">[DEL]</button></div><div style="display:flex;gap:5px;margin-bottom:8px;"><button id="ai-btn-save" style="flex:1;background:#f59e0b;color:#fff;border:none;padding:8px;cursor:pointer;">[SAVE]</button><button id="ai-btn-history" style="flex:1;background:#6366f1;color:#fff;border:none;padding:8px;cursor:pointer;">[HIST]</button><button id="ai-btn-export" style="flex:1;background:#8b5cf6;color:#fff;border:none;padding:8px;cursor:pointer;">[COPY]</button></div><div id="ai-result-screen" style="background:#000;padding:8px;border-radius:4px;height:200px;overflow-y:auto;white-space:pre-wrap;color:#34d399;font-family:monospace;">[READY]</div><div id="ai-history-panel" style="display:none;background:#1f2937;padding:8px;margin-top:8px;max-height:150px;overflow-y:auto;"></div></div></div>';

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
    var btns = ["ai-btn-analyze","ai-btn-record","ai-btn-export","ai-btn-save","ai-btn-history","ai-btn-clear"];
    isProcessing = isLoading;
    btns.forEach(function(id){
        var btn = document.getElementById(id);
        if(btn) btn.disabled = isLoading;
    });
    if(screen) screen.style.color = isLoading ? "#fbbf24" : "#34d399";
}

function updateHudUI(msg, append){
    var mem = document.getElementById("ai-mem-status");
    var screen = document.getElementById("ai-result-screen");
    if(mem) mem.innerText = "Mem:" + scrapedMemory.length;
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
    if(btns.length === 0) throw new Error("Data tidak ditemukan");
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

document.addEventListener("click", async function(e){
    if(e.target && e.target.closest("#ai-btn-toggle")){
        var body = document.getElementById("ai-widget-body");
        var icon = document.getElementById("ai-toggle-icon");
        if(!isMinimized){
            body.style.display = "none";
            icon.innerText = "[+]";
            isMinimized = true;
        }else{
            body.style.display = "block";
            icon.innerText = "[-]";
            isMinimized = false;
        }
        return;
    }
    if(e.target && e.target.id === "api-provider"){
        var provider = e.target.value;
        var endpoint = document.getElementById("api-endpoint");
        if(provider === "ollama"){
            endpoint.style.display = "block";
            endpoint.placeholder = "http://localhost:11434";
        }else if(provider === "openai"){
            endpoint.style.display = "block";
            endpoint.placeholder = "https://your-api.com/v1";
        }else{
            endpoint.style.display = "none";
        }
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
        }catch(err){
            updateHudUI("ERR:" + err.message, true);
        }finally{
            setLoading(false);
        }
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
        if(txt.length < 50){
            updateHudUI("WARN:No data", true);
            return;
        }
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
        if(panel && panel.style.display === "none"){
            if(chrome && chrome.storage){
                chrome.storage.local.get(["groqSavedAnalysis"], function(res){
                    savedAnalysis = res.groqSavedAnalysis || [];
                    var html = savedAnalysis.length === 0 ? "<div>Empty</div>" : "";
                    savedAnalysis.slice().reverse().forEach(function(it){
                        html += "<div onclick='loadH(" + it.id + ")' style='cursor:pointer;padding:5px;margin:3px;background:#374151;'>" + it.waktu + "</div>";
                    });
                    panel.innerHTML = html;
                    panel.style.display = "block";
                });
            }
        }else if(panel){
            panel.style.display = "none";
        }
        return;
    }
    window.loadH = function(id){
        var it = savedAnalysis.find(function(x){ return x.id === id; });
        if(it){
            var s = document.getElementById("ai-result-screen");
            if(s) s.innerText = it.hasil;
            var p = document.getElementById("ai-history-panel");
            if(p) p.style.display = "none";
            updateHudUI("Loaded", true);
        }
    };
    if(e.target && e.target.id === "ai-btn-export"){
        var s = document.getElementById("ai-result-screen");
        var t = s ? s.innerText : "";
        try{
            navigator.clipboard.writeText(t);
            updateHudUI("Copied!", true);
        }catch(err){
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
        }catch(err){
            updateHudUI("ERR:" + err.message, true);
        }finally{
            setLoading(false);
        }
        return;
    }
});

async function analyzeWithAPI(key, data, provider, endpoint){
    var prompt = "HITUNG SENDIRI! Jangan asal ambil.\n\nLANGKAH:\n1. Prob = (1/Odds)x100%\n2. Risk: >50%=RENDAH, 30-50%=SEDANG, <30%=TINGGI\n3. Kelly: prob x odds >1 = VALUE, <1 = SKIP.\n\nFORMAT WAJIB:\nRECOMMENDED: [HOME/DRAW/AWAY]@odds - prob% - alasan\nOU: [OVER/UNDER]@odds - prob% - alasan\nBTTS: [YES/NO]@odds - prob% - alasan\nRISK: [RENDAH/SEDANG/TINGGI]\nKELLY: [2%|3%|4%|5%|SKIP]";
    var url, body;
    
    // Determine endpoint based on provider
    if(provider === "ollama"){
        url = (endpoint || "http://localhost:11434") + "/api/chat";
        body = {model: "llama3.1", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], stream: false};
    }else if(provider === "openai"){
        url = (endpoint || "https://api.openai.com/v1/chat/completions") + "/chat/completions";
        body = {model: "gpt-4o", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], max_tokens: 1500};
    }else{
        // Groq default
        url = "https://api.groq.com/openai/v1/chat/completions";
        body = {model: "llama-3.3-70b-versatile", messages: [{role: "system", content: prompt}, {role: "user", content: "DATA:\n" + data}], temperature: 0, max_tokens: 1500};
    }
    
    try{
        var headers = {"Content-Type": "application/json"};
        if(provider !== "ollama") headers["Authorization"] = "Bearer " + key;
        
        var res = await fetch(url, {method: "POST", headers: headers, body: JSON.stringify(body)});
        var d = await res.json();
        
        var content = "";
        if(provider === "ollama"){
            content = d.message ? d.message.content : "";
        }else{
            content = d.choices[0] ? d.choices[0].message.content : "";
        }
        
        document.getElementById("ai-result-screen").innerText = "[PROVIDER:" + provider + " MODEL:" + (provider==="ollama"?"llama3.1":(provider==="openai"?"gpt-4o":"llama-3.3-70b")) + "]\n\n" + content;
    }catch(e){
        document.getElementById("ai-result-screen").innerText = "ERROR: " + e.message;
    }
}

async function analyzeWithGroq(key, data){
    // Use bigger model for better output\nvar prompt = "HITUNG SENDIRI! Jangan asal ambil dari data.\n\nLANGKAH:\n1. HITUNG PROBABILITAS: Prob = (1/Odds) x 100%\n2. TENTUKAN RISK: Prob>50%=RENDAH, 30-50%=SEDANG, <30%=TINGGI\n3. HITUNG KELLY: Kalau prob x odds > 1, ADA VALUE. Kalau prob x odds < 1, SKIP.\n\nFORMAT WAJIB (TULIS INI SAJA):\nRECOMMENDED: [HOME/DRAW/AWAY/TIDAK]@odds - prob[%] - alasan\nOU: [OVER/UNDER] line@odds - prob[%] - alasan\nBTTS: [YES/NO]@odds - prob[%] - alasan\nRISK: [RENDAH/SEDANG/TINGGI]\nKELLY: [2%|3%|4%|5%|SKIP]";;
    var models = ["llama-3.3-70b-versatile"]; // Best model
var togetherModels = ["Meta-Llama-3.1-70B-Instruct", "Mistral-7B-Instruct-v0.1"];
    var ok = false;
    data = data.replace(/\s+/g, " ").trim();
    for(var i = 0; i < models.length; i++){
        var m = models[i];
        updateHudUI("Calling " + m + "...", true);
        try{
            var c = new AbortController();
            var to = setTimeout(function(){ c.abort(); }, 30000);
            var res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {"Content-Type": "application/json", "Authorization": "Bearer " + key},
                body: JSON.stringify({
                    model: m,
                    messages: [
                        {role: "system", content: prompt},
                        {role: "user", content: "DATA:\n" + data}
                    ],
                    temperature: 0,
                    max_tokens: 1500
                }),
                signal: c.signal
            });
            clearTimeout(to);
            var d = await res.json();
            if(res.ok){
                var content = d.choices[0] ? d.choices[0].message.content : "";
                document.getElementById("ai-result-screen").innerText = "[MODEL:" + m + "]\n\n" + content;
                ok = true;
                break;
            }else{
                if(res.status === 429){
                    updateHudUI("Limit " + m, true);
                    await new Promise(function(r){ setTimeout(r, 1500); });
                    continue;
                }
                throw new Error(d.error ? d.error.message : "Error");
            }
        }catch(e){
            updateHudUI("ERR:" + e.message, true);
        }
    }
    if(!ok){
    // Try Together AI as backup
    updateHudUI("Trying Together AI...", true);
    for(var j=0; j<togetherModels.length; j++){
        var tm = togetherModels[j];
        try{
            var res = await fetch("https://api.together.ai/v1/chat/completions", {
                method: "POST",
                headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
                body:JSON.stringify({model:tm,messages:[{role:"system",content:prompt},{role:"user",content:"DATA:\n"+data}],max_tokens:1500})
            });
            var td = await res.json();
            if(res.ok){
                var c = td.choices[0]?td.choices[0].message.content:"";
                document.getElementById("ai-result-screen").innerText = "[MODEL:"+tm+"]\n\n"+c;
                ok = true; break;
            }
        }catch(e){ updateHudUI("ERR"+tm+":"+e.message, true); }
    }
}
if(!ok) updateHudUI("FAILED", true);
}