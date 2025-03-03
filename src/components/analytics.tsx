import { env } from "@/env";
import { OpenPanelComponent } from "@openpanel/nextjs";

const Analytics = () => {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <OpenPanelComponent clientId={env.ANALYTICS_CLIENT_ID} trackScreenViews />
  );
};

export { Analytics };
