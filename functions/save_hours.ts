import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Configuration information for the storing spreadsheet
// https://developers.google.com/sheets/api/guides/concepts#expandable-1
const GOOGLE_SPREADSHEET_RANGE = "A2:E2";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const SaveHoursFunctionDefinition = DefineFunction({
  callback_id: "save_hours",
  title: "Save logged hours",
  description: "Store input hours in a Google sheet",
  source_file: "functions/save_hours.ts",
  input_parameters: {
    properties: {
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
      employee: {
        type: Schema.slack.types.user_id,
        description: "Employee logging hours",
      },
      time_in: {
        type: Schema.slack.types.timestamp,
        description: "Start time for the date",
      },
      time_out: {
        type: Schema.slack.types.timestamp,
        description: "End time for the date",
      },
      breaks: {
        type: Schema.types.integer,
        description: "Minutes of break time taken",
      },
    },
    required: ["googleAccessTokenId", "employee", "time_in", "time_out"],
  },
  output_parameters: {
    properties: {
      hours: {
        type: Schema.types.number,
        description: "Total number of hours worked",
      },
    },
    required: ["hours"],
  },
});

export default SlackFunction(
  SaveHoursFunctionDefinition,
  async ({ inputs, client, env }) => {
    const { employee, time_in, time_out, breaks } = inputs;

    const startDate = new Date(time_in * 1000);
    const endDate = new Date(time_out * 1000);
    const timeOff = breaks ?? 0;
    const hours = (time_out - time_in - timeOff * 60) / 3600;

    // Validate inputs
    if (time_out < time_in) {
      return { error: `Start time is after end time` };
    }

    if (time_out - time_in < timeOff * 60) {
      return { error: `Break time exceeds shift duration` };
    }

    // Collect Google access token
    const auth = await client.apiCall("apps.auth.external.get", {
      external_token_id: inputs.googleAccessTokenId,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }

    // Append times to spreadsheet
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SPREADSHEET_ID}/values/${GOOGLE_SPREADSHEET_RANGE}:append?valueInputOption=USER_ENTERED`;
    const sheets = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${auth.external_token}`,
      },
      body: JSON.stringify({
        range: GOOGLE_SPREADSHEET_RANGE,
        majorDimension: "ROWS",
        values: [[employee, startDate, endDate, timeOff, hours]],
      }),
    });

    if (!sheets.ok) {
      return {
        error: `Failed to save hours to the timesheet: ${sheets.statusText}`,
      };
    }

    return { outputs: { hours } };
  },
);
