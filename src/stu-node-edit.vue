<template>
    <div>
        <div class="row-item">
            <span class="row-label">学员话术：</span>
            <div class="row-content">
                <a-tooltip
                    overlayClassName="tip-add-keyword"
                    :getPopupContainer="(triggerNode) => triggerNode.parentNode"
                    placement="top"
                    :visible="showTip"
                >
                    <template slot="title">
                        <span class="add-keyword" @click="addKeyWord"
                            >添加选词为关键信息</span
                        >
                    </template>
                    <a-textarea
                        class="node-content"
                        v-model="content"
                        autocomplete="off"
                        maxlength="1000"
                        :rows="4"
                        @change="changeHandle($event)"
                        @mousedown="hideTip"
                        @select="onSelect"
                    />
                </a-tooltip>
                <div class="suffix">
                    <div v-if="editable">
                        <a-tooltip placement="top" title="删除">
                            <i
                                class="icon-delete iconfont"
                                @click="delAllKeyInfo"
                            />
                        </a-tooltip>
                    </div>
                    <div v-else></div>
                    <div>
                        <a-tooltip placement="topRight">
                            <template slot="title">
                                <span>{{ TIP_NODECONTENT_A }}</span>
                                <br />
                                <span>{{ TIP_NODECONTENT_B }}</span>
                            </template>
                            <a-icon type="question-circle" class="icon" />
                        </a-tooltip>
                        <span class="text-num">{{
                            `${content ? content.length : 0}/1000`
                        }}</span>
                    </div>
                </div>
            </div>
        </div>

        <setting-tip ref="settingTip" :title="settingTipTitle" @ok="handleOk" />
    </div>
</template>

<script>
import SettingTip from "@/components/modal/setting-tip";
import { isEmpty, uuid, showErrorTip } from "@/utils/helpers";
import {
    IS_OR_NOT,
    CHOOSE_YES,
    CHOOSE_NO,
    TIP_NODECONTENT_A,
    TIP_NODECONTENT_B,
    REG_NODECONTENT,
} from "@/utils/const";
import { debounce } from "lodash";

