import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

console.log("Hello from Buidler Analyzer!");

const router = new Router();

//   .post("/add_notes", async (context) => {
//     const supabase = createClient(
//     // Supabase API URL - env var exported by default.
//     Deno.env.get('SUPABASE_URL') ?? '',
//     // Supabase API ANON KEY - env var exported by default.
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     )
//     // Change to get data from request body instead of query params
//     let content = await context.request.body.text();
//     content = JSON.parse(content);
//     const author = content.author;
//     const word = content.word;
//     const line = content.line;
//     const note = content.note;
//     const version = content.version;
//     const { data, error } = await supabase
//       .from('indiehacker_book_notes')
//       .insert([
//         { author, line, word, note, version }
//       ])
//     console.log(data)

//     // Add response handling
//     if (error) {
//       context.response.status = 400;
//       context.response.body = { error: error.message };
//     } else {
//       context.response.status = 201;
//       context.response.body = { message: "Note added successfully" };
//     }
//   })
//   .get("/notes", async (context) => {

//     const supabase = createClient(
//     // Supabase API URL - env var exported by default.
//     Deno.env.get('SUPABASE_URL') ?? '',
//     // Supabase API ANON KEY - env var exported by default.
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     )

//     // Querying data from Supabase
//     const { data, error } = await supabase
//       .from('indiehacker_book_notes')
//       .select('*')

//     if (error) {
//       console.error('Error fetching data:', error);
//       context.response.status = 500;
//       context.response.body = "Failed to fetch data";
//       return;
//     }

//     context.response.body = data;
// })
router.get("/analyze_user", async (context) => {
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (!githubToken) {
    context.response.status = 500;
    context.response.body = { error: "GitHub API key not found" };
    return;
  }

  const username = context.request.url.searchParams.get("username");
  if (!username) {
    context.response.status = 400;
    context.response.body = { error: "Username parameter is required" };
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const userData = await response.json();

    // Fetch user's social accounts
    const socialResponse = await fetch(`https://api.github.com/users/${username}/social_accounts`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!socialResponse.ok) {
      throw new Error(`GitHub API responded with status ${socialResponse.status}`);
    }

    const socialAccounts = await socialResponse.json();

    // Fetch user's events to get the last commit time
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!eventsResponse.ok) {
      throw new Error(`GitHub API responded with status ${eventsResponse.status}`);
    }

    const events = await eventsResponse.json();

    // Find the last push event
    const lastPushEvent = events.find(event => event.type === 'PushEvent');
    const lastCommitTime = lastPushEvent ? new Date(lastPushEvent.created_at) : null;

    // Perform basic analysis
    const analysis = {
      followersBiggerThanOne: userData.followers >= 1 ? "Yes" : "No",
      sourcePublicRepos: "No",
      hasSocialAccounts: socialAccounts.length > 0 ? "Yes" : "No",
      hasPublicEmail: userData.email ? "Yes" : "No",
      lastCommitInLastMonth: lastCommitTime && (new Date().getTime() - lastCommitTime.getTime() <= 30 * 24 * 60 * 60 * 1000) ? "Yes" : "No",
    };

    // Fetch repositories to count source repos
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub API responded with status ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();
    const sourceRepos = repos.filter(repo => !repo.fork).length;

    analysis.sourcePublicRepos = sourceRepos >= 3 ? "Yes" : "No";

    context.response.body = {
      analysis: analysis,
      raw_data: {
        username: userData.login,
        name: userData.name,
        bio: userData.bio, // Add this line to include the user's bio
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        socialAccounts: socialAccounts,
        userEmail: userData.email,
        lastCommitTime: lastCommitTime ? lastCommitTime.toISOString() : null,
      },
    };
  } catch (error) {
    console.error("Error analyzing user:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to analyze user" };
  }
});

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");

await app.listen({ port: 8000 });
