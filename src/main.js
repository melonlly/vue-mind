import Vue from "vue";
import App from "./App.vue";
import VueMind from "@/components/vue_mind";
import DragSelect from "@/components/drag_select";

Vue.config.productionTip = false;

Vue.use(VueMind);
Vue.use(DragSelect);

Vue.directive("focus", {
    // 当被绑定的元素插入到 DOM 中时……
    inserted: function (el) {
        // 聚焦元素
        el.focus();
    },
});

new Vue({
    render: (h) => h(App),
}).$mount("#app");
