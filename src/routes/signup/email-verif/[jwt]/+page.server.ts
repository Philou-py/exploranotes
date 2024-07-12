import { PRIVATE_KEY } from "$env/static/private";
import { PUBLIC_KEY } from "$env/static/public";
import { db } from "$lib/dgraph";
import { fail } from "@sveltejs/kit";
import { Mutation } from "dgraph-js";
import jwt from "jsonwebtoken";

const { verify, sign } = jwt;

export const actions = {
  checkJWT: async ({ params: { jwt }, cookies, request, locals }) => {
    try {
      const payload = verify(jwt, PUBLIC_KEY, { algorithms: ["ES256"] });
      if (typeof payload !== "object") throw new Error("JWT not an object!");

      const txn = db.newTxn();
      const mutation = new Mutation();
      mutation.setSetJson({
        uid: payload.uid,
        verifiedEmail: true,
      });
      await txn.mutate(mutation);
      await txn.commit();

      // Exclude 'verifiedEmail'
      const { accountType, uid, email, name } = payload;
      const newJWT = sign({ accountType, uid, email, name }, PRIVATE_KEY, {
        algorithm: "ES256",
        expiresIn: "1y",
      });

      locals.currentUser = {
        accountType,
        uid,
        email,
        name,
        verifiedEmail: true,
        school: { uid: "", name: "" },
        isAuthenticated: true,
      };

      cookies.set("Auth", newJWT, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
        secure: true,
      });

      const formData = await request.formData();
      const largeScreen = formData.get("largeScreen") === "yes" ? "yes" : "no";
      cookies.set("LGScreen", largeScreen, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: false,
        secure: true,
      });

      cookies.set("SBOpen", largeScreen, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: false,
        secure: true,
      });

      return { message: `${name}, votre inscription a bien été validée !` };
    } catch (error) {
      console.log("Invalid JWT!");
      return fail(400, { message: "Le jeton de l'URL est invalide !" });
    }
  },
};
