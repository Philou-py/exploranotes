import { db } from "$lib/dgraph";
import { validationFail } from "$lib/utilities";
import { Mutation } from "dgraph-js";
import { z } from "zod";

const groupsQuery = `
  query GroupsQuery($schoolUid: string, $userUid: string) {
    schools(func: uid($schoolUid)) {
      groups {
        key: uid
        name
        nbStudents: count(~groups @filter(type(Student)))
        level
        admins: ~groups @filter(type(Teacher)) (orderasc: name) { name }
        fav: count(~favGroups @filter(uid($userUid)))
      }
    }
  }
`;

interface GroupsQuery {
  schools: {
    groups: {
      key: string;
      name: string;
      nbStudents: number;
      level: string;
      admins?: { name: string }[];
      fav: number;
    }[];
  }[];
}

export const load = async ({ locals, depends }) => {
  depends("app:groupsList");
  const queryRes = await db.newTxn().queryWithVars(groupsQuery, {
    $userUid: locals.currentUser.uid,
    $schoolUid: locals.currentUser.school.uid,
  });
  const { schools }: GroupsQuery = queryRes.getJson();

  return {
    groups:
      schools[0]?.groups.map((gr) => ({
        ...gr,
        admins: gr.admins?.map((teach) => teach.name) || [],
        fav: gr.fav === 1,
      })) || [],
  };
};

const NewFav = z.object({
  groupId: z.string(),
  groupName: z.string(),
  fav: z.literal("yes").or(z.literal("no")),
});

export const actions = {
  addFav: async ({ request, locals }) => {
    const formData = await request.formData();

    const { success, data: newFav } = NewFav.safeParse({
      groupId: formData.get("groupId"),
      groupName: formData.get("groupName"),
      fav: formData.get("fav"),
    });
    if (!success) return validationFail();

    const txn = db.newTxn();
    const mutation = new Mutation();

    if (newFav.fav === "no")
      mutation.setSetJson({
        uid: locals.currentUser.uid,
        favGroups: { uid: newFav.groupId },
      });
    else
      mutation.setDeleteJson({
        uid: locals.currentUser.uid,
        favGroups: { uid: newFav.groupId },
      });

    await txn.mutate(mutation);
    await txn.commit();

    if (newFav.fav === "no")
      return { message: `Le groupe ${newFav.groupName} a bien été ajouté à vos favoris !` };
    else
      return {
        message: `Le groupe ${newFav.groupName} a bien été retiré de vos favoris !`,
      };
  },
};