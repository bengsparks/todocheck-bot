import { context, getOctokit } from "@actions/github"
import { GitHub } from "@actions/github/lib/utils";

export const tag = "github";

class GithubTracker implements Tracker {
    constructor(private octokit: InstanceType<typeof GitHub>, private metadata: { owner: string, repo: string }) {
    }

    async getIssue(issueId: string): Promise<Issue> {
        const resp = await this.octokit.request("GET /repos/{owner}/{repo}/issues/{issueNumber}", {
            ...this.metadata,
            issueNumber: issueId
        })
        if (resp.status !== 200) {
            throw resp;
        }

        return makeIssueFromGithub(resp.data);
    }

    async getIssues(issueIds: string | string[]): Promise<Issue[]> {
        if (typeof issueIds === "string") {
            return [await this.getIssue(issueIds)]
        }

        const resp = await this.octokit.request("GET /repos/{owner}/{repo}/issues", {
            ...this.metadata
        });
        if (resp.status !== 200) {
            throw resp;
        }

        const matchingIssues = resp.data.filter((githubIssue) => {
            const id: string = githubIssue.id.toString(10);
            return issueIds.indexOf(id);
        });
        if (matchingIssues === undefined) {
            throw resp;
        }

        return matchingIssues.map(makeIssueFromGithub);
    }

    async reopenIssue(issue: Issue): Promise<Issue> {
        const resp = await this.octokit.request("PATCH /repos/{owner}/{repo}/issues/{issueNumber}", {
            ...this.metadata,
            issueNumber: issue.issueId,
            state: "open"
        });
        if (resp.status !== 200) {
            throw resp;
        }

        return makeIssueFromGithub(resp.data);
    }


    async reopenIssues(issues: Issue | Issue[]): Promise<Issue[]> {
        // Github REST Api does not seem to support multiple issue updates, 
        // so issue all requests and Promise.all 
        const allIssues = !Array.isArray(issues) ? [issues] : issues;
        return Promise.all(allIssues.map(this.reopenIssue));
    }
}


export const initGithubTracker = (input: { token: string }): GithubTracker => {
    const repoEnvVar = process.env.GITHUB_REPOSITORY;
    if (repoEnvVar === undefined) {
        throw "GITHUB_REPOSITORY environment variable must be set!";
    }

    const [owner, repo] = repoEnvVar.split("/")
    const octokit = getOctokit(input.token);

    return new GithubTracker(octokit, { owner, repo });
}


const makeIssueFromGithub = (githubIssue: { state: string, id: number }): Issue => {
    return {
        isOpen: githubIssue.state === "open",
        issueId: githubIssue.id.toString(10)
    }
}