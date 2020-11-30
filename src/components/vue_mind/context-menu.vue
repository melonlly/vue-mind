<template>
    <div
        class="context-menu"
        v-if="contextMenuData.axis.left"
        :style="contextMenuData.axis"
    >
        <div class="menus">
            <div v-for="(obj, i) in contextMenuData.menuList" :key="`menu-list-${i}`">
                <div class="line" v-if="i !== 0"></div>
                <div v-for="(item, j) in obj" :key="`menu-item-${j}`">
                    <a
                        class="flex"
                        :class="{ disabled: item.disabled }"
                        @click.stop="clickHandle(item)"
                    >
                        {{ item.btnName }}
                        <span v-if="item.shortcut">{{ item.shortcut }}</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        contextMenuData: {
            type: Object,
            required: true,
        },
    },
    mounted() {
        document.addEventListener("click", this.hideMenu);
    },
    methods: {
        hideMenu() {
            const json = Object.assign({}, this.contextMenuData, {
                axis: {
                    left: null,
                    top: null,
                    bottom: null,
                },
            });
            this.$emit("update:contextMenuData", json);
        },
        clickHandle(obj) {
            if (obj.disabled) return;
            this.hideMenu();
            const type = typeof obj.fnHandle;
            if (type === "function") {
                const event = this.contextMenuData.event;
                var x = event.clientX;
                var y = event.clientY;
                obj.fnHandle(event);
            }
        },
    },
    beforeDestroy() {
        document.removeEventListener("click", this.hideMenu);
    },
};
</script>
<style lang="less" scoped>
.context-menu {
    position: fixed;
    z-index: 10;
    width: 197px;
    font-size: 12px;
}

.ml50 {
    margin-left: 50px;
}

.flex {
    display: flex;
    justify-content: space-between;
}
.menus {
    color: #000;
    background-color: #fff;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
    min-width: 180px;
    text-align: left;
    padding: 8px 0;

    & > div {
        line-height: 2.2;
        a {
            user-select: none;
            color: #314659;
            display: block;
            padding: 0 20px;
            text-decoration: none;
            cursor: pointer;

            &:hover {
                color: #1890ff;
            }

            &.flex {
                display: flex;
                height: auto;
            }

            &.disabled {
                color: #ccc;
                cursor: default;
            }
        }
    }

    .line {
        background-color: transparent !important;
        padding: 0;
        margin: 5px 0;
        border-top: 1px solid #eee;
    }
}
</style>
