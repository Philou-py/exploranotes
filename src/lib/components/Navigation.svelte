<script lang="ts">
  import Button from "./Button.svelte";
  import Menu from "svelte-material-icons/Menu.svelte";
  import logo from "$lib/images/logo-128.webp";
  import Login from "svelte-material-icons/Login.svelte";
  import Avatar from "./Avatar.svelte";
  import Cookies from "js-cookie";

  export let currentUser = {
    accountType: "teacher" as "teacher" | "student",
    name: "",
    isAuthenticated: false,
  };
  export let clipped = false;
  export let open = false;
  let bgElt: HTMLDivElement;

  const toggleSideBar = () => {
    if (clipped) {
      const currentValue = Cookies.get("SBOpen") as "yes" | "no" | undefined;
      Cookies.set("SBOpen", currentValue === "no" || !currentValue ? "yes" : "no");
    }
    open = !open;
  };

  const handleBgClick = (event: MouseEvent) => {
    if (event.target === bgElt) {
      toggleSideBar();
    }
  };
</script>

<nav class="navBar container">
  {#if currentUser.isAuthenticated}
    <Button
      variant="flat"
      --primary="var(--jester-red)"
      --secondary="white"
      on:click={toggleSideBar}
      style="margin-right: 20px"
      icon
    >
      <Menu />
    </Button>
  {/if}
  <a href="/" class="logoAndTitle">
    <img alt="ExploraNotes's logo" src={logo} width={50} height={50} />
    <h4 class="exploraNotes">ExploraNotes</h4>
  </a>
  <div class="links">
    {#if currentUser.isAuthenticated}
      {#if clipped}
        <Avatar name={currentUser.name} />
      {/if}
    {:else}
      <a href="/signin" tabindex="-1">
        <Button variant="outlined" --primary="white" shrinkToIcon>
          <Login slot="prepend" />
          Connexion
        </Button>
      </a>
    {/if}
  </div>
</nav>

<div
  bind:this={bgElt}
  class="sideBarWrapper"
  class:clipped
  class:open
  on:click={handleBgClick}
  tabindex="-1"
  role="presentation"
>
  <div class="sideBarContent">
    <Avatar name={currentUser.name} style="margin: 0 auto 30px; font-size: 30px;" --size="150px" />
    {#if currentUser.accountType === "teacher"}
      <slot name="teacherMenu" />
    {:else}
      <slot name="studentMenu" />
    {/if}
  </div>
</div>

<style lang="scss">
  $navBarHeight: 60px;
  $sideBarWidth: 270px;
  $xs: 600px;
  $sm: 960px;
  $md: 1264px;
  $lg: 1904px;
  $navColour: var(--jester-red);

  .navBar,
  .sideBarWrapper {
    font-size: 1.1em;
  }

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

  .links {
    margin-left: auto;
  }

  :global(.navBar a, .sideBarContent a) {
    text-decoration: none;
    color: inherit;
  }

  .sideBarWrapper {
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgb(0 0 0 / 0.5);
    opacity: 0;
    transition:
      transform 300ms ease,
      opacity 300ms ease,
      visibility 300ms ease;
    /* Less than the Modal's z-index */
    z-index: 8888;
    visibility: hidden;

    &.open {
      opacity: 1;
      visibility: visible;

      .sideBarContent {
        transform: translateX(0);
        visibility: visible;
      }
    }

    &.clipped {
      top: $navBarHeight;
      width: auto;
      height: calc(100% - $navBarHeight);
      transform: translateX(-$sideBarWidth);

      &.open,
      .sideBarContent {
        transform: translateX(0);
      }
    }
  }

  .sideBarContent {
    box-sizing: border-box;
    width: $sideBarWidth;
    height: 100%;
    padding: 30px 7px;
    background-color: color-mix(in srgb, var(--sweet-corn) 80%, white); // #eee
    transform: translateX(-$sideBarWidth);
    transition:
      transform 300ms ease,
      visibility 300ms ease;
    visibility: hidden;
    overflow-y: auto;
  }
</style>
