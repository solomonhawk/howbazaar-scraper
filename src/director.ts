import type { ConsolaInstance } from "consola";
import fs from "node:fs/promises";
import path from "node:path";
import playwright, { type Browser } from "playwright";
import type { FrameDefinition } from "./types";

/**
 * The Art Director defines the style and frame to use when capturing images and
 * manages the underlying playwright browser instance.
 */
export class ArtDirector {
  browser: Browser;
  style: string;
  silverFrame: FrameDefinition;

  constructor(private logger: ConsolaInstance) {}

  greet() {
    this.logger.box({
      message: "Generating Monster Cards from howbazaar.gg",
      style: {
        padding: 1,
        borderColor: "green",
        borderStyle: "double-rounded",
      },
    });
  }

  /**
   * Initializes configuration and settings.
   */
  async contemplate() {
    this.browser = await playwright.chromium.launch();

    this.style = await fs.readFile(
      path.join(__dirname, "screenshot.css"),
      "utf-8"
    );

    this.silverFrame = {
      top: await fs.readFile(this.framePath("silver/top")),
      right: await fs.readFile(this.framePath("silver/right")),
      bottom: await fs.readFile(this.framePath("silver/bottom")),
      left: await fs.readFile(this.framePath("silver/left")),
      topLeft: await fs.readFile(this.framePath("silver/top-left")),
      topRight: await fs.readFile(this.framePath("silver/top-right")),
      bottomLeft: await fs.readFile(this.framePath("silver/bottom-left")),
      bottomRight: await fs.readFile(this.framePath("silver/bottom-right")),
    } as const satisfies FrameDefinition;

    return this;
  }

  async procure() {
    const context = await this.browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto("https://www.howbazaar.gg/monsters", {
      waitUntil: "networkidle",
    });

    return page;
  }

  async collect(jobs: Promise<void>[]) {
    const results = await Promise.allSettled(jobs);

    if (results.every((job) => job.status === "fulfilled")) {
      this.logger.success("Finished capturing all monster cards");
    } else {
      this.logger.error(
        "Failed to capture all monster cards",
        results.filter((job) => job.status === "rejected")
      );
    }
  }

  /**
   * Closes the browser instance.
   */
  async critique() {
    await this.browser.close();
  }

  private framePath(name: string): string {
    return path.join(__dirname, "images", `${name}.png`);
  }
}
