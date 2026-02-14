// path: app/(portal)/registrar/requirements/queue/actions.ts

"use server";

import {
  verifySubmissionAction as verifyFromParent,
  rejectSubmissionAction as rejectFromParent,
} from "../actions";

export async function verifySubmissionAction(submissionId: string) {
  return verifyFromParent(submissionId);
}

export async function rejectSubmissionAction(submissionId: string, remarks: string) {
  return rejectFromParent(submissionId, remarks);
}
