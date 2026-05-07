// Menggunakan 'var' agar tidak error saat ekstensi di-reload (Anti-Crash)
var scrapedMemory = [];
var activeApiKey = ""; 
var isMinimized = false;
var isProcessing = false;
var savedAnalysis = [];

// =========================================================================
// 1. PEMBUATAN WIDGET HUD
// =========================================================================
var widget = document.createElement('div');
widget.id = "ai-command-widget";
widget.innerHTML = `
  <div id="ai-widget-container" style="background: #111827; color: white; border: 1px solid #374151; border-radius: 8px; width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); font-family: sans-serif; font-size: 12px; transition: width 0.3s ease;">
    <div id="ai-btn-toggle" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #374151; cursor: pointer; background: #1f2937; border-radius: 8px 8px 0 0;">
      <strong style="color: #f59e0b;">🚀 GROQ COMMAND FINAL (FORM VIP)</strong>
      <div style="display: flex; gap: 10px; align-items: center; pointer-events: none;">
         <span id="ai-mem-status" style="color: #fbbf24; font-size: 10px; font-weight:bold;">Memori: 0</span>
         <span id="ai-toggle-icon" style="color: white; font-weight: bold; font-size: 14px;">[—]</span>
      </div>
    </div>
    <div id="ai-widget-body" style="padding: 12px; display: block;">
        <input type="password" id="hud-api-key" placeholder="Paste Groq API Key di sini" style="width: 93%; padding: 8px; margin-bottom: 8px; background: #374151; color: white; border: 1px solid #4b5563; border-radius: 4px;">
        <button id="ai-btn-record" style="width: 100%; margin-bottom: 8px; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">📸 REKAM DATA MARKET</button>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <button id="ai-btn-analyze" style="flex: 2; background: #10b981; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">⚙️ ANALISIS PARLAY</button>
          <button id="ai-btn-clear" style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">🗑️ HAPUS</button>
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <button id="ai-btn-save" style="flex: 1; background: #f59e0b; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">💾 SIMPAN</button>
          <button id="ai-btn-history" style="flex: 1; background: #6366f1; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">📁 HISTORY</button>
          <button id="ai-btn-export" style="flex: 1; background: #8b5cf6; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">📋 EXPORT</button>
        </div>
        <div id="ai-result-screen" style="background: #000000; padding: 8px; border-radius: 4px; height: 220px; overflow-y: auto; white-space: pre-wrap; color: #34d399; font-family: monospace; border: 1px solid #065f46;">[GROQ READY] - Masukkan Key lalu Rekam.</div>
        <div id="ai-history-panel" style="display: none; background: #1f2937; padding: 8px; border-radius: 4px; margin-top: 8px; max-height: 150px; overflow-y: auto;"></div>
    </div>
  </div>
`;

Object.assign(widget.style, { position: 'fixed', bottom: '20px', left: '20px', zIndex: '2147483647' });

function enforceHUD() {
    if (document.body && !document.getElementById('ai-command-widget')) {
        document.body.appendChild(widget);
        chrome.storage.local.get(['groqApiKey'], (res) => {
            if (res.groqApiKey) {
                activeApiKey = res.groqApiKey;
                document.getElementById('hud-api-key').value = activeApiKey;
            }
        });
    }
}
setInterval(enforceHUD, 1000);

function setLoading(isLoading) {
  const screen = document.getElementById('ai-result-screen');
  const btnAnalyze = document.getElementById('ai-btn-analyze');
  const btnRecord = document.getElementById('ai-btn-record');
  const btnExport = document.getElementById('ai-btn-export');
  const btnSave = document.getElementById('ai-btn-save');
  const btnHistory = document.getElementById('ai-btn-history');
  const btnClear = document.getElementById('ai-btn-clear');
  
  isProcessing = isLoading;
  btnAnalyze.disabled = isLoading;
  btnRecord.disabled = isLoading;
  btnExport.disabled = isLoading;
  btnSave.disabled = isLoading;
  btnHistory.disabled = isLoading;
  btnClear.disabled = isLoading;
  
  if (isLoading) {
    screen.style.color = '#fbbf24';
  } else {
    screen.style.color = '#34d399';
  }
}

function updateHudUI(message, append = false) {
  const memStatus = document.getElementById('ai-mem-status');
  const screen = document.getElementById('ai-result-screen');
  if(memStatus) memStatus.innerText = `Memori: ${scrapedMemory.length}`;
  if(screen && message) {
    if (append) {
      let time = new Date().toLocaleTimeString();
      screen.innerText = `[${time}] ${message}\n\n` + screen.innerText.substring(0, 1500); 
    } else {
      screen.innerText = message;
    }
  }
}

