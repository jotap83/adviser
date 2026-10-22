import type { AppState } from "./types";
import { withManagementDemo } from "./operations";
import { withReferences } from "./mail-reference";
import { withInboxDemo } from "./inbox-model";
import { withProductionDemo } from "./production-model";
import { withChannelsDemo } from "./channels";
import { withOrganization } from "./organization";
import { withManagementInsightsDemo } from "./management-demo";

export const prepareDemoState = (s: AppState) =>
  withReferences(
    withManagementInsightsDemo(
      withOrganization(
        withChannelsDemo(
          withProductionDemo(
            withInboxDemo(withReferences(withManagementDemo(s))),
          ),
        ),
      ),
    ),
  );
