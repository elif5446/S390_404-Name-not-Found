export const normalizeRoomId = (roomId?: string | null): string => {
  return roomId?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "";
};
