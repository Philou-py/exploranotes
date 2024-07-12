<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { EditStudentReturn } from "./+page.server";
  import Modal from "components/Modal.svelte";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Face from "svelte-material-icons/FaceManOutline.svelte";
  import FaceShimmer from "svelte-material-icons/FaceManShimmerOutline.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import { enhance, applyAction } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";

  export let modalOpen = false;
  export let student: { uid: string; firstName: string; lastName: string; email: string };
  let loading = false;

  const handleEditStudent: SubmitFunction<EditStudentReturn, { message: string }> = () => {
    loading = true;

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message!);
          invalidate("app:students");
          modalOpen = false;
          break;
        case "failure":
          snackBars.haveASnack(result.data!.message, "error");
          break;
        case "error":
          snackBars.haveASnack(result.error.message, "error");
          break;
        default:
          await applyAction(result);
      }
      loading = false;
    };
  };
</script>

<Modal show={modalOpen} --width="clamp(400px, 40%, 600px)">
  <div class="card">
    <header>
      <h2 class="cardTitle center">Modifier un élève</h2>
    </header>

    <form method="POST" action="?/editStudent" use:enhance={handleEditStudent}>
      <TextField name="firstName" label="Prénom" value={student.firstName} required>
        <FaceShimmer slot="prepend" />
      </TextField>
      <TextField name="lastName" label="Nom de famille" value={student.lastName} required>
        <Face slot="prepend" />
      </TextField>
      <TextField
        type="email"
        name="email"
        label="Adresse électronique"
        value={student.email}
        readonly
      >
        <AccountCircle slot="prepend" />
      </TextField>
      <input type="hidden" name="uid" value={student.uid} />

      <div class="cardActions">
        <Button variant="text" --primary="var(--jester-red)" on:click={() => (modalOpen = false)}>
          Annuler
        </Button>
        <Button
          variant="outlined"
          formSubmit
          {loading}
          --primary="var(--princess-blue)"
          --secondary="white"
        >
          Valider
        </Button>
      </div>
    </form>
  </div>
</Modal>
