<template>
    <a-icon
        v-if="hasChildren"
        class="expand-icon"
        :type="expand ? 'minus-circle' : 'plus-circle'"
        :style="`left: ${x}px;top:${y}px;font-size:${expandRadius}px`"
        @click.stop="onClick"
        @mousedown.stop=""
    />
</template>
<script>
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
        expandRadius: {
            type: Number,
            default: 10,
        },
        hasChildren: {
            type: Boolean,
            default: false,
        },
        nodeWidth: {
            type: Number,
            default: 0,
        },
        nodeHeight: {
            type: Number,
            default: 0,
        },
        value: {
            type: Boolean,
            required: true,
        },
    },
    data() {
        return {
            expand: this.value,
        };
    },
    computed: {
        x() {
            if (this.layout === "horizontal") {
                return this.left + this.nodeWidth;
            } else {
                return this.left + this.nodeWidth / 2 - this.expandRadius / 2;
            }
        },
        y() {
            if (this.layout === "horizontal") {
                return this.top + this.nodeHeight / 2 - this.expandRadius / 2;
            } else {
                return this.top + this.nodeHeight;
            }
        },
    },
    watch: {
        value(val) {
            this.expand = val;
        },
    },
    methods: {
        onClick() {
            this.$nextTick(() => {
                this.$emit("expand", !this.expand);
            });
        },
    },
};
</script>
<style lang="less" scoped>
.expand-icon {
    position: absolute;
    color: #8b8b8b;
    cursor: pointer;
}
</style>
