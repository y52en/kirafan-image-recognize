<template lang="pug">
span
  v-app
    v-app-bar(app, color="blue", dark, height="40px")
      //- .d-flex.align-center
      //-   v-img.shrink.mr-2(
      //-     :src="require('./assets/favicon.png')",
      //-     width="37",
      //-     contain,
      //-     transition="scale-transition"
      //-   )

      //-   <v-img
      //-     alt="Vuetify Name"
      //-     class="shrink mt-1 hidden-sm-and-down"
      //-     contain
      //-     min-width="100"
      //-     src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
      //-     width="100"
      //-   />
      span アルファ版

      v-spacer

      //- v-btn(icon)
      //-   v-icon mdi-open-in-new

    v-main.mx-2
      router-view
</template>


<script>

export default {
  name: "App",

};
</script>
