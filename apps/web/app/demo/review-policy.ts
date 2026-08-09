export function canApproveRelease(annotations: readonly { resolved: boolean }[]) {
  return annotations.every((annotation) => annotation.resolved);
}
