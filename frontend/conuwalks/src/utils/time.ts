export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const parseSeconds = (durationValue: string | undefined): number => {
  if (!durationValue) return 0;
  const parsed = Number.parseFloat(durationValue.replace("s", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatDurationFromSeconds = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0 min";

  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
};

export const calculateEtaFromSeconds = (
  totalSeconds: number,
  targetTime: Date | null,
  timeMode: "leave" | "arrive",
): string => {
  if (timeMode === "arrive" && targetTime) {
    const hours = targetTime.getHours();
    const minutes = targetTime.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes} ETA`;
  }

  const startTime = targetTime ? targetTime.getTime() : Date.now();
  const etaDate = new Date(startTime + totalSeconds * 1000);

  const hours = etaDate.getHours();
  const minutes = etaDate.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes} ETA`;
};
