import { fail, redirect } from "@sveltejs/kit";
import sendVerifEmail from "../sendVerifEmail.js";

export const load = ({ locals }) => {
  if (!locals.currentUser) redirect(303, "/");

  return {
    email: locals.currentUser.email,
  };
};

export const actions = {
  default: ({ request, cookies, locals }) => {
    const currentUser = locals.currentUser;
    if (!currentUser) return fail(401);

    const verifURL = new URL(`/signup/email-verif/${cookies.get("Auth")}`, request.url);
    sendVerifEmail(currentUser.name, currentUser.email, verifURL.toString());

    return { message: "Un nouvel email a bien été envoyé !" };
  },
};
