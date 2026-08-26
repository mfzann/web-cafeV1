// Format number to Indonesian Rupiah (e.g. 35000 -> "Rp 35.000")
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Format ISO date string to Indonesian time format
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Play notification sound using Web Audio API (no external asset needed)
export function playOrderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain2.gain.setValueAtTime(0.4, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.5);
    }, 150);
  } catch (err) {
    console.log('Audio playback prevented by browser policy:', err);
  }
}
