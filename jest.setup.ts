import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";

if (!global.TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  (global as any).TextDecoder = TextDecoder;
}