export default {
    components: { SettingTip },
    props: {
        detailInfo: {
            type: Object,
            required: true,
        },
        busiKeyWord: {
            type: Array,
            required: true,
        },
        editable: {
            type: Boolean,
            default: false,
        },
        processId: {
            required: true,
        },
        nodeId: {
            required: true,
        },
        checkKeyInfo: {
            required: true,
        },
        nodeInfo: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            IS_OR_NOT,
            TIP_NODECONTENT_A,
            TIP_NODECONTENT_B,
            // 话术名称
            nodeName: "",
            // 话术内容
            content: "",
            isEnd: false,
            keyInfos: [],
            showTip: false,
            settingTipTitle: "",
        };
    },
    computed: {
        hasChild() {
            return !isEmpty(this.nodeInfo.children);
        },
    },
    beforeMount() {
        document.addEventListener("click", this.clickHandle);
    },
    mounted() {
        this.nodeName = this.detailInfo.nodeName || "";
        this.content = this.detailInfo.content || "";
        this.isEnd = this.detailInfo.isEnd === CHOOSE_YES;
        let keyInfos = this.detailInfo.keyInfos || [];
        this.keyInfos = keyInfos.map((obj) => {
            obj.uuid = uuid();
            obj.error = !!obj.error;
            if (isEmpty(obj.type)) {
                obj.error = true;
                obj.errorType = "TYPE_EMPTY";
            }

            const flag = this.checkPosition(this.detailInfo.content, obj);
            if (!flag) {
                obj.error = true;
                obj.errorType = "NO_MATCH";
            }
            return obj;
        });
        this.$nextTick(() => {
            this.lastContent = this.content + "";
        });
    },
    beforeDestroy() {
        document.removeEventListener("click", this.clickHandle);
    },
    watch: {
        keyInfos(val) {
            for (let i = 0, j = val.length; i < j; i++) {
                const keyInfo = val[i];
                const type = keyInfo.type;
                if (
                    keyInfo.error &&
                    keyInfo.errorType === "TYPE_EMPTY" &&
                    !isEmpty(type)
                ) {
                    keyInfo.error = false;
                    keyInfo.errorType = "";
                    this.$set(this.keyInfos, i, keyInfo);
                }
            }
        },
    },
    methods: {
        checkPosition(content, obj) {
            if (isEmpty(content)) {
                return false;
            }

            if (obj.standardWord !== content.substring(obj.begin, obj.end)) {
                return false;
            }
            return true;
        },
        clickHandle(e) {
            if (typeof e.target.className === "string") {
                if (e.target.className.indexOf("node-content") === -1) {
                    this.hideTip();
                }
            } else {
                this.hideTip();
            }
        },
        isContain(keyInfo, keyWord) {
            if (keyInfo.begin >= keyWord.end || keyInfo.end <= keyWord.begin) {
                return false;
            }
            return true;
        },
        canAddKeyWord(keyWord) {
            for (let i = 0, j = this.keyInfos.length; i < j; i++) {
                const keyInfo = this.keyInfos[i];
                if (keyInfo.error) {
                    continue;
                }

                const flag = this.isContain(keyInfo, keyWord);
                if (flag) {
                    return false;
                }
            }

            return true;
        },
        onChange(e) {
            this.isEnd = e.target.checked;
        },
        handleOk() {
            this.$emit("ignore");
        },
        getParams(flag) {
            if (!flag) {
                // 话术内容
                if (isEmpty(this.content)) {
                    this.settingTipTitle = "未配置话术内容";
                    this.$refs.settingTip.show();
                    return;
                }
                if (this.checkKeyInfo && isEmpty(this.keyInfos)) {
                    this.settingTipTitle = "未配置关键信息";
                    this.$refs.settingTip.show();
                    return;
                }

                for (let i = 0, j = this.keyInfos.length; i < j; i++) {
                    const keyInfo = this.keyInfos[i];
                    if (keyInfo.error) {
                        if (keyInfo.errorType === "NO_MATCH") {
                            this.settingTipTitle = "关键信息与话术不符";
                        } else if (keyInfo.errorType === "TYPE_EMPTY") {
                            this.settingTipTitle = "关键词分类未配置";
                        } else {
                            this.settingTipTitle = "关键词配置错误";
                        }
                        this.$refs.settingTip.show();
                        return;
                    }
                }
            }

            const keyInfos = this.keyInfos.map((obj) => {
                const json = Object.assign({}, obj);
                delete json.uuid;
                delete json.wordToAdd;
                delete json.showAddInput;
                return json;
            });

            return {
                nodeName: this.nodeName,
                content: this.content.trim(),
                isEnd: this.isEnd ? CHOOSE_YES : CHOOSE_NO,
                keyInfos: JSON.stringify(keyInfos),
            };
        },
        delAllKeyInfo() {
            if (isEmpty(this.keyInfos)) {
                return;
            }

            const _this = this;
            this.$confirm({
                title: "提示",
                content: <span>是否确认删除全部关键信息？</span>,
                onOk() {
                    _this.keyInfos = [];
                },
            });
        },
        changeHandle: debounce(function(e) {
            const target = e.target;
            // 选中的删除
            const begin = target.selectionStart;
            const end = target.selectionEnd;
            if (begin === end && this.showTip) {
                this.showTip = false;
            }

            const value = target.value;
            const selection = document.getSelection();
            this.content = value.replace(REG_NODECONTENT, "");

            // 更新关键词位置信息
            this.$nextTick(() => {
                const inputType = e.inputType || "input";
                if (!inputType) {
                    return;
                }
                const opLength = value.length - this.lastContent.length;
                const oldCursorPos = begin - opLength;

                const isInsert = inputType.indexOf("insert") !== -1;
                const isDelete = inputType.indexOf("delete") !== -1;
                for (let i = 0, j = this.keyInfos.length; i < j; i++) {
                    const keyInfo = this.keyInfos[i];

                    let flag;
                    if (isInsert) {
                        flag = this.isContain(keyInfo, {
                            begin: oldCursorPos,
                            end: oldCursorPos,
                        });
                    } else if (isDelete) {
                        flag = this.isContain(keyInfo, {
                            begin: oldCursorPos + opLength,
                            end: oldCursorPos,
                        });
                    }
                    if (flag) {
                        keyInfo.error = true;
                        keyInfo.errorType = "NO_MATCH";
                        // 特殊处理
                        if (isDelete) {
                            const _temp = value.substring(
                                keyInfo.begin,
                                keyInfo.end
                            );
                            if (_temp === keyInfo.standardWord) {
                                keyInfo.error = false;
                            }
                        }
                        this.$set(this.keyInfos, i, keyInfo);
                    } else {
                        if (keyInfo.begin >= oldCursorPos) {
                            const textLength =
                                value.replace(REG_NODECONTENT, "").length -
                                this.lastContent.length;
                            keyInfo.begin = keyInfo.begin + textLength;
                            keyInfo.end = keyInfo.end + textLength;
                            this.$set(this.keyInfos, i, keyInfo);
                        } else {
                            const _temp = value.substring(
                                keyInfo.begin,
                                keyInfo.end
                            );
                            if (_temp !== keyInfo.standardWord) {
                                keyInfo.error = true;
                                keyInfo.errorType = "NO_MATCH";
                                this.$set(this.keyInfos, i, keyInfo);
                            } else {
                                keyInfo.error = false;
                            }
                        }
                    }
                }
                this.lastContent = value.replace(REG_NODECONTENT, "") + "";

                //
                this.keyInfos = this.keyInfos.map((obj) => {
                    if (isEmpty(obj.type) && !obj.error) {
                        obj.error = true;
                        obj.errorType = "TYPE_EMPTY";
                    }
                    return obj;
                });
            });
        }, 200),
        onSelect(e) {
            const target = e.target;
            const begin = target.selectionStart;
            const end = target.selectionEnd;

            // 选中文本
            const text = target.value.substring(begin, end);
            if (text.length > 200) {
                this.$message.warning("仅支持200字以内的关键信息");
                return;
            }

            if (!isEmpty(text)) {
                this.keyWord = { text, begin, end };
                this.showTip = true;
            }
        },
        addKeyWord() {
            this.showTip = false;

            if (!this.keyWord) {
                return;
            }

            const MAX = 20;
            const length = this.keyInfos.length;
            if (length >= MAX) {
                this.$message.warning(`关键信息最多添加${MAX}个`);
                return;
            }

            const text = this.keyWord.text;
            if (isEmpty(text)) {
                return;
            }

            const pattern = new RegExp(/^[\u4e00-\u9fa5a-zA-Z0-9\%\-\.]+$/);
            if (!pattern.test(text)) {
                this.$message.warning("选中的关键信息包含不支持的字符");
                this.showTip = false;
                return;
            }

            if (!this.canAddKeyWord(this.keyWord)) {
                this.$message.warning(
                    `关键信息的选择，不可有“重复、交叉、包含”关系！`
                );
                return;
            }

            // 添加关键信息
            const begin = this.keyWord.begin;
            const end = this.keyWord.end;

            let type = "";
            try {
                type = this.busiKeyWord[0].typeId;
            } catch (error) {}

            const json = {
                uuid: uuid(),
                standardWord: text,
                begin,
                end,
                type: type,
                extensionWord: [],
                score: 0,
            };
            this.keyInfos.push(json);
        },
        hideTip() {
            this.showTip = false;
        },
    },
};
</script>
<style lang="less" scoped>
@suffix-color: #ababab;

.row-item {
    display: flex;
    &:nth-child(n + 2) {
        margin-top: 20px;
    }

    &.block {
        display: block;
    }
    &.items-center {
        align-items: center;
    }
    .bread {
        margin-bottom: 10px;
    }
    .row-label {
        margin-right: 10px;
    }
    .row-content {
        flex: 1;
        .suffix {
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 5px 0 0 5px;
            .text-num {
                margin-left: 10px;
                color: @suffix-color;
            }
            .icon--shuju-zidongshibie {
                color: #1890ff;
                font-size: 16px;
                cursor: pointer;
            }
            .icon-delete {
                color: #1890ff;
                font-size: 16px;
                cursor: pointer;
                //margin-left: 20px;
            }
        }
    }
    /deep/ .ant-input-suffix {
        color: @suffix-color;
    }
}

.auto-word-wrapper {
    margin-top: 20px;
}
.row-content {
    /deep/ .tip-add-keyword {
        cursor: pointer;
        .ant-tooltip-inner {
            background: #1890ff;
        }
        .ant-tooltip-arrow {
            border-top-color: #1890ff;
        }
    }
}
</style>
