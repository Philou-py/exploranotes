<script>
  import { darken, lighten } from "$lib/utilities";
  import Button from "$lib/components/Button.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import TextField from "$lib/components/TextField.svelte";
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
  <div style="background-color: transparent">
    <Button variant="outlined" disabled>
      <AccountCircle slot="append" />
      Hello, <strong>world</strong>!</Button
    >
    <Button --primary="var(--red)" --secondary="white" variant="flat" size="small">
      <AccountCircle slot="append" />
      Hello, <strong>world</strong>!</Button
    >
    <Button variant="outlined" size="medium" --primary="var(--indigo)" --secondary="white">
      <AccountCircle slot="append" />
      Hello, <strong>world</strong>!</Button
    >
    <Button
      variant="elevated"
      size="large"
      --primary={lighten("var(--yellow)", 55)}
      --secondary="black"
    >
      <AccountCircle slot="prepend" />
      Hello, <strong>world</strong>!</Button
    >
    <Button variant="elevated" size="large" --primary="var(--deep-orange)" --secondary="white">
      <AccountCircle slot="append" />
      Hello, <strong>world</strong>!</Button
    >
    <Button variant="elevated" size="small" icon>
      <AccountCircle />
    </Button>
    <Button variant="outlined" size="medium" --primary="var(--teal)" icon>
      <AccountCircle />
    </Button>
    <Button
      variant="flat"
      size="large"
      --primary={lighten("var(--purple)", 20)}
      --secondary="white"
      icon
    >
      <AccountCircle />
    </Button>
    <br />
    <br />
    <div>
      <TextField type="url" label="Hello, world!" placeholder="Hello, world!" required hint="Hello, world!">
        <AccountCircle slot="prepend" />
      </TextField>
    </div>
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
  }

  .welcome {
    display: block;
    position: relative;
    width: 100%;
    height: 0;
    padding: 0 0 calc(100% * 495 / 2048) 0;
  }

  .welcome img {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    display: block;
  }
</style>
