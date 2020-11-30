<template>
  <div class="bread">
      <slot></slot>
  </div>
</template>

<script>
export default {
    name: 'Bread'
}
</script>

<style scoped lang="less">
  .bread {
    display: flex;
    align-items: center;
    height: 12px;
    padding-left: 6px;
    border-left: 6px solid #1890ff;
  }
</style>