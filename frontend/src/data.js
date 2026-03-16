export const INITIAL_SERIES = [];

// Use Math.floor (truncate) not Math.round to avoid 99.5% showing as 100%
export const getProgress = (s) => {
  const total = s.latestChapter || s.totalChapters || 0;
  return total > 0 ? Math.floor((s.readChapters / total) * 100) : 0;
};
export const getUpcoming = (s) => Math.max(0, (s.latestChapter || s.totalChapters || 0) - (s.readChapters || 0));
export const getStatusColor = (st) => st === "Completed" ? "#2ECC71" : st === "Ongoing" ? "#F5A623" : "#8A8398";
export const getReadingStatus = (s) => {
  const upcoming = getUpcoming(s);
  if ((s.readChapters || 0) === 0) return { label: "Plan to Read", color: "#8A8398" };
  if (upcoming === 0) return { label: "Up to Date", color: "#2ECC71" };
  return { label: `${upcoming} Behind`, color: "#E8341C" };
};