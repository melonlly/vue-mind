<template>
    <div id="app">
        <div class="content">
          <flows></flows>
        </div>
    </div>
</template>

<script>
import Flows from "./flows";

/*
    todolist
        1.feat 背景拖拽
            按住Ctrl拖动
*/

export default {
    name: "App",
    components: {
        Flows,
    },
};
</script>

<style lang="less">
@import "./less/common/global.less";
@import "./less/common/layout.less";
#app {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .content {
      flex: 1;
    }
}
</style>
