import { getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import * as core from '@actions/core';

import {
  Inputs, Issue, IssueComparator, Tracker,
} from './tracker';

const makeIssueFromGithub = (githubIssue: { id: number | string, state: string }): Issue => ({
  isOpen: githubIssue.state === 'open',
  issueRef: githubIssue.id.toString(10),
});

class GithubTracker implements Tracker {
  constructor(
    private octokit: InstanceType<typeof GitHub>,
    private metadata: { owner: string, repo: string },
  ) { }

  async getIssue(issueId: string): Promise<Issue> {
    const resp = await this.octokit.rest.issues.get({
      ...this.metadata,
      issue_number: parseInt(issueId, 10),
    });
    if (resp.status !== 200) {
      throw new Error(resp.toString());
    }

    return makeIssueFromGithub({ id: issueId, state: resp.data.state });
  }

  async getIssues(issueIds: string | string[]): Promise<Issue[]> {
    if (typeof issueIds === 'string') {
      return [await this.getIssue(issueIds)];
    }

    const issues: Issue[] = await Promise.all(issueIds.map(this.getIssue));

    /* const resp = await this.octokit.request('GET /repos/{owner}/{repo}/issues', {
      ...this.metadata,
    }); */

    return issues
      .filter((issue) => issueIds.includes(issue.issueRef));
  }

  async reopenIssue(issue: Issue): Promise<Issue> {
    if (issue.isOpen) {
      throw new Error(`${issue} is already open!`);
    }

    const resp = await this.octokit.rest.issues.update({
      ...this.metadata,
      issue_number: parseInt(issue.issueRef, 10),
      state: 'open',
    });

    /* const resp = await this.octokit.request('PATCH /repos/{owner}/{repo}/issues/{issueNumber}', {
      ...this.metadata,
      issueNumber: issue.issueRef,
      state: 'open',
    }); */
    if (resp.status !== 200) {
      throw new Error(resp.toString());
    }

    return makeIssueFromGithub({ id: issueId, state: resp.data.state });
  }

  async reopenIssues(issues: Issue | Issue[]): Promise<Issue[]> {
    // Github REST Api does not seem to support multiple issue updates,
    // so issue all requests and Promise.all
    const allIssues = !Array.isArray(issues) ? [issues] : issues;
    return Promise.all(allIssues.map(this.reopenIssue));
  }
}

export const initGithubTracker = (inputs: {
  token: string,
}): GithubTracker => {
  const repoEnvVar = process.env.GITHUB_REPOSITORY;
  if (repoEnvVar === undefined) {
    throw new Error('GITHUB_REPOSITORY environment variable must be set!');
  }

  const [owner, repo] = repoEnvVar.split('/');
  const octokit = getOctokit(inputs.token);

  return new GithubTracker(octokit, { owner, repo });
};

export const readInputsFromAction = (): Inputs => ({
  token: core.getInput('token'),
  issueRefs: core.getInput('issue-numbers').split(','),
  todocheck: core.getInput('todocheck'),
});

export const comparator: IssueComparator = (
  lhs: { issueRef: string | number; },
  rhs: { issueRef: string | number; },
): number => {
  const li: number = typeof lhs.issueRef === 'string'
    ? parseInt(lhs.issueRef, 10)
    : lhs.issueRef;
  const ri: number = typeof rhs.issueRef === 'string'
    ? parseInt(rhs.issueRef, 10)
    : rhs.issueRef;
  return li - ri;
};
