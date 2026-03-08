const getNextWeekday = (date = new Date()) => {
  const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
  let daysToAdd = 1;
  if (dayOfWeek === 5) daysToAdd = 3;
  else if (dayOfWeek === 6) daysToAdd = 2;

  date.setDate(date.getDate() + daysToAdd);
  return date;
};

const formattedDate = getNextWeekday().toISOString().split("T")[0];
output.setDate = formattedDate;
