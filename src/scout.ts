import type { ConsolaInstance } from "consola";
import { Artist } from "./artist";
import type { ArtDirector } from "./director";
import { Parchment } from "./parchment";
import type { Context } from "./types";

/**
 * The Scout is capable of navigating to the howbazaar.gg website and capturing
 * all the monster images for a given day.
 *
 * It spins up a new browser context and page within the provided browser
 * instance. The provided art director defines the style and frame to use when
 * capturing images.
 */
export class Scout {
  ctx: Context;
  parchment: Parchment;
  artist: Artist;

  constructor(private logger: ConsolaInstance, private director: ArtDirector) {}

  async survey(day: string) {
    const page = await this.director.procure();

    this.ctx = {
      page,
      style: this.director.style,
      frame: this.director.silverFrame,
      logger: this.logger,
    } as const satisfies Context;

    this.parchment = new Parchment(this.ctx);
    this.artist = new Artist(this.ctx);

    await this.surveyDay(day);
  }

  private async surveyDay(day: string) {
    this.ctx.logger.start(`Capturing monsters for day ${day}`);

    try {
      for (const { entry, name } of await this.parchment.pagesFor(day)) {
        await this.artist.draw(name, entry);

        this.ctx.logger.success(`Captured info for: "${name}"`);
      }

      this.ctx.logger.success(`Captured monsters for day: "${day}"`);
    } catch (error) {
      this.ctx.logger.error(error);
    }
  }
}
