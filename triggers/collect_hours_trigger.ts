import { Trigger } from "deno-slack-sdk/types.ts";
import CollectHoursWorkflow from "../workflows/collect_hours.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const collectHoursTrigger: Trigger<typeof CollectHoursWorkflow.definition> = {
  type: "shortcut",
  name: "Log hours worked",
  description: "Save your billable hours to the timesheet",
  workflow: "#/workflows/collect_hours",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
  },
};

export default collectHoursTrigger;
