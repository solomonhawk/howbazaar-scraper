import { DAYS } from "./invariants";
import { ArtDirector } from "./director";
import { logger } from "./logger";
import { Scout } from "./scout";

async function main() {
  const director = await new ArtDirector(logger).contemplate();

  director.greet();

  await director.collect(
    DAYS.map((day) => new Scout(logger, director).survey(day))
  );

  await director.critique();
}

main().catch((error) => logger.error(error));
