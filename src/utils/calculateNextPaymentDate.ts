export const calculateNextPaymentDate = (subscribedAt: Date) => {
  const date = new Date(subscribedAt);
  date.setMonth(date.getMonth() + 1);
  return date;
};
