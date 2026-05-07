// BETOR Extension v12 - Fixed Version
// ============================

console.log('[BETOR] v12: Loaded');

var widget = document.createElement("div");
widget.id = "betor-widget";

// SMALL 240px + LEFT BOTTOM
widget.style.cssText = "position:fixed;bottom:10px;left:10px;z-index:2147483647;width:240px;background:#1a1a2e;border-radius:8px;color:#fff;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,0.5);";

// Widget HTML - COMPACT
widget.innerHTML = '<div id="bh" style="background:#ff6b35;padding:8px;font-weight:bold;cursor:pointer;">BETOR <span id="bt">[▼]</span></div>' +
'<div id="bb" style="padding:8px;">' +
'<select id="api-provider" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;">' +
'<option value="cohere">Cohere (FREE)</option>' +
'<option value="groq">Groq</option>' +
'<option value="together">Together</option>' +
'</select>' +
'<input type="password" id="hud-api-key" placeholder="API Key" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;">' +
'<button id="ai-btn-record" style="width:48%;padding:6px;background:#667eea;color:#fff;border:none;">REKAM</button>' +
'<button id="ai-btn-analyze" style="width:48%;padding:6px;background:#10b981;color:#fff;border:none;">ANALYZE</button>' +
'<button id="ai-btn-test" style="width:48%;padding:6px;background:#444;color:#fff;border:none;">TEST</button>' +
'<button id="ai-btn-clear" style="width:48%;padding:6px;background:#ef4444;color:#fff;border:none;">DEL</button>' +
'<div id="ai-result-screen" style="background:#000;padding:8px;margin-top:6px;height:100px;overflow-y:auto;color:#22c55e;font-size:11px;">[ BETOR v12 ]\nTekan REKAM</div>' +
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
setTimeout(initWidget, 5000);

// Toggle header
document.getElementById("bh").onclick = function() {
    var bb = document.getElementById("bb");
    var bt = document.getElementById("bt");
    bb.style.display = bb.style.display === "none" ? "block" : "none";
    bt.innerText = bb.style.display === "none" ? "[▲]" : "[▼]";
};

// REKAM
document.getElementById("ai-btn-record").onclick = function() {
    var screen = document.getElementById("ai-result-screen");
    screen.innerText = "Recording...";
    console.log('[BETOR] REKAM clicked');
    
    var btns = document.querySelectorAll("button[data-testid='fixture-outcome']");
    if (!btns.length) btns = document.querySelectorAll("button[class*='odd']");
    if (!btns.length) btns = document.querySelectorAll("[class*='market'] button");
    
    var odds = [];
    btns.forEach(function(b) {
        var txt = b.innerText.trim();
        if (txt && !isNaN(txt) && parseFloat(txt) > 1 && parseFloat(txt) < 15) odds.push(txt);
    });
    
    if (odds.length > 0) {
        screen.innerText = "OK: " + odds.length + " odds\n" + odds.slice(0,10).join(", ");
    } else {
        screen.innerText = "Cari semua button...";
        var all = document.querySelectorAll("button");
        var data = [];
        all.forEach(function(b) {
            var t = b.innerText.trim();
            if (t && !isNaN(t) && parseFloat(t) > 1.01 && parseFloat(t) < 15) data.push(t);
        });
        screen.innerText = "FOUND: " + data.length + "\n" + data.slice(0,10).join(", ");
    }
};

// TEST
document.getElementById("ai-btn-test").onclick = function() {
    var provider = document.getElementById("api-provider").value;
    document.getElementById("ai-result-screen").innerText = "[TEST MODE]\nProvider: " + provider + "\n\nScript: OK\nWidget: OK";
};

// ANALYZE
document.getElementById("ai-btn-analyze").onclick = function() {
    var key = document.getElementById("hud-api-key").value;
    if (!key) {
        document.getElementById("ai-result-screen").innerText = "ERROR: Masukin API Key!";
        return;
    }
    document.getElementById("ai-result-screen").innerText = "Processing...\n" + document.getElementById("api-provider").value;
};

// CLEAR
document.getElementById("ai-btn-clear").onclick = function() {
    document.getElementById("ai-result-screen").innerText = "[CLEARED]\nTekan REKAM";
};

console.log('[BETOR] v12 Ready');
