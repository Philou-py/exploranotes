export const load = ({ locals, cookies }) => {
  const sideBarOpen = cookies.get("SBOpen") === "yes";
  return { currentUser: locals.currentUser, sideBarOpen };
};
