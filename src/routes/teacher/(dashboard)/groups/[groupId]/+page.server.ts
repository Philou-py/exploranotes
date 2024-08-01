import { db } from "$lib/dgraph";
import { getRandomColour, validationFail } from "$lib/utilities";
import { fail, error } from "@sveltejs/kit";
import { Mutation } from "dgraph-js";
import { z } from "zod";

const groupQuery = `
  query GroupQuery($userUid: string, $groupUid: string) {
    groups(func: uid($groupUid)) {
      name
      level
      admins: ~groups @filter(type(Teacher)) {
        uid
        name
      }
      students: ~groups @filter(type(Student)) {
        key: uid
        firstName
        lastName
        subgroups(orderasc: name) @filter(uid_in(~subgroups, $groupUid)) {
          uid
          name
          colour
        }
      }
      subjects(orderasc: name) {
        uid
        name
      }
      subgroups(orderasc: name) {
        uid
        name
        colour
      }
    }
  }
`;

interface Subgroup {
  uid: string;
  name: string;
  colour: string;
}

interface GroupQuery {
  groups: {
    name: string;
    level: string;
    admins: { uid: string; name: string }[];
    students?: {
      key: string;
      firstName: string;
      lastName: string;
      subgroups?: Subgroup[];
    }[];
    subjects?: { uid: string; name: string }[];
    subgroups?: {
      uid: string;
      name: string;
      colour: string;
    }[];
  }[];
}

export const load = async ({ params, locals, depends }) => {
  depends("app:groupDetails");
  const queryRes = await db
    .newTxn()
    .queryWithVars(groupQuery, { $userUid: locals.currentUser.uid, $groupUid: params.groupId });
  const { groups }: GroupQuery = queryRes.getJson();

  if (groups.length === 0) error(404, "Oups ! Il semblerait que ce groupe n’existe pas !");
  const group = groups[0];

  return {
    uid: params.groupId,
    name: group.name,
    level: group.level,
    isAdmin: group.admins.some((ad) => ad.uid === locals.currentUser.uid),
    admins: group.admins.map((ad) => ad.name),
    students: group.students || [],
    subjects: group.subjects || [],
    subgroups: group.subgroups || [],
    subgroupsItems: group.subgroups?.map(({ uid, name }) => [uid, name] as [string, string]) || [],
  };
};

const addSubgroupQuery = `
  query AddSubgroupQuery($userUid: string, $groupUid: string, $subgroupName: string) {
    groups(func: uid($groupUid)) @filter(uid_in(~groups, $userUid)) {
      nb: count(subgroups @filter(eq(name, $subgroupName)))
    }
    teachers(func: uid($userUid)) @normalize {
      admin: count(groups @filter(uid($groupUid)))
    }
  }
`;

interface AddSubgroupQuery {
  groups: {
    nb: number;
  }[];
  teachers: { admin: number }[];
}

const ManageSubgroup = z.object({
  stUid: z.string().min(1),
  stName: z.string().min(1),
  sgUid: z.string().min(1),
});

const checkSubgroupQuery = `
  query CheckSubgroupQuery($stUid: string, $sgUid: string, $teacherUid: string, $groupUid: string) {
    students(func: uid($stUid)) {
      existant: count(subgroups @filter(uid($sgUid)))
    }
    teachers(func: uid($teacherUid)) {
      admin: count(groups @filter(uid($groupUid)))
    }
  }
`;

interface CheckSubgroupQuery {
  students: { existant: number }[];
  teachers: { admin: number }[];
}

export const actions = {
  addSubgroup: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const subgroupName = formData.get("name");
    if (!subgroupName || typeof subgroupName !== "string") return validationFail();

    const queryRes = await db.newTxn().queryWithVars(addSubgroupQuery, {
      $userUid: locals.currentUser.uid,
      $groupUid: params.groupId,
      $subgroupName: subgroupName.toLowerCase(),
    });
    const { groups, teachers }: AddSubgroupQuery = queryRes.getJson();

    if (teachers[0].admin === 0)
      return fail(403, {
        message: "Pour créer un sous-groupe, vous devez être administrateur !",
      });
    if (groups.length === 0) return validationFail();
    if (groups[0].nb > 0) return fail(400, { message: "Ce sous-groupe existe déjà !" });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({
      uid: params.groupId,
      subgroups: { name: subgroupName, colour: getRandomColour() },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `Le sous-groupe ${subgroupName} a bien été créé !` };
  },

  addRemSubgroup: async ({ request, params, locals }) => {
    const formData = await request.formData();
    const { success, data: newJoin } = ManageSubgroup.safeParse({
      stUid: formData.get("stUid"),
      stName: formData.get("stName"),
      sgUid: formData.get("sgUid"),
    });
    if (!success) return validationFail();

    const queryRes = await db.newTxn().queryWithVars(checkSubgroupQuery, {
      $stUid: newJoin.stUid,
      $sgUid: newJoin.sgUid,
      $teacherUid: locals.currentUser.uid,
      $groupUid: params.groupId,
    });
    const { students, teachers }: CheckSubgroupQuery = queryRes.getJson();

    if (teachers[0].admin === 0)
      return fail(403, {
        message: "Pour ajouter ou retirer un sous-groupe, vous devez être administrateur !",
      });
    if (students.length === 0) return validationFail();

    const txn = db.newTxn();
    const mutation = new Mutation();
    if (students[0].existant)
      mutation.setDeleteJson({
        uid: newJoin.stUid,
        subgroups: { uid: newJoin.sgUid },
      });
    else
      mutation.setSetJson({
        uid: newJoin.stUid,
        subgroups: { uid: newJoin.sgUid },
      });

    await txn.mutate(mutation);
    await txn.commit();

    return {
      message: `${newJoin.stName} a bien ${students[0].existant ? "quitté" : "rejoint"} un sous-groupe !`,
    };
  },
};
