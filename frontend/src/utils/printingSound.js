export const playSound = (type) => {
  try {
    // Only accepts "success" or "info" per requirements
    if (type !== 'success' && type !== 'info') return;
    const audio = new Audio(`/assets/sounds/${type}.mp3`);
    audio.play().catch(e => console.warn('Audio play prevented by browser policy:', e));
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};
