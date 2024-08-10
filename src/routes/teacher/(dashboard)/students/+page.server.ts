import { db } from "$lib/dgraph";
import { z } from "zod";
import { getRandomColour, validationFail } from "$lib/utilities";
import { Mutation } from "dgraph-js";
import { fail } from "@sveltejs/kit";
import { createEmail, transporter } from "$lib/mail";

interface StudentsQuery {
  schools: {
    students: {
      key: string;
      firstName: string;
      lastName: string;
      name: string;
      nameSlug: string;
      email: string;
      hasAccount: boolean;
      primGroups?: {
        uid: string;
        name: string;
        colour: string;
      }[];
      otherGroups?: {
        name: string;
        colour: string;
      }[];
      selected: number;
      toRemove?: boolean;
    }[];
    groups: {
      key: string;
      name: string;
      nbStudents: number;
      level: string;
      primary: boolean;
      isAdmin: number;
    }[];
  }[];
  mAGroups: {
    uid: string;
    name: string;
    admins: { key: string; name: string; email: string }[];
  }[];
}

export const load = async ({ locals, depends, url }) => {
  depends("app:students");

  const newGroup = url.searchParams.get("newGroup") === "yes";
  let groupToEdit = (!newGroup && url.searchParams.get("editGroup")) || "";
  if (groupToEdit !== "" && !groupToEdit.startsWith("0x")) groupToEdit = "";

  let mAGroup = url.searchParams.get("manageAccess") || "";
  if (!mAGroup.startsWith("0x")) mAGroup = "";

  const studentsQuery = `
    query StudentsQuery {
      schools(func: uid(${locals.currentUser.school.uid})) {
        students: ~school @filter(type(Student)) {
          key: uid
          firstName
          lastName
          name
          email
          hasAccount: verifiedEmail
          primGroups: groups @filter(eq(primary, true)) (orderasc: name@fr) {
            uid
            name: name@fr
            colour
          }
          otherGroups: groups @filter(eq(primary, false)) (orderasc: name@fr) {
            name: name@fr
            colour
          }
          selected: count(groups @filter(uid(${groupToEdit})))
        }
        groups {
          key: uid
          name: name@fr
          nbStudents: count(~groups @filter(type(Student)))
          level
          primary
          isAdmin: count(~groups @filter(type(Teacher) and uid(${locals.currentUser.uid})))
        }
      }
      mAGroups(func: uid(${mAGroup})) {
        uid
        name: name@fr
        admins: ~groups @filter(type(Teacher)) (orderasc: name) {
          key: uid
          name
          email
        }
      }
    }
  `;

  const response = await db.newTxn().query(studentsQuery);
  const { schools, mAGroups }: StudentsQuery = response.getJson();

  let groupPrefill = { name: "", level: "", primary: false };
  const targetGroup = schools[0]?.groups.find((gr) => gr.key === groupToEdit && gr.isAdmin === 1);
  if (targetGroup)
    groupPrefill = {
      name: targetGroup.name,
      level: targetGroup.level,
      primary: targetGroup.primary,
    };
  else groupToEdit = "";

  const students =
    schools[0]?.students.map((st) => ({
      ...st,
      nameSlug: st.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\p{Diacritic}]/gu, ""),
      email: st.email.endsWith("@inconnu.fr") ? "" : st.email,
      hasAccount: !!st.hasAccount,
      primGroupsStr: st.primGroups ? st.primGroups.join(" ") : "",
      otherGroupsStr: st.otherGroups ? st.otherGroups.join(" ") : "",
      selected: st.selected === 1,
    })) || [];

  return {
    students,
    groups: schools[0]?.groups || [],
    groupsItems: [
      ["", "-- Pas de tri --"] as [string, string],
      ...(schools[0]?.groups.map((gr) => [gr.key, gr.name] as [string, string]) || []),
    ],
    groupToEdit,
    newGroup,
    groupPrefill,
    mAGroup: mAGroups[0] || { uid: "", name: "", admins: [] },
  };
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

