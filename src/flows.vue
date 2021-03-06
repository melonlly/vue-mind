<template>
    <div class="page-flow">
        <div class="chart-container">
            <div class="tool-bar" v-show="editable">
                <a-popover
                    trigger="hover"
                    overlayClassName="help-tip"
                    placement="rightTop"
                    :getPopupContainer="(triggerNode) => triggerNode.parentNode"
                >
                    <template slot="content">
                        <p class="tips-item">操作提示</p>
                        <div class="tips-item">
                            <div>新建话术:</div>
                            <div>Enter</div>
                        </div>
                        <div class="tips-item">
                            <div>删除话术:</div>
                            <div>Del</div>
                        </div>
                        <div class="tips-item">
                            <div>选中话术:</div>
                            <div>单击</div>
                        </div>
                        <div class="tips-item">
                            <div>编辑话术:</div>
                            <div>双击</div>
                        </div>
                        <div class="tips-item">
                            <div>复制话术:</div>
                            <div>Ctrl+C</div>
                        </div>
                        <div class="tips-item">
                            <div>粘贴话术:</div>
                            <div>Ctrl+V</div>
                        </div>
                        <div class="tips-item">
                            <div>标记说明:</div>
                            <div>双击线段</div>
                        </div>
                        <div class="tips-item">
                            <div>框选话术:</div>
                            <div>按住Ctrl拖拽鼠标左键</div>
                        </div>
                        <div class="tips-item">
                            <div>多选话术:</div>
                            <div>按住Ctrl单击鼠标左键</div>
                        </div>
                    </template>
                    <a-icon type="question-circle" class="icon" />
                </a-popover>
                <a-tooltip
                    :title="`撤销${undoType}`"
                    placement="right"
                    v-if="pointerIndex >= 1"
                >
                    <i class="iconfont icon-chexiao icon" @click="undo" />
                </a-tooltip>
                <a-tooltip
                    title="添加首节点"
                    placement="right"
                    v-if="!nodes.length"
                >
                    <a-icon type="plus" class="icon" @click="addFirstNode" />
                </a-tooltip>
            </div>
            <drag-select
                class="chart-pannel custom-scroll"
                @change="dragChange"
            >
                <vue-mind
                    class="mind"
                    ref="vueMind"
                    v-model="nodes"
                    layout="vertical"
                    :editable="editable"
                    :vspace="60"
                    :width="12000"
                    :height="12000"
                    :connections="connections"
                    @addNode="addNodeHandle"
                    @deleteNode="deleteNodeHandle"
                    @clickNode="clickNode"
                    @dblclickNode="dblclick"
                    @copyNode="copyNode"
                    @multiCopy="multiCopy"
                    @pasteNode="pasteNode"
                    @dragNode="dragNode"
                    @undo="undo"
                    @redo="redo"
                    @contextmenu="onContextMenu"
                    @expand="onExpand"
                    @changeLineText="changeLineText"
                >
                </vue-mind>
            </drag-select>
        </div>

        <!-- 菜单 -->
        <context-menu
            ref="contextMenu"
            :contextMenuData.sync="contextMenuData"
        ></context-menu>

        <!--首节点类型选择-->
        <node-type-modal ref="nodeTypeModal" @ok="onOk" @cancel="onCancel" />

        <!--节点编辑-->
        <a-drawer
            wrapClassName="node-edit-drawer"
            :title="drawerTitle"
            :width="600"
            :visible="visible"
            @close="closeHandle"
        >
            <!--系统节点编辑-->
            <sys-node-edit
                ref="nodeDrawer"
                v-if="visible && editNode.type === NODE_TYPE.SYSTEM"
                :editable="editable"
                :detail-info="nodeDetail"
                :node-info="editNode"
                @ignore="ignoreHandle"
            />

            <!--学员节点编辑-->
            <stu-node-edit
                ref="nodeDrawer"
                v-if="visible && editNode.type === NODE_TYPE.STUDENT"
                :process-id="id"
                :node-id="this.editNode ? this.editNode.id : null"
                :editable="editable"
                :check-key-info="checkKeyInfo"
                :detail-info="nodeDetail"
                :busi-key-word="busiKeyWord"
                :node-info="editNode"
                @ignore="ignoreHandle"
            />

            <!--旁白节点编辑-->
            <text-node-edit
                ref="nodeDrawer"
                v-if="visible && editNode.type === NODE_TYPE.TEXT"
                :editable="editable"
                :detail-info="nodeDetail"
                :node-info="editNode"
                @ignore="ignoreHandle"
            />

            <div class="footer">
                <template v-if="!editable">
                    <a-button type="primary" @click="closeDrawer"
                        >关闭</a-button
                    >
                </template>
                <template v-else>
                    <a-button @click="closeDrawer">取消</a-button>
                    <a-button type="primary" @click="saveNodeInfo"
                        >保存</a-button
                    >
                </template>
            </div>
        </a-drawer>
    </div>
