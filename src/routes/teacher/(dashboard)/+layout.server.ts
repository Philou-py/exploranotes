import { db } from "$lib/dgraph";
import { redirect } from "@sveltejs/kit";

// Including the 'uid' field is necessary to avoid receiving an empty
// array when 'pendingJoin' and 'schoolName' are not present
const schoolQuery = `
  query SchoolQuery($userUid: string) {
    users(func: uid($userUid)) @normalize {
      uid
      school {
        schoolName: name
      }
      pendingJoin {
        pendingJoin: uid
      }
    }
  }
`;

export const load = async ({ locals }) => {
  const response = await db
    .newTxn()
    .queryWithVars(schoolQuery, { $userUid: locals.currentUser!.uid });
  const {
    users: [teacher],
  }: { users: { schoolName?: string; pendingJoin?: string }[] } = response.getJson();

  if (!teacher.schoolName) redirect(303, "/teacher/select-school");

  return { schoolName: teacher.schoolName, pendingSchoolUid: teacher.pendingJoin };
};
