<template>
    <svg version="1.1">
        <g
            transform="translate(0.5 0.5)"
            v-for="item in viewList"
            :key="item.id"
        >
            <polyline
                :points="item.path"
                @mouseover="hoverLine(item)"
                @mouseleave="leaveLine(item)"
                @click="onClick(item)"
            />
            <polyline
                class="line"
                :class="{ hover: hoverId === item.id }"
                :points="item.path"
                @click="onClick(item)"
            />
        </g>
        <line
            v-if="dragNode"
            :x1="source.x"
            :y1="source.y"
            :x2="target && target.x"
            :y2="target && target.y"
        />
    </svg>
</template>
<script>
import { uuid } from "@/utils/helpers";

export default {
    props: {
        layout: {
            type: String,
            default: "horizontal",
            validator: function(val) {
                return ["horizontal", "vertical"].indexOf(val) !== -1;
            },
        },
        rootNode: {
            validator: (prop) => typeof prop === "object" || prop === null,
            required: true,
        },
        expandRadius: {
            type: Number,
            default: 10,
        },
        copyLeft: {
            type: Number,
        },
        copyTop: {
            type: Number,
        },
        dragNode: {
            required: true,
        },
    },
    computed: {
        source() {
            if (this.layout === "horizontal") {
                return {
                    x: this.copyLeft,
                    y: this.copyTop + this.dragNode.nodeHeight / 2,
                };
            } else {
                return {
                    x: this.copyLeft + this.dragNode.nodeWidth / 2,
                    y: this.copyTop,
                };
            }
        },
        target() {
            let min = null;
            let node = null;
            this.eachNode(this.rootNode, (obj) => {
                if (obj.id !== this.dragNode.id) {
                    const disX = this.getDisX(obj);
                    const disY = this.getDisY(obj);

                    if (this.layout === "horizontal" && disX <= 0) {
                        return;
                    }
                    if (this.layout === "vertical" && disY <= 0) {
                        return;
                    }

                    const dis = Math.abs(disX) + Math.abs(disY);
                    if (!min) {
                        min = dis;
                        node = obj;
                    } else if (dis <= min) {
                        min = dis;
                        node = obj;
                    }
                }
            });

            if (!node) {
                node = {
                    id: this.rootNode.id,
                    x: this.rootNode.x,
                    y: this.rootNode.y,
                    nodeWidth: this.rootNode.nodeWidth,
                    nodeHeight: this.rootNode.nodeHeight,
                };
            }

            this.targetId = node.id;
            this.$root.TARGET_ID = node.id;
            if (this.layout === "horizontal") {
                return {
                    x: node.x + node.nodeWidth,
                    y: node.y + node.nodeHeight / 2,
                };
            } else {
                return {
                    x: node.x + node.nodeWidth / 2,
                    y: node.y + node.nodeHeight,
                };
            }
        },
    },
    data() {
        return {
            height: 10,
            viewList: [],
            targetId: null,
            hoverId: null,
        };
    },
    mounted() {
        this.$nextTick(() => {
            this.setViewList();
        });
    },
    methods: {
        hoverLine(item) {
            const index = this.viewList.findIndex((obj) => {
                return obj.id === item.id;
            });
            if (index !== -1) {
                this.viewList.splice(index, 1);
                this.viewList.push(item);
                this.hoverId = item.id;
            }
        },
        leaveLine(item) {
            this.hoverId = null;
        },
        onClick(item) {
            this.$emit("click", item);
        },
        getDisX(node) {
            if (this.layout === "horizontal") {
                return this.copyLeft - (node.x + node.nodeWidth);
            } else {
                return (
                    this.copyLeft +
                    this.dragNode.nodeWidth / 2 -
                    (node.x + node.nodeWidth / 2)
                );
            }
        },
        getDisY(node) {
            if (this.layout === "horizontal") {
                return (
                    this.copyTop +
                    this.dragNode.nodeHeight / 2 -
                    (node.y + node.nodeHeight / 2)
                );
            } else {
                return this.copyTop - (node.y + node.nodeHeight);
            }
        },
        eachNode(node, callback) {
            callback && callback(node);
            const expand = node.expand;
            if (expand) {
                const children = node.children;
                children.forEach((obj) => {
                    this.eachNode(obj, callback);
                });
            }
        },
        setViewList(rootNode) {
            rootNode = rootNode || this.rootNode;
            const array = [];
            if (rootNode) {
                const getChildren = (obj) => {
                    const startPoint = this.getStartPoint(obj);
                    const children = obj.children;
                    if (children && children.length && obj.expand) {
                        children.forEach((child) => {
                            const endPoint = this.getEndPoint(child);
                            const line = this.getLinePath(startPoint, endPoint);
                            if (line) {
                                array.push({
                                    id: `${obj.id}:${child.id}`,
                                    path: line,
                                });
                            }
                            getChildren(child);
                        });
                    }
                };
                getChildren(rootNode);
            }

            this.viewList = array;
        },
        getStartPoint(obj) {
            let x = null;
            if (this.layout === "vertical") {
                x = obj.x + obj.nodeWidth / 2; // + 1
            } else {
                x = obj.x + obj.nodeWidth + this.expandRadius;
            }

            let y = null;
            if (this.layout === "vertical") {
                y = obj.y + obj.nodeHeight + this.expandRadius; // + 2
            } else {
                y = obj.y + obj.nodeHeight / 2;
            }
            return { x, y };
        },
        getEndPoint(obj) {
            let x = null;
            if (this.layout === "vertical") {
                x = obj.x + obj.nodeWidth / 2; // + 1
            } else {
                x = obj.x;
            }

            let y = null;
            if (this.layout === "vertical") {
                y = obj.y;
            } else {
                y = obj.y + obj.nodeHeight / 2;
            }

            return { x, y };
        },
        getLinePath(start, end) {
            if (isNaN(start.x) || isNaN(start.y)) {
                return null;
            }

            if (isNaN(end.x) || isNaN(end.y)) {
                return null;
            }

            let pointA = null;
            if (this.layout === "vertical") {
                pointA = {
                    x: start.x,
                    y: start.y + this.height,
                };
            } else {
                pointA = {
                    x: start.x + this.height,
                    y: start.y,
                };
            }

            let pointB = null;
            if (this.layout === "vertical") {
                pointB = {
                    x: end.x,
                    y: start.y + this.height,
                };
            } else {
                pointB = {
                    x: start.x + this.height,
                    y: end.y,
                };
            }
            return `${start.x},${start.y} ${pointA.x},${pointA.y} ${pointB.x},${pointB.y} ${end.x},${end.y}`;
        },
    },
    watch: {
        targetId(val) {
            this.$emit("targetChange", val);
        },
        layout() {
            this.$nextTick(() => {
                // 此处更新不成功，无奈采用setTimeout
                setTimeout(() => {
                    this.setViewList();
                });
            });
        },
        rootNode: {
            handler() {
                this.$nextTick(() => {
                    setTimeout(() => {
                        this.setViewList();
                    });
                });
            },
            immediate: true, //刷新加载 立马触发一次handler
            deep: true, // 可以深度检测到 person 对象的属性值的变化
        },
        dragNode(val) {
            if (!val) {
                this.targetId = null;
            }
        },
        viewList(val) {
            this.$emit("change", val);
        },
    },
};
</script>
<style lang="less" scoped>
svg {
    width: 100%;
    height: 100%;
}
polyline {
    fill: none;
    stroke: transparent;
    stroke-width: 11;
    &.line {
        fill: none;
        stroke: #cbcbcb;
        stroke-width: 1;
        &.hover {
            position: relative;
            stroke: #1890ff;
            z-index: 100;
            cursor: pointer;
        }
        &:hover {
            position: relative;
            stroke: #1890ff;
            z-index: 100;
            cursor: pointer;
        }
    }
    &:hover {
        cursor: pointer;
    }
}
line {
    stroke: rgba(139, 139, 139, 0.8);
    stroke-width: 2;
}
</style>
