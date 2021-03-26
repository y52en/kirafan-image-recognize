<template lang="pug">

  v-app
    v-app-bar(app, color="lime darken-3", dark, height="40px")
      .d-flex.align-center
        v-img.shrink.mr-2(
          :src="require('./assets/favicon.png')",
          width="37",
          contain,
          transition="scale-transition"
        )
      span 戦闘データ取得ツール
      v-spacer
      v-btn(@click="$window.document.getElementById('imgFile').click()",text,style="max-width:30vw")
        v-icon mdi-image
        span 読み込み
        input#imgFile(type="file",style="visibility:visible;width:0;height:0;")
      //- v-btn(@click="$window.document.getElementById('imgFile').click()",text)
      //-   v-icon mdi-reload
      //-   //- span リセット


    v-main.mx-2.mt-2
      router-view
</template>


<script>

export default {
  name: "App",

};
</script>
