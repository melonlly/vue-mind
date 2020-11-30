<template>
    <div class="container">
        <template v-if="node">
            <div class="node-wrapper">
                <mind-node
                    v-if="node"
                    class="node-item"
                    :class="{
                        selected,
                        'is-error': node.detail && !!node.detail.nodeIsError,
                    }"
                    :left="x"
                    :top="y"
                    :layout="layout"
                    @keydown="keydown"
                    @focus="onFocus"
                    @blur="onBlur"
                    @dragStart="dragStart"
                    @drag="onDrag"
                    @click="onClick"
                    @dblclick="dblclick"
                    @contextmenu="contextmenu"
                >
                    <div class="node-content" :title="node.detail.content">
                        <i
                            class="icon"
                            :class="{
                                'sys-node': node.type === NODE_TYPE.SYSTEM,
                                'stu-node': node.type === NODE_TYPE.STUDENT,
                                'text-node': node.type === NODE_TYPE.TEXT,
                            }"
                        />
                        <span
                            class="text"
                            v-if="node.detail && node.detail.content"
                            >{{ node.detail.content }}</span
                        >
                        <span class="text error-tip" v-else
                            >请编辑节点内容</span
                        >
                    </div>
                </mind-node>
                <expand-icon
                    v-model="node.expand"
                    :left="x"
                    :top="y"
                    :layout="layout"
                    :node-width="nodeWidth"
                    :node-height="nodeHeight"
                    :expandRadius="expandRadius"
                    :has-children="!!node.children && !!node.children.length"
                    @expand="expandChange"
                />
            </div>
            <div class="tree-list">
                <mind-tree
                    v-show="node.expand"
                    v-if="node && node.children && node.children.length"
                    v-for="item in node.children"
                    :ref="`mindTree_${item.id}`"
                    :key="item.id"
                    :dis-x="disX"
                    :dis-y="disY"
                    :layout="layout"
                    :vspace="vspace"
                    :node="item"
                    :select-nodes="selectNodes"
                    :expand-radius="expandRadius"
                >
                </mind-tree>
            </div>
        </template>
    </div>
</template>

<script>
import MindNode from "./mind-node";
import ExpandIcon from "./expand-icon";
import Bus from "@/utils/bus";
import { NODE_TYPE } from "@/utils/const";

