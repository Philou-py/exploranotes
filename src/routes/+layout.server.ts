export const load = ({ locals, cookies }) => {
  const sideBarOpen = cookies.get("SBOpen") === "yes";
  const largeScreen = cookies.get("LGScreen") === "yes";
  return { currentUser: locals.currentUser, sideBarOpen, largeScreen };
};
