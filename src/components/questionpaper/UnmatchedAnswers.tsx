import type { AnswerBlock } from "@/lib/types";

export function UnmatchedAnswers({ answers }: { answers: AnswerBlock[] }) {
  if (answers.length === 0) return null;

  return (
    <section className="mt-5">
      <h3 className="px-1 text-p5 font-semibold uppercase tracking-wide text-subtle">
        Answers with no matching question
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {answers.map((answer) => (
          <li
            key={answer.id}
            className="rounded-panel border border-dashed border-hairline bg-surface px-4 py-3"
          >
            <p className="text-p5 font-semibold text-ink">
              {answer.writtenLabel
                ? `Labelled "${answer.writtenLabel}", which is not on this paper`
                : "Unlabelled answer"}
            </p>
            <p className="mt-1 line-clamp-2 text-p5 text-muted">{answer.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
