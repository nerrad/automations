/**
 * Internal dependencies
 */
const checkForDuplicateIssue = require("./utils/check-for-duplicate-issue");
const reopenClosed = require("./utils/reopen-closed");
const { lineBreak, truncate } = require("./utils/helpers");
const { issueFromMerge } = require("./templates");
const getTodos = require("./utils/get-todos");
const debug = require("../../debug");

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async (context, octokit) => {
  // if the pull is closed but not merged, skip
  if (!context.payload.pull_request.merged) {
    return;
  }

  /**
   * @type {TodoItem[]}
   */
  const todos = getTodos(context, octokit);
  todos.forEach(
    async ({
      keyword,
      title,
      content,
      fileName,
      range,
      sha,
      username,
      number,
    }) => {
      // Prevent duplicates!
      const existingIssue = await checkForDuplicateIssue(
        context,
        octokit,
        title
      );
      if (existingIssue) {
        debug(`Duplicate issue found with title [${title}]`);
        return reopenClosed(
          { context, octokit, issue: existingIssue },
          { keyword, title, sha, fileName }
        );
      }
      let body = issueFromMerge({
        ...context.repo,
        sha,
        username,
        range,
        fileName,
        keyword,
        number,
        body: content,
      });
      body = lineBreak(body);
      const { owner, repo } = context.repo;
      debug(`Creating issue [${title}] in [${owner}/${repo}]`);
      return octokit.issues.create({
        ...context.repo,
        title: truncate(title),
        body,
      });
    }
  );
};