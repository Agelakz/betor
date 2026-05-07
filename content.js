// BETOR Extension v11 - SMALL & STABLE
// ==============================

console.log('[BETOR] v11: Loaded');

function betorInit() {
    if (document.getElementById('betor-widget')) return;
    
    var widget = document.createElement('div');
    widget.id = 'betor-widget';
    
    // SMALLER - 240px width
    widget.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:2147483647;background:#1a1a2e;border-radius:8px;width:240px;color:#fff;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.5);font-size:12px;';
    
    // Build compact HTML
    widget.innerHTML = '<div id="bh" style="background:#ff6b35;padding:8px;font-weight:bold;cursor:pointer;">BETOR <span id="bs">[▼]</span></div>' +
        '<div id="bb" style="padding:8px;">' +
        '<select id="ap" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;"><option value="cohere">Cohere</option><option value="groq">Groq</option></select>' +
        '<input type="password" id="ak" placeholder="API Key" style="width:100%;padding:4px;margin-bottom:4px;background:#333;color:#fff;border:1px solid #555;">' +
        '<button id="ar" style="width:48%;padding:6px;background:#667eea;color:#fff;border:none;">REKAM</button>' +
        '<button id="aa" style="width:48%;padding:6px;background:#10b981;color:#fff;border:none;">GO</button>' +
        '<div id="as" style="background:#000;padding:6px;margin-top:6px;height:80px;overflow-y:auto;color:#22c55e;font-size:11px;">[READY]\nTekan REKAM untuk scrape</div>' +
        '</div>';
    
    try {
        document.body.appendChild(widget);
        console.log('[BETOR] Widget added');
        
        // Toggle
        document.getElementById('bh').onclick = function() {
            var bb = document.getElementById('bb');
            var bs = document.getElementById('bs');
            bb.style.display = bb.style.display === 'none' ? 'block' : 'none';
            bs.innerText = bb.style.display === 'none' ? '[▲]' : '[▼]';
        };
        
        // REKAM - scrape data
        document.getElementById('ar').onclick = function() {
            console.log('[BETOR] REKAM clicked');
            var screen = document.getElementById('as');
            screen.innerText = 'Scraping...\n';
            
            try {
                var btns = document.querySelectorAll("button[data-testid='fixture-outcome']");
                if (!btns.length) btns = document.querySelectorAll("button[class*='odd']");
                if (!btns.length) btns = document.querySelectorAll("[class*='market'] button");
                
                var data = [];
                btns.forEach(function(b) {
                    var txt = b.innerText.trim();
                    if (txt && !isNaN(txt) && parseFloat(txt) > 1 && parseFloat(txt) < 15) {
                        data.push(txt);
                    }
                });
                
                if (data.length > 0) {
                    screen.innerText = 'OK: ' + data.length + ' odds\n' + data.slice(0,5).join(', ');
                } else {
                    screen.innerText = 'Cari odds...';
                    // Try all buttons
                    var allBtns = document.querySelectorAll('button');
                    var odds = [];
                    allBtns.forEach(function(b) {
                        var t = b.innerText.trim();
                        if (t && !isNaN(t) && parseFloat(t) > 1.01 && parseFloat(t) < 15) odds.push(t);
                    });
                    screen.innerText = 'OK: ' + odds.length + ' found\n' + odds.slice(0,8).join(', ');
                }
            } catch(e) {
                screen.innerText = 'ERR: ' + e.message;
            }
        };
        
        // ANALYZE
        document.getElementById('aa').onclick = function() {
            var key = document.getElementById('ak').value;
            var provider = document.getElementById('ap').value;
            var screen = document.getElementById('as');
            
            if (!key) {
                screen.innerText = 'ERROR: Masukin API Key!';
                return;
            }
            
            screen.innerText = 'Processing...\n' + provider;
            console.log('[BETOR] ANALYZE: ' + provider);
        };
        
        document.getElementById('as').innerText = '[v11 Ready]\nTekan REKAM';
        
    } catch(e) {
        console.log('[BETOR] Error: ' + e.message);
    }
}

setTimeout(betorInit, 500);
setTimeout(betorInit, 2000);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', betorInit);
} else {
    betorInit();
}
