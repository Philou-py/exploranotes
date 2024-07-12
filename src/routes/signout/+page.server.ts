export const actions = {
  default: ({ locals, cookies }) => {
    cookies.delete("Auth", { path: "/" });
    cookies.delete("SBOpen", { path: "/" });
    cookies.delete("LGScreen", { path: "/" });
    locals.currentUser.isAuthenticated = false;
    return { message: "Vous êtes à présent déconnecté(e) !" };
  },
};
