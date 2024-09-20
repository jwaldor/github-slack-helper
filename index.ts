// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persists across program updates. Store data here.
import { nodes, root, state } from "membrane";

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

export async function handler(_, { event }) {
  const username = await event.comment.$pop().$pop().user.login;
  console.log(username);
  const listener = state.comment_listeners
    ? state.comment_listeners.get(username)
    : undefined;
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
