import { serve } from "inngest/express";
import { inngest, functions } from "../server/inngest/index.js";

export const config = {
  api: {
    bodyParser: false, 
  },
};

export default serve({
  client: inngest,
  functions,
});