export type MsgReturn = {
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

const NewGroup = z.object({
  groupToEdit: z.string(),
  name: z.string().min(1).max(20),
  level: z.string().min(1).max(40),
  primary: z.literal("yes").or(z.literal("no")),
});

interface CreateGroupQuery {
  scCheck: { allInSchool: boolean }[];
  grCheck: { isAdmin: boolean }[];
}

const NewAdmin = z.object({
  groupUid: z.string().regex(/0x[a-f0-9]+/),
  email: z.string().email(),
});

const addAdminQuery = `
  query AddAdminQuery($schoolUid: string, $email: string) {
    schools(func: uid($schoolUid)) {
      teachers: ~school @filter(type(Teacher) and eq(email, $email)) {
        uid
        name
      }
    }
  }
`;

interface AddAdminQuery {
  schools: {
    teachers: { uid: string; name: string }[];
  }[];
}

const OldAdmin = z.object({
  groupUid: z.string().regex(/0x[a-f0-9]+/),
  teacherUid: z.string().regex(/0x[a-f0-9]+/),
});

const remAdminQuery = `
  query RemAdminQuery($schoolUid: string, $groupUid: string, $teacherUid: string) {
    schools(func: uid($schoolUid)) {
      groups @filter(uid($groupUid)) {
        teachers: ~groups @filter(type(Teacher) and uid($teacherUid)) {
          name
        }
        nbAdmins: count(~groups @filter(type(Teacher)))
      }
    }
  }
`;

interface RemAdminQuery {
  schools: {
    groups: {
      teachers?: { name: string }[];
      nbAdmins: number;
    }[];
  }[];
}

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
    mutation.setSetJson(student);
    mutation.setDeleteJson(studentDelete);

    await txn.mutate(mutation);
    await txn.commit();

    const actionReturn: MsgReturn = {
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

  createGroup: async ({ request, locals }) => {
    const schoolUid = locals.currentUser.school.uid;
    const formData = await request.formData();
    const inputStudents = Array.from(formData.entries())
      .filter(([id, _]) => id.startsWith("st"))
      .map(([_, uid]) => uid);
    const removeStudents = Array.from(formData.entries())
      .filter(([id, _]) => id.startsWith("rem"))
      .map(([_, uid]) => uid);

    const { data: newGroup, success } = NewGroup.safeParse({
      groupToEdit: formData.get("groupToEdit"),
      name: formData.get("name"),
      level: formData.get("level"),
      primary: formData.get("primary") || "no",
    });

    if (!success) return validationFail();

    let createGroupQuery = `
      query CreateGroupQuery {
        var(func: uid(${schoolUid})) {
          groups @filter(uid(${newGroup.groupToEdit})) {
            nbAdmins as count(~groups @filter(type(Teacher) and uid(${locals.currentUser.uid})))
          }
        }
        var(func: uid(${schoolUid})) {
          nbStudents as count(~school @filter(type(Student) and uid(${inputStudents.join(", ")})))
        }
        scCheck(func: uid(${schoolUid})) {
          allInSchool: math(nbStudents == ${inputStudents.length})
        }
        grCheck(func: uid(${newGroup.groupToEdit})) {
          isAdmin: math(nbAdmins == 1)
        }
      }
    `;
    const queryRes = await db.newTxn().query(createGroupQuery);
    const { scCheck, grCheck }: CreateGroupQuery = queryRes.getJson();

    if (!scCheck[0].allInSchool || (newGroup.groupToEdit && !grCheck[0].isAdmin))
      return validationFail();

    const newSubjects = Array.from(formData.entries())
      .filter(([key, _]) => key.startsWith("sub"))
      .map(([_, val]) => ({
        "dgraph.type": "Subject",
        "name@fr": val,
      }));

    const txn = db.newTxn();
    const mutation = new Mutation();

    const groupUid = newGroup.groupToEdit || "_:gr";
    mutation.setSetJson([
      {
        uid: groupUid,
        "dgraph.type": "Group",
        "name@fr": newGroup.name,
        subjects: newSubjects,
        level: newGroup.level,
        primary: newGroup.primary === "yes",
        schoolYear: new Date().getFullYear(),
        colour: `var(--${getRandomColour()})`,
        creationDate: new Date(),
      },
      ...inputStudents.map((uid) => ({ uid, groups: { uid: groupUid } })),
      {
        uid: locals.currentUser.uid,
        groups: { uid: groupUid },
      },
      {
        uid: locals.currentUser.school.uid,
        groups: { uid: groupUid },
      },
    ]);

    mutation.setDeleteJson(
      removeStudents.map((uid) => ({
        uid,
        groups: { uid: groupUid },
      })),
    );

    await txn.mutate(mutation);
    await txn.commit();

    const actionReturn: MsgReturn = {
      message: `Le groupe ${newGroup.name} a bien été ${newGroup.groupToEdit ? "modifié" : "créé"} !`,
    };
    return actionReturn;
  },

  addAdmin: async ({ request, locals }) => {
    const formData = await request.formData();

    const { success, data: newAdmin } = NewAdmin.safeParse({
      groupUid: formData.get("groupUid"),
      email: formData.get("email"),
    });
    if (!success) return validationFail();

    const queryRes = await db.newTxn().queryWithVars(addAdminQuery, {
      $schoolUid: locals.currentUser.school.uid,
      $email: newAdmin.email,
    });
    const { schools }: AddAdminQuery = queryRes.getJson();

    if (schools.length === 0)
      return fail(400, { message: "Ce professeur n’existe pas dans cet établissement !" });
    const teacher = schools[0].teachers[0];

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({
      uid: teacher.uid,
      groups: { uid: newAdmin.groupUid },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return { message: `${teacher.name} est maintenant un administrateur !` };
  },

  removeAdmin: async ({ request, locals }) => {
    const formData = await request.formData();

    const { success, data: oldAdmin } = OldAdmin.safeParse({
      groupUid: formData.get("groupUid"),
      teacherUid: formData.get("teacherUid"),
    });
    if (!success) return validationFail();

    if (oldAdmin.teacherUid === locals.currentUser.uid)
      return fail(400, {
        message: "Vous ne pouvez pas vous retirer vous-même le rôle d’administrateur !",
      });

    const queryRes = await db.newTxn().queryWithVars(remAdminQuery, {
      $schoolUid: locals.currentUser.school.uid,
      $teacherUid: oldAdmin.teacherUid,
      $groupUid: oldAdmin.groupUid,
    });
    const { schools }: RemAdminQuery = queryRes.getJson();

    if (schools.length === 0)
      return fail(400, { message: "Ce groupe n’existe pas dans cet établissement !" });
    if (!schools[0].groups[0].teachers)
      return fail(400, { message: "Ce professeur n’est pas un administrateur de ce groupe !" });
    if (schools[0].groups[0].nbAdmins === 1)
      return fail(400, { message: "Vous ne pouvez pas supprimer le dernier administrateur !" });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setDeleteJson({
      uid: oldAdmin.teacherUid,
      groups: { uid: oldAdmin.groupUid },
    });

    await txn.mutate(mutation);
    await txn.commit();

    return {
      message: `${schools[0].groups[0].teachers[0].name} n’est plus administrateur de ce groupe !`,
    };
  },
};
