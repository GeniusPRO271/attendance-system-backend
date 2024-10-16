import type { GroupDTO } from "./service/dto";

// Helper function to check if the date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper function to check if the date is within this week
export function isThisWeek(date: Date): boolean {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

  return date >= startOfWeek && date <= endOfWeek;
}

// Helper function to check if the date is within the next week
export function isNextWeek(date: Date): boolean {
  const today = new Date();
  const startOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
  const endOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 13));

  return date >= startOfNextWeek && date <= endOfNextWeek;
}




