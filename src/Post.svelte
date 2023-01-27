<script>
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import StarRating from "./StarRating.svelte";
    import SliderRating from "./SliderRating.svelte";
</script>

<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo class="mx-auto" type="post"/>
</div>
 <div class="mt-10">
     <SliderRating/>
     <StarRating/>
 </div>