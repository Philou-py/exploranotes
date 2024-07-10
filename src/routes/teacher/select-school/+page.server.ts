import { db } from "$lib/dgraph";
import { Mutation } from "dgraph-js";
import { fail } from "@sveltejs/kit";
import { createEmail, transporter } from "$lib/mail";
import jwt from "jsonwebtoken";
import { PRIVATE_KEY } from "$env/static/private";

const { sign } = jwt;

const schoolsQuery = `
  query SchoolsQuery($userUid: string) {
    schools(func: type(School)) {
      uid
      name
      address
    }

    users(func: uid($userUid)) @normalize {
      uid
      pendingJoin {
        pendingJoin: uid
      }
    }
  }
`;

interface School {
  uid: string;
  name: string;
  address: string;
}

export const load = async ({ locals }) => {
  const response = await db
    .newTxn()
    .queryWithVars(schoolsQuery, { $userUid: locals.currentUser!.uid });
  const { schools, users }: { schools: School[]; users: { pendingJoin?: string }[] } =
    response.getJson();

  return {
    schools: schools,
    pendingSchool: schools.find(({ uid }) => uid === users[0].pendingJoin),
  };
};

const queryAdmin = `
  query QueryAdmin($schoolUid: string) {
    admins(func: uid($schoolUid)) @normalize {
      ~school @filter(type(Teacher)) @facets(eq(admin, true)) {
        adminEmail: email
        adminName: name
      }
    }
  }
`;

export const actions = {
  default: async ({ request, locals }) => {
    const { uid, email, name } = locals.currentUser!;
    const formData = await request.formData();
    const schoolUid = formData.get("schoolUid");
    if (!schoolUid || typeof schoolUid !== "string")
      return fail(400, { message: "Le format des données entrées n'est pas valide !" });

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson({ uid, pendingJoin: { uid: schoolUid } });
    await txn.mutate(mutation);
    await txn.commit();

    const response = await db.newTxn().queryWithVars(queryAdmin, { $schoolUid: schoolUid });
    const { admins }: { admins: { adminEmail: string; adminName: string }[] } = response.getJson();

    const jwt = sign({ uid }, PRIVATE_KEY, { algorithm: "ES256", expiresIn: "30d" });

    admins.forEach(({ adminName, adminEmail }) => {
      const acceptURL = new URL(`/teacher/accept-teacher/${jwt}`, request.url);
      const requestEmail = createEmail(`
        <p>
          Bonjour ${adminName},
        </p>
        <p>
          ${name} souhaite rejoindre votre établissement. Son adresse email est ${email}.
        </p>
        <p>
          Si vous reconnaissez cet utilisateur, vous pouvez <a href="${acceptURL}">accepter sa demande</a>.
        </p>
      `);

      transporter.sendMail(
        {
          from: "ExploraNotes <contact@exploranotes.fr>",
          to: adminEmail,
          subject: "Un utilisateur souhaite rejoindre votre établissement",
          html: requestEmail,
        },
        (error) => {
          if (error) {
            console.log(`Error upon sending school joining email to ${adminEmail}:`);
            console.log(error);
          } else {
            console.log(`School joining email successfully sent again to ${adminEmail}!`);
          }
        },
      );
    });

    return { message: "Votre demande a bien été prise en compte !" };
  },
};