// =========================================================================
// 2. SCRAPER DATA-TESTID (DENGAN FALLBACK)
// =========================================================================
function scrapeStakeData() {
  let result = [];
  
  // Cara 1: Pakai data-testid (utama)
  let oddsButtons = document.querySelectorAll('button[data-testid="fixture-outcome"]');
  
  // Cara 2: Fallback - cari button dengan atribut odds
  if (oddsButtons.length === 0) {
    oddsButtons = document.querySelectorAll('button[class*="odd"], [data-odds]');
  }
  
  // Cara 3: Fallback - semua button yang ada di market container
  if (oddsButtons.length === 0) {
    oddsButtons = document.querySelectorAll('[class*="market"] button, [class*="event"] button');
  }
  
  // Cara 4: Last resort - semua button dengan angka odds (>1.01)
  if (oddsButtons.length === 0) {
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
      const text = btn.innerText?.trim();
      if (text && !isNaN(text) && parseFloat(text) > 1.01 && parseFloat(text) < 15) {
        oddsButtons.push(btn);
      }
    });
  }
  
  if (oddsButtons.length === 0) throw new Error("Data market tidak ditemukan. Pastikan halaman sudah terbuka.");

  let matchGroups = new Map();
  oddsButtons.forEach(btn => {
      let parentBox = btn.closest('.market, [data-testid="market-row"]') || btn.parentElement;
      if (!matchGroups.has(parentBox)) matchGroups.set(parentBox, []);
      
      let teamName = btn.querySelector('[data-testid="outcome-button-name"]')?.innerText.trim() || btn.innerText.split('\n')[0]?.trim() || 'X';
      let oddsValue = btn.querySelector('[data-testid="fixture-odds"]')?.innerText.trim() || btn.innerText.trim();
      
      // Cek apakah ini benar angka odds
      if (!isNaN(oddsValue) && parseFloat(oddsValue) > 1) {
        matchGroups.get(parentBox).push(`${teamName}: ${oddsValue}`);
      }
  });

  matchGroups.forEach((oddsArray, key) => {
      if (oddsArray.length > 0) {
        result.push(`MATCH_DATA: ` + oddsArray.join(' | '));
      }
  });

  // Ngebuang data yang kembar
  let uniqueResult = result.filter((item, index) => result.indexOf(item) === index);

  return uniqueResult.join('\n');
}

// =========================================================================
// 3. PENYADAP DATA H2H (DENGAN MULTI-FALLBACK)
// =========================================================================
async function getLiveH2H() {
  try {
    let bodyText = document.body.innerText || "";
    
    // Coba berbagai pattern pencarian
    let h2hPatterns = [
      "HEAD TO HEAD",
      "PREVIOUS MEETINGS", 
      "H2H",
      "Past Encounters",
      "Team News",
      "Lineups"
    ];
    
    let h2hIndex = -1;
    let foundPattern = "";
    
    for (let pattern of h2hPatterns) {
      let idx = bodyText.indexOf(pattern);
      if (idx !== -1) {
        h2hIndex = idx;
        foundPattern = pattern;
        break;
      }
    }
    
    if (h2hIndex !== -1) {
        // Potongannya dilebarin jadi 2000 karakter biar data "FORM" di bawah nggak kepotong!
        let rawH2H = bodyText.substring(h2hIndex, h2hIndex + 2000);
        let cleanH2H = rawH2H.replace(/\n+/g, ' | ').replace(/\s+/g, ' ').substring(0, 1800);
        return `DATA (${foundPattern}):\n${cleanH2H}`;
    } else {
        // Coba cari dari tab/section yang visible
        const h2hSection = document.querySelector('[class*="h2h"], [class*="head"], [data-tab="h2h"], [data-panel*="history"]');
        if (h2hSection) {
          return `DATA (DARI SECTION):\n${h2hSection.innerText.substring(0, 1800)}`;
        }
        return "INFO: Menu H2H belum dibuka. Klik tab 'Head to Head' di kanan layar untuk melihat data.";
    }
  } catch (err) {
    return `INFO: Gagal sadap (${err.message})`;
  }
}

