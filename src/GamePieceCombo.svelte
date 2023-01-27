<script>
    import GamePiece from "./GamePiece.svelte";
    import NextStageButton from "./NextStageButton.svelte";
    import LastStageButton from "./LastStageButton.svelte";
    import QRButton from "./QRButton.svelte";

    export let type = "normal";
</script>

{#if type === "normal"}
    <LastStageButton/>
    <div class="ml-3">
        <GamePiece gamePiece="Cone"/>
    </div>
    <div class="ml-3">
        <GamePiece/>
    </div>
    <div class="ml-3">
        <NextStageButton/>
    </div>
    {:else if type === "post"}
    <LastStageButton/>
    <div class="ml-3">
    <QRButton/>
    </div>
{/if}
