import { isEmpty, showErrorTip } from '@/utils/helpers';
<template>
    <div class="auto-word">
        <div class="word-row" v-for="info in keyInfos" :key="info.uuid">
            <a-tooltip placement="top" title="删除">
                <a-icon
                    type="minus-circle"
                    theme="filled"
                    v-show="editable"
                    @click="deleteInfo(info)"
                />
            </a-tooltip>
            <div class="word-item" :class="{ error: info.error }">
                <div class="word-content">
                    <a-input
                        v-model="info.standardWord"
                        disabled
                        :title="info.standardWord"
                    />
                    <a-select v-model="info.type" @change="onChange">
                        <a-select-option
                            v-for="obj in busiKeyWord"
                            :key="obj.typeId"
                            :value="obj.typeId"
                        >
                            {{ obj.typeName }}
                        </a-select-option>
                    </a-select>
                </div>
                <div class="extension-wrapper">
                    <div class="extension-word-pannel">
                        <span
                            v-for="(word, index) in info.extensionWord"
                            :key="`${word}_${index}`"
                        >
                            <div class="ellipsis" :title="word">{{ word }}</div>
                            <a-icon
                                theme="filled"
                                type="close-circle"
                                @click="deleteExtendWord(info, index)"
                            />
                        </span>
                    </div>
                    <div class="btn-pannel" v-show="editable">
                        <a-tooltip placement="top" title="添加拓展词">
                            <a-icon
                                class="icon-btn"
                                type="plus-circle"
                                @click="showAddInput(info)"
                            />
                        </a-tooltip>
                        <!-- <a-tooltip placement="bottom" title="重新识别">
                            <a-icon class="icon-btn" type="sync" @click="reAnalysis(info)"/>
                        </a-tooltip> -->
                    </div>
                </div>
                <a-input-search
                    class="add-input"
                    v-show="info.showAddInput"
                    placeholder="输入回复，输入完后点击enter或者添加按钮完成添加"
                    v-model.trim="info.wordToAdd"
                    maxlength="200"
                    @search="addExtendWord(info)"
                    @input="onInput($event)"
                >
                    <a-button
                        type="primary"
                        slot="enterButton"
                        @click="addExtendWord(info)"
                    >
                        添加
                    </a-button>
                </a-input-search>
            </div>
        </div>
    </div>
</template>

<script>
import { analysisWord, checkExtWord } from "@/utils/api";
import { isEmpty, showErrorTip } from "@/utils/helpers";

export default {
    props: {
        busiKeyWord: {
            type: Array,
            required: true,
        },
        value: {
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
    },
    data() {
        return {
            keyInfos: JSON.parse(JSON.stringify(this.value)),
        };
    },
    methods: {
        // 解决输入框有时输入不了的问题
        onInput() {
            this.$forceUpdate();
        },
        onChange(val) {
            this.$emit("input", this.keyInfos);
        },
        deleteExtendWord(info, index) {
            info.extensionWord.splice(index, 1);
            this.$emit("input", this.keyInfos);
        },
        addExtendWord(info) {
            if (isEmpty(info.wordToAdd)) {
                return;
            }

            if (info.extensionWord.indexOf(info.wordToAdd) !== -1) {
                this.$message.warning("该资源已存在");
                return;
            }

            if (info.extensionWord.length >= 8) {
                this.$message.warning("若需管理更多资源，请去资源管理页面");
                return false;
            }

            const params = {
                processId: this.processId,
                nodeId: this.nodeId,
                standardWord: JSON.stringify(info),
                extWord: info.wordToAdd,
            };
            checkExtWord(params)
                .then((res) => {
                    info.extensionWord.unshift(info.wordToAdd);
                    info.wordToAdd = "";
                    this.$emit("input", this.keyInfos);
                })
                .catch((err) => {
                    showErrorTip(err);
                });
        },
        reAnalysis(info) {
            const extensionWord = info.extensionWord;

            if (isEmpty(extensionWord)) {
                this.doAnalysisWord(info);
                return;
            }

            const _this = this;
            this.$confirm({
                title: "提示",
                content: (
                    <span>
                        重新挖掘，将会刷新该词的现有扩展词，是否确认刷新？
                    </span>
                ),
                onOk() {
                    _this.doAnalysisWord(info);
                },
            });
        },
        doAnalysisWord(info) {
            analysisWord(info.standardWord)
                .then((res) => {
                    const extensionWord = res.extensionWord || [];
                    if (isEmpty(extensionWord)) {
                        this.$message.warning(
                            "暂未识别出可用结果，请手动添加吧"
                        );
                        return;
                    }
                    info.extensionWord = extensionWord;
                    this.$emit("input", this.keyInfos);
                })
                .catch((err) => {
                    showErrorTip(err);
                });
        },
        deleteInfo(info) {
            const index = this.keyInfos.findIndex((obj) => {
                return obj.uuid === info.uuid;
            });
            if (index !== -1) {
                this.keyInfos.splice(index, 1);
                this.$nextTick(() => {
                    this.$emit("input", this.keyInfos);
                });
            }
        },
        showAddInput(info) {
            const index = this.keyInfos.findIndex((obj) => {
                return obj.uuid === info.uuid;
            });
            if (index !== -1) {
                const json = this.keyInfos[index];
                json.showAddInput = !json.showAddInput;
                if (!json.showAddInput) {
                    json.wordToAdd = "";
                }
                this.$set(this.keyInfos, index, json);
            }
        },
    },
    watch: {
        value(val) {
            this.keyInfos = JSON.parse(JSON.stringify(val));
        },
    },
};
</script>

<style lang="less" scoped>
.auto-word {
    .anticon-minus-circle {
        color: rgba(0, 0, 0, 0.4);
    }
}
.word-item {
    border: 1px solid #ababab;
    border-radius: 4px;
    padding: 10px;
    &.error {
        border: 1px solid #ff4d4f;
    }

    .word-content {
        display: flex;
        input {
            flex: 1;
        }
        .ant-select {
            flex: 1;
            margin-left: 10px;
        }
    }
    .add-input {
        margin-top: 10px;
    }
}

.word-row {
    display: flex;
    align-items: center;
    &:nth-child(n + 2) {
        margin-top: 20px;
    }
    .word-item {
        flex: 1;
    }
    .anticon-minus-circle {
        cursor: pointer;
        font-size: 18px;
        margin-right: 10px;
    }
}

.extension-word-pannel {
    border: 1px solid #dbdbdb;
    border-radius: 3px;
    padding: 10px;
    min-height: 54px;
    max-height: 103px;
    overflow: auto;
    span {
        display: inline-block;
        width: 23%;
        max-width: 104px;
        background: #d8d8d8;
        border-radius: 2px;
        margin: 0 2% 0 0;
        padding: 0 5px;
        height: 32px;
        line-height: 32px;
        position: relative;

        .ellipsis {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        &:nth-child(n + 5) {
            margin-top: 6px;
        }

        &:hover {
            .anticon-close-circle {
                display: inline-block;
            }
        }

        .anticon-close-circle {
            position: absolute;
            right: -5px;
            top: -5px;
            font-size: 14px;
            cursor: pointer;
            display: none;
        }
    }
}
.extension-wrapper {
    margin-top: 10px;
    display: flex;
    .extension-word-pannel {
        flex: 1;
    }
    .btn-pannel {
        width: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        .icon-btn {
            cursor: pointer;
        }
    }
}
</style>