// =========================================================================
// 4. LOGIKA TOMBOL (DENGAN EXPORT & LOADING STATE)
// =========================================================================
document.addEventListener('click', async (event) => {
    if (event.target && event.target.closest('#ai-btn-toggle')) {
        const body = document.getElementById('ai-widget-body');
        const icon = document.getElementById('ai-toggle-icon');
        const container = document.getElementById('ai-widget-container');
        if (!isMinimized) {
            body.style.display = 'none'; icon.innerText = '[+]'; container.style.width = '200px'; isMinimized = true;
        } else {
            body.style.display = 'block'; icon.innerText = '[—]'; container.style.width = '320px'; isMinimized = false;
        }
        return;
    }

    if (event.target && event.target.id === 'ai-btn-record') {
        if (isProcessing) return;
        try {
            setLoading(true);
            updateHudUI("⏳ Merekam data market...");
            let cleanData = scrapeStakeData();
            scrapedMemory.push(cleanData);
            updateHudUI(`✅ SUKSES: ${cleanData.split('\n').length} market terekam.`, true);
        } catch (error) { 
            updateHudUI(`❌ ERROR: ${error.message}`, true); 
        } finally {
            setLoading(false);
        }
        return;
    }

    if (event.target && event.target.id === 'ai-btn-clear') {
        scrapedMemory = []; 
        updateHudUI("🗑️ Memori dihapus.", true);
        return;
    }

    if (event.target && event.target.id === 'ai-btn-save') {
        const screen = document.getElementById('ai-result-screen');
        const resultText = screen.innerText;
        if (resultText.length < 50 || resultText.includes('READY')) {
            updateHudUI("⚠️ Tidak ada hasil untuk disimpan!", true);
            return;
        }
        
        const saveData = {
            id: Date.now(),
            waktu: new Date().toLocaleString(),
            hasil: resultText
        };
        
        savedAnalysis.push(saveData);
        
        chrome.storage.local.set({ groqSavedAnalysis: savedAnalysis }, () => {
            updateHudUI(`💾 Disimpan! (${savedAnalysis.length} hasil)`, true);
        });
        return;
    }

    if (event.target && event.target.id === 'ai-btn-history') {
        const panel = document.getElementById('ai-history-panel');
        
        if (panel.style.display === 'none') {
            chrome.storage.local.get(['groqSavedAnalysis'], (res) => {
                savedAnalysis = res.groqSavedAnalysis || [];
                if (savedAnalysis.length === 0) {
                    panel.innerHTML = '<div style="color:#fbbf24">📭 Belum ada hasil tersimpan.</div>';
                } else {
                    let html = '<div style="font-size:10px; font-weight:bold; margin-bottom:5px; color:#fbbf24;">📁 HISTORY (' + savedAnalysis.length + '):</div>';
                    savedAnalysis.slice().reverse().forEach((item, idx) => {
                        let matchName = item.hasil.match(/MATCH:\s*(.+)/)?.[1] || 'Match ' + (savedAnalysis.length - idx);
                        let prediksi = item.hasil.match(/PREDIKSI:\s*(.+)/)?.[1] || '';
                        let risk = item.hasil.match(/RISK:\s*(.+)/)?.[1] || '';
                        
                        html += `<div style="background:#374151; padding:5px; margin:3px 0; border-radius:3px; cursor:pointer;" onclick="loadHistory(${item.id})">
                            <div style="color:#fbbf24; font-size:10px;">${item.waktu}</div>
                            <div style="color:#10b981; font-size:11px;">${matchName.substring(0,40)}</div>
                            <div style="color:#9ca3af; font-size:10px;">${prediksi.substring(0,50)} | ${risk}</div>
                        </div>`;
                    });
                }
                panel.innerHTML = html;
                panel.style.display = 'block';
            });
        } else {
            panel.style.display = 'none';
        }
        return;
    }

    window.loadHistory = function(id) {
        const item = savedAnalysis.find(s => s.id === id);
        if (item) {
            document.getElementById('ai-result-screen').innerText = item.hasil;
            document.getElementById('ai-history-panel').style.display = 'none';
            updateHudUI("📜 Hasil dimuat dari history.", true);
        }
    };

    if (event.target && event.target.id === 'ai-btn-export') {
        const screen = document.getElementById('ai-result-screen');
        const textToExport = screen.innerText;
        
        // Copy ke clipboard
        try {
            await navigator.clipboard.writeText(textToExport);
            updateHudUI("📋 Hasil disalin ke clipboard!", true);
        } catch (e) {
            // Fallback untuk browser lama
            const textarea = document.createElement('textarea');
            textarea.value = textToExport;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            updateHudUI("📋 Hasil disalin ke clipboard!", true);
        }
        return;
    }

    if (event.target && event.target.id === 'ai-btn-analyze') {
        if (isProcessing) return;
        try {
            const inputEl = document.getElementById('hud-api-key');
            activeApiKey = inputEl.value.trim();
            if (!activeApiKey) throw new Error("API Key Groq kosong.");
            if (scrapedMemory.length === 0) throw new Error("Belum ada data terekam. Klik 'REKAM' dulu.");

            setLoading(true);
            updateHudUI("⏳ Membaca layar H2H & FORM...");
            const liveH2H = await getLiveH2H();

            let finalDataToAI = scrapedMemory.join('\n\n') + "\n\n=== DATA TAMBAHAN ===\n" + liveH2H;

            updateHudUI("⏳ GROQ: Menganalisis Odds, H2H, & FORM...");
            await analyzeWithGroq(activeApiKey, finalDataToAI);
        } catch (error) { 
            updateHudUI(`❌ ERROR: ${error.message}`, true); 
        } finally {
            setLoading(false);
        }
        return;
    }
});

