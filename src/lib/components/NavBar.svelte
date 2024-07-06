<script lang="ts">
  import Button from "./Button.svelte";
  import logo from "$lib/images/logo.png";
  import Login from "svelte-material-icons/Login.svelte";

  interface CurrentUser {
    email: string;
    displayName: string;
    accountType: "teacher" | "student";
  }
  export let currentUser: CurrentUser | undefined = undefined;
</script>

<div class="navBar container">
    <a href="/" class="logoAndTitle">
      <img alt="ExploraNotes's logo" src={logo} width={50} height={50} />
      <h4 class="exploraNotes">ExploraNotes</h4>
    </a>
    <a href="/signin" style="margin-left: auto" tabindex="-1">
      <Button variant="outlined" --primary="white" shrinkToIcon>
        <Login slot="prepend" />
        Connexion
      </Button>
    </a>
</div>

{#if currentUser}
  <div class="sideBar">
    This is the side bar!
  </div>
{/if}

<style lang="scss">
  $navBarHeight: 60px;
  $xs: 600px;
  $sm: 960px;
  $md: 1264px;
  $lg: 1904px;
  $navColour: var(--jester-red);

  .navBar {
    position: sticky;
    background-color: $navColour;
    box-shadow: 0 2px 4px 0 darkgrey;
    top: 0;
    width: 100%;
    height: $navBarHeight;
    z-index: 8000;
    display: flex;
    align-items: center;
  }

  .logoAndTitle {
    display: flex;
    align-items: center;
    text-decoration: none;
    position: relative;
    cursor: pointer;
  }

  .exploraNotes {
    margin-left: 5px;
    color: white;
  }
</style>
