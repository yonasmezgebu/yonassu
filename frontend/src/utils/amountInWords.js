const ONES = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
const SCALES = ['', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION'];

const threeDigits = (n) => {
  let out = '';
  if (n >= 100) {
    out += ONES[Math.floor(n / 100)] + ' HUNDRED';
    n %= 100;
    if (n) out += ' ';
  }
  if (n >= 20) {
    out += TENS[Math.floor(n / 10)];
    if (n % 10) out += '-' + ONES[n % 10];
  } else if (n > 0) {
    out += ONES[n];
  }
  return out;
};

export const amountInWordsBirr = (amount) => {
  const v = Math.round(Math.abs(Number(amount) || 0));
  if (v === 0) return 'ZERO ETB';
  let n = v;
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let g = groups.length - 1; g >= 0; g--) {
    const w = threeDigits(groups[g]);
    if (w) parts.push(w + (SCALES[g] ? ' ' + SCALES[g] : ''));
  }
  return parts.join(' ').replace(/  +/g, ' ').trim() + ' ETB';
};
