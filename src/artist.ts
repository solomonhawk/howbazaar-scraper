import path from "path";
import sharp, { type Sharp } from "sharp";
import {
  BACKGROUND_COLOR,
  FRAME_HEIGHT,
  FRAME_OPAQUE_BOTTOM,
  FRAME_OPAQUE_LEFT,
  FRAME_OPAQUE_RIGHT,
  FRAME_OPAQUE_TOP,
  FRAME_WIDTH,
  IMAGE_PADDING,
} from "./invariants";
import type { Context } from "./types";

export class Artist {
  constructor(private ctx: Context) {}

  async draw(name: string, entry: Buffer) {
    const metadata = await sharp(entry).metadata();

    /**
     * Crop a single pixel from the bottom of the image. Sometimes playwright
     * includes a single wrong pixel at the bottom edge. This prevents the trim
     * below from isolating the image correctly.
     */
    const cropped = await sharp(entry)
      .extract({
        top: 0,
        left: 0,
        width: metadata.width!,
        height: metadata.height! - 1,
      })
      .toBuffer();

    /**
     * Trim empty space and add extra padding to the image.
     */
    const trimmed = await sharp(cropped)
      .trim({
        background: BACKGROUND_COLOR,
        lineArt: true,
        threshold: 1,
      })
      .extend({
        top: IMAGE_PADDING,
        right: IMAGE_PADDING,
        bottom: IMAGE_PADDING,
        left: IMAGE_PADDING,
        background: BACKGROUND_COLOR,
      })
      .toBuffer();

    /**
     * Extend the image enough to fit the frame.
     */
    const extended = await sharp(trimmed)
      .extend({
        top: FRAME_OPAQUE_TOP,
        right: FRAME_OPAQUE_RIGHT,
        bottom: FRAME_OPAQUE_BOTTOM,
        left: FRAME_OPAQUE_LEFT,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    const framed = await this.addFrame(extended);

    await framed
      .toFormat("png")
      .toFile(path.join(__dirname, "..", "assets", `${name}.png`));
  }

  /**
   * Takes an image buffer and adds a frame around it.
   */
  private async addFrame(buffer: Buffer): Promise<Sharp> {
    const metadata = await sharp(buffer).metadata();

    return sharp(buffer).composite([
      {
        input: this.ctx.frame.topLeft,
        top: 0,
        left: 0,
      },
      {
        input: this.ctx.frame.topRight,
        top: 0,
        left: metadata.width! - FRAME_WIDTH,
      },
      {
        input: this.ctx.frame.bottomRight,
        top: metadata.height! - FRAME_HEIGHT,
        left: metadata.width! - FRAME_WIDTH,
      },
      {
        input: this.ctx.frame.bottomLeft,
        top: metadata.height! - FRAME_HEIGHT,
        left: 0,
      },
      {
        input: await this.rescaleVerticalFrameBorder({
          image: this.ctx.frame.top,
          targetWidth: metadata.width! - FRAME_WIDTH * 2,
        }),
        top: 0,
        left: FRAME_WIDTH,
      },
      {
        input: await this.rescaleVerticalFrameBorder({
          image: this.ctx.frame.bottom,
          targetWidth: metadata.width! - FRAME_WIDTH * 2,
        }),
        top: metadata.height! - FRAME_HEIGHT,
        left: FRAME_WIDTH,
      },

      {
        input: await this.rescaleHorizontalFrameBorder({
          image: this.ctx.frame.left,
          metadata,
          targetHeight: metadata.height! - FRAME_WIDTH - FRAME_HEIGHT,
        }),
        top: FRAME_WIDTH,
        left: 0,
        gravity: "center",
      },
      {
        input: await this.rescaleHorizontalFrameBorder({
          image: this.ctx.frame.right,
          metadata,
          targetHeight: metadata.height! - FRAME_WIDTH - FRAME_HEIGHT,
        }),
        top: FRAME_WIDTH,
        left: metadata.width! - FRAME_WIDTH,
        gravity: "center",
      },
    ]);
  }

  /**
   * Rescales a frame top/bottom frame border width to span the entire image
   * width leaving space for the left and right frame border corners.
   */
  private async rescaleVerticalFrameBorder({
    image,
    targetWidth,
  }: {
    image: Buffer;
    targetWidth: number;
  }): Promise<Buffer> {
    const frameMetadata = await sharp(image).metadata();

    if (frameMetadata.width! > targetWidth) {
      this.ctx.logger.debug(`Shrinking frame border to fit ${targetWidth}`);

      return sharp(image)
        .extract({
          left: Math.ceil((frameMetadata.width! - targetWidth) / 2),
          top: 0,
          width: targetWidth,
          height: frameMetadata.height!,
        })
        .toBuffer();
    } else {
      this.ctx.logger.debug(`Expanding frame border to fill ${targetWidth}`);

      const extendAmount = Math.ceil((targetWidth - frameMetadata.width!) / 2);

      return sharp(image)
        .extend({
          left: extendAmount,
          right: extendAmount,
          extendWith: "copy",
        })
        .toBuffer();
    }
  }

  /**
   * Rescales a frame left/right frame border height to span the entire image
   * height leaving space for the top and bottom frame border corners.
   */
  private async rescaleHorizontalFrameBorder({
    image,
    metadata,
    targetHeight,
  }: {
    image: Buffer;
    metadata: sharp.Metadata;
    targetHeight: number;
  }): Promise<Buffer> {
    const frameMetadata = await sharp(image).metadata();

    if (frameMetadata.height! > targetHeight) {
      this.ctx.logger.debug(`Shrinking frame border to fit ${targetHeight}`);

      return sharp(image)
        .extract({
          left: 0,
          top: Math.ceil((frameMetadata.height! - targetHeight) / 2),
          width: frameMetadata.width!,
          height: targetHeight,
        })
        .toBuffer();
    } else {
      this.ctx.logger.debug(`Expanding frame border to fill ${targetHeight}`);

      const extendAmountTop =
        Math.ceil((metadata.height! - frameMetadata.height!) / 2) - FRAME_WIDTH;

      const extendAmountBottom =
        Math.ceil((metadata.height! - frameMetadata.height!) / 2) -
        FRAME_HEIGHT;

      return sharp(image)
        .extend({
          top: extendAmountTop,
          bottom: extendAmountBottom,
          extendWith: "copy",
        })
        .toBuffer();
    }
  }
}
