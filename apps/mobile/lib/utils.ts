import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let _id = 0;
export function makeId(): string {
  // Time-prefixed random ID — collision-resistant enough for a local-first
  // app and short enough to read in logs.
  _id = (_id + 1) % 1_000_000;
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 1e9).toString(36);
  return `${t}-${r}-${_id.toString(36)}`;
}
