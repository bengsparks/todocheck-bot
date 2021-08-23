/* import * as core from '@actions/core'; */
import * as argparse from 'argparse'
import *  as github from './trackers/github';

const main = () => {
    const namespace: argparse.Namespace = ((parameters: string[]) => {
        const parser = new argparse.ArgumentParser({
            prog: process.env.npm_package_name,
            description: process.env.npm_package_description
        });

        parser.add_argument("-b", "--basepath", {
            default: ".",
            required: false,
            help: "The path for the project. Defaults to current directory",
        });

        parser.add_argument("-c", "--config", {
            required: false,
            help: "The project configuration file to use. Will use the one from the basepath if not specified",
        });

        parser.add_argument("-tr", "--tracker", {
            choices: [github.tag],
            required: true,
            help: "Which issue tracker is used for this project"
        });

        parser.add_argument("-tc", "--todocheck", {
            required: true,
            help: "Path to the todocheck binary"
        });

        return parser.parse_args(parameters);

    })(process.argv.slice(2));

    const tr: string = namespace.tracker;
    if (tr === github.tag) {
        console.log("detected github")
    }
}

main()