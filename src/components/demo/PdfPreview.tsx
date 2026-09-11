"use client";

import { ExternalLink } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";

export function PdfPreview({
  url,
  title,
  onClose,
}: {
  url: string | null;
  title: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(url)} onClose={onClose} title={title} size="lg">
      {url && (
        <>
          <iframe
            src={`${url}#view=FitH`}
            title={title}
            className="h-[70dvh] w-full rounded-field border border-hairline bg-surface-soft"
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 self-start text-p4 font-medium text-brand hover:underline"
          >
            <ExternalLink className="size-4" /> Open in a new tab
          </a>
        </>
      )}
    </Dialog>
  );
}
