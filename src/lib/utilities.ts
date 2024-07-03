export const lighten = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, white ${percent}%)`;

export const darken = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, black ${percent}%)`;
