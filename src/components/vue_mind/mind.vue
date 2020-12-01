<template>
    <div
        class="mind-wrapper"
        :style="`transform: scale(${scale});width: ${width}px;height: ${height}px;min-width: ${minWidth}px;min-height: ${minHeight}px`"
        @contextmenu="onContextMenu"
    >
        <copy-node
            v-show="visible"
            :node-content="nodeContent"
            :style="`left:${left}px;top:${top}px;`"
        />
        <mind-tree
            ref="mindTree"
            :dis-x="disX"
            :dis-y="disY"
            :layout="layout"
            :vspace="vspace"
            :node="rootNode"
            :expand-radius="expandRadius"
            :select-nodes="selectNodes"
            @sizeChange="onSizeChange"
        >
        </mind-tree>
        <mind-svg
            ref="mindSvg"
            :show-drag-line="visible"
            :layout="layout"
            :drag-node="dragNode"
            :copy-left="left"
            :copy-top="top"
            :root-node="rootNode"
            :expand-radius="expandRadius"
            @click="editPathText"
            @change="lineListChange"
            @targetChange="targetChange"
        />
        <template v-for="(obj, i) in pathTextList">
            <a-input
                :key="`path-input-${i}-${obj.id}`"
                style="height: 24px"
                v-if="obj.mode === 'Edit'"
                id="text_input"
                class="path-text-input"
                autocomplete="off"
                maxlength="200"
                :style="`left:${obj.x}px;top:${obj.y}px`"
                v-model="obj.text"
                v-focus="obj.mode === 'Edit'"
                @blur="onBlur($event, obj)"
                @keyup.enter="onBlur($event, obj)"
                @change="textChange(obj)"
            />
            <span
                :key="`path-span-${i}-${obj.id}`"
                class="path-text"
                v-show="obj.mode !== 'Edit'"
                :style="`left:${obj.x}px;top:${obj.y}px`"
                :title="obj.text"
                @click="editPathText(obj)"
            >
                {{ obj.text }}
            </span>
        </template>
    </div>
</template>

<script>
import MindTree from "./mind-tree";
import CopyNode from "@/components/vue_mind/copy-node";
import MindSvg from "@/components/vue_mind/mind-svg";
import Bus from "@/utils/bus";
import { isEmpty } from "@/utils/helpers";

let positon = null;

