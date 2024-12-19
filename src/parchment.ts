import type { Page } from "playwright";
import type { Context } from "./types";
import {
  DAY_BUTTONS_CONTAINER_CLASS,
  MONSTER_BUTTONS_CLASS,
  MONSTER_BUTTON_NAME_CLASS,
} from "./invariants";

export class Parchment {
  constructor(private ctx: Context) {}

  async pagesFor(day: string) {
    const dayButtonsContainer = this.ctx.page.locator(
      DAY_BUTTONS_CONTAINER_CLASS
    );

    await dayButtonsContainer
      .getByRole("button", { name: day, exact: true })
      .click();

    const monsterButtons = await this.ctx.page
      .locator(MONSTER_BUTTONS_CLASS)
      .all();

    return Promise.all(
      monsterButtons.map(async (button) => {
        const name = await button
          .locator(MONSTER_BUTTON_NAME_CLASS)
          .textContent();

        this.ctx.logger.start(`Capturing info for: "${name}"`);

        if (!name) {
          throw new Error("Could not find name for button");
        }

        const id = name.replace(/ /g, "_").replace(/\./g, "\\.");
        await button.click();

        const monsterInfo = await this.ctx.page.locator(`#${id}`);

        const buffer = await monsterInfo.screenshot({
          animations: "disabled",
          style: this.ctx.style,
        });

        return {
          entry: buffer,
          name,
        };
      })
    );
  }
}
