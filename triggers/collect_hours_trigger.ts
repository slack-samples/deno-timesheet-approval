import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import CollectHoursWorkflow from "../workflows/collect_hours.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const collectHoursTrigger: Trigger<typeof CollectHoursWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Log hours worked",
  description: "Save your billable hours to the timesheet",
  workflow: `#/workflows/${CollectHoursWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
  },
};

export default collectHoursTrigger;
