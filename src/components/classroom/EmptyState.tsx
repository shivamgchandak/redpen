import Image from "next/image";
import TeacherIllustration from "../../../public/images/AILadyRed.png";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card bg-surface px-6 py-10 text-center">
      <Image src={TeacherIllustration} alt="" width={120} height={120} className="h-[100px] w-[100px] sm:h-[120px] sm:w-[120px]" />
      <div className="flex max-w-[420px] flex-col gap-1">
        <h2 className="text-p1 font-bold text-ink-strong">{title}</h2>
        <p className="text-p4 text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}
