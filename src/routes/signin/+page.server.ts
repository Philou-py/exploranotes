import { PRIVATE_KEY } from "$env/static/private";
import { redirect, fail } from "@sveltejs/kit";
import { z } from "zod";
import { db } from "$lib/dgraph";
import jwt from "jsonwebtoken";

const { sign } = jwt;

export const load = ({ locals }) => {
  if (locals.currentUser) redirect(303, "/");
};

const User = z.object({
  email: z.string().email(),
  password: z.string().min(7),
  sideBarOpen: z.literal("yes").or(z.literal("no")),
});

const pwdQuery = `
  query PasswordQuery($email: string, $pwd: string) {
    users(func: eq(email, $email)) {
      uid
      email
      name
      verifiedEmail
      dgraph.type
      validPwd: checkpwd(password, $pwd)
    }
  }
`;

export const actions = {
  default: async ({ request, cookies, locals }) => {
    const formData = await request.formData();
    const {
      success,
      error,
      data: user,
    } = User.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      sideBarOpen: formData.get("sideBarOpen"),
    });

    if (!success) {
      console.log("Validation error:", error);
      return fail(400, { message: "Le format des données entrées n'est pas valide !" });
    }

    const queryRes = await db
      .newTxn()
      .queryWithVars(pwdQuery, { $email: user.email, $pwd: user.password });
    const { users } = queryRes.getJson();

    if (users.length === 0 || users[0].validPwd === false) {
      return fail(403, { message: "L'adresse email ou le mot de passe sont incorrects !" });
    }

    let currentUser = {
      uid: users[0].uid,
      accountType: users[0]["dgraph.type"][0].toLowerCase(),
      email: users[0].email,
      name: users[0].name,
      verifiedEmail: !!users[0].verifiedEmail,
    };

    locals.currentUser = currentUser;

    const info: Partial<typeof currentUser> = { ...currentUser };
    if (currentUser.verifiedEmail) delete info.verifiedEmail;

    const jwt = sign(info, PRIVATE_KEY, {
      algorithm: "ES256",
      expiresIn: "1y",
    });

    cookies.set("Auth", jwt, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
      secure: true,
    });

    cookies.set("SBOpen", user.sideBarOpen, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
      secure: true,
    });

    return { message: `Content de vous revoir, ${currentUser.name} !` };
  },
};
