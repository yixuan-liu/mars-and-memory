import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  // We don't want to enforce runtimeEnv on initialization for all platforms (especially React Native vs Node.js)
  // By using `runtimeEnvStrict` or passing `process.env` we could easily break RN if not careful.
  // Instead, rely on process.env being shimmed or available.
  runtimeEnv: process.env, 
});
