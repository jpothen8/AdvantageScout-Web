<script>
    import ScoringLocation from "./ScoringLocation.svelte";
    import ScoringLocationCombo from "./ScoringLocationCombo.svelte";
    import TrashCan from "./TrashCan.svelte";
    import GamePiece from "./GamePiece.svelte";
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import StartLocationDropdown from "./StartLocationDropdown.svelte";
    import MobilityBox from "./MobilityBox.svelte";
    import DockedBox from "./DockedBox.svelte";
    import BalancedBox from "./BalancedBox.svelte";
    import UndoButton from "./UndoButton.svelte";
    import {autoGameData, autoStack, generalGameData, undoing} from "./stores";
    let lastData = JSON.parse(JSON.stringify($autoGameData))
    if ($autoStack.length === 0) {
        $autoStack.push((JSON.parse(JSON.stringify($autoGameData))))
    }

    $: $autoGameData, updateStack()

    function updateStack() {
        console.log("hi")
        if (!$undoing && lastData !== $autoGameData) {
            $autoStack.push((JSON.parse(JSON.stringify($autoGameData))))
            lastData = JSON.parse(JSON.stringify($autoGameData))
            JSON.parse(JSON.stringify($autoGameData))
            console.log("hi2")
        }
        $undoing=false;
        console.log(lastData === $autoGameData)
    }
</script>

<div class="z-20 pt-4 xl:pl-0xl:pl-8  z-10">
    <div class="flex justify-center">
        <UndoButton/>
        <div class="ml-2">
            <StartLocationDropdown/>
        </div>
        <div class="-mt-4 ml-2">
            <MobilityBox/>
        </div>
    </div>
    <div class="flex justify-center -mt-2">
        <div class="text-3xl mt-7 ">
            Auto
        </div>
        <div class="ml-8">
            <DockedBox/>
        </div>
        <div class="ml-16">
            <BalancedBox/>
        </div>
        <div class="text-3xl mt-8 ml-8 {$generalGameData['allianceColor']==='red' ? 'text-error' : 'text-accent'}">
            {$generalGameData['teamNum']}
        </div>
    </div>


</div>

<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo class="mx-auto"/>
</div>

<div class="pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10">
    <div class="mt-6">
        <ScoringLocationCombo/>
    </div>
</div>