export default {
    name: "MindTree",
    components: { MindNode, ExpandIcon },
    props: {
        disX: {
            type: Number,
        },
        disY: {
            type: Number,
        },
        // 水平间距
        hspace: {
            type: Number,
            default: 30,
        },
        // 垂直间距
        vspace: {
            type: Number,
            default: 30,
        },
        expandRadius: {
            type: Number,
            default: 10,
        },
        layout: {
            type: String,
            default: "horizontal",
        },
        node: {
            validator: (prop) => typeof prop === "object" || prop === null,
            required: true,
        },
        selectNodes: {
            type: Array,
            default: [],
        },
    },
    data() {
        return {
            NODE_TYPE,
            nodeHeight: 0,
            nodeWidth: 0,
            containerHeight: 0,
            containerWidth: 0,
            mTop: 0,
            mLeft: 0,
        };
    },
    computed: {
        selected() {
            const index = this.selectNodes.findIndex((id) => {
                return id === this.node.id;
            });
            return index !== -1;
        },
        x() {
            if (!this.node) {
                return 0;
            }

            let x;
            if (this.layout === "horizontal") {
                x = this.layoutX + this.mLeft;
            } else {
                x = this.layoutX + (this.containerWidth - this.nodeWidth) / 2;
            }
            x = x + this.disX;

            this.node.x = x;
            return x;
        },
        y() {
            if (!this.node) {
                return 0;
            }

            let y;
            if (this.layout === "horizontal") {
                y = this.layoutY + (this.containerHeight - this.nodeHeight) / 2;
            } else {
                y = this.layoutY + this.mTop;
            }
            y = y + this.disY;

            this.node.y = y;
            return y;
        },
        layoutX() {
            if (this.layout === "horizontal") {
                if (this.$parent.nodeWidth) {
                    return (
                        this.$parent.layoutX +
                        this.$parent.nodeWidth +
                        this.hspace +
                        this.expandRadius
                    );
                } else {
                    return 0;
                }
            } else {
                if (this.$parent.nodeWidth) {
                    return this.$parent.layoutX + this.mLeft;
                } else {
                    return 0;
                }
            }
        },
        layoutY() {
            if (this.layout === "horizontal") {
                if (this.$parent.nodeWidth) {
                    return this.$parent.layoutY + this.mTop;
                } else {
                    return 0;
                }
            } else {
                if (this.$parent.nodeWidth) {
                    return (
                        this.$parent.layoutY +
                        this.$parent.nodeHeight +
                        this.vspace +
                        this.expandRadius
                    );
                } else {
                    return 0;
                }
            }
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.initWidthAndHeight();
        });
    },
    updated() {
        /**
         * 此处存在性能问题，需要优化
         */
        this.$nextTick(() => {
            this.initWidthAndHeight();
        });
    },
    methods: {
        contextmenu(e) {
            Bus.$emit("node:contextmenu", e, this.node);
        },
        onClick(e) {
            Bus.$emit("node:click", e, this.node);
        },
        dblclick(e) {
            Bus.$emit("node:dblclick", e, this.node);
        },
        onDrag(disX, disY) {
            Bus.$emit("drag", disX, disY, this.node);
        },
        dragStart(el) {
            Bus.$emit("dragStart", el, this.node);
        },
        onBlur(e) {
            Bus.$emit("node:blur", e, this.node);
        },
        onFocus(e) {
            Bus.$emit("node:focus", e, this.node);
        },
        keydown(e) {
            Bus.$emit("node:keydown", e, this.node);
        },
        initWidthAndHeight() {
            const dom = this.$el.querySelector(".node-item");
            if (!dom) return;
            if (!this.domOffsetHeight) {
                this.domOffsetHeight = dom.offsetHeight;
                this.domOffsetWidth = dom.offsetWidth;
            }

            this.nodeHeight = this.domOffsetHeight;
            this.nodeWidth = this.domOffsetWidth;
            this.node.nodeHeight = this.nodeHeight;
            this.node.nodeWidth = this.nodeWidth;

            const children = this.node.children;
            if (children && children.length && this.node.expand) {
                let height = 0;
                let width = 0;

                children.forEach((obj, index) => {
                    const vm = this.$refs[`mindTree_${obj.id}`][0];
                    if (!vm) return;

                    if (this.layout === "horizontal") {
                        if (index !== 0) {
                            height = height + this.vspace;
                        }
                        vm.mLeft = 0;
                        vm.mTop = height;
                        height = height + vm.containerHeight;
                        width = Math.max(width, vm.containerWidth);
                    } else {
                        if (index !== 0) {
                            width = width + this.hspace;
                        }
                        vm.mTop = 0;
                        vm.mLeft = width;
                        width = width + vm.containerWidth;

                        height = Math.max(height, vm.containerHeight);
                    }
                });

                if (this.layout === "horizontal") {
                    this.containerHeight = height;
                    this.containerWidth =
                        this.nodeWidth +
                        this.hspace +
                        this.expandRadius +
                        width;
                } else {
                    this.containerHeight =
                        this.nodeHeight +
                        this.vspace +
                        this.expandRadius +
                        height;
                    this.containerWidth = width;
                }
            } else {
                const dom = this.$el.querySelector(".node-item");
                this.containerHeight = this.domOffsetHeight;
                this.containerWidth = this.domOffsetWidth;
            }
            this.$emit("sizeChange", this.containerHeight, this.containerWidth);
        },
        expandChange(expand) {
            Bus.$emit("node:update", Object.assign({}, this.node, { expand }));
        },
    },
};
</script>

<style lang="less" scoped>
@icon-size: 32px;

.node-content {
    display: flex;
    align-items: center;
    // padding: 10px 0;
    padding: 4px;
    cursor: pointer;
    .icon {
        margin-right: 10px;
        border-radius: 100%;
    }
    .text {
        flex: 1;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        text-align: left;
        margin-right: 7px;
        &.error-tip {
            color: rgba(0, 0, 0, 0.4);
            margin: 0;
            padding: 0;
        }
    }
}
/**系统节点 */
i.sys-node {
    display: inline-block;
    width: @icon-size;
    height: @icon-size;
    background: url(../../../public/image/sys-node.png) center center no-repeat;
    background-size: contain;
}

/**学员节点 */
i.stu-node {
    display: inline-block;
    width: @icon-size;
    height: @icon-size;
    background: url(../../../public/image/stu-node.png) center center no-repeat;
    background-size: contain;
}

/**旁白节点 */
i.text-node {
    display: inline-block;
    width: @icon-size;
    height: @icon-size;
    background: url(../../../public/image/text-node.png) center center no-repeat;
    background-size: contain;
}
</style>
