<template>
    <a-modal
        title="请选择您要建立的首个节点属性"
        v-model="visiable"
        :maskClosable="false"
        @ok="onOk"
        @cancel="onCancel"
    >
        <div class="modal-content">
            <span class="label">节点属性：</span>
            <a-radio-group :options="typeList" v-model="nodeType" />
        </div>
    </a-modal>
</template>

<script>
import { NODE_TYPES_LIST, NODE_TYPE } from "@/utils/const";

export default {
    data() {
        return {
            typeList: this.getTypeList(),
            visiable: false,
            nodeType: NODE_TYPE.SYSTEM,
        };
    },
    methods: {
        getTypeList() {
            const array = NODE_TYPES_LIST.map((obj) => {
                if (obj.value === NODE_TYPE.TEXT) {
                    obj.disabled = true;
                } else if (obj.value === NODE_TYPE.STUDENT) {
                    obj.disabled = true;
                } else {
                    obj.disabled = false;
                }
                return obj;
            });
            return array;
        },
        show(flag) {
            if (flag) {
                this.nodeType = NODE_TYPE.SYSTEM;
            }
            this.visiable = true;
        },
        hide() {
            this.visiable = false;
        },
        onOk() {
            this.hide();
            this.$emit("ok", this.nodeType);
        },
        onCancel() {
            this.hide();
            this.$emit("cancel");
        },
    },
};
</script>

<style lang="less" scoped>
.modal-content {
    padding: 10px 0;
    .ant-radio-group {
        margin-left: 10px;
    }
}
</style>
