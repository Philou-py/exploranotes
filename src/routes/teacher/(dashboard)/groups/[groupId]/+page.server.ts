import { db } from "$lib/dgraph";
import { getRandomColour, validationFail } from "$lib/utilities";
import { fail, error } from "@sveltejs/kit";
import { Mutation } from "dgraph-js";
import { z } from "zod";

const groupQuery = `
  query GroupQuery($userUid: string, $groupUid: string, $schoolUid: string) {
    schools(func: uid($schoolUid)) {
      groups @filter(uid($groupUid)) {
        name: name@fr
        level
        admins: ~groups @filter(type(Teacher)) {
          uid
          name
        }
        students: ~groups @filter(type(Student)) {
          key: uid
          firstName
          lastName
          subgroups: ~students(orderasc: name@fr) @filter(type(Subgroup) and uid_in(group, $groupUid)) {
            uid
            name: name@fr
            colour
          }
        }
        subjects(orderasc: name@fr) {
          uid
          name: name@fr
        }
        subgroups: ~group (orderasc: name@fr) @filter(type(Subgroup)) {
          uid
          name: name@fr
          colour
        }
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
  schools: {
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
      subgroups?: Subgroup[];
    }[];
  }[];
}

export const load = async ({ params, locals, depends }) => {
  depends("app:groupDetails");
  const queryRes = await db.newTxn().queryWithVars(groupQuery, {
    $userUid: locals.currentUser.uid,
    $groupUid: params.groupId,
    $schoolUid: locals.currentUser.school.uid,
  });
  const { schools }: GroupQuery = queryRes.getJson();

  if (schools.length === 0) error(404, "Oups ! Il semblerait que ce groupe n’existe pas !");
  const group = schools[0].groups[0];

  return {
    uid: params.groupId,
    name: group.name,
    level: group.level,
    isAdmin: group.admins.some((ad) => ad.uid === locals.currentUser.uid),
    admins: group.admins.map((ad) => ad.name),
    students: group.students || [],
    subjects: group.subjects || [],
    subgroups: group.subgroups || [],
    subgroupsItems:
      group.subgroups?.map(
        ({ uid, name, colour }) => [uid, name, colour] as [string, string, string],
      ) || [],
  };
};

const addSubgroupQuery = `
  query AddSubgroupQuery($userUid: string, $groupUid: string, $subgroupName: string) {
    groups(func: uid($groupUid)) @filter(uid_in(~groups, $userUid)) {
      nb: count(~group @filter(type(Subgroup) and eq(name, $subgroupName)))
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
      existant: count(~students @filter(type(Subgroup) and uid($sgUid)))
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

const delSubgroupQuery = `
  query DelSubgroupQuery($sgUid: string, $userUid: string) {
    subgroups(func: uid($sgUid)) {
      name: name@fr
      group {
        uid
        admin: count(~groups @filter(uid($userUid)))
      }
    }
  }
`;

interface DelSubgroupQuery {
  subgroups: {
    name: string;
    group: { uid: string; admin: number };
  }[];
}

export const actions = {
  addSubgroup: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const subgroupName = formData.get("name");
    if (!subgroupName || typeof subgroupName !== "string") return validationFail();

    const queryRes = await db.newTxn().queryWithVars(addSubgroupQuery, {
      $userUid: locals.currentUser.uid,
      $groupUid: params.groupId,
      $subgroupName: subgroupName,
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
      "dgraph.type": "Subgroup",
      "name@fr": subgroupName,
      colour: `var(--${getRandomColour()})`,
      group: { uid: params.groupId },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `Le sous-groupe ${subgroupName} a bien été créé !` };
  },

  delSubgroup: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const subgroupUid = formData.get("sgUid");

    if (!subgroupUid || typeof subgroupUid !== "string") return validationFail();

    const queryRes = await db
      .newTxn()
      .queryWithVars(delSubgroupQuery, { $sgUid: subgroupUid, $userUid: locals.currentUser.uid });
    const { subgroups }: DelSubgroupQuery = queryRes.getJson();

    if (subgroups.length === 0 || subgroups[0].group.uid !== params.groupId)
      return validationFail();
    if (subgroups[0].group.admin !== 1)
      return fail(403, {
        message: "Pour supprimer un sous-groupe, vous devez être administrateur !",
      });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setDeleteJson({ uid: subgroupUid });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `Le sous-groupe ${subgroups[0].name} a bien été supprimé !` };
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
        uid: newJoin.sgUid,
        students: { uid: newJoin.stUid },
      });
    else
      mutation.setSetJson({
        uid: newJoin.sgUid,
        students: { uid: newJoin.stUid },
      });

    await txn.mutate(mutation);
    await txn.commit();

    return {
      message: `${newJoin.stName} a bien ${students[0].existant ? "quitté" : "rejoint"} un sous-groupe !`,
    };
  },
};
