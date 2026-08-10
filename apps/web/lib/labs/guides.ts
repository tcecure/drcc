export type LabGuideSeat = {
  seatNumber: number;
  username: string;
  displayName: string;
};

export const labGuideSeats: LabGuideSeat[] = Array.from({ length: 20 }, (_, index) => {
  const seatNumber = index + 1;
  const username = `Student${String(seatNumber).padStart(2, "0")}`;

  return {
    seatNumber,
    username,
    displayName: `Seat ${String(seatNumber).padStart(2, "0")}`,
  };
});

export const labGuideSections = [
  {
    title: "1. Start your session",
    steps: [
      "Confirm you are signed in to the DigitalRCC Lab Companion.",
      "Open your active lab assignment and verify your assigned seat.",
      "Use only the student identity assigned to your lab window.",
    ],
  },
  {
    title: "2. Connect to the lab",
    steps: [
      "Open the controlled workspace link when it is available in your current lab.",
      "Confirm VPN or browser-based access as directed by staff.",
      "Do not share lab links, screenshots, credentials, or internal identifiers.",
    ],
  },
  {
    title: "3. Work through the guide",
    steps: [
      "Complete the training tasks in order and keep notes on blockers.",
      "Use the support request workflow if access, VPN, Guacamole, or guide instructions block progress.",
      "Return to the current lab page to check progress or request verification.",
    ],
  },
  {
    title: "4. Verify and finish",
    steps: [
      "Use Check progress while you are still working.",
      "Use Verify lab when you believe the assigned tasks are complete.",
      "After a passing verification, complete the lab so the pod can be reset and released for the next student.",
    ],
  },
];

export const labGuideSafetyNotes = [
  "The lab window is 14 days unless staff grants an exception.",
  "The hands-on environment is limited to 20 concurrent student seats.",
  "Student01 through Student20 identify lab seats, not reusable shared passwords.",
  "Never store customer material, real credentials, or sensitive data in the lab companion.",
];
