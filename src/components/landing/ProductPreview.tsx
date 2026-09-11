import Image from "next/image";
import { cn } from "@/lib/cn";
import SampleSheet from "../../../public/images/sample-sheet.jpg";

const ROWS = [
  { q: "1", text: "Which blood vessel carries blood away from the heart?", marks: "2 / 2", tone: "success", selected: true },
  { q: "3", text: "Explain the role of chloroplasts in photosynthesis...", marks: "1.5 / 2", tone: "success" },
  { q: "4", text: "Describe the flow of blood through the human heart...", marks: "0 / 2", tone: "danger", note: "Not attempted" },
  { q: "6", text: "Draw a neat labelled diagram of the digestive system...", marks: "1.5 / 5", tone: "warn", note: "No diagram drawn" },
] as const;

const TONES = {
  success: "bg-success/10 text-success",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
};

/**
 * What the result screen looks like, built from the real sample answer sheet.
 * The boxes sit where the answers are on this page.
 */
export function ProductPreview() {
  return (
    <section aria-labelledby="preview" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="preview" className="text-[26px] font-bold tracking-[-0.04em] text-ink-strong sm:text-[32px]">
          See where every mark comes from
        </h2>
        <p className="max-w-[560px] text-p3 text-muted">
          Pick a question and its answer lights up on the student&apos;s sheet, with the mark and short feedback beside it.
        </p>
      </div>

      <div className="overflow-hidden rounded-hero border border-hairline/60 bg-surface shadow-[0_24px_60px_rgba(24,24,24,0.10)]">
        <div className="flex items-center gap-1.5 border-b border-hairline/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-brand/60" />
          <span className="size-2.5 rounded-full bg-warn/50" />
          <span className="size-2.5 rounded-full bg-success/50" />
          <span className="ml-3 truncate text-p5 text-subtle">Unit Test II · Roll number 21</span>
        </div>

        <div className="grid md:grid-cols-[1fr_1.1fr]">
          <ul className="flex flex-col gap-2 bg-surface-soft p-3 sm:p-4">
            {ROWS.map((row) => (
              <li
                key={row.q}
                className={cn(
                  "flex items-start gap-3 rounded-panel border bg-surface px-3 py-3",
                  "selected" in row && row.selected ? "border-brand/70" : "border-transparent"
                )}
              >
                <span
                  className={cn(
                    "grid h-7 min-w-7 shrink-0 place-items-center rounded-chip px-1.5 text-p5 font-bold text-white",
                    "selected" in row && row.selected ? "bg-brand" : "bg-[#2B2B2B]/80"
                  )}
                >
                  {row.q}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-p4 leading-snug text-ink">{row.text}</p>
                  {"note" in row && <p className="mt-0.5 text-p5 text-subtle">{row.note}</p>}
                  {"selected" in row && row.selected && (
                    <p className="mt-2 rounded-field bg-surface-soft px-2.5 py-2 text-p5 leading-relaxed text-muted">
                      Clear, direct answer that names the aorta. Adding where the aorta carries blood would round it out.
                    </p>
                  )}
                </div>
                <span className={cn("shrink-0 rounded-pill px-2 py-0.5 text-p5 font-semibold tabular-nums", TONES[row.tone])}>
                  {row.marks}
                </span>
              </li>
            ))}
          </ul>

          <div className="relative h-[300px] overflow-hidden bg-ink-strong sm:h-[380px] md:h-auto md:min-h-[420px]">
            <div className="absolute inset-x-4 top-4 sm:inset-x-8">
              <div className="relative">
                <Image
                  src={SampleSheet}
                  alt="A page of a student's handwritten answer sheet"
                  className="block h-auto w-full rounded-[4px]"
                  sizes="(min-width: 768px) 560px, 100vw"
                />
                <span
                  className="absolute rounded-[4px] border-[1.5px] border-success bg-success/10"
                  style={{ left: "14.5%", top: "7.8%", width: "52.3%", height: "9.4%" }}
                >
                  <span className="absolute -left-px -top-5 rounded-[4px] bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Q1
                  </span>
                </span>
                <span
                  className="absolute rounded-[4px] border border-hairline/70"
                  style={{ left: "14.5%", top: "19.8%", width: "52.3%", height: "9.2%" }}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-strong to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
