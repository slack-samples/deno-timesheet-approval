import { stub } from "@std/testing/mock";
import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import SaveHoursFunction from "./save_hours.ts";

function stubFetch() {
  // Replaces globalThis.fetch with the mocked copy
  return stub(
    globalThis,
    "fetch",
    async (url: string | URL | Request, options?: RequestInit) => {
      const req = url instanceof Request ? url : new Request(url, options);

      assertEquals(req.method, "POST");

      switch (req.url) {
        case "https://slack.com/api/users.profile.get":
          return new Response(JSON.stringify({
            ok: true,
            profile: {
              real_name: "Cactus Poke",
            },
          }));
        case "https://slack.com/api/apps.auth.external.get": {
          const body = await req.formData();
          if (body.get("external_token_id") === "INVALID_TOKEN_ID") {
            return new Response(JSON.stringify({
              ok: false,
              error: "Invalid token",
            }));
          }
          return new Response(JSON.stringify({
            ok: true,
            external_token: "GOOGLE_ACCESS_TOKEN",
          }));
        }
        case "https://sheets.googleapis.com/v4/spreadsheets/undefined/values/A2:F2:append?valueInputOption=USER_ENTERED":
          // Code to execute if expression === value2
          return new Response(JSON.stringify({
            ok: true,
          }));
        default:
          throw Error(
            `No stub found for ${req.method} ${req.url}\nHeaders: ${
              JSON.stringify(Object.fromEntries(req.headers.entries()))
            }`,
          );
      }
    },
  );
}

const { createContext } = SlackFunctionTester("save_hours");

Deno.test("Fail on invalid auth token id", async () => {
  using _stubFetch = stubFetch();
  const inputs = {
    googleAccessTokenId: "INVALID_TOKEN_ID",
    employee: "U04051AF9NJ",
    time_in: 1673456400,
    time_out: 1673485200,
  };

  const { error } = await SaveHoursFunction(createContext({ inputs }));
  assertEquals(error?.includes("Invalid token"), true);
});

Deno.test("Save hours for a shift without breaks", async () => {
  using _stubFetch = stubFetch();
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    employee: "U04051AF9NJ",
    time_in: 1673456400,
    time_out: 1673485200,
  };

  const { outputs, error } = await SaveHoursFunction(createContext({ inputs }));
  assertEquals(error, undefined);
  assertEquals(outputs?.hours, 8);
});

Deno.test("Save hours for a shift with breaks", async () => {
  using _stubFetch = stubFetch();
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    employee: "U04051AF9NJ",
    time_in: 1673456400,
    time_out: 1673485200,
    breaks: 30,
  };

  const { outputs, error } = await SaveHoursFunction(createContext({ inputs }));
  assertEquals(error, undefined);
  assertEquals(outputs?.hours, 7.5);
});

Deno.test("Fail when time out precedes time in", async () => {
  using _stubFetch = stubFetch();
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    employee: "U04051AF9NJ",
    time_in: 1673485200,
    time_out: 1673456400,
  };

  const { error } = await SaveHoursFunction(createContext({ inputs }));
  assertEquals(error?.includes("Start time is after end time"), true);
});

Deno.test("Fail when break duration exceeds shift duration", async () => {
  using _stubFetch = stubFetch();
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    employee: "U04051AF9NJ",
    time_in: 1673456400,
    time_out: 1673485200,
    breaks: 8 * 60 + 1,
  };

  const { error } = await SaveHoursFunction(createContext({ inputs }));
  assertEquals(error?.includes("Break time exceeds shift duration"), true);
});
