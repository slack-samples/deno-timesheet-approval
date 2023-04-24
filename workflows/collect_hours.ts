import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SaveHoursFunctionDefinition } from "../functions/save_hours.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 */
const CollectHoursWorkflow = DefineWorkflow({
  callback_id: "collect_hours",
  title: "Collect billable hours",
  description: "Gather and save timesheet info to a Google sheet",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
});

/**
 * For collecting input from users, we recommend the
 * built-in OpenForm function as a first step.
 * https://api.slack.com/automation/functions#open-a-form
 */
const timesheetForm = CollectHoursWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Collect hours",
    description: "Log the hours you've worked into a timesheet",
    interactivity: CollectHoursWorkflow.inputs.interactivity,
    submit_label: "Save",
    fields: {
      elements: [{
        name: "time_in",
        title: "Time in",
        type: Schema.slack.types.timestamp,
        default: Math.floor(new Date().setHours(9, 0, 0) / 1000),
      }, {
        name: "time_out",
        title: "Time out",
        type: Schema.slack.types.timestamp,
        default: Math.floor(new Date().setHours(17, 0, 0) / 1000),
      }, {
        name: "breaks",
        title: "Breaks",
        type: Schema.types.integer,
        description: "Total break time in minutes",
        minimum: 0,
      }],
      required: ["time_in", "time_out"],
    },
  },
);

CollectHoursWorkflow.addStep(SaveHoursFunctionDefinition, {
  googleAccessTokenId: { credential_source: "DEVELOPER" },
  employee: CollectHoursWorkflow.inputs.interactivity.interactor.id,
  time_in: timesheetForm.outputs.fields.time_in,
  time_out: timesheetForm.outputs.fields.time_out,
  breaks: timesheetForm.outputs.fields.breaks,
});

export default CollectHoursWorkflow;
