import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";

const GoogleProvider = DefineOAuth2Provider({
  provider_key: "google",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    "provider_name": "Google",
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "client_id":
      "938986130734-lggcidogjghiuaq863o2be32nu5gpn97.apps.googleusercontent.com", // Add your Client ID here!
    "scope": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    "authorization_url_extras": {
      "prompt": "consent",
      "access_type": "offline",
    },
    "identity_config": {
      "url": "https://www.googleapis.com/oauth2/v1/userinfo",
      "account_identifier": "$.email",
    },
  },
});

export default GoogleProvider;
