import { PRIVATE_KEY } from "$env/static/private";
import { z } from "zod";
import { db } from "$lib/dgraph";
import { Mutation } from "dgraph-js";
import jwt from "jsonwebtoken";
import { fail, redirect } from "@sveltejs/kit";
import sendVerifEmail from "./sendVerifEmail.js";

// https://github.com/auth0/node-jsonwebtoken/issues/963
const { sign } = jwt;

export const load = ({ locals }) => {
  if (locals.currentUser) redirect(303, "/");
};

const emailQuery = `
  query EmailQuery($email: string) {
    users(func: eq(email, $email)) {
      uid
    }
  }
`;

const NewUser = z.object({
  accountType: z.literal("teacher").or(z.literal("student")),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(7),
  sideBarOpen: z.literal("yes").or(z.literal("no")),
});

export const actions = {
  default: async ({ request, cookies, locals }) => {
    const data = await request.formData();
    const {
      success,
      error,
      data: newUser,
    } = NewUser.safeParse({
      accountType: data.get("accountType"),
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      password: data.get("password"),
      sideBarOpen: data.get("sideBarOpen"),
    });

    if (!success) {
      console.log("Validation error:", error);
      return fail(400, { message: "Le format des données entrées n'est pas valide !" });
    }

    const name = `${newUser.firstName} ${newUser.lastName}`;

    const queryRes = await db.newTxn().queryWithVars(emailQuery, { $email: newUser.email });
    const { users } = queryRes.getJson();
    if (users.length > 0) {
      console.log(users);
      return fail(400, { message: "Cette adresse email est déjà utilisée !" });
    }

    const txn = db.newTxn();
    const mutation = new Mutation();

    mutation.setSetJson({
      uid: "_:newUser",
      "dgraph.type": newUser.accountType === "teacher" ? "Teacher" : "Student",
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      name,
      email: newUser.email,
      password: newUser.password,
      creationDate: new Date(),
    });

    const response = await txn.mutate(mutation);
    await txn.commit();

    const uid = response.getUidsMap().get("newUser") as string;

    const currentUser = {
      accountType: newUser.accountType,
      uid,
      email: newUser.email,
      name,
      verifiedEmail: false,
    };
    locals.currentUser = currentUser;

    const jwt = sign(currentUser, PRIVATE_KEY, {
      algorithm: "ES256",
      expiresIn: "30d",
    });

    const verifURL = new URL(`/signup/email-verif/${jwt}`, request.url);
    sendVerifEmail(currentUser.name, currentUser.email, verifURL.toString());

    cookies.set("Auth", jwt, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // Valid for 30 days
      sameSite: "lax", // Allows cookie to be sent on navigation
      httpOnly: true,
      secure: true,
    });

    cookies.set("SBOpen", newUser.sideBarOpen, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
      secure: true,
    });

    return { message: `Bienvenue, ${name} !` };
  },
};
