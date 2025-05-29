# Timesheet Approval

This automation features a workflow that collects input from a form in Slack and
saves the results to a Google Sheet.

https://github.com/slack-samples/deno-timesheet-approval/assets/18134219/75224918-67fb-488a-8fa6-1e9af5f36de6

**Guide Outline**:

- [Included Workflows](#included-workflows)
- [Setup](#setup)
  - [Install the Slack CLI](#install-the-slack-cli)
  - [Clone the Sample](#clone-the-sample)
  - [Prepare Google Services](#prepare-google-services)
- [Creating Triggers](#creating-triggers)
- [Datastores](#datastores)
- [Testing](#testing)
- [Deploying Your App](#deploying-your-app)
- [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Included Workflows

- **Collect billable hours**: Gather and save timesheet info to a Google sheet

## Setup

Before getting started, first make sure you have a development workspace where
you have permission to install apps. **Please note that the features in this
project require that the workspace be part of
[a Slack paid plan](https://slack.com/pricing).**

### Install the Slack CLI

To use this sample, you first need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/automation/quickstart).

### Clone the Sample

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ slack create my-app -t slack-samples/deno-timesheet-approval

# Change into the project directory
$ cd my-app
```

## Prepare Google Services

With [external authentication](https://api.slack.com/automation/external-auth)
you can programmatically interact with Google services and APIs from your app,
as though you're the authorized user.

The client credentials needed for these interactions can be collected from a
Google Cloud project with OAuth enabled and with access to the appropriate
services.

### Create a Google Cloud Project

Begin by creating a new project from
[the Google Cloud resource manager](https://console.cloud.google.com/cloud-resource-manager),
then
[enabling the Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
for this project.

Next,
[create an OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
for your app. The "User Type" and other required app information can be
configured as you wish. No additional scopes need to be added here, and you can
add test users for development if you want.

Client credentials can be collected by
[creating an OAuth client ID](https://console.cloud.google.com/apis/credentials/oauthclient)
with an application type of "Web application". Under the "Authorized redirect
URIs" section, add `https://oauth2.slack.com/external/auth/callback` then click
"Create".

You'll use these newly created client credentials in the next steps.

#### Set the Client ID

Start by renaming the `.env.example` file at the top level of your project to
`.env`, being sure not to commit this file to version control. This file will
store sensitive, app-specific variables that are determined by the environment
being used.

Now take your client ID and add it as the value for `GOOGLE_CLIENT_ID` in the
`.env` file. This value will be used in `external_auth/google_provider.ts` - the
custom OAuth2 provider definition for your Google project.

Once complete, update your local or hosted app with `slack run` or
`slack deploy` to create an environment for storing your external authentication
client secret and access token.

> Note: Unlike environment variables used at runtime, this variable is only used
> when generating your app manifest. Therefore, you do **not** need to use the
> `slack env add` command to set this value for
> [deployed apps](#deploying-your-app).

#### Save the Client Secret

With your client secret ready, run the following command, replacing
`GOOGLE_CLIENT_SECRET` with your own secret:

```sh
$ slack external-auth add-secret --provider google --secret GOOGLE_CLIENT_SECRET
```

When prompted to select an app, choose the `(local)` app only if you're running
the app locally.

#### Initiate the OAuth2 Flow

With your Google project created and the Client ID and secret set, you're ready
to initate the OAuth flow!

If all the right values are in place, the following command will prompt you to
choose an app, select a provider (hint: choose the `google` one), then pick the
Google account you want to authenticate with:

```sh
$ slack external-auth add
```

Once you've successfully authenticated your account, you're almost ready to
configure your Google Sheet and create a link into your workflow!

#### Assign Authentication to the Workflow

To complete the connection process, you need to let your app know which
authenticated account you'll be using for specific workflows.

Specify that the "Collect billable hours" workflow should use your recently
authenticated account when making API calls using the following command:

```sh
$ slack external-auth select-auth
```

Select the workspace and app environment for your app, then select the
`#/workflows/collect_hours` workflow and the `google` provider to choose the
external account to use.

With this, you're ready to make API calls from your workflow!

### Create a Google Sheet

In this app, the inputs of submitted forms are stored in a Google Sheet.

To prepare this external datastore, start by
[creating a blank spreadsheet](https://docs.google.com/spreadsheets/create)
using your authenticated account, then add the following headers to Row 1:

```
Name | Employee | Time in | Time out | Breaks (min) | Hours
```

Designate this spreadsheet as the desired datastore through environment
variables, which allows for different spreadsheets to be used across your local
and hosted app instances.

Copy your spreadsheet's ID (the random-ish string found in the URL). Now, you're
ready to set up your environment!

#### Development Environment Variables

When [developing locally](https://api.slack.com/automation/run), environment
variables found in the `.env` file at the root of your project are used. For
local development, add your spreadsheet ID to the `.env` file (replacing
`YOUR_SPREADSHEET_ID` with your spreadsheet ID):

```bash
# .env
GOOGLE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
```

#### Production Environment Variables

[Deployed apps](https://api.slack.com/automation/deploy) use environment
variables that are added using `slack env`. To add your access token to a
Workspace where your deployed app is installed, use the following command (once
again, replacing `YOUR_SPREADSHEET_ID` with your spreadsheet ID):

```sh
$ slack env add GOOGLE_SPREADSHEET_ID YOUR_SPREADSHEET_ID
```

## Running Your Project Locally

While building your app, you can see your changes appear in your workspace in
real-time with `slack run`. You'll know an app is the development version if the
name has the string `(local)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

To stop running locally, press `<CTRL> + C` to end the process.

## Creating Triggers

[Triggers](https://api.slack.com/automation/triggers) are what cause workflows
to run. These triggers can be invoked by a user, or automatically as a response
to an event within Slack.

When you `run` or `deploy` your project for the first time, the CLI will prompt
you to create a trigger if one is found in the `triggers/` directory. For any
subsequent triggers added to the application, each must be
[manually added using the `trigger create` command](#manual-trigger-creation).

When creating triggers, you must select the workspace and environment that you'd
like to create the trigger in. Each workspace can have a local development
version (denoted by `(local)`), as well as a deployed version. _Triggers created
in a local environment will only be available to use when running the
application locally._

### Link Triggers

A [link trigger](https://api.slack.com/automation/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app).

With link triggers, after selecting a workspace and environment, the output
provided will include a Shortcut URL. Copy and paste this URL into a channel as
a message, or add it as a bookmark in a channel of the workspace you selected.
Interacting with this link will run the associated workflow.

**Note: triggers won't run the workflow unless the app is either running locally
or deployed!**

### Manual Trigger Creation

To manually create a trigger, use the following command:

```zsh
$ slack trigger create --trigger-def triggers/collect_hours_trigger.ts
```

## Datastores

For storing data related to your app, datastores offer secure storage on Slack
infrastructure. The use of a datastore requires the
`datastore:write`/`datastore:read` scopes to be present in your manifest.

## Testing

For an example of how to test a function, see `functions/save_hours_test.ts`.
Test filenames should be suffixed with `_test`.

Run all tests with `deno test`:

```zsh
$ deno test
```

## Deploying Your App

Once development is complete, deploy the app to Slack infrastructure using
`slack deploy`:

```zsh
$ slack deploy
```

When deploying for the first time, you'll be prompted to
[create a new link trigger](#creating-triggers) for the deployed version of your
app. When that trigger is invoked, the workflow should run just as it did when
developing locally (but without requiring your server to be running).

## Viewing Activity Logs

Activity logs of your application can be viewed live and as they occur with the
following command:

```zsh
$ slack activity --tail
```

## Project Structure

### `.slack/`

Contains `apps.dev.json` and `apps.json`, which include installation details for
development and deployed apps.

Contains `hooks.json` used by the CLI to interact with the project's SDK
dependencies. It contains script hooks that are executed by the CLI and
implemented by the SDK.

### `datastores/`

[Datastores](https://api.slack.com/automation/datastores) securely store data
for your application on Slack infrastructure. Required scopes to use datastores
include `datastore:write` and `datastore:read`.

### `external_auth/`

[External authentication](https://api.slack.com/automation/external-auth)
enables connections to external services using OAuth2. Once connected, you can
perform actions as the authorized user on these services using custom functions.

### `functions/`

[Functions](https://api.slack.com/automation/functions) are reusable building
blocks of automation that accept inputs, perform calculations, and provide
outputs. Functions can be used independently or as steps in workflows.

### `triggers/`

[Triggers](https://api.slack.com/automation/triggers) determine when workflows
are run. A trigger file describes the scenario in which a workflow should be
run, such as a user pressing a button or when a specific event occurs.

### `workflows/`

A [workflow](https://api.slack.com/automation/workflows) is a set of steps
(functions) that are executed in order.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/automation/forms) before
continuing to the next step.

### `manifest.ts`

The [app manifest](https://api.slack.com/automation/manifest) contains the app's
configuration. This file defines attributes like app name and description.

## Resources

To learn more about developing automations on Slack, visit the following:

- [Automation Overview](https://api.slack.com/automation)
- [CLI Quick Reference](https://api.slack.com/automation/cli/quick-reference)
- [Samples and Templates](https://api.slack.com/automation/samples)
