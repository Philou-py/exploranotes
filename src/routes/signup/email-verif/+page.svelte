<script lang="ts">
  import { enhance, applyAction } from "$app/forms";
  import Button from "components/Button.svelte";
  import type { SubmitFunction } from "./$types";
  import { snackBars } from "components/SnackBars.svelte";

  export let data;
  let loading = false;

  const handleResend: SubmitFunction = () => {
    loading = true;
    return async ({ result }) => {
      loading = false;
      switch (result.type) {
        case "success":
          console.log("Success!");
          snackBars.haveASnack(result.data!.message);
          break;
        default:
          await applyAction(result);
      }
    };
  };
</script>

<h1>Confirmation de votre inscription</h1>

<p>
  Un email de confirmation a été envoyé à l&rsquo;adresse {data.email} afin de s&rsquo;assurer de sa
  validité.
</p>

<p>
  La réception de l&rsquo;email se fait généralement en moins d&rsquo;une minute. Il se peut
  qu&rsquo;il arrive dans le dossier de spam.
</p>

<form method="POST" use:enhance={handleResend}>
  <Button formSubmit {loading} --primary="var(--turmeric)" --secondary="white">
    Renvoyer un email
  </Button>
</form>

<style>
  p,
  form {
    text-align: center;
    font-size: 1.5em;
  }

  form {
    margin: 1.5em;
  }
</style>
