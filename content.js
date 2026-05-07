// BETOR Extension v10 - DEBUG VERSION
// ==============================

console.log('[BETOR] v10: Script loaded');

// Function to initialize
function betorInit() {
    console.log('[BETOR] init called');
    
    // Check if already exists
    if (document.getElementById('betor-widget')) {
        console.log('[BETOR] Widget already exists');
        return;
    }
    
    // Create widget element
    var widget = document.createElement('div');
    widget.id = 'betor-widget';
    
    // Set styles
    var style = widget.style;
    style.cssText = 'position:fixed !important;bottom:20px !important;left:20px !important;z-index:2147483647 !important;background:#1a1a2e !important;border-radius:12px !important;padding:0 !important;width:280px !important;color:#fff !important;font-family:Arial,sans-serif !important;box-shadow:0 4px 20px rgba(0,0,0,0.5) !important;';
    style.display = 'block';
    style.visibility = 'visible';
    
    // Build HTML
    var html = '';
    html += '<div id="betor-header" style="background:linear-gradient(90deg,#ff6b35,#f7931e) !important;padding:10px !important;cursor:pointer !important;font-weight:bold !important;">BETOR AI v10</div>';
    html += '<div id="betor-body" style="padding:10px !important;">';
    html += '<div id="betor-status" style="margin-bottom:10px;font-size:11px;color:#0f0;">[v10 Ready]</div>';
    html += '<select id="api-provider" style="width:100%;padding:8px;margin:8px 0;background:#333;color:#fff;border:1px solid #555;">';
    html += '<option value="cohere">Cohere (FREE)</option>';
    html += '<option value="groq">Groq</option>';
    html += '</select>';
    html += '<input type="password" id="hud-api-key" placeholder="API Key" style="width:100%;padding:8px;margin:8px 0;background:#333;color:#fff;border:1px solid #555;">';
    html += '<button id="ai-btn-record" style="width:100%;padding:10px;margin:5px 0;background:#667eea;color:#fff;border:none;">REKAM - Test</button>';
    html += '<button id="ai-btn-analyze" style="width:100%;padding:12px;margin:5px 0;background:#10b981;color:#fff;border:none;font-weight:bold;">ANALYZE</button>';
    html += '<button id="ai-btn-test" style="width:100%;padding:10px;margin:5px 0;background:#666;color:#fff;border:none;">TEST</button>';
    html += '<button id="ai-btn-clear" style="padding:8px;margin:5px 5px 5px 0;background:#ef4444;color:#fff;border:none;">DEL</button>';
    html += '<button id="ai-btn-save" style="padding:8px;margin:5px 0;background:#f59e0b;color:#fff;border:none;">SAVE</button>';
    html += '<div id="ai-result-screen" style="background:#000;padding:10px;margin-top:10px;height:120px;overflow-y:auto;color:#22c55e;font-size:12px;font-family:monospace;">[ BETOR v10 READY ]\nCoba tekan TEST</div>';
    html += '</div>';
    
    widget.innerHTML = html;
    
    // Try to append
    try {
        if (document.body) {
            document.body.appendChild(widget);
            console.log('[BETOR] Widget appended to body');
            
            // Add click handlers
            document.getElementById('ai-btn-record').onclick = function() {
                console.log('[BETOR] REKAM clicked');
                document.getElementById('ai-result-screen').innerText = '[TEST] REKAM WORK!\nCoba tekan ANALYZE atau TEST';
            };
            
            document.getElementById('ai-btn-test').onclick = function() {
                console.log('[BETOR] TEST clicked');
                var provider = document.getElementById('api-provider').value;
                document.getElementById('ai-result-screen').innerText = '[TEST MODE]\nProvider: ' + provider + '\n\nScript: OK\nWidget: OK\nClick: OK';
            };
            
            document.getElementById('ai-btn-analyze').onclick = function() {
                var key = document.getElementById('hud-api-key').value;
                if (!key) {
                    alert('Masukkan API Key!');
                    return;
                }
                document.getElementById('ai-result-screen').innerText = 'Processing...\nProvider: ' + document.getElementById('api-provider').value;
            };
            
            document.getElementById('ai-btn-clear').onclick = function() {
                document.getElementById('ai-result-screen').innerText = '[CLEARED]';
            };
            
            document.getElementById('ai-btn-save').onclick = function() {
                document.getElementById('ai-result-screen').innerText = '[SAVED]';
            };
            
            // Toggle body
            document.getElementById('betor-header').onclick = function() {
                var body = document.getElementById('betor-body');
                body.style.display = body.style.display === 'none' ? 'block' : 'none';
            };
            
            console.log('[BETOR] All handlers added');
            document.getElementById('betor-status').innerText = '[v10 Ready - Click TEST]';
            
        } else {
            console.log('[BETOR] No body, retrying...');
            setTimeout(betorInit, 1000);
        }
    } catch(e) {
        console.log('[BETOR] Error: ' + e.message);
    }
}

// Try to start
console.log('[BETOR] About to call init');
setTimeout(betorInit, 500);
setTimeout(betorInit, 2000);
setTimeout(betorInit, 5000);

// Also try on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', betorInit);
} else {
    betorInit();
}

console.log('[BETOR] Init scheduled');
