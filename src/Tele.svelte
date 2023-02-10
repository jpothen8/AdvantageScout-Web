<script>
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import ScoringLocationCombo from "./ScoringLocationCombo.svelte";
    import UndoButton from "./UndoButton.svelte";
    import DockedBox from "./DockedBox.svelte";
    import BalancedBox from "./BalancedBox.svelte";
    import {autoGameData, autoStack, generalGameData, teleGameData, teleStack, undoing} from "./stores";

    if($teleStack.length === 0){
        $teleStack.push((JSON.parse(JSON.stringify($teleGameData))))
    }

    $: $teleGameData, updateStack()
    function updateStack() {
        if (!$undoing) {
            $teleStack.push((JSON.parse(JSON.stringify($teleGameData))))
        }
        $undoing=false;
    }
</script>

<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo class="mx-auto"/>
</div>

<div class="z-20 pt-4 xl:pl-0xl:pl-8  z-10">
    <div class="flex justify-center mr-[320px]">
        <UndoButton/>
    </div>
</div>

<div class="flex justify-center -mt-1 xl:mt-1">
    <div class="text-3xl mt-7 -ml-2 xl:text-5xl">
        Tele-Op
    </div>
    <div class="ml-1">
        <DockedBox/>
    </div>
    <div class="ml-16">
        <BalancedBox/>
    </div>
    <div class="text-3xl mt-8 ml-8 {$generalGameData['allianceColor']==='red' ? 'text-error' : 'text-accent'}">
        {$generalGameData['teamNum']}
    </div>
</div>


<div class="pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10">
    <div class="mt-6">
        <ScoringLocationCombo/>
    </div>
</div>

<br><br><br><br><hr style="height:7px; visibility:hidden;" />

