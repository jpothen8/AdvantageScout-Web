<script>
    import Login from "./Login.svelte";
    import {gameStage} from "./stores";
    import Auto from "./Auto.svelte";
    import Tele from "./Tele.svelte";
    import QRPage from "./QRPage.svelte";

    window.onbeforeunload = function ()
    {
        return "";
    };

</script>

{#if $gameStage === 0}
    <Login/>
{:else if $gameStage === 1}
    <Auto/>
{:else if $gameStage === 2}
    <Tele/>
{:else}
    <QRPage/>
{/if}
