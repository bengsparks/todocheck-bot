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

export type IssueComparator = (lhs: { issueRef: string }, rhs: { issueRef: string }) => number;

export type Inputs = {
  token: string,
  issueRefs: string[]
  todocheck: string
};
