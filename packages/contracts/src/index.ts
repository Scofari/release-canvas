import { z } from 'zod';

export const releaseStatuses = ['draft', 'in_review', 'changes_requested', 'approved', 'archived'] as const;
export const releaseStatusSchema = z.enum(releaseStatuses);
export type ReleaseStatus = z.infer<typeof releaseStatusSchema>;

export const annotationSchema = z.object({
  id: z.uuid(),
  artifactVersionId: z.uuid(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(2000),
  status: z.enum(['open', 'resolved']),
  assigneeName: z.string().trim().max(80).nullable(),
  version: z.number().int().positive(),
});
export type Annotation = z.infer<typeof annotationSchema>;

export const createAnnotationSchema = annotationSchema.pick({
  artifactVersionId: true, x: true, y: true, title: true, body: true, assigneeName: true,
});

export const releaseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  status: releaseStatusSchema,
  version: z.number().int().positive(),
  dueAt: z.iso.datetime().nullable(),
});

const allowedTransitions: Record<ReleaseStatus, readonly ReleaseStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['changes_requested', 'approved', 'archived'],
  changes_requested: ['in_review', 'archived'],
  approved: ['archived'],
  archived: [],
};

export function canTransitionRelease(from: ReleaseStatus, to: ReleaseStatus) {
  return allowedTransitions[from].includes(to);
}

export const problemDetailsSchema = z.object({
  type: z.string(), title: z.string(), status: z.number().int(), detail: z.string(), instance: z.string().optional(),
});
