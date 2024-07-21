import { db } from "$lib/dgraph.js";
import { z } from "zod";
import { validationFail } from "$lib/utilities";
import { Mutation } from "dgraph-js";
import { fail } from "@sveltejs/kit";
import { createEmail, transporter } from "$lib/mail.js";

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

  const students =
    users[0]?.school.students.map((st) => ({
      ...st,
      email: st.email.endsWith("@inconnu.fr") ? "" : st.email,
    })) || [];

  return { students };
};

export type SummaryItem = {
  key: string;
  name: string;
  email: string;
  existingAccount: boolean;
  schoolStatus: "none" | "current" | "other";
  isTeacher: boolean;
  duplicate: boolean;
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
  email: z.literal("").or(z.string()),
  uid: z.string(),
});

export type EditStudentReturn = {
  message: string;
};

const deleteQuery = `
  query DeleteQuery($userUid: string) {
    users(func: uid($userUid)) @filter(type(Student)) {
      uid
      email
      firstName
      lastName
      name
      school {
        uid
      }
    }
  }
`;

interface DeleteQuery {
  users: {
    uid: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    school?: { uid: string };
  }[];
}

export type AccountDeleteReturn = { message: string };

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

    const emailSet = new Set();
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

        if (emailSet.has(st.email)) st.duplicate = true;
        else emailSet.add(st.email);

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

      for (const [stId, [emailRes]] of Object.entries(result)) {
        if (
          emailRes?.accountType[0] === "Teacher" ||
          emailRes?.schoolUid ||
          map.get(stId).duplicate
        )
          continue;

        if (emailRes) map.get(stId).uid = emailRes.uid;

        map.get(stId)["dgraph.type"] = "Student";
        students.push(map.get(stId));
      }

      const txn = db.newTxn();
      const mutation = new Mutation();
      mutation.setSetJson(students);

      await txn.mutate(mutation);
      await txn.commit();

      return { message: "Toutes les actions ont bien été effectuées !" };
    }

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
        duplicate: !!map.get(stId).duplicate,
      })),
    };
    return actionReturn;
  },

  editStudent: async ({ request, locals }) => {
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
    const studentDelete = [];

    if (student.email) {
      type EmailQuery = {
        students: { hasAccount?: boolean; school?: { uid: string } }[];
        usersWithEmail: { accountType: "Teacher" | "Student"; uid: string }[];
      };

      const emailQuery = `
        query EmailQuery($studentUid: string, $newEmail: string) {
          students(func: uid($studentUid)) @filter(type(Student)) {
            hasAccount: verifiedEmail
            school {
              uid
            }
          }

          usersWithEmail(func: eq(email, $newEmail)) {
            accountType: dgraph.type
            uid
          }
        }
      `;

      const response = await db
        .newTxn()
        .queryWithVars(emailQuery, { $studentUid: student.uid, $newEmail: student.email });
      const { students, usersWithEmail }: EmailQuery = response.getJson();

      if (
        students.length === 0 ||
        !students[0].school ||
        students[0].school.uid !== locals.currentUser.school.uid
      )
        return fail(403, { message: "Vous n'avez pas la permission de modifier cet élève !" });

      if (students[0].hasAccount)
        return fail(403, {
          message:
            "Vous ne pouvez pas modifier l'adresse électronique d'un élève possédant déjà un compte !",
        });

      if (usersWithEmail.length === 1 && usersWithEmail[0].accountType === "Student") {
        studentDelete.push({ uid: student.uid });
        student.uid = usersWithEmail[0].uid;
      } else if (usersWithEmail.length > 0)
        return fail(400, { message: "Cette adresse électronique est déjà utilisée !" });
    } else {
      student.email = `${student.firstName.trim()}.${student.lastName.trim()}@inconnu.fr`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\p{Diacritic} ]/gu, "");

      type EmailQuery = {
        students: {
          email: string;
          hasAccount?: boolean;
          school?: {
            uid: string;
            usersWithEmail?: { uid: string }[];
          };
        }[];
      };

      const emailQuery = `
        query EmailQuery($studentUid: string, $newEmail: string) {
          students(func: uid($studentUid)) @filter(type(Student)) {
            email
            hasAccount: verifiedEmail
            school {
              uid
              usersWithEmail: ~school @filter(eq(email, $newEmail)) {
                uid
              }
            }
          }
        }
      `;
      const response = await db
        .newTxn()
        .queryWithVars(emailQuery, { $studentUid: student.uid, $newEmail: student.email });
      const { students }: EmailQuery = response.getJson();

      if (
        students.length === 0 ||
        !students[0].school ||
        students[0].school.uid !== locals.currentUser.school.uid
      )
        return fail(403, { message: "Vous n'avez pas la permission de modifier cet élève !" });

      if (students[0].hasAccount) student.email = students[0].email;
      else if (
        students[0].school.usersWithEmail &&
        !(
          students[0].school.usersWithEmail.length === 1 &&
          students[0].school.usersWithEmail[0].uid === student.uid
        )
      )
        return fail(400, {
          message:
            "Malheureusement, vous ne pouvez pas créer d'homonymes parmi les élèves ne possédant pas d'adresse électronique dans un même établissement !",
        });
    }

    const txn = db.newTxn();
    const mutation = new Mutation();
    console.log(student);
    console.log(studentDelete);
    mutation.setSetJson(student);
    mutation.setDeleteJson(studentDelete);

    await txn.mutate(mutation);
    await txn.commit();

    const actionReturn: EditStudentReturn = {
      message: `L'élève ${student.name} a bien été modifié !`,
    };
    return actionReturn;
  },

  deleteAccount: async ({ request, locals }) => {
    const formData = await request.formData();
    const uid = formData.get("uid");

    if (!uid || typeof uid !== "string") return validationFail();

    const response = await db.newTxn().queryWithVars(deleteQuery, { $userUid: uid });
    const { users }: DeleteQuery = response.getJson();

    if (users.length === 0)
      return fail(400, { message: "Vous ne pouvez pas supprimer le compte de cet élève !" });

    const student = users[0];

    if (!student.school || student.school.uid !== locals.currentUser.school.uid)
      return fail(400, {
        message: "Vous n'avez pas la permission de supprimer le compte de cet élève !",
      });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({
      uid,
      verifiedEmail: false,
      email: `${student.firstName.trim()}.${student.lastName.trim()}@inconnu.fr`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\p{Diacritic} ]/gu, ""),
    });
    mutation.setDeleteJson({
      uid,
      password: null,
    });
    await txn.mutate(mutation);
    await txn.commit();

    const deleteAccountEmail = createEmail(
      `
      <p>Bonjour ${student.name},</p>
      <p>
        Nous avons le regret de vous annoncer la fermeture de votre compte
        par un(e) professeur(e). Vos identifiants ne fonctionneront donc plus
        à partir de maintenant.
      </p>
    `,
      "Bien cordialement",
    );

    transporter.sendMail(
      {
        from: "ExploraNotes <contact@exploranotes.fr>",
        to: student.email,
        subject: "Fermeture de votre compte ExploraNotes",
        html: deleteAccountEmail,
      },
      (error) => {
        if (error) {
          console.log(`Error upon sending account deleting email to ${student.email}:`);
          console.log(error);
        } else {
          console.log(`Account deleting email successfully sent again to ${student.email}!`);
        }
      },
    );

    return { message: `Le compte de l'élève ${student.name} a bien été supprimé !` };
  },
};
