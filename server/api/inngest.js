import { serve } from "inngest/express";
import { inngest, functions } from "../inngest/index.js"; // adjust path if needed

export default serve({ client: inngest, functions });
