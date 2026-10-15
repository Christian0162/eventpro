import '@testing-library/jest-dom'; // so toBeInTheDocument works
import { TextEncoder, TextDecoder } from "util";

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;


