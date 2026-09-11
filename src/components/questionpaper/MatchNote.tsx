import type { MatchSource } from "@/lib/types";

const SOURCE_LABEL: Record<Exclude<MatchSource, "label">, string> = {
  lexical: "what the answer says",
  llm: "AI arbitration",
};

export function MatchNote({
  source,
  note,
}: {
  source: MatchSource;
  note?: string | null;
}) {
  if (source === "label") {
    return (
      <p className="mt-2 text-[12px] text-subtle">
        Matched by the label the student wrote.
      </p>
    );
  }

  return (
    <p className="mt-2 text-[12px] text-subtle">
      No question number was written. Matched by {SOURCE_LABEL[source]}
      {note ? ` (${note})` : ""}.
    </p>
  );
}
