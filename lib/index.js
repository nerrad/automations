/**
 * External dependencies
 */
const { setFailed, getInput } = require("@actions/core");
const { context, Github } = require("@actions/github");

/**
 * Internal dependencies
 */
const handleTodos = require("./automations/todos");
const debug = require("./debug");
const ifNotFork = require("./if-not-fork");
const automations = require("./automations");

/**
 * @typedef {import('@actions/github').GitHub} Github
 */

(async function initialize() {
  const token = getInput("github_token");
  const types = getInput("automations") || [];

  if (typeof types !== "array") {
    setFailed(
      "initialize: The provided `automations` configuration object must be a list."
    );
    return;
  }
  if (!token) {
    setFailed("initialize: Input `github_token` is required");
    return;
  }

  const octokit = new GitHub(token);

  debug(
    `initialize: Received event = '${context.eventName}', action = '${context.payload.action}'`
  );

  for (const { name, events, actions, runner } of automations) {
    if (
      event.includes(context.eventName) &&
      (actions === undefined || actions.includes(context.payload.action))
    ) {
      try {
        debug(`initialize: Starting runner ${name}`);
        await runner(context.event, context.payload, octokit);
      } catch (error) {
        setFailed(`initialize: Runner ${name} failed with error: ${error}`);
      }
    }
  }

  debug("initialize: All done!");
})();