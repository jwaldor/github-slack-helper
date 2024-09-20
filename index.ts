// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persists across program updates. Store data here.
import { nodes, root, state } from "membrane";

export async function configure() {}

//set up a listener for an org
export async function configure_org_comment({ name }) {
  await nodes.github.organizations
    .one({ name })
    .commentCreated.$subscribe(root.handler); // .commentCreated.$subscribe(root.handler);
}

//allows a user to listen for comments on their PRs (for all orgs whose comment events are subscribed to)
export async function user_listen_comments({ github_id, slack_id }) {
  if (state.comment_listeners) {
    state.comment_listeners.set(github_id, slack_id);
  } else {
    state.comment_listeners = new Map([[github_id, slack_id]]);
  }
  console.log(`${github_id},${slack_id} started listening`);
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

export async function send_open_issues() {
  console.log("start");
  console.log("alerts");
  // const repos = state.open_issue_alerts
  //   ? Object.keys(state.open_issue_alerts)
  //   : [];
  console.log("loop");
  for (let [repo, value] of state.open_issue_alerts.entries()) {
    // console.log(repo, "here");
    console.log("here");
    // console.log(repo, "hello");
    console.log(await repo.issues.page().items);
    repo.issues;
    console.log("here2");
    // console.log(await repo.issues.page().items);
    console.log("here3");
    const issues = await repo.issues.page().items.items;
    console.log("issues", issues);
    // const display = issues
    //   .map((item) => `${item.title} ${item.url}`)
    //   .join("\n");
    // console.log("issues", issues);
    // console.log("name", repo.name);
    // state.open_issue_alerts.get(repo).forEach((user) => {
    //   nodes.slack.users.one({ id: user }).sendMessage({
    //     text: `Outstanding issues for ${repo.name}\n${issues}`,
    //   });
    // });
  }
  // repos.forEach((repo) => {

  // });
}

export async function handler(_, { event }) {
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

export async function test_func() {
  const test_thing = nodes.github.organizations
    .one({ name: "fractal-bootcamp" })
    .repos.one({ name: "directoryNY" })
    .pull_requests.one({ number: 1 });
}

// export async function configure_git({ org, api_key }) {
//   nodes.github.configure({ token: api_key });
// }
