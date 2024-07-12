import { fail } from "@sveltejs/kit";

export const lighten = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, white ${percent}%)`;

export const darken = (colour: string, percent: number) =>
  `color-mix(in srgb, ${colour}, black ${percent}%)`;

export const validationFail = () =>
  fail(400, { message: "Le format des données entrées n'est pas valide !" });