// =========================================================================
// 5. API KONEKSI GROQ (FORMAT STRICT "NO BET" & BLACKLIST LIGA)
// =========================================================================
async function analyzeWithGroq(key, pageData) {
  const systemPrompt = `ATURAN MUTLAK:
1. WAJIB 100% BAHASA INDONESIA!
2. DILARANG MENGGUNAKAN TAG THINKING.
3. BLACKLIST: Turki, Israel = NO BET.

PERAN: Analis Olahraga Pro, All Markets Expert.
TUGAS: Analisis SEMUA market (1x2, O/U, AH, BTTS, DC, GG), H2H, FORM.

ATURAN MATEMATIS:
1. ODDS ke Probabilitas Implisit SEMUA market.
2. Poisson + Monte Carlo dg FORM.
3. NO BET jika margin <3%.

FORMAT LAPORAN:
MATCH: [Home] vs [Away]
H2H: W-D-L & 5 match terakhir kedua tim
IMPLIED PROB:
  - 1x2: H% | D% | A%
  - OU variants: O1.5|U1.5, O2.0|U2.0, O2.5|U2.5, O3.0|U3.0, O3.5|U3.5, O4.0|U4.0
  - BTTS: Y% | N%
  - DC: 1X|12|X2
POISSON: 3 Skor + xG + Expected Score
PREDIKSI AKHIR:
  - 1x2: HOME/DRAW/AWAY or NO BET
  - BEST OU: [line] @[odds] - [OVER/UNDER]
  - BTTS: YES/NO @[odds]
  - AH: [handicap] @[odds]
  - DC: [double chance]
VALUE BET: urut highest value dgn odds + alasan
RISK: RENDAH/SEDANG/TINGGI + Kelly [2-5%] atau SKIP`;

  const groqModels = [
    "llama-3.3-70b-versatile", 
    "qwen/qwen3-32b",          
    "llama-3.1-8b-instant",     
    "openai/gpt-oss-120b"     
  ];

  let isSuccess = false;

  let compressedLogData = pageData.replace(/\s+/g, ' ').trim();

  for (let i = 0; i < groqModels.length; i++) {
    let currentModel = groqModels[i];
    updateHudUI(`⏳ GROQ: Memanggil [${currentModel}]...`, true);

    try {
      // Timeout 30 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: "system", content: systemPrompt }, 
            { role: "user", content: "DATA LOG:\n" + compressedLogData }
          ],
          temperature: 0.0, 
          max_tokens: 1500 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const d = await res.json();
      
      if (res.ok) {
          let rawResponse = d.choices[0]?.message?.content || "";
          // Hapus tag thinking
          let aiResponseText = rawResponse.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
          
          if (aiResponseText.length < 50) {
              updateHudUI(`⚠️ [${currentModel}] Jawaban zonk. Ganti model...`, true);
              continue; 
          }

          const modelIndicator = `[🤖 Dikerjakan oleh: ${currentModel}]\n\n`;
          document.getElementById('ai-result-screen').innerText = modelIndicator + aiResponseText;
          
          isSuccess = true;
          break; 
      } else {
          if (res.status === 429) {
              updateHudUI(`⚠️ [${currentModel}] Limit. Ganti model...`, true);
              await new Promise(r => setTimeout(r, 1500));
              continue; 
          } else {
              throw new Error(d.error?.message || "API Error tidak diketahui");
          }
      }
    } catch (e) { 
        if (e.name === 'AbortError') {
            updateHudUI(`❌ Timeout [${currentModel}]. Coba model lain...`, true);
        } else {
            updateHudUI(`❌ Error [${currentModel}]: ${e.message}`, true);
        }
    }
  }

  if (!isSuccess) {
      updateHudUI("🚨 SEMUA MODEL GAGAL. Tunggu 1 Menit, lalu coba lagi.", true);
  }
}