// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persists across program updates. Store data here.
import { nodes, root, state } from "membrane";

//set up a listener for an org
export async function configure_org({ org }) {
  console.log(org)
  await nodes.github.organizations
    .one({ name:org })
    .commentCreated.$subscribe(root.handle_comment);
  await nodes.github.organizations
    .one({ name:org })
    .reviewRequested.$subscribe(root.handle_reviewrequested);
  await nodes.github.organizations
    .one({ name:org })
    .reviewCreated.$subscribe(root.handle_reviewrequested);
}

//allows a user to listen for comments on their PRs (for all orgs whose comment events are subscribed to)
export async function user_listen_comments({ github_name, slack_id }) {
  if (state.comment_listeners) {
    state.comment_listeners.set(github_name, slack_id);
  } else {
    state.comment_listeners = new Map([[github_name, slack_id]]);
  }
  console.log(`${github_name},${slack_id} started listening`);
}

export async function user_alert_open_issues({ owner, repo, slack_id }) {
  repo = nodes.github.users.one({ name: owner }).repos.one({ name: repo });
  console.log("repo", repo);
  if (!state.open_issue_alerts) {
    state.open_issue_alerts = new Map();
  }
  state.open_issue_alerts.get(repo)
    ? state.open_issue_alerts.get(repo).push(slack_id)
    : state.open_issue_alerts.set(repo, [slack_id]);
}

export async function user_alert_review_requested({ github_name, slack_id }) {
  if (!state.review_requested_alerts) {
    state.review_requested_alerts = new Map([[github_name, slack_id]]);
  } else {
    state.review_requested_alerts.set(github_name, slack_id);
  }
}

export async function user_alert_review_requested_1day({
  github_name,
  slack_id,
}) {
  if (!state.review_requested_alerts_1day) {
    state.review_requested_alerts_1day = new Map([[github_name, slack_id]]);
  } else {
    state.review_requested_alerts_1day.set(github_name, slack_id);
  }
}

export async function send_open_issues() {
  for (let [repo, value] of state.open_issue_alerts.entries()) {
    // console.log(
    //   await repo.issues.search({
    //     q: "is:issue is:open",
    //     sort: "created",
    //     order: "desc",
    //     per_page: 10, // Adjust this number as needed
    //   })
    // );
    const issues = await repo.issues.page.items.$query(
      "{ number title user { login } }"
    );
    const issues_text = issues
      .map((issue) => `#${issue.number} ${issue.title} by ${issue.user.login}`)
      .join("\n");
    await Promise.all(
      state.open_issue_alerts.get(repo).map(async (user) => {
        const { name } = await repo.$query("{ name }");
        await nodes.slack.users.one({ id: user }).sendMessage({
          text: `10 most recent open issues for ${name}\n${issues_text}`,
        });
      })
    );
  }
}
// repos.forEach((repo) => {

// });

export async function handle_comment(_, { event }) {
  const username = await event.comment.$pop().$pop().user.login;
  console.log(username);
  const listener = state.comment_listeners?.get(username);
  console.log(listener);
  if (listener) {
    console.log("listener found");
    await nodes.slack.users.one({ id: listener }).sendMessage({
      text: `New comment for ${username}: ${await event.comment.body}`,
    });
  }
}

export async function handle_reviewrequested(_, { event }) {
  console.log("requestedreviewer",await event.requestedReviewer,"pullrequest",await event.pullRequest);
  const reviewer = await event.requestedReviewer.login;
  const pullRequest = await event.pullRequest;
  const {title,url} = await pullRequest.$query("{ title url }")
  const owner = await pullRequest.owner;
  const {login} = await owner.$query("{ login }");
  const slack_id = state.review_requested_alerts.get(reviewer);

  if (slack_id){

      //handle alerting about requested reviews
      await nodes.slack.users.one({ id: slack_id }).sendMessage({
        text: `Your review has been requested for the following Pull Request: ${title} by ${login} found at ${url}`,
      });
  }
  //handle reminding about requested reviews



}

export async function handle_reviewsubmitted(_, { event }) {
  //handle alerting about requested reviews
  const reviewer = await event.pullRequest.requested_reviewer.login;
  // const pr_url =  await event.pull_request_url;
  // const request = await event;
  
  const slack_id = state.review_requested_alerts.get(reviewer);

  //handle reminding about requested reviews
}

export async function test_func() {
  const test_thing = nodes.github.organizations
    .one({ name: "fractal-bootcamp" })
    .repos.one({ name: "directoryNY" })
    .pull_requests.one({ number: 1 });
}

// export async function configure_git({ org, api_key }) {
//   nodes.github.configure({ token: api_key });
// }
