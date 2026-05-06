document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const status = document.getElementById('status');

  // Load API key yang tersimpan
  chrome.storage.local.get(['groqApiKey'], (res) => {
    if (res.groqApiKey) {
      apiKeyInput.value = res.groqApiKey;
      deleteBtn.style.display = 'inline-block';
    }
  });

  // Simpan API Key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      chrome.storage.local.set({ groqApiKey: key }, () => {
        status.innerText = "✅ Kunci tersimpan!";
        deleteBtn.style.display = 'inline-block';
        setTimeout(() => status.innerText = "", 2000);
      });
    } else {
      status.innerText = "⚠️ Masukkan kunci terlebih dahulu!";
    }
  });

  // Hapus API Key
  deleteBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['groqApiKey'], () => {
      apiKeyInput.value = "";
      deleteBtn.style.display = 'none';
      status.innerText = "🗑️ Kunci dihapus.";
    });
  });
});