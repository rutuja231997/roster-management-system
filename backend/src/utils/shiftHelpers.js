const timeToMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const hasOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

const checkShiftOverlap = (entryA, entryB) => {
  // Skip comparison if shift timings are missing
  if (
    !entryA.shiftStart ||
    !entryA.shiftEnd ||
    !entryB.shiftStart ||
    !entryB.shiftEnd
  ) {
    return false;
  }

  const startA = timeToMinutes(entryA.shiftStart);
  const endA = timeToMinutes(entryA.shiftEnd);

  const startB = timeToMinutes(entryB.shiftStart);
  const endB = timeToMinutes(entryB.shiftEnd);

  return hasOverlap(startA, endA, startB, endB);
};

module.exports = {
  timeToMinutes,
  hasOverlap,
  checkShiftOverlap,
};
