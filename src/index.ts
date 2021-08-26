import * as util from "util";
const exec = util.promisify(require('child_process').exec);

import * as github from "./trackers/github";
import { TodocheckOutput, parse, ParseResult } from "./todocheck";

const main = async () => {
    const [inputs, tracker] = (() => {
        let i: Inputs;
        let t: Tracker;

        if (process.env.GITHUB_REPOSITORY) {
            i = github.readInputsFromAction();
            t = github.initGithubTracker(i);
        }

        else {
            throw new Error("Unknown host!")
        }

        return [i, t] as const;
    })();

    // TODO: Support closing of multiple issues, e.g. when a Pull Request is merged
    // TODO: and it references multiple relevant issues 

    // For now, simple issue closing is supported
    const issue = await tracker.getIssue(inputs.issueRef);
    if (issue.isOpen) {
        throw new Error(`Accidentally fired on an open issue! ${issue}`)
    }

    // TODO: Execute todocheck here and capture output
    const {stdout, _stderr} = await exec(`${inputs.todocheck} --format json`);
    const output: ParseResult<TodocheckOutput> = parse(stdout);

    if (!!output && output.hasError) {
        throw output.error
    }

    const reopenedIssue = await tracker.reopenIssue(issue);
    if (!reopenedIssue.isOpen) {
        throw new Error(`Referenced issue is still closed! ${issue}`)
    }
}

main().then(() => {
    console.log("Execution terminated successfully")
}).catch((reason) => {
    console.error(`${reason}`)
})