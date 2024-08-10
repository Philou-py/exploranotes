import { db } from "$lib/dgraph";
import { Mutation } from "dgraph-js";
import { error, fail } from "@sveltejs/kit";
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
      name: name@fr
      fav: count(favTeachers @filter(uid($userUid)))
      teachers {
        uid
        name
        email
      }
      groups: ~subjects {
        uid
        name: name@fr
        students: ~groups @filter(type(Student)) {
          key: uid
          name
          subgroups: ~students @filter(type(Subgroup)) {
            name: name@fr
            colour
          }
        }
        subgroups: ~group @filter(type(Subgroup)) {
          name: name@fr
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
    name: string;
    fav: number;
    teachers?: {
      uid: string;
      name: string;
      email: string;
    }[];
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
      name: sub.name,
      fav: sub.fav === 1,
      teachers: sub.teachers || [],
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
  subName: z.string(),
  fav: z.literal("yes").or(z.literal("no")),
});

const addTeacherQuery = `
  query AddTeacherQuery($teacherEmail: string, $schoolUid: string, $userUid: string, $subjectUid: string) {
    var(func: uid($subjectUid)) {
      group as ~subjects
    }
    admins(func: uid($userUid)) @filter(uid_in(groups, uid(group))) {
      uid
    }
    teachers(func: eq(email, $teacherEmail)) @filter(type(Teacher) and uid_in(school, $schoolUid)) {
      uid
      name
    }
  }
`;

interface AddTeacherQuery {
  admins: { uid: string }[];
  teachers: {
    uid: string;
    name: string;
  }[];
}

const remTeacherQuery = `
  query RemTeacherQuery($teacherUid: string, $schoolUid: string, $userUid: string, $subjectUid: string) {
    var(func: uid($subjectUid)) {
      group as ~subjects
    }
    admins(func: uid($userUid)) @filter(uid_in(groups, uid(group))) {
      uid
    }
    subjects(func: uid($subjectUid)) {
      teachers @filter(uid($teacherUid)) {
        uid
        name
      }
    }
  }
`;

interface RemTeacherQuery {
  admins: { uid: string }[];
  subjects: {
    teachers: {
      uid: string;
      name: string;
    }[];
  }[];
}

export const actions = {
  addFav: async ({ request, locals, params }) => {
    const formData = await request.formData();

    const { success, data: newFav } = NewFav.safeParse({
      subName: formData.get("subName"),
      fav: formData.get("fav"),
    });
    if (!success) return validationFail();

    const txn = db.newTxn();
    const mutation = new Mutation();

    if (newFav.fav === "no")
      mutation.setSetJson({
        uid: params.subjectId,
        favTeachers: { uid: locals.currentUser.uid },
      });
    else
      mutation.setDeleteJson({
        uid: params.subjectId,
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

  addTeacher: async ({ params, request, locals }) => {
    const formData = await request.formData();
    const { success, data: email } = z.string().email().safeParse(formData.get("email"));
    if (!success) return validationFail();

    const queryRes = await db.newTxn().queryWithVars(addTeacherQuery, {
      $teacherEmail: email,
      $schoolUid: locals.currentUser.school.uid,
      $userUid: locals.currentUser.uid,
      $subjectUid: params.subjectId,
    });
    const { admins, teachers }: AddTeacherQuery = queryRes.getJson();

    if (admins.length !== 1)
      return fail(403, {
        message: "Vous devez être administrateur du groupe pour ajouter un professeur !",
      });
    if (teachers.length !== 1)
      return fail(400, { message: "Ce professeur n’existe pas dans cet établissement !" });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({
      uid: params.subjectId,
      teachers: { uid: teachers[0].uid },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `${teachers[0].name} a bien rejoint cette matière !` };
  },

  remTeacher: async ({ params, request, locals }) => {
    const formData = await request.formData();
    const { success, data: teacherUid } = z
      .string()
      .regex(/0x[a-f0-9]+/)
      .safeParse(formData.get("teacherUid"));
    if (!success) return validationFail();

    const queryRes = await db.newTxn().queryWithVars(remTeacherQuery, {
      $teacherUid: teacherUid,
      $schoolUid: locals.currentUser.school.uid,
      $userUid: locals.currentUser.uid,
      $subjectUid: params.subjectId,
    });
    const { admins, subjects }: RemTeacherQuery = queryRes.getJson();

    if (admins.length !== 1)
      return fail(403, {
        message: "Vous devez être administrateur du groupe pour ajouter un professeur !",
      });
    if (subjects.length !== 1)
      return fail(400, { message: "Ce professeur n’a pas rejoint cette matière !" });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setDeleteJson({
      uid: params.subjectId,
      teachers: { uid: subjects[0].teachers[0].uid },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `${subjects[0].teachers[0].name} a bien quitté cette matière !` };
  },
};
