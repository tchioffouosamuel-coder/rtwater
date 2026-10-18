export function formatApiDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";

  const frenchDate = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+à\s+(\d{1,2}):(\d{2}))?$/,
  );
  let date: Date;

  if (frenchDate) {
    const [, day, month, year, hours = "0", minutes = "0"] = frenchDate;
    date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    );

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day) ||
      date.getHours() !== Number(hours) ||
      date.getMinutes() !== Number(minutes)
    ) {
      return "—";
    }
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", options);
}
