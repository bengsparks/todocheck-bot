import { context, getOctokit } from "@actions/github"
import { GitHub } from "@actions/github/lib/utils";

export const tag = "github";

class GithubTracker implements Tracker {
    constructor(private octokit: InstanceType<typeof GitHub>, private owner: string, private repo: string) {
    }

    async getIssue(issueId: string): Promise<Issue> {
        return this.octokit.request("GET /repos/{owner}/{repo}/issues/{issueId}", {
            owner: this.owner,
            repo: this.repo,
            issueId: issueId
        }).then((response) => {
            if (response.status !== 200) {
                return Promise.reject(response)
            }

            return Promise.resolve({
                isOpen: response.data.state === "open",
                issueId: issueId
            })
        });
    }

    async getIssues(issueIds: string | [string]): Promise<Issue[]> {
        if (typeof issueIds === "string") {
            return this.getIssue(issueIds).then((issue) => {
                return Promise.resolve([issue]);
            });
        }

        return this.octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: this.owner,
            repo: this.repo,
        }).then((response) => {
            if (response.status !== 200) {
                return Promise.reject(response);
            }

            const matchingIssues = response.data.filter((githubIssue) => {
                const id: string = githubIssue.id.toString(10);
                return issueIds.indexOf(id);
            });
            if (matchingIssues === undefined) {
                return Promise.reject(response);
            }

            return Promise.resolve(matchingIssues.map((githubIssue) => {
                return {
                    isOpen: githubIssue.state === "open",
                    issueId: githubIssue.id.toString(10)
                }
            }))
        });
    }
}


export const initGithubTracker = async (input: { token: string }): Promise<GithubTracker> => {
    return new Promise<GithubTracker>(() => {
        const octokit = getOctokit(input.token);
        const repoEnvVar = process.env.GITHUB_REPOSITORY;

        if (repoEnvVar === undefined) {
            return Promise.reject("GITHUB_REPOSITORY environment variable must be set!")
        }

        const [owner, repo] = repoEnvVar.split("/")

        return new GithubTracker(octokit, owner, repo);
    });
}