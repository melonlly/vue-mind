import Vue from "vue";
import App from "./App.vue";
import 'ant-design-vue/dist/antd.css'
import Antd from 'ant-design-vue'
import VueMind from "@/components/vue_mind";
import '../public/font/iconfont.css'
import DragSelect from "@/components/drag_select";

Vue.config.productionTip = false;

Vue.use(Antd)
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
    data() {
        return {
            TARGET_ID: null
        }
    },
    render: (h) => h(App),
}).$mount("#app");
