/** Number of milliseconds in a minute */
const MINUTE = 60 * 1000;

export const dateToMinutes = (date: Date) =>
  Math.floor(date.getTime() / MINUTE);

export const minutesToDate = (minutes: number) => new Date(minutes * MINUTE);
