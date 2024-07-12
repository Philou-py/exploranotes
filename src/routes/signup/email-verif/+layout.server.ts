import { redirect } from "@sveltejs/kit";

export const load = ({ locals }) => {
  if (locals.currentUser.isAuthenticated && locals.currentUser.verifiedEmail) redirect(303, "/");
};
