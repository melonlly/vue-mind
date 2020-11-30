<template>
    <a-modal
      title="Title"
      wrapClassName="setting-tip"
      dialogClass="setting-tip"
      width="416px"
      :maskClosable="false"
      :closable="false"
      :visible="visible"
    >
      
      <div>
          <div class="items-center">
                <a-icon type="question-circle" />
                <span class="confirm-title">{{title}}</span>
          </div>
      </div>
      <div slot="footer" class="footer">
          <a-button type="primary" @click="handleCancel">继续配置</a-button>
          <a-button type="primary" @click="handleOk">我知道了</a-button>
      </div>
    </a-modal>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            visible: false,
            ModalText: ''
        }
    },
    methods: {
        show() {
            this.visible = true
        },
        hide() {
            this.visible = false
        },
        handleOk() {
            this.hide()
            this.$emit('ok')
        },
        handleCancel() {
            this.visible = false
        }
    }
}
</script>
<style lang="less">
.ant-modal-wrap.setting-tip{
    .ant-modal-header {
        display: none
    }
    .anticon-question-circle {
        margin-right: 16px;
        font-size: 22px;
        color: #faad14;
    }
    .confirm-title {
        display: block;
        overflow: hidden;
        color: rgba(0,0,0,.85);
        font-weight: 500;
        font-size: 16px;
        line-height: 1.4;
    }
    .items-center{
        display: flex;
        align-items: center;
    }
    .ant-modal-footer{
        border-top: 0;
        & > div {
            display: flex;
            justify-content: space-between;
            padding: 10px 10px;
            margin-top: 20px;
        }
    }
}
</style>