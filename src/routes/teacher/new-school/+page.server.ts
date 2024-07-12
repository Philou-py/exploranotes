import { db } from "$lib/dgraph";
import { Mutation } from "dgraph-js";
import { fail } from "@sveltejs/kit";
import { z } from "zod";

interface School {
  uid: string;
  name: string;
  address: string;
}

const NewSchool = z.object({
  name: z.string(),
  address: z.string(),
  academy: z.string(),
});

export const actions = {
  default: async ({ request, locals }) => {
    const { uid } = locals.currentUser;
    const formData = await request.formData();
    const {
      success,
      error,
      data: newSchool,
    } = NewSchool.safeParse({
      name: formData.get("schoolName"),
      address: formData.get("schoolAddress"),
      academy: formData.get("academy"),
    });

    if (!success) {
      console.log("Validation error:", error);
      return fail(400, { message: "Le format des données entrées n'est pas valide !" });
    }

    const txn = db.newTxn();
    const mutation = new Mutation();
    mutation.setSetJson([
      { uid: "_:school", "dgraph.type": "School", ...newSchool },
      { uid, school: { uid: "_:school", "school|admin": true } },
    ]);
    await txn.mutate(mutation);
    await txn.commit();

    return { message: `L'établissement ${newSchool.name} a bien été créé !` };
  },
};