export default {
    name: "VueMind",
    components: { MindTree, CopyNode, MindSvg },
    props: {
        scale: {
            type: Number,
            default: 1,
        },
        height: {
            type: Number,
            required: true,
        },
        width: {
            type: Number,
            required: true,
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
        value: {
            type: Array,
            required: true,
        },
        connections: {
            type: Array,
            default: [],
        },
        editable: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            paddingTop: 20,
            paddingLeft: 80,
            nodesData: this.value,
            minWidth: 0,
            minHeight: 0,
            rootNode: null,
            // 节点
            nodeContent: null,
            visible: false,
            left: 0,
            top: 0,
            selectNodes: [],
            ctrlDown: false,
            selectType: "single",
            dragNode: null,
            lineList: [],
            pathTextList: [],
        };
    },
    computed: {
        disX() {
            if (this.width >= this.minWidth) {
                return (this.width - this.minWidth) / 2 + this.paddingLeft;
            } else {
                return this.paddingLeft;
            }
        },
        disY() {
            if (this.height >= this.minHeight) {
                return (this.height - this.minHeight) / 2 + this.paddingTop;
            } else {
                return this.paddingTop;
            }
        },
    },
    beforeCreate() {
        Bus.$on("dragStart", (dom, dragNode) => {
            if (!this.editable) {
                return;
            }

            const left = parseFloat(dom.style.left);
            const top = parseFloat(dom.style.top);

            positon = {
                left: left,
                top: top,
            };
            this.left = left;
            this.top = top;
            this.nodeContent = dom;
        });

        Bus.$on("drag", (disX, disY, dragNode) => {
            if (!this.editable) {
                return;
            }

            if (Math.abs(disX) > 2 || Math.abs(disY) > 2) {
                this.visible = true;
                if (!this.dragNode) {
                    this.dragNode = dragNode;
                }
            }
            this.left = positon.left + disX;
            this.top = positon.top + disY;
        });

        Bus.$on("dragEnd", (e) => {
            if (!this.editable) {
                return;
            }

            if (!this.dragNode) {
                return;
            }
            const sourceId = this.dragNode.id;
            const parentid = this.dragNode.parentid;

            const targetId = this.$root.TARGET_ID;
            if (isEmpty(targetId)) {
                console.error("出现异常情况：targetId为空");
                return;
            }

            this.visible = false;
            this.dragNode = null;

            // 根节点是否所有节点的父节点，拖动是不应该生效的
            if (!parentid) {
                return;
            }

            // 拖动的节点不存在
            const index = this.value.findIndex((obj) => {
                return obj.id === sourceId;
            });
            if (index === -1) {
                return;
            }

            const sourceNode = this.getNodeById(sourceId);
            const targetNode = this.getNodeById(targetId);

            // 父节点拖到子节点后面是不生效的
            const isParent = this.isParent(sourceNode, targetNode);
            if (isParent) {
                return;
            }

            // 改变排序
            const children = targetNode.children.filter((obj) => {
                return obj.id !== sourceNode.id;
            });

            let insertAfterId = null;
            let insertBeforeId = null;
            const position = {
                x: this.left,
                y: this.top,
            };

            let key = this.layout === "horizontal" ? "y" : "x";
            for (let i = 0, j = children.length; i < j; i++) {
                const childNode = children[i];

                if (i === 0 && position[key] <= childNode[key]) {
                    // 第一点
                    insertBeforeId = childNode.id;
                    break;
                } else if (i === j - 1 && position[key] > childNode[key]) {
                    // 最后一个点
                    insertAfterId = childNode.id;
                    break;
                } else {
                    const nextNode = children[i + 1];
                    if (position[key] === childNode[key]) {
                        insertBeforeId = childNode.id;
                        break;
                    } else if (
                        position[key] > childNode[key] &&
                        position[key] < nextNode[key]
                    ) {
                        insertBeforeId = nextNode.id;
                        break;
                    } else if (position[key] === nextNode[key]) {
                        insertBeforeId = nextNode.id;
                        break;
                    }
                }
            }

            if (!insertBeforeId && !insertAfterId) {
                // 表示节点没有因拖拽发生位置变动
                if (parentid === targetId) {
                    return;
                }
                this.$emit("dragNode", e, sourceId, targetId, "Original");
            } else if (insertBeforeId && !insertAfterId) {
                if (parentid === targetId) {
                    const indexA = this.nodesData.findIndex((obj) => {
                        return obj.id === sourceId;
                    });
                    const indexB = this.nodesData.findIndex((obj) => {
                        return obj.id === insertBeforeId;
                    });
                    // 表示节点没有因拖拽发生位置变动
                    if (indexA < indexB) {
                        return;
                    }
                }
                this.$emit(
                    "dragNode",
                    e,
                    sourceId,
                    targetId,
                    "Before",
                    insertBeforeId
                );
            } else if (!insertBeforeId && insertAfterId) {
                if (parentid === targetId) {
                    const indexA = this.nodesData.findIndex((obj) => {
                        return obj.id === sourceId;
                    });
                    const indexB = this.nodesData.findIndex((obj) => {
                        return obj.id === insertAfterId;
                    });
                    // 表示节点没有因拖拽发生位置变动
                    if (indexA > indexB) {
                        return;
                    }
                }
                this.$emit(
                    "dragNode",
                    e,
                    sourceId,
                    targetId,
                    "After",
                    insertAfterId
                );
            }
        });

        Bus.$on("updateRoot", () => {
            this.$nextTick(() => {
                this.setRootNode();
            });
        });

        Bus.$on("node:update", (node) => {
            this.$emit("expand", node);
        });

        Bus.$on("node:keydown", (e, node) => {
            e.preventDefault();
            e.stopPropagation();
            const keyCode = e.keyCode;
            switch (keyCode) {
                // Enter
                case 13:
                    this.addNode(node.id);
                    break;
                // Control
                case 17:
                    this.ctrlDown = true;
                    break;
                // Delete
                case 46:
                    this.deleteNode(node.id);
                    break;
                // C
                case 67:
                    e.ctrlKey && this.copyNode(node.id);
                    break;
                // V
                case 86:
                    e.ctrlKey && this.pasteNode(node.id);
                    break;
                // Z
                case 90:
                    // Ctrl + Z 撤销
                    if (e.ctrlKey && !e.shiftKey) {
                        this.undo();
                    } else if (e.ctrlKey && e.shiftKey) {
                        this.redo();
                    }
                    break;
                default:
                    break;
            }
        });

        Bus.$on("node:focus", (e, node) => {
            // TODO
        });

        Bus.$on("node:blur", (e, node) => {
            // TODO
        });

        Bus.$on("node:click", (e, node) => {
            this.$emit("clickNode", e, node);

            //隐藏右键菜单
            const index = this.selectNodes.findIndex((id) => {
                return id === node.id;
            });
            // 多选模式下选择节点
            if (e.ctrlKey) {
                if (index === -1) {
                    this.selectNodes.push(node.id);
                } else {
                    this.selectNodes.splice(index, 1);
                }
                this.selectType = "multi";
                return;
            }

            // 单选模式下选择节点
            if (index === -1) {
                this.selectNodes = [node.id];
            } else {
                const nodeId = this.selectNodes[index];
                this.selectNodes = [nodeId];
            }
            this.selectType = "single";
        });

        Bus.$on("node:dblclick", (e, node) => {
            this.$emit("dblclickNode", e, node);
        });

        Bus.$on("node:contextmenu", (e, node) => {
            this.$emit("contextmenu", e, node);
        });
    },
    created() {
        this.rootNode = this.getRootNode();
    },
    mounted() {
        document.addEventListener("keydown", this.keydown);
        document.addEventListener("keyup", this.keyup);
        document.addEventListener("click", this.onClick);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keyup", this.keyup);
        document.removeEventListener("click", this.onClick);

        const el = this.$el;
        el.removeEventListener("mousemove", this.mousemove);

        Bus.$off("dragStart");
        Bus.$off("drag");
        Bus.$off("dragEnd");
        Bus.$off("updateRoot");
        Bus.$off("node:update");
        Bus.$off("node:keydown");
        Bus.$off("node:focus");
        Bus.$off("node:blur");
        Bus.$off("node:click");
        Bus.$off("node:dblclick");
        Bus.$off("node:contextmenu");
    },
    methods: {
        targetChange(targetId) {
            console.log(`当前节点改变 targetChange`);
        },
        getPathTextList() {
            return this.pathTextList;
        },
        setPathTextList() {
            const array = [];
            this.connections.forEach((connection) => {
                const text = connection.text;
                if (!isEmpty(text) || connection.mode === "Edit") {
                    const id = connection.id;
                    const path = this.getPath(id);
                    if (path) {
                        const middlePoint = this.getPathMiddlePoint(path);
                        const json = Object.assign(
                            {
                                id: id,
                                mode: connection.mode || "View",
                                text,
                            },
                            middlePoint
                        );
                        array.push(json);
                    }
                }
            });
            this.pathTextList = array;
        },
        textChange(obj) {
            this.$emit("changeLineText", obj.id, {
                text: obj.text,
            });
        },
        getPath(id) {
            const index = this.lineList.findIndex((obj) => {
                return obj.id === id;
            });
            if (index !== -1) {
                return this.lineList[index].path;
            } else {
                return null;
            }
        },
        lineListChange(val) {
            this.lineList = val;
        },
        editPathText(item) {
            this.$emit("changeLineText", item.id, {
                mode: "Edit",
            });
        },
        onBlur(e, item) {
            this.$nextTick(() => {
                this.$emit("changeLineText", item.id, {
                    mode: "View",
                    text: item.text,
                });
            });
        },
        getMiddlePoint(pointA, pointB) {
            const arrayA = pointA.split(",");
            const arrayB = pointB.split(",");
            const x = (parseFloat(arrayA[0]) + parseFloat(arrayB[0])) / 2;
            const y = (parseFloat(arrayA[1]) + parseFloat(arrayB[1])) / 2;
            return { x, y };
        },
        getPathMiddlePoint(path) {
            const array = path.split(/\s+/g);
            // 获取第二个点和第3个点
            let pointB = array[3];
            const pointC = array[2];

            // if (pointB === pointC) {
            //   pointB = array[3]
            // }
            const middlePoint = this.getMiddlePoint(pointB, pointC);
            return middlePoint;
        },
        isParent(parentNode, node) {
            const children = parentNode.children;
            if (children && children.length) {
                let flag = false;
                for (let i = 0, j = children.length; i < j; i++) {
                    const obj = children[i];
                    if (obj.id === node.id) {
                        flag = true;
                    } else {
                        flag = flag || this.isParent(obj, node);
                    }
                }
                return flag;
            } else {
                return false;
            }
        },
        getNodeById(nodeId) {
            let obj = null;
            this.eachNode(this.rootNode, (node) => {
                if (node.id === nodeId) {
                    obj = node;
                    return false;
                }
                return true;
            });
            return obj;
        },
        onClick(e) {
            if (this.ctrlDown) {
                return;
            }
            this.selectNodes = [];
        },
        findNodesInRect(obj, rootNode) {
            const array = [];
            this.eachNode(rootNode, (node) => {
                if (node.x >= obj.left) {
                    if (node.x + node.nodeWidth <= obj.left + obj.width) {
                        if (node.y >= obj.top) {
                            if (
                                node.y + node.nodeHeight <=
                                obj.top + obj.height
                            ) {
                                array.push(node.id);
                            }
                        }
                    }
                }
                return true;
            });
            return array;
        },
        dragSelect(obj) {
            if (isEmpty(obj)) {
                return;
            }
            const array = this.findNodesInRect(obj, this.rootNode);
            if (!isEmpty(array)) {
                this.selectNodes = array;
                this.selectType = "multi";
            }
        },
        eachNode(node, callback) {
            if (callback) {
                if (!callback(node)) return;
            }
            const children = node.children;
            if (children && children.length) {
                children.forEach((obj) => {
                    this.eachNode(obj, callback);
                });
            }
        },
        zoomIn() {
            this.$emit("zoomIn");
        },
        zoomOut() {
            this.$emit("zoomOut");
        },
        resetZoom() {
            this.$emit("resetZoom");
        },
        onContextMenu(e) {
            this.$emit("contextmenu", e);
        },
        keydown(e) {
            // 拖拽中禁止操作
            if (this.visible) {
                return;
            }

            const keyCode = e.keyCode;
            switch (keyCode) {
                case 90:
                    // Ctrl + Z 撤销
                    if (e.ctrlKey && !e.shiftKey) {
                        this.undo();
                    } else if (e.ctrlKey && e.shiftKey) {
                        this.redo();
                    }
                    break;
                case 17:
                    this.ctrlDown = true;
                    break;
                case 67:
                    e.ctrlKey && this.copyNode();
                    break;
                // Delete
                case 46:
                    this.deleteNode();
                    break;
                default:
                    break;
            }
        },
        keyup(e) {
            const keyCode = e.keyCode;
            switch (keyCode) {
                case 17:
                    this.ctrlDown = false;
                    break;
                default:
                    break;
            }
        },
        pasteNode(nodeId) {
            this.$emit("pasteNode", nodeId);
        },
        copyNode(nodeId) {
            if (this.selectType === "multi") {
                this.$emit("multiCopy", this.selectNodes);
            } else if (this.selectType === "single") {
                this.$emit("copyNode", nodeId);
            } else {
                console.error("unknown select type");
            }
        },
        // 恢复
        redo() {
            if (!this.editable) {
                return;
            }

            this.$emit("redo");
        },
        // 撤销
        undo() {
            if (!this.editable) {
                return;
            }

            this.$emit("undo");
        },
        addNode(id) {
            if (!this.editable) {
                return;
            }

            if (id) {
                this.$emit("addNode", id);
                return;
            }

            const length = this.selectNodes.length;
            if (length === 1) {
                this.$emit("addNode", this.selectNodes[0]);
            }
        },
        deleteNode(nodeId) {
            if (!this.editable) {
                return;
            }
            this.$emit("deleteNode", nodeId);
        },
        getRootNode() {
            const array = this.nodesData.map((obj) => {
                obj.children = this.nodesData.filter((item) => {
                    return item.parentid === obj.id;
                });
                if (obj.expand === undefined) {
                    obj.expand = true;
                }
                return obj;
            });
            const index = array.findIndex((obj) => {
                return !obj.parentid;
            });
            if (index !== -1) {
                return array[index];
            }

            return null;
        },
        onSizeChange(height, width) {
            this.minHeight = height + 2 * this.paddingTop;
            this.minWidth = width + 2 * this.paddingLeft;
        },
        setRootNode() {
            const rootNode = this.getRootNode();
            if (!rootNode) {
                this.rootNode = null;
            } else {
                // 深拷贝的简单实现
                this.rootNode = JSON.parse(JSON.stringify(rootNode));
            }
        },
    },
    watch: {
        width() {
            this.$nextTick(() => {
                this.setRootNode();
            });
        },
        height() {
            this.$nextTick(() => {
                this.setRootNode();
            });
        },
        value(val) {
            this.nodesData = val;

            this.selectNodes = this.selectNodes.filter((nodeId) => {
                const index = val.findIndex((obj) => {
                    return obj.id === nodeId;
                });
                return index !== -1;
            });

            this.$nextTick(() => {
                this.setRootNode();
            });
        },
        connections() {
            this.$nextTick(() => {
                this.setPathTextList();
            });
        },
        lineList() {
            this.$nextTick(() => {
                this.setPathTextList();
            });
        },
    },
};
</script>

