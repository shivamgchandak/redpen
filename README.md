# RedPen: Answer Sheet Mapping and Marking

Upload a question paper and a handwritten answer sheet. The app extracts every
question, finds each answer on the sheet, highlights it, and marks it.

**Live:** to be deployed

**Stack:** Next.js 15, TypeScript, Tailwind, Zustand, MongoDB (Mongoose), Auth.js (Google), Vercel Blob

**AI:** Groq free tier: `qwen/qwen3.6-27b` (vision), `openai/gpt-oss-120b` and
`openai/gpt-oss-20b` (text)

## Using it

1. **Sign in with Google** and give your school name once.
2. **Create a class**: school, class, section and subject, then paste the student list.
3. **Create a test**: upload the question paper and, optionally, your rubric
   (points with marks, or a model answer key). RedPen reads them once for the
   whole class and drafts points for any question your rubric does not cover.
4. **Check and lock the rubric**. Edit marks and points, then lock it so every
   student is marked the same way.
5. **Upload each student's answer sheet**. Marking takes about a minute. Open
   the result to see every answer boxed on the sheet, change any mark, and
   move to the next student.
6. **Download the marksheet** as CSV.

## The demo

The `/demo` page shows a sample question paper, answer sheet and rubric as already
uploaded (they can be opened, not replaced). Start Mapping plays the loader,
then shows a prepared result for those files, saved in `public/demo`
(`demo.json` plus the page images). It makes no model calls, so it is instant,
free and cannot be abused, and it says on screen that it is a prepared example.

The highlight boxes come from the same line detection the app uses, and the
marks follow the app's own marking rules against `public/demo/rubric.pdf`.

## How it works

The core rule: **local image processing provides the geometry, the model
provides the meaning.** The model is never asked for coordinates, because
vision models invent them.

1. **Render.** PDFs and images become page bitmaps in the browser with pdf.js.
2. **Segment.** A horizontal projection finds every line of ink and stamps its
   index in the margin, numbered continuously across the whole sheet.
3. **Extract questions.** One vision call per three pages, with a strict schema.
   Subparts like `11 (a)` and `11 (b)` stay separate entries.
4. **Extract answers.** The model reads the printed indices back and says which
   line range each answer covers, whether it contains a drawing, and what is
   labelled on it. Highlight rectangles are computed from the segmentation
   boxes, so a highlight can only be as wrong as the line detection.
5. **Map.** Three tiers, cheapest first: the label the student wrote, then
   text similarity weighted by IDF, then one arbitration call for leftovers.
   Position on the page is never used, because answers come out of order.
6. **Mark.** A checklist mark scheme is written from the questions alone, then
   each answer is marked against it. Every credited point must quote the
   student; quotes are verified in code before the mark is computed.

## Edge cases

| Requirement | How |
|---|---|
| Printed order preserved | display order is independent of the label |
| Subparts separate | `11a` and `11b` are two entries with a shared parent |
| Answers out of order | mapping is by label and content, never by position |
| Unanswered questions | reported as unattempted, excluded from highlighting |
| Answers matching no question | listed separately, still selectable |
| Answers spanning pages | one block, one region per page, page stepper on the highlight |
| Unnumbered answers | located and shown, but not credited, with the reason stated |
| Choice questions | "any two of three" counts the best two |

## What a run costs

The free tier is metered in requests per day, per model, so calls are batched
and every stage is cached on its own inputs.

| | requests |
|---|---|
| Reading a test (paper and rubric, once per class) | 2, plus about 1 per 20 marks the rubric does not cover |
| Each answer sheet (4 pages, 11 answers) | about 5: 2 to read, 0 or 1 to match, about 3 to grade |
| The same file again | 0 (kept by its fingerprint) |
| The public demo | 0 (a saved run) |

How it stays low:

- **Grading is batched**: up to four answers per call instead of one each.
- **The overall remark is written from the marks**, not by the model.
- **The subject comes back with the question paper**, not in a separate call.
- **Rubric drafting** covers up to 20 marks per call, and only badly thin
  schemes are redrafted.
- **Everything is cached**: a retried step, or a second script with the same
  answers, reuses earlier model results.

The server log prints what each step spent:

```
[ai] mark 66f1c0...: read used 2 requests
[ai] mark 66f1c0...: grade used 3 requests
```

## Test files

`public/demo/` has a question paper, a handwritten answer sheet of four pages and a
rubric. The sheet has every edge case built in: answers out of order, one
across a page break, three skipped questions, and an answer to a question that
is not on the paper. Upload them into a test of your own to try a real run.

## Running locally

```bash
npm install                 # postinstall copies the pdf.js worker into public/
cp .env.example .env.local  # then fill in the values below
npm run check:models        # confirm the Groq model IDs against your account
npm run dev
```

What `.env.local` needs:

| Variable | Where it comes from |
|---|---|
| `GROQ_API_KEY` | console.groq.com/keys |
| `MONGODB_URI` | MongoDB Atlas, free M0 cluster: Database > Connect > Drivers |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud Console > APIs & Services > Credentials > OAuth client (Web). Redirect URI: `http://localhost:3000/api/auth/callback/google` |
| `BLOB_READ_WRITE_TOKEN` | Vercel project > Storage > create a **private** Blob store, then `vercel env pull` |

Open `/api/health` to check every service is configured and the database is
reachable.

Then sign in, create a class and a test, and mark an answer sheet. A cold
run takes about a minute per sheet; a repeat of the same file is instant and free.

## Architecture

```
Browser                                   Server (Next.js on Vercel, Mumbai)          Background (Vercel Workflows)
render, segment pages (pdf.js)  ──────▶  server actions: classes, students,
upload files straight to Blob             tests, rubric, overrides (checked with zod)
                                          POST /api/tests/:id/read      ── start ──▶  readTestWorkflow
                                          POST /api/submissions/:id/mark ── start ──▶  markSubmissionWorkflow
page polls (router.refresh)  ◀──────────  progress, results in MongoDB  ◀─ steps ─   read → match → grade
```

- **Rendering stays in the browser.** The server never needs an image library,
  and big files go straight to private Blob storage, clear of the 4.5MB body limit.
- **The paper and rubric are read once per test**, then locked, so every
  student is marked against the same rubric.
- **Marking runs in the background.** Each stage is a workflow step: saved when
  it finishes, retried on its own, and every model call is cached on its
  inputs, so a retry is nearly free. The teacher can close the tab.
- **Same file, same marks.** Answer sheets are fingerprinted (SHA-256); an
  identical upload keeps the existing marks and is never marked again.
- **Every query is scoped to the teacher who is signed in**, and files can only be
  read from the teacher's own storage folder.
- **The public demo replays a saved run**, so it never calls the model.

## Layout

```
src/
  app/            routes (pages, route handlers) and server actions in app/actions
  components/     UI, one folder per screen or panel (classroom, result, answersheet and more)
  server/         code that runs only on the server: db (Mongoose models), queries, session, blob, marking/
  workflows/      background runs: readTest, markSubmission, and their steps/
  lib/
    ai/           model registry and the Groq client
    pipeline/     questions, answers, mapping, rubric, rubricUpload, grading/
    schemas.ts    zod input shapes shared by browser and server
    marks.ts      mark scheme shape and the arithmetic on it
    cache.ts      content cache for each stage (MongoDB, or disk locally)
    render.ts     rasterising, line segmentation, index stamping
    store.ts      the demo's state machine
```

## Assumptions and limitations

- **One upload at a time.** Each answer sheet is uploaded from the browser one
  by one; marking then runs in the background. Uploading a whole class at once
  can sit on the same workflow later.
- **Teachers only in the first version.** Students do not sign in; the teacher owns the roster.
- **Diagrams are credited, not judged.** The pipeline knows a drawing is there
  and what is labelled on it, so a drawn answer scores properly, but it cannot
  tell a good diagram from a bad one. Those questions are flagged for a look.
- **Line segmentation assumes roughly horizontal writing.** A skewed phone photo
  would need a deskew pass first.
- **Tuned against generated handwriting.** The sample uses a handwriting font,
  not a real scan. Genuine handwriting is harder.
- **pdfjs-dist is pinned to version 4.** Versions 5 and 6 need a very recent browser or
  every PDF fails to open.
- **Free tier throughput is the binding constraint**, not model quality.
