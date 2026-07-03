import successSoundFile from '../assets/notification/success.mp3';
import infoSoundFile from '../assets/notification/info.mp3';

let successAudio = null;
let infoAudio = null;

if (typeof window !== 'undefined') {
  successAudio = new Audio(successSoundFile);
  infoAudio = new Audio(infoSoundFile);
}

export const playSuccessSound = () => {
  if (successAudio) {
    successAudio.currentTime = 0;
    successAudio.play().catch(e => console.error('Error playing success sound:', e));
  }
};

export const playInfoSound = () => {
  if (infoAudio) {
    infoAudio.currentTime = 0;
    infoAudio.play().catch(e => console.error('Error playing info sound:', e));
  }
};
