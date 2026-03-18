export function calculateScore(donor) {
  let score = 0;

  if (donor.age >= 18 && donor.age <= 60) score += 1;
  if (donor.lastDonationDays > 90) score += 1;
  if (donor.health === "good") score += 1;

  return score;
}