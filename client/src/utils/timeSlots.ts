// Utility to generate time slots for a given opening/closing time and interval
export function generateTimeSlots(
  open = '10:00',
  close = '22:00',
  intervalMinutes = 30
) {
  const slots = [];
  let [h, m] = open.split(':').map(Number);
  let [endH, endM] = close.split(':').map(Number);
  let start = h * 60 + m;
  let end = endH * 60 + endM;
  while (start <= end) {
    const hour = Math.floor(start / 60).toString().padStart(2, '0');
    const min = (start % 60).toString().padStart(2, '0');
    slots.push(`${hour}:${min}`);
    start += intervalMinutes;
  }
  return slots;
}
