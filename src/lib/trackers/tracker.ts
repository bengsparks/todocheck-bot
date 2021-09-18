export interface Tracker {
  getIssue(issueId: string): Promise<Issue>;
  getIssues(issueIds: string | string[]): Promise<Issue[]>

  reopenIssue(issue: Issue): Promise<Issue>
  reopenIssues(issues: Issue | Issue[]): Promise<Issue[]>
}

export interface Issue {
  isOpen: boolean
  issueRef: string
}

/**
 * Facilitate comparing of issue refs for sorting purposes.
 * Not all issue trackers store their issue refs as numbers, which is why strings are supported.
 *
 * @param lhs an issue number
 * @param rhs an issue number
 * @returns > 0 if lhs > rhs, == 0 if rhs == 0, otherwise < 0, i.e. lhs < rhs
 */
export type IssueComparator = (
  lhs: { issueRef: string | number },
  rhs: { issueRef: string | number }
) => number;

export type Inputs = {
  token: string,
  issueRefs: string[]
  todocheck?: string
};
