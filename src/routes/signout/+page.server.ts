export const actions = {
  default: ({ cookies }) => {
    cookies.delete("Auth", { path: "/" });
    cookies.delete("SBOpen", { path: "/" });
    return { message: "Vous êtes à présent déconnecté(e) !" };
  },
};
