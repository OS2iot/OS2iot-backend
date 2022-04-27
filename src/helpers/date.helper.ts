export const subtractHours = (date: Date, hours = 1): Date => {
    const newDate = new Date();
    newDate.setTime(date.getTime() - 1000 * (60 * 60 * hours));
    return newDate;
};

export const subtractDays = (date: Date, days = 1): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() - days);
    return newDate;
};
