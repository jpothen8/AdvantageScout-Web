<script>
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import ScoringLocationCombo from "./ScoringLocationCombo.svelte";
    import UndoButton from "./UndoButton.svelte";
    import DockedBox from "./DockedBox.svelte";
    import BalancedBox from "./BalancedBox.svelte";
</script>

<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo class="mx-auto"/>
</div>

<div class="z-20 pt-4 xl:pl-0xl:pl-8  z-10">
    <div class="flex justify-center mr-[320px]">
        <UndoButton/>
    </div>
</div>

<div class="flex justify-center -mt-1">
    <div class="text-3xl mt-7 ">
        Tele
    </div>
    <div class="ml-11">
        <DockedBox/>
    </div>
    <div class="ml-16">
        <BalancedBox/>
    </div>
    <div class="text-3xl mt-8 ml-8">
        6328
    </div>
</div>


<div class="pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10">
    <div class="mt-6">
        <ScoringLocationCombo/>
    </div>
</div>

