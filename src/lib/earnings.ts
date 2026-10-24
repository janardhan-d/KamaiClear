export const STORAGE_KEY = 'kamaiclear-shifts-v1';

export const PLATFORMS = ['Zomato', 'Swiggy', 'Zepto', 'Uber / Rapido', 'Other'] as const;

export type Platform = (typeof PLATFORMS)[number];

export type Shift = {
  id: string;
  date: string;
  platform: Platform;
  hours: number;
  waitingHours: number;
  orders: number;
  kilometres: number;
  payout: number;
  tips: number;
  incentives: number;
  fuel: number;
  maintenance: number;
  phone: number;
  otherCost: number;
  note: string;
};

export type ShiftInput = Omit<Shift, 'id'>;

export const createEmptyShift = (): ShiftInput => ({
  date: new Date().toISOString().slice(0, 10),
  platform: 'Zomato',
  hours: 8,
  waitingHours: 0,
  orders: 0,
  kilometres: 0,
  payout: 0,
  tips: 0,
  incentives: 0,
  fuel: 0,
  maintenance: 0,
  phone: 0,
  otherCost: 0,
  note: '',
});

export function grossEarnings(shift: Pick<Shift, 'payout' | 'tips' | 'incentives'>) {
  return Number(shift.payout || 0) + Number(shift.tips || 0) + Number(shift.incentives || 0);
}

export function operatingCosts(
  shift: Pick<Shift, 'fuel' | 'maintenance' | 'phone' | 'otherCost'>,
) {
  return Number(shift.fuel || 0) + Number(shift.maintenance || 0) + Number(shift.phone || 0) + Number(shift.otherCost || 0);
}

export function netEarnings(shift: Shift | ShiftInput) {
  return grossEarnings(shift) - operatingCosts(shift);
}

export function trueHourlyPay(shift: Shift | ShiftInput) {
  return shift.hours > 0 ? netEarnings(shift) / shift.hours : 0;
}

export function costRate(shift: Shift | ShiftInput) {
  const gross = grossEarnings(shift);
  return gross > 0 ? (operatingCosts(shift) / gross) * 100 : 0;
}

export function formatMoney(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string, long = false) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: long ? 'long' : undefined,
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : undefined,
  }).format(new Date(`${value}T12:00:00`));
}

export function sortNewest(shifts: Shift[]) {
  return [...shifts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getSummary(shifts: Shift[]) {
  const gross = shifts.reduce((sum, shift) => sum + grossEarnings(shift), 0);
  const costs = shifts.reduce((sum, shift) => sum + operatingCosts(shift), 0);
  const net = shifts.reduce((sum, shift) => sum + netEarnings(shift), 0);
  const hours = shifts.reduce((sum, shift) => sum + shift.hours, 0);
  const best = [...shifts].sort((a, b) => trueHourlyPay(b) - trueHourlyPay(a))[0];

  return {
    gross,
    costs,
    net,
    hours,
    shifts: shifts.length,
    hourly: hours > 0 ? net / hours : 0,
    costRate: gross > 0 ? (costs / gross) * 100 : 0,
    best,
  };
}
