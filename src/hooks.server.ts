import { PUBLIC_KEY } from "$env/static/public";
import { transporter } from "$lib/mail";
import { db } from "$lib/dgraph";
import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

const { verify } = jwt;

transporter.verify((error) => {
  if (error) {
    console.log("Transporter error:");
    console.log(error);
  } else {
    console.log("Nodemailer is ready to send emails!");
  }
});

interface SchoolQuery {
  users: {
    uid: string;
    school?: {
      uid: string;
      name: string;
    };
  }[];
}

// Including the first 'uid' field is necessary to avoid receiving an
// empty array when 'school' is not present
const schoolQuery = `
  query SchoolQuery($userUid: string) {
    users(func: uid($userUid)) {
      uid
      school {
        uid
        name
      }
    }
  }
`;

export const handle = async ({ event, resolve }) => {
  const { url, locals, route, cookies } = event;
  locals.currentUser = {
    uid: "",
    accountType: "teacher",
    email: "",
    name: "",
    verifiedEmail: false,
    school: { uid: "", name: "" },
    isAuthenticated: false,
  };
  const jwt = cookies.get("Auth");

  if (jwt) {
    try {
      const payload = verify(jwt, PUBLIC_KEY, { algorithms: ["ES256"] });
      if (typeof payload === "object") {
        const { accountType, uid, email, name, verifiedEmail } = payload;
        locals.currentUser = {
          accountType,
          uid,
          email,
          name,
          verifiedEmail: verifiedEmail !== false,
          school: { uid: "", name: "" },
          isAuthenticated: true,
        };
      } else {
        throw new Error("JWT payload is not an object!");
      }
    } catch (err) {
      console.log("Invalid JWT!");
    }
  }

  if (url.pathname.startsWith("/teacher")) {
    if (!locals.currentUser.isAuthenticated || locals.currentUser.accountType !== "teacher")
      redirect(303, "/");

    if (!route.id) console.log("No route id!");
    if (route.id && route.id.startsWith("/teacher/(dashboard)")) {
      const response = await db
        .newTxn()
        .queryWithVars(schoolQuery, { $userUid: locals.currentUser.uid });
      const {
        users: [teacher],
      }: SchoolQuery = response.getJson();

      if (!teacher.school) redirect(303, "/teacher/select-school");
      locals.currentUser.school = teacher.school;
    }
  }

  return await resolve(event);
};
