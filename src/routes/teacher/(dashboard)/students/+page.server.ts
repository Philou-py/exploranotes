import { db } from "$lib/dgraph.js";
import { z } from "zod";
import { validationFail } from "$lib/utilities";
import { Mutation } from "dgraph-js";

interface StudentsQuery {
  users: {
    school: {
      students: {
        key: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        hasAccount?: boolean;
      }[];
    };
  }[];
}

const studentsQuery = `
  query StudentsQuery($userUid: string) {
    users(func: uid($userUid)) {
      school {
        students: ~school @filter(type(Student)) {
          key: uid
          firstName
          lastName
          name
          email
          hasAccount: verifiedEmail
        }
      }
    }
  }
`;

export const load = async ({ locals, depends }) => {
  depends("app:students");
  const response = await db
    .newTxn()
    .queryWithVars(studentsQuery, { $userUid: locals.currentUser.uid });
  const { users }: StudentsQuery = response.getJson();

  return { students: users[0]?.school.students || [] };
};

export type SummaryItem = {
  key: string;
  name: string;
  email: string;
  existingAccount: boolean;
  schoolStatus: "none" | "current" | "other";
  isTeacher: boolean;
};

export type AddStudentsReturn = {
  summary: SummaryItem[] | undefined;
  message?: string;
};

const NewStudent = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.literal("").or(z.string().email()),
});

interface EmailsQuery {
  [stId: string]: {
    uid: string;
    accountType: ("Teacher" | "Student")[];
    schoolUid?: string;
  }[];
}

const StudentEdit = z.object({
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  email: z.string(),
  uid: z.string(),
});

export type EditStudentReturn = {
  message: string;
};

export const actions = {
  addStudents: async ({ request, locals }) => {
    const formData = await request.formData();
    const force = formData.get("force") === "yes";
    formData.delete("force");

    const map = new Map();
    for (const [key, value] of formData.entries()) {
      const [id, fieldName] = key.split(":");
      if (!id) return validationFail();

      if (map.has(id)) map.get(id)[fieldName] = value;
      else map.set(id, { [fieldName]: value });
    }

    let queries = "";

    for (const [stId, st] of map) {
      try {
        NewStudent.parse(st);
        // https://stackoverflow.com/a/37511463
        if (!st.email)
          st.email = `${st.firstName.trim()}.${st.lastName.trim()}@inconnu.fr`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\p{Diacritic} ]/gu, "");

        queries += `
          ${stId}(func: eq(email, "${st.email}")) @normalize {
            accountType: dgraph.type
            uid: uid
            school {
              schoolUid: uid
            }
          }
        `;
        st.name = `${st.firstName} ${st.lastName}`;
        st.school = { uid: locals.currentUser.school.uid };
      } catch (err) {
        return validationFail();
      }
    }

    let emailsQuery = `
      query EmailsQuery {
        ${queries}
      }
    `;
    const queryResponse = await db.newTxn().query(emailsQuery);
    const result: EmailsQuery = queryResponse.getJson();

    if (force) {
      const students = [];
      const studentsDelete = [];

      for (const [stId, [emailRes]] of Object.entries(result)) {
        if (emailRes?.accountType[0] === "Teacher" || emailRes?.schoolUid) continue;

        if (emailRes) {
          map.get(stId).uid = emailRes.uid;
          studentsDelete.push({
            uid: emailRes.uid,
            pendingJoin: null,
          });
        }

        map.get(stId)["dgraph.type"] = "Student";
        students.push(map.get(stId));
      }

      console.log(students);
      console.log(studentsDelete);

      const txn = db.newTxn();
      const mutation = new Mutation();
      mutation.setSetJson(students);
      mutation.setDeleteJson(studentsDelete);

      await txn.mutate(mutation);
      await txn.commit();

      return { message: "Toutes les actions ont bien été effectuées !" };
    }

    console.log(result);

    const actionReturn: AddStudentsReturn = {
      summary: Object.entries(result).map(([stId, [emailRes]]) => ({
        key: stId,
        name: map.get(stId).name,
        email: map.get(stId).email,
        existingAccount: !!emailRes,
        schoolStatus: (!emailRes || !emailRes.schoolUid
          ? "none"
          : emailRes.schoolUid === locals.currentUser.school.uid
            ? "current"
            : "other") as "none" | "current" | "other",
        isTeacher: emailRes?.accountType[0] === "Teacher",
      })),
    };
    return actionReturn;
  },

  editStudent: async ({ request }) => {
    const formData = await request.formData();
    const { success, data: student } = StudentEdit.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      name: "",
      email: formData.get("email"),
      uid: formData.get("uid"),
    });

    if (!success) return validationFail();

    student.name = `${student.firstName} ${student.lastName}`;
    if (student.email.endsWith("@inconnu.fr"))
      student.email = `${student.firstName.trim()}.${student.lastName.trim()}@inconnu.fr`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\p{Diacritic} ]/gu, "");

    const txn = db.newTxn();
    const mutation = new Mutation();
    console.log(student);
    mutation.setSetJson(student);

    await txn.mutate(mutation);
    await txn.commit();

    const actionReturn: EditStudentReturn = {
      message: `L'élève ${student.name} a bien été modifié !`,
    };
    return actionReturn;
  },
};
