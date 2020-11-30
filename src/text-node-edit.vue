<template>
    <div>
        <div class="row-item">
            <span class="row-label">旁白话术：</span>
            <div class="row-content">
                <a-textarea
                    v-model="content"
                    autocomplete="off"
                    maxlength="1000"
                    :rows="4"
                    @change="changeHandle($event)"
                />
                <div class="suffix">
                    <div></div>
                    <div>
                        <a-tooltip placement="topRight">
                            <template slot="title">
                                <span>{{ TIP_NODECONTENT_A }}</span>
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
import { isEmpty } from "@/utils/helpers";
import { NODE_TYPE } from "@/utils/const";
import {
    IS_OR_NOT,
    CHOOSE_YES,
    CHOOSE_NO,
    TIP_NODECONTENT_A,
    TIP_NODECONTENT_B,
    REG_NODECONTENT,
} from "@/utils/const";

export default {
    components: { SettingTip },
    props: {
        detailInfo: {
            type: Object,
            required: true,
        },
        editable: {
            type: Boolean,
            default: false,
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
            isInterrupt: null,
            isEnd: false,
            settingTipTitle: "",
        };
    },
    computed: {
        hasChild() {
            return !isEmpty(this.nodeInfo.children);
        },
    },
    mounted() {
        this.nodeName = this.detailInfo.nodeName || "";
        this.content = this.detailInfo.content || "";

        let flag = isEmpty(this.detailInfo.isInterrupt);
        if (flag) {
            this.isInterrupt = CHOOSE_YES;
        } else {
            this.isInterrupt = this.detailInfo.isInterrupt;
        }

        this.isEnd = this.detailInfo.isEnd === CHOOSE_YES;
    },
    methods: {
        getDisabled() {
            let flag = this.hasChildType(this.nodeInfo, NODE_TYPE.SYSTEM);
            flag = flag || this.hasChildType(this.nodeInfo, NODE_TYPE.TEXT);
            return flag;
        },
        // 判断是否有某个类型的子节点
        hasChildType(node, nodeType) {
            const children = node.children || [];
            const index = children.findIndex((obj) => {
                return obj.type === nodeType;
            });
            return index !== -1;
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
            }
            return {
                nodeName: this.nodeName,
                content: this.content.trim(),
                isInterrupt: this.isInterrupt,
                isEnd: this.isEnd ? CHOOSE_YES : CHOOSE_NO,
            };
        },
        changeHandle(e) {
            const { value } = e.target;
            this.content = value.replace(REG_NODECONTENT, "");
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
                margin-left: 20px;
            }
        }
    }
    /deep/ .ant-input-suffix {
        color: @suffix-color;
    }
}
</style>
