export function coverInk(color) {
  const hex = String(color || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#3E2F59';
  const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  return luminance < .24 ? '#FCFBFB' : '#3E2F59';
}

/** Render a color-and-text cover as a real image, so it persists on every device. */
export async function makePlaylistCoverFile(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 800, 800);
  ctx.strokeStyle = coverInk(color);
  ctx.globalAlpha = .25;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(680, 130, 50 + i * 36, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = coverInk(color);
  ctx.font = 'italic 48px Georgia, serif';
  ctx.fillText('ayna', 66, 98);
  ctx.font = 'bold 76px Georgia, serif';
  const words = String(text || 'My playlist').trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > 650 && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, 4);
  visible.forEach((value, index) => ctx.fillText(value, 66, 390 + (index - (visible.length - 1) / 2) * 93, 670));
  ctx.font = '32px Georgia, serif';
  ctx.fillText('CURATED BY YOU', 66, 710);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', .88));
  if (!blob) throw new Error('Could not make the cover. Please try again.');
  return new File([blob], 'ayna-playlist-cover.jpg', { type: 'image/jpeg' });
}
