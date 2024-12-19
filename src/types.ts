import type { ConsolaInstance } from "consola";
import type { Page } from "playwright";

export type Context = {
  page: Page;
  style: string;
  frame: FrameDefinition;
  logger: ConsolaInstance;
};

export type FrameDefinition = {
  top: Buffer;
  right: Buffer;
  bottom: Buffer;
  left: Buffer;
  topLeft: Buffer;
  topRight: Buffer;
  bottomLeft: Buffer;
  bottomRight: Buffer;
};
