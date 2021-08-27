export interface Tracker {
  getIssue(issueId: string): Promise<Issue>;
  getIssues(issueIds: string | string[]): Promise<Issue[]>

  reopenIssue(issue: Issue): Promise<Issue>
  reopenIssues(issues: Issue | Issue[]): Promise<Issue[]>
}

export type Issue = {
  isOpen: boolean;
  issueId: string;
};

export type Inputs = {
  token: string,
  issueRef: string
  todocheck: string
};
