"use client";

import { useCallback, useState } from "react";
import { findSameSheet, saveAnswerSheet } from "@/app/actions/submissions";
import { fileHash, uploadAnswerSheet } from "@/lib/upload/documents";
import { postJson } from "./useAutoRefresh";

/** "started": marking runs in the background. "kept": same file as before. null: failed. */
export type UploadOutcome = "started" | "kept" | null;

/**
 * The browser prepares and uploads the sheet (the tab must stay open for
 * that part, a few seconds), then marking runs in the background on the
 * server and the page follows its progress.
 */
export function useMarkSubmission(teacherId: string, testId: string) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [error, setError] = useState<{ studentId: string; message: string } | null>(null);

  const upload = useCallback(
    async (studentId: string, file: File): Promise<UploadOutcome> => {
      setUploadingId(studentId);
      setError(null);
      setUploadLabel("Checking the file");
      try {
        const sourceHash = await fileHash(file);

        // Same file already marked for this student: keep those marks, spend nothing.
        const { same } = await findSameSheet({ testId, studentId, sourceHash });
        if (same) return "kept";

        const uploaded = await uploadAnswerSheet(teacherId, file, setUploadLabel);
        const saved = await saveAnswerSheet({
          testId,
          studentId,
          sourceHash,
          sourceFile: uploaded.file,
          pages: uploaded.pages,
        });
        if (!saved.ok) throw new Error(saved.message);
        if (saved.kept) return "kept";

        setUploadLabel("Starting to mark");
        await postJson(`/api/submissions/${saved.id}/mark`);
        return "started";
      } catch (err) {
        setError({ studentId, message: err instanceof Error ? err.message : String(err) });
        return null;
      } finally {
        setUploadingId(null);
        setUploadLabel(null);
      }
    },
    [teacherId, testId]
  );

  const markAgain = useCallback(async (studentId: string, submissionId: string): Promise<boolean> => {
    setError(null);
    try {
      await postJson(`/api/submissions/${submissionId}/mark`);
      return true;
    } catch (err) {
      setError({ studentId, message: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, []);

  return { uploadingId, uploadLabel, error, upload, markAgain };
}
