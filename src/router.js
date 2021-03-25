import Vue from "vue";
import Router from "vue-router";
// import Home from "./views/Home/";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: import_vue("Home"),
    },
    // {
    //   path: "/ImageRecognize",
    //   name: "ImageRecognize",
    //   //   props: true,
    //   component: import_vue("ImageRecognize"),
    // },
  ],
});

function import_vue(path) {
  return () => import("./views/" + path);
}
