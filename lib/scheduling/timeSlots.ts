/**
 * Generate time slots from start to end hour with given increment
 * @param startHour - Start hour in 24h format (e.g., 7 for 7:00 AM)
 * @param endHour - End hour in 24h format (e.g., 17 for 5:00 PM)
 * @param increment - Minutes between slots (e.g., 30)
 * @returns Array of time strings in HH:MM format (e.g., ["07:00", "07:30", "08:00"])
 */
export function generateTimeSlots(
  startHour: number,
  endHour: number,
  increment: number
): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += increment) {
      // Don't go past end hour's 0 minute mark
      if (hour === endHour && min > 0) break;
      
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  
  return slots;
}

/**
 * Format 24h time to 12h with AM/PM
 * @param time24 - Time in HH:MM format (e.g., "07:30", "16:00")
 * @returns Formatted time (e.g., "7:30 AM", "4:00 PM")
 */
export function format12Hour(time24: string): string {
  const [hourStr, minStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const min = minStr || "00";
  
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  
  return `${displayHour}:${min} ${period}`;
}