</template>

<script>
import SysNodeEdit from "./sys-node-edit";
import StuNodeEdit from "./stu-node-edit";
import TextNodeEdit from "./text-node-edit";
import NodeTypeModal from "@/components/modal/node-type-modal";
import ContextMenu from "@/components/vue_mind/context-menu.vue";
import { uuid, showErrorTip, getObjType, isEmpty } from "@/utils/helpers";
import { FLOW_STATUS, NODE_TYPE, DEFAULT_PARAMS } from "@/utils/const";
import { SystemNode, StudentNode, TextNode } from "@/utils/entity/node";
// 提取变量( 是否为结束节点 1: 是 0: 否)
import { CHOOSE_YES } from "@/utils/const";
import cloneDeep from "lodash/cloneDeep";
const staticWidth = 197;
const staticHeight = 174;
export default {
    components: {
        NodeTypeModal,
        ContextMenu,
        SysNodeEdit,
        StuNodeEdit,
        TextNodeEdit,
    },
    data() {
        return {
            NODE_TYPE,
            // 右击菜单
            contextMenuData: {
                axis: {
                    left: null,
                    top: null,
                    bottom: null,
                },
                menuList: [],
            },
            // 复制剪贴板
            clipBoard: [],
            // 控制右侧抽屉
            visible: false,
            drawerTitle: "",
            editNode: null,
            // 节点详情-编辑
            nodeDetail: null,
            flowName: null,
            flowStatus: null,
            width: 0,
            height: 0,
            nodes: [], // 当前所有节点
            pointerIndex: -1,
            undoList: [],
            connections: [],
            undoType: "",
            // 存放业务关键词
            busiKeyWord: [],
            // 是否需求校验关键信息配置
            checkKeyInfo: true,
        };
    },
    computed: {
        editable() {
            return (
                this.flowStatus !== FLOW_STATUS.ONLINE &&
                this.flowStatus !== FLOW_STATUS.OFFLINE_FAIL
            );
        },
    },
    mounted() {
        const dom = this.$el;
        this.width = document.body.clientWidth - 20;
        this.height = dom.offsetHeight - 20;
        const chartPannel = this.$el.querySelector(".chart-pannel");
        chartPannel.style.height = dom.offsetHeight - 20 + "px";
    },
    methods: {
        // 添加首节点
        addFirstNode() {
            this.$refs.nodeTypeModal.show(true);
        },
        // 拖动改变
        dragChange(obj) {
            console.log(obj);
            this.$refs.vueMind.dragSelect(obj);
        },
        closeHandle(e) {
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            const className = target.className;
            const type = getObjType(className);
            if (
                type === "String" &&
                className.indexOf("ant-drawer-mask") !== -1
            ) {
                this.editable ? this.saveNodeInfo() : this.closeDrawer();
            } else {
                this.closeDrawer();
            }
        },
        canMoveTo(targetId, sourceNode) {
            const targetNode = this.getNodeById(targetId);
            const sourceType = sourceNode.type;
            return true;
        },
        // 判断是否有某个类型的子节点
        hasChildType(node, nodeType, nodeId) {
            const children = node.children || [];
            const childArray = children.filter((obj) => {
                return obj.id !== nodeId;
            });
            const index = childArray.findIndex((obj) => {
                return obj.type === nodeType;
            });
            return index !== -1;
        },
        saveHistoryNodes(json) {
            const MAX = 5;
            const maxIndex = this.undoList.length - 1;
            if (maxIndex === this.pointerIndex) {
                if (this.undoList.length >= MAX + 1) {
                    this.undoList.shift();
                }
                this.undoList.push(json);
                this.pointerIndex = this.undoList.length - 1;
            } else {
                const arrayStr = this.undoList[this.pointerIndex];
                if (arrayStr !== json.content) {
                    this.undoList.splice(this.pointerIndex + 1);
                    if (this.undoList.length >= MAX + 1) {
                        this.undoList.shift();
                    }
                    this.undoList.push(json);
                    this.pointerIndex = this.undoList.length - 1;
                }
            }
        },
        copyNodeInfo(node) {
            const json = {
                id: node.id,
                parentid: node.parentid,
                text: node.text,
                type: node.type,
                detail: node.detail,
            };
            return json;
        },
        getFirstNode(array) {
            const index = array.findIndex((obj) => {
                return !obj.parentid;
            });
            if (index !== -1) {
                return array[index];
            }
        },
        onExpand(node) {
            const index = this.nodes.findIndex((obj) => {
                return obj.id === node.id;
            });
            const json = {
                expand: node.expand === undefined ? true : node.expand,
            };
            const obj = Object.assign({}, this.nodes[index], json);
            if (index !== -1) {
                this.$set(this.nodes, index, obj);
            }
        },
        changeLineText(lineId, json) {
            if (!this.editable) return;
            const index = this.connections.findIndex((obj) => {
                return obj.id === lineId;
            });
            if (index !== -1) {
                const obj = Object.assign({}, this.connections[index], json);
                this.$set(this.connections, index, obj);
            } else {
                this.connections.push({
                    id: lineId,
                    mode: json.mode || "View",
                    text: "",
                });
            }
        },
        eachNode(node, callback) {
            if (!node) {
                return;
            }
            callback && callback(node);
            const children = node.children;
            if (children && children.length) {
                children.forEach((obj) => {
                    this.eachNode(obj, callback);
                });
            }
        },
        hasTextNodeInFlow() {
            return !!this.nodes.filter((obj) => {
                return obj.type === NODE_TYPE.TEXT;
            }).length;
        },
        hasRootNode() {
            const index = this.nodes.findIndex((obj) => {
                return isEmpty(obj.parentid);
            });
            if (index != -1) {
                return true;
            } else {
                return false;
            }
        },
        onOk(nodeType) {
            const flag = this.hasRootNode();
            if (flag) {
                return;
            }
            const id = uuid(32, 16);
            // 创建首节点
            let json;
            if (nodeType === NODE_TYPE.SYSTEM) {
                json = new SystemNode(id);
            } else if (nodeType === NODE_TYPE.STUDENT) {
                json = new StudentNode(id);
            } else if (nodeType === NODE_TYPE.TEXT) {
                json = new TextNode(id);
            }
            this.nodes.push(json);
            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Add",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        // 首节点类型选择modal-取消
        onCancel() {
            console.log(`首节点类型选择modal：取消`);
        },
        getNodeById(nodeId) {
            const index = this.nodes.findIndex((obj) => {
                return obj.id === nodeId;
            });
            if (index === -1) {
                console.error(`getNodeById: ${nodeId} not found.`);
                return null;
            }
            return this.nodes[index];
        },
        // 添加节点
        addNodeHandle(nodeId) {
            // 已经有节点正在添加
            if (this.locked) {
                return;
            }
            const node = this.getNodeById(nodeId);
            const nodeType = node.type;
            // 随机模式下不可添加多分支
            const flag = this.hasChildNode(node);
            if (flag) {
                this.$message.warning("随机模式下不可添加多分支节点");
                return;
            }
            // 如果当前节点为结束节点，禁止新增节点
            if (node.detail.isEnd === CHOOSE_YES) {
                this.$message.warning("结束节点不允许新增节点");
                return false;
            }
            if (nodeType === NODE_TYPE.SYSTEM) {
                const hasTextNode = this.hasChildType(node, NODE_TYPE.TEXT);
                if (hasTextNode) {
                    this.$message.warning("业务节点冲突，请手动添加");
                    return false;
                }
                const id = uuid(32, 16);
                const json = new StudentNode(id);
                json.parentid = nodeId;
                this.nodes.push(json);
            } else if (nodeType === NODE_TYPE.STUDENT) {
                const id = uuid(32, 16);
                const json = new SystemNode(id);
                json.parentid = nodeId;
                this.nodes.push(json);
            } else if (nodeType === NODE_TYPE.TEXT) {
                // 首节点为旁白节点的情形
                const flag = this.hasChildType(node, NODE_TYPE.STUDENT);
                const type = this.getParentTypeForTextNode(node);
                if (type === NODE_TYPE.SYSTEM || flag) {
                    this.$message.warning("业务节点冲突，请手动添加");
                    return false;
                }
                // 可打断
                const isInterrupt = this.getIsInterruptByNode(node);
                if (isInterrupt) {
                    this.$message.warning("请将该节点设置为不可打断后新建");
                    return false;
                }
                const id = uuid(32, 16);
                const json = new SystemNode(id);
                json.parentid = nodeId;
                this.nodes.push(json);
            }
            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Add",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        // 新建节点
        addNodeByType(nodeId, nodeType) {
            const node = this.getNodeById(nodeId);
            if (isEmpty(node)) {
                return;
            }
            const id = uuid(32, 16);
            let json;
            if (nodeType === NODE_TYPE.SYSTEM) {
                json = new SystemNode(id);
            } else if (nodeType === NODE_TYPE.STUDENT) {
                json = new StudentNode(id);
            } else if (nodeType === NODE_TYPE.TEXT) {
                json = new TextNode(id);
            }
            json.parentid = nodeId;
            this.nodes.push(json);

            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Add",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        // 删除节点
        deleteNodeHandle(nodeId) {
            this.$refs.contextMenu.hideMenu();
            if (this.visible) {
                return;
            }
            let selectNodes = this.$refs.vueMind.selectNodes;
            if (!isEmpty(nodeId)) {
                if (isEmpty(selectNodes)) {
                    selectNodes = [nodeId];
                } else {
                    if (selectNodes.indexOf(nodeId) === -1) {
                        selectNodes = [nodeId];
                    }
                }
            }
            if (isEmpty(selectNodes)) {
                return;
            }
            selectNodes.forEach((nodeId) => {
                const node = this.getNodeById(nodeId);
                this.eachNode(node, (nodeItem) => {
                    const index = this.nodes.findIndex((obj) => {
                        return obj.id === nodeItem.id;
                    });

                    if (index !== -1) {
                        this.nodes.splice(index, 1);
                    }
                });
            });

            // 自动保存流程
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Delete",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        // 单击节点
        clickNode(e, node) {
            this.$refs.contextMenu.hideMenu();
        },
        // 双击节点
        dblclick(e, node) {
            const param = {
                nodeId: node.id,
            };
            this.nodeDetail = {}; // 节点详情
            this.editNode = node;
            if (node.type === NODE_TYPE.SYSTEM) {
                this.drawerTitle = "机器人话术配置";
            } else if (node.type === NODE_TYPE.STUDENT) {
                this.drawerTitle = "学员话术配置";
            } else if (node.type === NODE_TYPE.TEXT) {
                this.drawerTitle = "旁白话术配置";
            }
            this.visible = true;
        },
        getPathText(pathTextList, parentId, id) {
            const pathId = `${parentId}:${id}`;
            const index = pathTextList.findIndex((obj) => {
                return obj.id === pathId;
            });
            if (index !== -1) {
                return pathTextList[index].text;
            } else {
                return "";
            }
        },
        // 保存流程信息
        saveFlow(type) {},
        closeDrawer() {
            this.editNode = null;
            this.drawerTitle = "";
            this.visible = false;
        },
        getDetail(obj) {
            return {
                nodeName: obj.nodeName,
                nodeType: obj.nodeType,
                content: obj.nodeContent,
                isInterrupt: obj.isInterrupt,
                isEnd: obj.isEnd,
                nodeIsError: obj.nodeIsError,
            };
        },
        ignoreHandle() {
            console.log(`ignoreHandle`);
        },
        // 保存节点信息
        saveNodeInfo(e, flag) {
            console.log(`saveNodeInfo`);
        },
        updateContentById(content, json) {
            let jsonArray = JSON.parse(content);
            const array = jsonArray.map((obj) => {
                if (obj.id === json.id) {
                    obj.detail = json.detail;
                }
                return obj;
            });
            return JSON.stringify(array);
        },
        updateUndoList(json) {
            for (var i = 0, j = this.undoList.length; i < j; i++) {
                const undoItem = this.undoList[i];
                const content = undoItem.content;
                undoItem.content = this.updateContentById(content, json);
            }
        },
        // 更新流程图中的节点信息
        updateNodeInfo(json) {
            const index = this.nodes.findIndex((obj) => {
                return obj.id === json.id;
            });
            if (index !== -1) {
                const obj = Object.assign({}, this.nodes[index], json);
                this.$set(this.nodes, index, obj);
            } else {
                console.error(`updateNodeInfo: node not found[${json.id}]`);
            }
        },
        copyNode(nodeId) {
            if (this.visible) {
                return;
            }
            if (!nodeId) {
                // this.$message.warning('请选择要复制的节点')
                return;
            }
            const node = this.getNodeById(nodeId);
            if (isEmpty(node)) {
                return;
            }
            const idArray = [];
            this.eachNode(node, (nodeItem) => {
                idArray.push(nodeItem.id);
            });
            // TODO 节点复制
            console.log(idArray);
        },
        multiCopy(nodeIdList) {
            if (this.visible) {
                return;
            }

            const nodeList = nodeIdList.map((nodeId) => {
                const node = this.getNodeById(nodeId);
                const json = this.copyNodeInfo(node);
                return json;
            });
            const _tempList = [];
            const _array = nodeList.map((obj) => {
                obj.children = nodeList.filter((item) => {
                    if (item.parentid === obj.id) {
                        _tempList.push(item.id);
                        return true;
                    }
                    return false;
                });
                return obj;
            });

            const array = _array.filter((obj) => {
                const index = _tempList.findIndex((nodeId) => {
                    return nodeId === obj.id;
                });
                return index === -1;
            });

            const idArray = [];
            nodeIdList.forEach((nodeId) => {
                const node = this.getNodeById(nodeId);
                idArray.push(node.id);
            });

            // TODO 节点复制
            console.log(idArray);
        },
        // 粘贴节点
        pasteNode(nodeId) {
            if (this.visible) {
                return;
            }

            const node = this.getNodeById(nodeId);
            if (isEmpty(node)) {
                return;
            }

            const idArray = [];
            this.clipBoard.forEach((node) => {
                this.eachNode(node, (obj) => {
                    idArray.push(obj.id);
                });
            });

            if (isEmpty(idArray)) {
                this.$message.warning("请先复制节点");
                return;
            }

            this.$message.success("粘贴成功");

            // 自动保存
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Paste",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        // 拖拽移动节点
        dragNode(e, sourceId, targetId, type, insertId) {
            if (this.visible || !this.editable) {
                return;
            }
            const index = this.nodes.findIndex((obj) => {
                return obj.id === sourceId;
            });
            const sourceNode = this.nodes[index];

            const flag = this.canMoveTo(targetId, sourceNode);
            if (!flag) {
                return;
            }

            sourceNode.parentid = targetId;
            if (type === "Original") {
                this.$set(this.nodes, index, sourceNode);
            } else {
                this.nodes.splice(index, 1);
                let _index = this.nodes.findIndex((obj) => {
                    return obj.id === insertId;
                });
                if (type === "After") {
                    _index = _index + 1;
                }
                this.nodes.splice(_index, 0, sourceNode);
            }

            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveHistoryNodes({
                    type: "Drag",
                    content: JSON.stringify(this.nodes),
                });
                this.saveFlow("Auto");
            });
        },
        checkInterrupt(array) {
            for (let i = 0, j = array.length; i < j; i++) {
                const node = array[i];
                const isInterrupt = this.getIsInterruptByNode(node);
                if (isInterrupt) {
                    const children = this.getChildrenFromArray(node.id, array);
                    node.children = children;
                    const hasTextNode = this.hasChildType(node, NODE_TYPE.TEXT);
                    const hasSysNode = this.hasChildType(
                        node,
                        NODE_TYPE.SYSTEM
                    );
                    if (hasTextNode || hasSysNode) {
                        return false;
                    }
                }
            }
            return true;
        },
        checkEnd(array) {
            for (let i = 0, j = array.length; i < j; i++) {
                const node = array[i];
                const isEnd = this.getIsEnd(node);
                if (isEnd) {
                    const children = this.getChildrenFromArray(node.id, array);
                    node.children = children;
                    if (this.hasChildNode(node)) {
                        return false;
                    }
                }
            }
            return true;
        },
        // 撤销
        undo() {
            if (this.visible) {
                return;
            }
            if (this.pointerIndex < 1) {
                return;
            }
            this.pointerIndex = this.pointerIndex - 1;
            const array = JSON.parse(this.undoList[this.pointerIndex].content);

            // 保持节点的展开收起状态
            for (let i = 0, j = array.length; i < j; i++) {
                const nodeItem = array[i];
                const node = this.getNodeById(nodeItem.id);
                if (!isEmpty(node)) {
                    nodeItem.expand = node.expand;
                }
            }

            this.nodes = array;

            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveFlow("Auto");
            });
        },
        // 恢复
        redo() {
            if (this.visible) {
                return;
            }

            if (this.pointerIndex + 2 > this.undoList.length) {
                return;
            }
            this.pointerIndex = this.pointerIndex + 1;
            // 此处要用数组拷贝，不然会有问题
            const array = JSON.parse(this.undoList[this.pointerIndex].content);
            this.nodes = array;

            // 自动保存流程信息
            this.$nextTick(() => {
                this.saveFlow("Auto");
            });
        },
        getParentTypeForTextNode(node) {
            const parentId = node.parentid;
            if (parentId) {
                const parentNode = this.getNodeById(parentId);
                if (
                    parentNode.type === NODE_TYPE.SYSTEM ||
                    parentNode.type === NODE_TYPE.STUDENT
                ) {
                    return parentNode.type;
                } else {
                    return this.getParentTypeForTextNode(parentNode);
                }
            } else {
                return null;
            }
        },
        getIsInterruptByNode(node) {
            let isInterrupt = 0;
            try {
                isInterrupt = node.detail.isInterrupt;
            } catch (error) {}
            return isInterrupt === 1 ? true : false;
        },
        hasChildNode(node) {
            return node && node.children && !!node.children.length;
        },
        getChildrenFromArray(id, array) {
            return array.filter((obj) => {
                return obj.parentid === id;
            });
        },
        getIsEnd(node) {
            const detail = node.detail;
            if (isEmpty(detail)) {
                return false;
            }

            const isEnd = detail.isEnd;
            if (isEnd === CHOOSE_YES) {
                return true;
            }

            return false;
        },
        onContextMenu(e, node) {
            e.preventDefault();
            e.stopPropagation();
            if (!node || !this.editable) return;

            var x = e.clientX;
            var y = e.clientY;
            
            let array = [
                {
                    btnName: "新建机器人话术",
                    disabled: false,
                    fnHandle: this.addNodeByType.bind(
                        this,
                        node.id,
                        NODE_TYPE.SYSTEM
                    ),
                },
                {
                    btnName: "新建学员话术",
                    disabled: false,
                    fnHandle: this.addNodeByType.bind(
                        this,
                        node.id,
                        NODE_TYPE.STUDENT
                    ),
                },
                {
                    btnName: "新建旁白话术",
                    disabled: false,
                    fnHandle: this.addNodeByType.bind(
                        this,
                        node.id,
                        NODE_TYPE.TEXT
                    ),
                },
                {
                    btnName: "复制",
                    fnHandle: this.copyNode.bind(this, node.id),
                    shortcut: "Ctrl + C",
                },
                {
                    btnName: "粘贴",
                    disabled: !this.clipBoard.length,
                    fnHandle: this.pasteNode.bind(this, node.id),
                    shortcut: "Ctrl + V",
                },
                {
                    btnName: "删除",
                    fnHandle: this.deleteNodeHandle.bind(this, node.id),
                    shortcut: "Del",
                },
            ];
            const eleHeight =
                this.$refs.contextMenu.$el.clientHeight || staticWidth;
            const eleWidth =
                this.$refs.contextMenu.$el.clientWidth || staticHeight;
            const bodyHeight = document.body.clientHeight;
            const bodyWidth = document.body.clientWidth;
            if (eleWidth + x >= bodyWidth) {
                x = x - eleWidth;
            }
            if (eleHeight + y >= bodyHeight) {
                y = y - eleHeight;
            }
            Object.assign(this.contextMenuData, {
                event: e,
                axis: {
                    left: `${x}px`,
                    top: `${y}px`,
                },
                menuList: [array],
            });
        },
        setUndoType() {
            const item = this.undoList[this.pointerIndex];
            const type = item.type;
            switch (type) {
                case "New":
                    this.undoType = "";
                    break;
                case "Add":
                    this.undoType = "新建操作";
                    break;
                case "Delete":
                    this.undoType = "删除操作";
                    break;
                case "Paste":
                    this.undoType = "粘贴操作";
                    break;
                case "Drag":
                    this.undoType = "拖拽操作";
                    break;
                default:
                    break;
            }
        },
    },
    watch: {
        pointerIndex() {
            this.$nextTick(() => {
                this.setUndoType();
            });
        },
        undoList() {
            this.$nextTick(() => {
                this.setUndoType();
            });
        },
    },
};
</script>
<!--TODO 样式提取-->
<style lang="less">
/* 设置默认的滚动条样式 */
@scroll-width: 8px;
.custom-scroll {
    &::-webkit-scrollbar {
        width: @scroll-width;
        height: @scroll-width;
        border: 1px solid #ccc;
        border-radius: @scroll-width;
    }

    &::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: @scroll-width / 2;
    }
}

