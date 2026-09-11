const POINTS = [
  {
    title: "The box comes from the ink",
    body: "Answer highlights are measured from the handwriting on the page. The AI never guesses coordinates, so a box cannot land on empty space.",
  },
  {
    title: "Every mark is quoted",
    body: "A point only earns credit when RedPen can quote the student's own words for it. Points it cannot quote earn nothing.",
  },
  {
    title: "One standard for the class",
    body: "The rubric is locked before the first script is marked, so student 1 and student 40 are marked the same way.",
  },
];

export function TrustPoints() {
  return (
    <section
      aria-labelledby="trust"
      className="flex flex-col gap-6 rounded-hero bg-surface p-6 sm:p-8 lg:p-10"
    >
      <h2
        id="trust"
        className="text-[26px] font-bold tracking-[-0.04em] text-ink-strong sm:text-[32px]"
      >
        Marks you can check
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title} className="flex flex-col gap-2 border-l-2 border-brand pl-4">
            <h3 className="text-p2 font-bold text-ink">{point.title}</h3>
            <p className="text-p4 text-muted">{point.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
