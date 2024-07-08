<script lang="ts">
  import Button from "components/Button.svelte";
  import type { SubmitFunction } from "./$types";
  import { applyAction, enhance } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { goto } from "$app/navigation";

  let loading = false;

  const handleSubmit: SubmitFunction = ({ formData }) => {
    loading = true;
    formData.set("sideBarOpen", window.matchMedia("(max-width: 960px)").matches ? "no" : "yes");
    return async ({ result }) => {
      loading = false;
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          goto("/");
          break;
        case "failure":
          snackBars.haveASnack(result.data!.message, "error");
          goto("/signup/email-verif");
          break;
        default:
          await applyAction(result);
      }
    };
  };
</script>

<h1>Confirmation de votre inscription</h1>

<form method="POST" action="?/checkJWT" use:enhance={handleSubmit}>
  <Button
    formSubmit
    variant="elevated"
    --primary="var(--living-coral)"
    --secondary="white"
    {loading}
  >
    Allons-y !
  </Button>
</form>

<style>
  form {
    text-align: center;
    margin: 1.5em;
    font-size: 1.5em;
  }
</style>
