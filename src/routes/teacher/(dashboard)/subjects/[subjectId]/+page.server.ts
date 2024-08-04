import { db } from "$lib/dgraph";
import { Mutation } from "dgraph-js";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import { validationFail } from "$lib/utilities";

const subjectQuery = `
  query SubjectQuery($subjectUid: string, $schoolUid: string, $userUid: string) {
    schools(func: uid($subjectUid)) {
      ~subjects {
        ~groups @filter(uid($schoolUid)) {
          uid
        }
      }
    }
    admins(func: uid($subjectUid)) {
      ~subjects {
        ~groups @filter(uid($userUid)) {
          uid
        }
      }
    }
    subjects(func: uid($subjectUid)) {
      uid
      name
      fav: count(favTeachers @filter(uid($userUid)))
      groups: ~subjects {
        uid
        name
        students: ~groups @filter(type(Student)) {
          key: uid
          name
          subgroups: ~students @filter(type(Subgroup)) {
            name
            colour
          }
        }
        subgroups: ~group @filter(type(Subgroup)) {
          name
          colour
        }
      }
    }
  }
`;

interface Subgroup {
  name: string;
  colour: string;
}

interface SubjectQuery {
  schools: object[];
  admins: object[];
  subjects: {
    uid: string;
    name: string;
    fav: number;
    groups: {
      uid: string;
      name: string;
      subgroups?: Subgroup[];
      students: {
        key: string;
        name: string;
        subgroups?: Subgroup[];
        selected?: boolean;
      }[];
    }[];
  }[];
}

export const load = async ({ params, locals, depends }) => {
  depends("app:subjectDetails");

  const queryRes = await db.newTxn().queryWithVars(subjectQuery, {
    $subjectUid: params.subjectId,
    $schoolUid: locals.currentUser.school.uid,
    $userUid: locals.currentUser.uid,
  });
  const { schools, admins, subjects }: SubjectQuery = queryRes.getJson();

  if (schools.length === 0) error(404, "Oups ! Il semblerait que cette matière n’existe pas !");

  const sub = subjects[0];
  return {
    subject: {
      uid: sub.uid,
      name: sub.name,
      fav: sub.fav === 1,
    },
    group: {
      uid: sub.groups[0].uid,
      name: sub.groups[0].name,
      students: sub.groups[0].students.map((st) => ({
        ...st,
        subgroups: new Set(st.subgroups?.map(({ name }) => name) || []),
      })),
    },
    subgroups: new Map(sub.groups[0].subgroups?.map(({ name, colour }) => [name, colour]) || []),
    selSgs: sub.groups[0].subgroups?.map(({ name }) => name) || [],
    isGroupAdmin: admins.length === 1,
  };
};

const NewFav = z.object({
  subId: z.string(),
  subName: z.string(),
  fav: z.literal("yes").or(z.literal("no")),
});

export const actions = {
  addFav: async ({ request, locals }) => {
    const formData = await request.formData();

    const { success, data: newFav } = NewFav.safeParse({
      subId: formData.get("subId"),
      subName: formData.get("subName"),
      fav: formData.get("fav"),
    });
    if (!success) return validationFail();

    const txn = db.newTxn();
    const mutation = new Mutation();

    if (newFav.fav === "no")
      mutation.setSetJson({
        uid: newFav.subId,
        favTeachers: { uid: locals.currentUser.uid },
      });
    else
      mutation.setDeleteJson({
        uid: newFav.subId,
        favTeachers: { uid: locals.currentUser.uid },
      });

    await txn.mutate(mutation);
    await txn.commit();

    if (newFav.fav === "no")
      return { message: `La matière ${newFav.subName} a bien été ajoutée à vos favoris !` };
    else
      return {
        message: `La matière ${newFav.subName} a bien été retirée de vos favoris !`,
      };
  },
};
