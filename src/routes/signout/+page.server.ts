export const actions = {
  default: ({ locals, cookies }) => {
    cookies.delete("Auth", { path: "/" });
    cookies.delete("SBOpen", { path: "/" });
    cookies.delete("Colour", { path: "/" });
    locals.currentUser = undefined;
    return { message: "Vous êtes à présent déconnecté(e) !" };
  },
};
