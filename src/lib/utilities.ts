import { fail } from "@sveltejs/kit";

export const lighten = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, white ${percent}%)`;

export const darken = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, black ${percent}%)`;

export const validationFail = () =>
  fail(400, { message: "Le format des données entrées n'est pas valide !" });

export const colours = [
  "fiesta",
  "jester-red",
  "turmeric",
  "dark-cheddar",
  "princess-blue",
  "pepper-stem",
  "eden",
  "living-coral",
  "creme-de-peche",
  "peach-pink",
  "fruit-dove",
  "sweet-corn",
  "pink-peacock",
  "blue-stone",
  "orange-tiger",
  "chili-pepper",
  "sweet-lilac",
];
