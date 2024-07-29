import { db } from "$lib/dgraph";
import { fail } from "@sveltejs/kit";
import { Mutation } from "dgraph-js";
import { z } from "zod";

interface TeachersQuery {
  users: {
    school: {
      uid: string;
      admin?: boolean;
      teachers?: {
        key: string;
        name: string;
        email: string;
        admin?: boolean;
        groups?: {
          name: string;
          colour: string;
        }[];
      }[];
      pendingTeachers?: {
        key: string;
        name: string;
        email: string;
        signUpDate: string;
      }[];
    };
  }[];
}

const teachersQuery = `
  query TeachersQuery($userUid: string) {
    users(func: uid($userUid)) {
      school @facets(admin: admin) {
        uid
        teachers: ~school @filter(type(Teacher) and eq(verifiedEmail, true)) @facets(admin: admin) {
          key: uid
          name
          email
          groups @filter(eq(primary, true)) {
            name
            colour
          }
        }
        pendingTeachers: ~pendingJoin @filter(type(Teacher) and eq(verifiedEmail, true)) {
          key: uid
          name
          email
          signUpDate: creationDate
        }
      }
    }
  }
`;

export const load = async ({ locals: { currentUser }, depends }) => {
  depends("app:teachers");
  const response = await db.newTxn().queryWithVars(teachersQuery, { $userUid: currentUser.uid });
  const { users }: TeachersQuery = response.getJson();
  const school = users[0]?.school;

  return {
    admin: school?.admin || "",
    teachersItems: school?.teachers || [],
    pendingTeachersItems: school?.admin && school.pendingTeachers ? school.pendingTeachers : [],
  };
};

export const actions = {
  acceptTeacher: async ({ request, locals }) => {
    const formData = await request.formData();
    const { success, error, data: teacherUid } = z.string().safeParse(formData.get("teacherUid"));

    if (!success) {
      console.log("Validation error:", error);
      return fail(400, { message: "Le format des données entrées n'est pas valide !" });
    }

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({ uid: teacherUid, school: { uid: locals.currentUser.school.uid } });
    mutation.setDeleteJson({ uid: teacherUid, pendingJoin: null });

    await txn.mutate(mutation);
    await txn.commit();
  },
};
