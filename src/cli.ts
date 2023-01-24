import { hideBin } from "yargs/helpers";
import app from "./app";

(async () => {
  const argv = await app(hideBin(process.argv)).argv;
  process.exit(0);
})();
