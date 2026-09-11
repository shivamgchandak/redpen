/**
 * One student per line. Accepts "Priya Sharma", "12, Priya Sharma",
 * "12 Priya Sharma" or a pasted spreadsheet row ("12<TAB>Priya Sharma").
 */
export function parseRoster(raw: string): { name: string; rollNo: string }[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^([A-Za-z]{0,3}\d+[A-Za-z]?)[\s,;:\t.)-]+(.+)$/.exec(line);
      return m
        ? { rollNo: m[1].trim(), name: m[2].trim() }
        : { rollNo: "", name: line.replace(/^[,;\t]+|[,;\t]+$/g, "").trim() };
    })
    .filter((s) => s.name.length > 0 && s.name.length <= 80);
}
