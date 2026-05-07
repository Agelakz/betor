// BETOR - Simple Test
(function() {
    console.log('[BETOR] Loading...');
    alert('BETOR: Loading!');
    
    var widget = document.createElement('div');
    widget.id = 'betor-widget';
    widget.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999999;background:#1a1a2e;border-radius:12px;padding:0;width:280px;color:#fff;font-family:Arial;';
    
    widget.innerHTML = '<div style="background:linear-gradient(90deg,#ff6b35,#f7931e);padding:10px;cursor:pointer;" id="betor-header"><strong>BETOR AI</strong></div>' +
        '<div style="padding:10px;" id="betor-body">' +
        '<select id="api-provider" style="width:100%;padding:8px;margin:8px 0;background:#333;color:#fff;border:1px solid #555;"><option value="cohere">Cohere</option><option value="groq">Groq</option></select>' +
        '<input type="password" id="hud-api-key" placeholder="API Key" style="width:100%;padding:8px;margin:8px 0;background:#333;color:#fff;border:1px solid #555;">' +
        '<button id="ai-btn-record" style="width:100%;padding:10px;margin:5px 0;background:#667eea;color:#fff;border:none;">REKAM</button>' +
        '<button id="ai-btn-analyze" style="width:100%;padding:12px;margin:5px 0;background:#10b981;color:#fff;border:none;font-weight:bold;">ANALYZE</button>' +
        '<button id="ai-btn-test" style="width:100%;padding:10px;margin:5px 0;background:#666;color:#fff;border:none;">TEST</button>' +
        '<button id="ai-btn-clear" style="padding:8px;margin:5px 5px 5px 0;background:#ef4444;color:#fff;border:none;">DEL</button>' +
        '<button id="ai-btn-save" style="padding:8px;margin:5px 0;background:#f59e0b;color:#fff;border:none;">SAVE</button>' +
        '<div id="ai-result-screen" style="background:#000;padding:10px;margin-top:10px;height:120px;overflow-y:auto;color:#22c55e;font-size:12px;">[ BETOR READY ]</div>' +
        '</div>';
    
    function init() {
        if(document.body) {
            document.body.appendChild(widget);
            alert('BETOR: Added!');
            console.log('[BETOR] Added!');
        } else {
            setTimeout(init, 500);
        }
    }
    init();
})();
