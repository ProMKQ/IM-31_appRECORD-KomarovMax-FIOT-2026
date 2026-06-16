export const BASE_PATH =
  process.env.BASE_PATH ??
  (process.env.NODE_ENV === "production"
    ? "/IM-31_appRECORD-KomarovMax-FIOT-2026"
    : "");
