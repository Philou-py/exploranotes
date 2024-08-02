import { db } from "$lib/dgraph";

const sideBarQuery = `
  query SideBarQuery($userUid: string) {
    var(func: uid($userUid)) {
      subjects as ~favTeachers {
        groups as ~subjects
      }
    }
    favGroups(func: uid(groups), orderasc: name) {
      uid
      name
      favSubjects: subjects @filter(uid(subjects)) (orderasc: name) {
        uid
        name
      }
    }
  }
`;

interface SideBarQuery {
  favGroups: {
    uid: string;
    name: string;
    favSubjects: { uid: string; name: string }[];
  }[];
}

export const load = async ({ locals, cookies, depends }) => {
  depends("app:favSubjects");
  const sideBarOpen = cookies.get("SBOpen") === "yes";
  const largeScreen = cookies.get("LGScreen") === "yes";
  let favGroups: SideBarQuery["favGroups"] = [];

  if (locals.currentUser.isAuthenticated) {
    const queryRes = await db
      .newTxn()
      .queryWithVars(sideBarQuery, { $userUid: locals.currentUser.uid });
    favGroups = (queryRes.getJson() as SideBarQuery).favGroups;
  }

  return { currentUser: locals.currentUser, sideBarOpen, largeScreen, favGroups };
};
