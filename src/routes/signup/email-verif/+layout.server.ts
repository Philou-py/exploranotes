import { redirect } from "@sveltejs/kit";

export const load = ({ locals }) => {
  if (locals.currentUser?.verifiedEmail) redirect(303, "/");
};