<style lang="less">
.mind-wrapper {
    position: relative;
    background: #eef2f5;
    border-radius: 4px;
    overflow: hidden;
}
.mind-node {
    position: absolute;
    box-sizing: border-box;
    width: 280px;
    // height: 48px;
    // line-height: 48px;
    font-size: 16px;
    text-align: center;

    background: rgba(249, 249, 249, 1);
    border: 1px solid rgba(226, 226, 226, 1);
    // border-radius: 23px;
    border-radius: 100px;
    outline: none;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: none;

    &.dragable-node {
        z-index: 1;
        cursor: move;
        opacity: 0.7;
        &:hover {
            cursor: move;
        }
    }

    &.selected {
        border: 1px solid #1890ff;
        box-shadow: 0px 0px 5px rgba(24, 144, 255, 0.5);
    }
    &.is-error {
        .icon {
            border: 1px solid #ff4d4f;
            box-shadow: 0px 0px 5px #ff4d4f;
        }
    }
}

.path-text {
    position: absolute;
    left: 10px;
    top: 10px;
    color: #fff;
    font-size: 13px;
    height: 24px;
    line-height: 24px;
    background: #8f8f8f;
    border-radius: 4px;
    padding: 0 8px;
    max-width: 80px;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    transform: translate(-50%; -50%);
}

.path-text-input {
    position: absolute;
    left: 10px;
    top: 10px;
    border: 1px solid #40a9ff;
    outline: none;
    padding: 4px 11px;
    border-radius: 4px;
    width: 80px;
    transform: translate(-50%; -50%);
}
</style>
