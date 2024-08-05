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
  "aspen-gold",
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
  "bluestone",
  "orange-tiger",
  "chili-pepper",
  "sweet-lilac",
  "guacamole",
  "vanilla-custard",
  "soybean",
  "toffee",
  "terrarium-moss",
  "galaxy-blue",
];

export const alternateColours = new Map([
  ["var(--fiesta)", "white"],
  ["var(--jester-red)", "white"],
  ["var(--turmeric)", "white"],
  ["var(--aspen-gold)", "black"],
  ["var(--dark-cheddar)", "white"],
  ["var(--princess-blue)", "white"],
  ["var(--pepper-stem)", "white"],
  ["var(--eden)", "white"],
  ["var(--living-coral)", "white"],
  ["var(--creme-de-peche)", "black"],
  ["var(--peach-pink)", "white"],
  ["var(--fruit-dove)", "white"],
  ["var(--sweet-corn)", "black"],
  ["var(--pink-peacock)", "white"],
  ["var(--bluestone)", "white"],
  ["var(--orange-tiger)", "white"],
  ["var(--chili-pepper)", "white"],
  ["var(--sweet-lilac)", "black"],
  ["var(--guacamole)", "white"],
  ["var(--vanilla-custard)", "black"],
  ["var(--soybean)", "black"],
  ["var(--toffee)", "white"],
  ["var(--terrarium-moss)", "white"],
  ["var(--galaxy-blue)", "white"],
]);

export const getRandomColour = () => colours[Math.floor(Math.random() * colours.length)];
