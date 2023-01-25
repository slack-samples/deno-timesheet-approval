import * as mf from "mock-fetch/mod.ts";
import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import SaveHoursFunction from "./save_hours.ts";

// Replaces globalThis.fetch with the mocked copy
mf.install();

mf.mock("POST@/api/apps.auth.external.get", async (args) => {
  const body = await args.formData();

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
});

mf.mock("POST@/v4/spreadsheets/*/values/*:append", () => {
  return new Response(JSON.stringify({
    ok: true,
  }));
});

const { createContext } = SlackFunctionTester("save_hours");

Deno.test("Fail on invalid auth token id", async () => {
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
