import Image, { type StaticImageData } from "next/image";
import ClassroomIcon from "../../../public/images/myclassroom.png";
import PaperIcon from "../../../public/images/PDFBatch.png";
import UploadIcon from "../../../public/images/Upload.png";
import SparkleIcon from "../../../public/images/ExtractingSparkelRed.png";

const STEPS: { icon: StaticImageData; title: string; body: string }[] = [
  {
    icon: ClassroomIcon,
    title: "Create a class",
    body: "Add your school, class and subject, then your students.",
  },
  {
    icon: PaperIcon,
    title: "Upload the paper and rubric",
    body: "Once per test. No rubric? RedPen drafts one, and you check it before locking.",
  },
  {
    icon: UploadIcon,
    title: "Upload each answer sheet",
    body: "About a minute per student. Answers are found even when written out of order.",
  },
  {
    icon: SparkleIcon,
    title: "Check and adjust",
    body: "Every answer is boxed on the sheet, every mark has a reason, and any mark can be changed.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="flex flex-col gap-5">
      <h2
        id="how-it-works"
        className="text-center text-[26px] font-bold tracking-[-0.04em] text-ink-strong sm:text-[32px]"
      >
        How it works
      </h2>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-card bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-field bg-surface-soft">
                <Image
                  src={step.icon}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="text-p5 font-semibold tabular-nums text-subtle">
                Step {i + 1}
              </span>
            </div>
            <h3 className="text-p2 font-bold text-ink">{step.title}</h3>
            <p className="text-p4 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
