import { db } from "$lib/dgraph";

const sideBarQuery = `
  query SideBarQuery($userUid: string) {
    users(func: uid($userUid)) {
      favGroups {
        uid
        name
      }
    }
  }
`;

interface SideBarQuery {
  users: {
    favGroups: { uid: string; name: string }[];
  }[];
}

export const load = async ({ locals, cookies, depends }) => {
  depends("app:favGroups");
  const sideBarOpen = cookies.get("SBOpen") === "yes";
  const largeScreen = cookies.get("LGScreen") === "yes";
  let favGroups: SideBarQuery["users"][0]["favGroups"] = [];

  if (locals.currentUser.isAuthenticated) {
    const queryRes = await db
      .newTxn()
      .queryWithVars(sideBarQuery, { $userUid: locals.currentUser.uid });
    const { users }: SideBarQuery = queryRes.getJson();
    if (users[0]) favGroups = users[0].favGroups;
  }

  return { currentUser: locals.currentUser, sideBarOpen, largeScreen, favGroups };
};