.node-edit-drawer {
    .ant-drawer-body {
        padding-bottom: 80px;
    }
    .footer {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 100%;
        border-top: 1px solid #e9e9e9;
        padding: 10px 16px;
        background: #fff;
        text-align: right;
        z-index: 1;
        button:nth-child(n + 2) {
            margin-left: 10px;
        }
    }
}

.tool-bar {
    .help-tip.ant-popover {
        .ant-popover-arrow {
            border-left-color: rgba(0, 0, 0, 0.75);
            border-bottom-color: rgba(0, 0, 0, 0.75);
        }
        /deep/ .ant-popover-inner {
            color: #fff;
            background-color: rgba(0, 0, 0, 0.75);
        }
        .ant-popover-inner-content {
            color: #fff;
        }
    }
}

.flow-import-modal {
    .ant-upload.ant-upload-drag {
        p.color-yellow {
            color: #faa130;
        }
        /**此处样式非常重要，影响上传点击区域 */
        .ant-upload {
            display: table;
            width: 100%;
        }
    }
    .tips {
        padding: 8px 0;
        .download {
            margin-left: 10px;
        }
    }

    .ant-upload-btn {
        background: blue;
    }
}
</style>

<style lang="less" scoped>
.chart-pannel {
    position: relative;
    background: #eef2f5;
    overflow: auto;
    height: 100%;
    margin-top: 10px;
    .mind {
        width: 12000px;
        height: 12000px;
    }
}

