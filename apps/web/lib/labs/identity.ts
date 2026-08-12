export function getLabSeatIdentity(seatNumber: number) {
  if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > 20) {
    throw new Error("Lab seat number must be between 1 and 20.");
  }

  const paddedSeat = String(seatNumber).padStart(2, "0");

  return {
    podName: `Pod${paddedSeat}`,
    labUsername: `student${paddedSeat}`,
  };
}
