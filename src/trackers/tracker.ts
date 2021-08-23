interface Tracker {
    getIssue(issueId: string): Promise<Issue>;
    getIssues(issueIds: string | [string]): Promise<Issue[]>
}

type Issue = {
    isOpen: boolean;
    issueId: string;
};
