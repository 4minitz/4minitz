const Travis = require(`travis-ci`),
      _ = require('lodash/fp'),
      optionParser = require('node-getopt').create([
        ['b', 'branch=[ARG]', 'Branch to query; Default is master'],
        ['h', 'help', 'Display this help']]);

var travis = new Travis({
    version: `2.0.0`,
    headers: {
        'user-agent': 'Travis/1.0'
    }
});

const arg = optionParser.bindHelp().parseSystem();
const branch = _.getOr('master', 'branch', arg.options);

var isRelevantCommitId = _.curry((successfulCommits, commitOnBranch) => _.includes(commitOnBranch.id, successfulCommits));

var getCommitsOnBranch = _.compose(
    _.filter({branch}),
    _.prop('commits')
);

var getCommitIdsThatPassed = _.compose(
    _.map(_.prop('commit_id')),
    _.filter({state: 'passed'}),
    _.prop('builds')
);

var getLatestCommit = _.compose(
    _.head,
    _.sortBy('commited_at')
);

travis.authenticate({
    github_token: process.env.GITHUB_TOKEN
}, (error) => {
    if (error) {
        console.log(`Error authenticating: ${error}`);
        return;
    }

    travis.repos('4minitz', '4minitz').builds().get((error, response) => {
        if (error) {
            console.error(`Error getting latest builds: ${error}`);
            return;
        }

        const commitsOnBranch = getCommitsOnBranch(response);
        const commitsThatPassed = getCommitIdsThatPassed(response);
        const commitsOnBranchThatPassed = _.filter(isRelevantCommitId(commitsThatPassed), commitsOnBranch);
        const latestStableCommit = getLatestCommit(commitsOnBranchThatPassed);

        const sha = _.getOr('', 'sha', latestStableCommit);

        console.log(sha);
    });
});