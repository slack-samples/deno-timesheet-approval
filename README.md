# Deno Timesheet Approval App

This app demonstrates a workflow that collects input from a form in Slack and
saves the results to a preconfigured Google Sheet using external authentication
in a custom function.

**Guide Outline**:

- [Supported Workflows](#supported-workflows)
- [Setup](#setup)
  - [Install the Slack CLI](#install-the-slack-cli)
  - [Clone the Sample App](#clone-the-sample-app)
- [Prepare your Google Services](#prepare-your-google-services)
  - [Create a Google Cloud Project](#create-a-google-cloud-project)
  - [Create a Google Sheet](#create-a-google-sheet)
- [Create a Link Trigger](#create-a-link-trigger)
- [Running Your Project Locally](#running-your-project-locally)
- [Testing](#testing)
- [Deploying Your App](#deploying-your-app)
  - [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Supported Workflows

- **Collect billable hours**: Gather and save timesheet info to a Google sheet.

## Setup

Before getting started, make sure you have a development workspace where you
have permissions to install apps. If you don’t have one set up, go ahead and
[create one](https://slack.com/create). Also, please note that the workspace
requires any of [the Slack paid plans](https://slack.com/pricing).

### Install the Slack CLI

To use this sample, you first need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/future/quickstart).

### Clone the Sample App

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ slack create my-app -t slack-samples/deno-timesheet-approval

# Change into this project directory
$ cd my-app
```

## Prepare your Google Services

With [external authentication](https://api.slack.com/future/external-auth) you
can programmatically interact with Google services and APIs from your app, as
though you're the authorized user.

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

#### Set your Client ID

Take your client ID and add it as the value for `client_id` in
`external_auth/google_provider.ts` – the custom OAuth2 provider definition for
your Google project.

Once complete, use `slack run` or `slack deploy` to update your local or hosted
app.

#### Save your Client Secret

With your client secret ready, run the following command, replacing
`GOOGLE_CLIENT_SECRET` with your own secret:

```sh
$ slack external-auth add-secret --provider google --secret GOOGLE_CLIENT_SECRET
```

When prompted to select an app, choose the `(dev)` app only if you're running
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

Once you've successfully connected your account, you're ready to configure your
Google Sheet and create a link into your workflow!

### Create a Google Sheet

In this app, the inputs of submitted forms are stored in a Google Sheet.

To prepare this external datastore, start by
[creating a blank spreadsheet](https://docs.google.com/spreadsheets/create)
using the authenticated account, renaming the sheet tab to "Time Log", and
adding the following headers to Row 1:

```
Employee | Time in | Time out | Breaks (min) | Hours
```

Designating this spreadsheet as the desired datastore is done with environment
variables, allowing for different spreadsheets to be used across your local and
hosted app instances.

With the spreadsheet ID (the random-ish string found in the URL) copied, you're
ready to set up your environment!

#### Development environment variables

When [developing locally](https://api.slack.com/future/run), environment
variables found in the `.env` file at the root of your project are used. For
local development, rename `.env.sample` to `.env` and add your spreadsheet ID to
the file (replacing `YOUR_SPREADSHEET_ID` with your spreadsheet ID):

```bash
# .env
SPREADSHEET_ID=YOUR_SPREADSHEET_ID
```

#### Production environment variables

[Deployed apps](https://api.slack.com/future/deploy) use environment variables
that are added using `slack env`. To add your access token to a Workspace where
your deployed app is installed, use the following command (once again, replacing
`YOUR_SPREADSHEET_ID` with your spreadsheet ID):

```sh
$ slack env add SPREADSHEET_ID YOUR_SPREADSHEET_ID
```

## Create a Link Trigger

[Triggers](https://api.slack.com/future/triggers) are what cause workflows to
run. These triggers can be invoked by a user, or automatically as a response to
an event within Slack.

A [link trigger](https://api.slack.com/future/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app). When creating a trigger, you must select
the Workspace that you'd like to create the trigger in. Each Workspace has a
development version (denoted by `(dev)`), as well as a deployed version.

To create a link trigger for the Workflow in this sample, run the following
command:

```zsh
$ slack trigger create --trigger-def triggers/collect_hours_trigger.ts
```

After selecting a Workspace, the output provided will include the link trigger
Shortcut URL. Copy and paste this URL into a channel as a message, or add it as
a bookmark in a channel of the Workspace you selected.

**Note: this link won't run the workflow until the app is either running locally
or deployed!** Read on to learn how to run your app locally and eventually
deploy it to Slack hosting.

## Running Your Project Locally

While building your app, you can see your changes propagated to your workspace
in real-time with `slack run`. In both the CLI and in Slack, you'll know an app
is the development version if the name has the string `(dev)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Once running, click the
[previously created Shortcut URL](#create-a-link-trigger) associated with the
`(dev)` version of your app. This should start the included sample workflow.

To stop running locally, press `<CTRL> + C` to end the process.

## Testing

For an example of how to test a function, see `functions/save_hours_test.ts`.
Test filenames should be suffixed with `_test`.

Run all tests with `deno test`:

```zsh
$ deno test
```

## Deploying Your App

Once you're done with development, you can deploy the production version of your
app to Slack hosting using `slack deploy`:

```zsh
$ slack deploy
```

After deploying, [create a new link trigger](#create-a-link-trigger) for the
production version of your app (not appended with `(dev)`). Once the trigger is
invoked, the workflow should run just as it did in when developing locally.

### Viewing Activity Logs

Activity logs for the production instance of your application can be viewed with
the `slack activity` command:

```zsh
$ slack activity
```

## Project Structure

### `manifest.ts`

The [app manifest](https://api.slack.com/future/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

### `/external_auth`

[External authentication](https://api.slack.com/future/external-auth) connects
your app to external services using OAuth2. Once connected, you can perform
actions as the authorized user on these services from a custom function.

### `/functions`

[Functions](https://api.slack.com/future/functions) are reusable building blocks
of automation that accept inputs, perform calculations, and provide outputs.
Functions can be used independently or as steps in workflows.

### `/workflows`

A [workflow](https://api.slack.com/future/workflows) is a set of steps that are
executed in order. Each step in a workflow is a function.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/future/forms) before continuing
to the next step.

### `/triggers`

[Triggers](https://api.slack.com/future/triggers) determine when workflows are
executed. A trigger file describes a scenario in which a workflow should be run,
such as a user pressing a button or when a specific event occurs.

## Resources

To learn more about developing with the CLI, you can visit the following guides:

- [Creating a new app with the CLI](https://api.slack.com/future/create)
- [Configuring your app](https://api.slack.com/future/manifest)
- [Developing locally](https://api.slack.com/future/run)

To view all documentation and guides available, visit the
[Overview page](https://api.slack.com/future/overview).