@tool-bar-width: 50px;
.chart-container {
    padding: 0 10px 10px 10px;
    position: relative;
    .tool-bar {
        position: absolute;
        top: 10px; //62px;
        left: 20px;
        z-index: 100;
        background: #fff;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
        border-radius: @tool-bar-width / 2;
        width: @tool-bar-width;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: (@tool-bar-width / 2 - 10px) 10px;

        .anticon {
            font-size: 20px;
        }
        .icon-huanyingye {
            font-size: 23px;
            display: flex;
            align-items: center;
            height: 23px;
        }
        .icon-icon-- {
            font-size: 25px;
            display: flex;
            align-items: center;
            height: 23px;
            font-weight: bold;
            &::before {
                height: 23px;
                line-height: 23px;
            }
            &.is-random {
                color: #1890ff;
            }
        }
        .icon-chexiao {
            font-size: 23px;
            display: flex;
            align-items: center;
            height: 23px;
            &::before {
                height: 23px;
                line-height: 23px;
            }
        }
        .icon {
            cursor: pointer;
            color: rgba(0, 0, 0, 0.65);
            &:nth-child(n + 2) {
                margin-top: 10px;
            }
        }
        .anticon-plus {
            color: rgba(0, 0, 0, 0.8);
        }
    }
}
.operation-pannel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 0 0;
    .btn-pannel {
        button:nth-child(n + 2) {
            margin-left: 10px;
        }
    }
}

.tips-item {
    width: 208px;
    display: flex;
    div:nth-of-type(n + 2) {
        margin-left: 10px;
    }
}

.page-flow {
    height: 100%;
}
</style>
