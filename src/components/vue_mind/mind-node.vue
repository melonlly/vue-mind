<template>
    <div
        tabindex="1"
        class="mind-node"
        :style="`left: ${left}px;top:${top}px`"
        @focus="onFocus"
        @blur="onBlur"
        @dblclick="dblclick"
        @click.stop="onClick"
        @contextmenu="onContextMenu"
    >
        <slot />
    </div>
</template>

<script>
import Bus from "@/utils/bus";

let starter = null;
let ender = null;

export default {
    props: {
        top: {
            type: Number,
            default: 0,
        },
        left: {
            type: Number,
            default: 0,
        },
        layout: {
            type: String,
            default: "horizontal",
        },
    },
    data() {
        return {
            offsetHeight: 0,
            offsetWidth: 0,
            isDrag: false,
        };
    },
    mounted() {
        const el = this.$el;
        this.offsetHeight = el.offsetHeight;
        this.offsetWidth = el.offsetWidth;

        el.addEventListener("mousedown", this.mouseDown);

        el.addEventListener("keydown", this.keydown);
    },
    beforeDestroy() {
        const el = this.$el;
        el.removeEventListener("mousedown", this.mouseDown);
        el.removeEventListener("keydown", this.keydown);

        document.removeEventListener("mousemove", this.mouseMove);
        document.removeEventListener("mouseup", this.mouseup);
    },
    methods: {
        onClick(e) {
            this.$emit("click", e);
        },
        onContextMenu(e) {
            event.preventDefault();
            event.stopPropagation();
            this.$emit("contextmenu", e);
        },
        dblclick(e) {
            this.$emit("dblclick", e);
        },
        onFocus(e) {
            this.$emit("focus", e);
        },
        onBlur(e) {
            this.$emit("blur", e);
        },
        keydown(e) {
            // 禁止移动过程中删除节点
            if (this.isDrag) {
                return;
            }
            this.$emit("keydown", e);
        },
        mouseDown(e) {
            const ctrlKey = e.ctrlKey;
            if (ctrlKey) {
                return;
            }

            if (e.button === 2) {
                return;
            }

            this.$emit("dragStart", this.$el);
            this.isDrag = true;
            starter = {
                pageX: e.pageX,
                pageY: e.pageY,
            };
            document.addEventListener("mousemove", this.mouseMove);
            document.addEventListener("mouseup", this.mouseup);
        },
        mouseMove(e) {
            if (!this.isDrag) {
                return;
            }
            ender = {
                pageX: e.pageX,
                pageY: e.pageY,
            };
            const disX = ender.pageX - starter.pageX;
            const disY = ender.pageY - starter.pageY;
            this.$emit("drag", disX, disY);
        },
        mouseup(e) {
            Bus.$emit("dragEnd", e);
            this.isDrag = false;
            document.removeEventListener("mousemove", this.mouseMove);
            document.removeEventListener("mouseup", this.mouseup);
        },
    },
};
</script>
