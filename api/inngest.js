import { serve } from "inngest/express";
import { inngest, functions } from "../server/inngest/index.js";

export default serve({
  client: inngest,
  functions,
});
