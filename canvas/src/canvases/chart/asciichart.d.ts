declare module "asciichart" {
  function plot(series: number[] | number[][], config?: PlotConfig): string;

  interface PlotConfig {
    height?: number;
    offset?: number;
    padding?: string;
    colors?: number[];
    min?: number;
    max?: number;
    format?: (x: number) => string;
  }

  const black: number;
  const red: number;
  const green: number;
  const yellow: number;
  const blue: number;
  const magenta: number;
  const cyan: number;
  const lightgray: number;
  const darkgray: number;
  const lightred: number;
  const lightgreen: number;
  const lightyellow: number;
  const lightblue: number;
  const lightmagenta: number;
  const lightcyan: number;
  const white: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _default: any;
  export {
    plot,
    PlotConfig,
    black,
    red,
    green,
    yellow,
    blue,
    magenta,
    cyan,
    lightgray,
    darkgray,
    lightred,
    lightgreen,
    lightyellow,
    lightblue,
    lightmagenta,
    lightcyan,
    white,
    _default as default,
  };
}
