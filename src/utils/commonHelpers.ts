/**
 * Format seconds into MM:SS format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "1:30", "0:05")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
