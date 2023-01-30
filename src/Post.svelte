<script>
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import StarRating from "./StarRating.svelte";
    import SliderRating from "./SliderRating.svelte";
    import NotesBox from "./NotesBox.svelte";
</script>

<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo class="mx-auto" type="post"/>
</div>
 <div class="flex flex-col items-center justify-center m-10">
     <SliderRating name="Defense Duration"/>
     <StarRating name = "Defense Rating"/>
     <SliderRating name = "Rec. Defense Duration"/>
     <StarRating name = "Driver Rating"/>
     <StarRating name = "Intake Rating"/>
     <NotesBox/>
 </div>