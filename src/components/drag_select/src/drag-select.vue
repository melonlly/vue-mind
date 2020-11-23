<template>
    <div class="drag-select-wrapper" @mousedown="onMouseDown">
        <slot></slot>
        <div
            v-show="mouseDown"
            class="drag-select-box"
            :style="selectionBoxStyling"
        ></div>
    </div>
</template>
<script>
import "./requestAnimationFrame";
export default {
    name: "DragSelect",
    props: {
        // 自动滚动速度 慢速模式
        slowSpeed: {
            type: Number,
            default: 0,
        },
        // 自动滚动速度 快速模式
        fastSpeed: {
            type: Number,
            default: 20,
        },
    },
    data() {
        return {
            clientRect: null,
            mouseDown: false,
            // 起始点
            startPoint: null,
            // 结束点
            endPoint: null,
            // 最终计算 结束点
            lastEndPoint: null,
            // 滚动触发，速度基数 暂不对开发者暴露，一般无需改动
            triggerDistance: 10,
            // 选框最终数据
            selectionBox: {
                left: 0,
                top: 0,
                width: 0,
                height: 0,
            },
            // 选框最终样式
            selectionBoxStyling: {
                left: "0px",
                top: "0px",
                width: "0px",
                height: "0px",
                borderWidth: "0px",
            },
            scrollX: null,
            // 自动滚动计时器
            autoScrollTimer: null,
            scrollSpeedSlow: Math.min(this.slowSpeed, this.fastSpeed),
            scrollSpeedFast: Math.max(this.slowSpeed, this.fastSpeed),
            scrollSpeedY: Math.min(this.slowSpeed, this.fastSpeed),
            scrollSpeedX: Math.min(this.slowSpeed, this.fastSpeed),
            $dom: null,
        };
    },
    methods: {
        boxAutoScroll() {
            this.autoScrollTimer = window.requestAnimationFrame(this.scrollFn);
        },
        scrollFn() {
            if (!this.mouseDown) {
                return;
            }
            if (this.scrollY === true) {
                if (
                    this.$el.scrollHeight - this.$el.scrollTop <=
                    this.$el.clientHeight
                ) {
                } else {
                    this.$el.scrollTop += this.scrollSpeedY;
                }
            } else if (this.scrollY === false) {
                if (this.$el.scrollTop <= 0) {
                } else {
                    this.$el.scrollTop -= this.scrollSpeedY;
                }
            }

            if (this.scrollX === true) {
                if (
                    this.$el.scrollWidth - this.$el.scrollLeft <=
                    this.$el.clientWidth
                ) {
                } else {
                    this.$el.scrollLeft += this.scrollSpeedX;
                }
            } else if (this.scrollX === false) {
                if (this.$el.scrollLeft <= 0) {
                } else {
                    this.$el.scrollLeft -= this.scrollSpeedX;
                }
            }

            cancelAnimationFrame(this.autoScrollTimer);
            this.computeLastEndPoint();
            this.autoScrollTimer = window.requestAnimationFrame(this.scrollFn);
        },
        computeLastEndPoint() {
            if (!this.mouseDown || !this.startPoint || !this.endPoint) return;
            const clientRect = this.clientRect;
            const x = this.endPoint.x - clientRect.left + this.$el.scrollLeft;
            const y = this.endPoint.y - clientRect.top + this.$el.scrollTop;
            this.lastEndPoint = {
                x: Math.min(x, this.$dom.offsetWidth),
                y: Math.min(y, this.$dom.offsetHeight),
            };
            // 选择框属性计算
            const left = Math.min(this.startPoint.x, this.lastEndPoint.x);
            const top = Math.min(this.startPoint.y, this.lastEndPoint.y);
            const width = Math.abs(this.startPoint.x - this.lastEndPoint.x);
            const height = Math.abs(this.startPoint.y - this.lastEndPoint.y);
            this.selectionBox = {
                left,
                top,
                width,
                height,
            };
            this.selectionBoxStyling = {
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
            };
            if (width > 3 && height > 3) {
                this.$emit("change", this.selectionBox);
            }
        },
        getYScrollSpeed(event, obj) {
            let scrollSpeed = this.scrollSpeed;
            const speedDiff = this.scrollSpeedFast - this.scrollSpeedSlow;

            if (event.pageY <= obj.clientTopDown) {
                if (event.pageY > this.clientRect.top) {
                    const percent =
                        1 -
                        (event.pageY - this.clientRect.top) /
                            this.triggerDistance;
                    scrollSpeed = this.scrollSpeedSlow + percent * speedDiff;
                } else {
                    scrollSpeed = this.scrollSpeedFast;
                }
            }

            if (event.pageY >= obj.clientBottomUp) {
                if (event.pageY < this.clientRect.bottom) {
                    const percent =
                        1 -
                        (this.clientRect.bottom - event.pageY) /
                            this.triggerDistance;
                    scrollSpeed = this.scrollSpeedSlow + percent * speedDiff;
                } else {
                    scrollSpeed = this.scrollSpeedFast;
                }
            }

            return scrollSpeed;
        },
        getXScrollSpeed(event, obj) {
            let scrollSpeed = this.scrollSpeed;
            const speedDiff = this.scrollSpeedFast - this.scrollSpeedSlow;

            if (event.pageX <= obj.clientLeftDown) {
                if (event.pageX > this.clientRect.left) {
                    const percent =
                        1 -
                        (event.pageX - this.clientRect.left) /
                            this.triggerDistance;
                    scrollSpeed = this.scrollSpeedSlow + percent * speedDiff;
                } else {
                    scrollSpeed = this.scrollSpeedFast;
                }
            }

            if (event.pageX >= obj.clientRightUp) {
                if (event.pageX < this.clientRect.right) {
                    const percent =
                        1 -
                        (this.clientRect.right - event.pageX) /
                            this.triggerDistance;
                    scrollSpeed = this.scrollSpeedSlow + percent * speedDiff;
                } else {
                    scrollSpeed = this.scrollSpeedFast;
                }
            }

            return scrollSpeed;
        },
        onMouseDown(event) {
            // 忽略右键点击
            if (event.button === 2) return;
            if (!event.ctrlKey) return;

            this.clientRect = this.$el.getBoundingClientRect();

            const clientRect = this.clientRect;
            // 注册开始点
            this.mouseDown = true;
            this.$dom = document.querySelector(".mind-wrapper");
            this.startPoint = {
                x: event.pageX - clientRect.left + this.$el.scrollLeft,
                y: event.pageY - clientRect.top + this.$el.scrollTop,
            };
            // 开始监听鼠标 移动，抬起 事件
            window.addEventListener("mousemove", this.onMouseMove);
            window.addEventListener("mouseup", this.onMouseUp);
        },
        onMouseMove(event) {
            if (!this.mouseDown) return;
            if (!event.ctrlKey) {
                this.onMouseUp();
                return;
            }

            // 容器参数
            const clientRect = this.clientRect;
            // 滚动启动、速度 常数值
            const triggerDistance = this.triggerDistance;

            // 容器顶部往下 triggerDistance px
            const clientTopDown = clientRect.top + triggerDistance;
            // 容器底部往上 triggerDistance px
            const clientBottomUp = clientRect.bottom - triggerDistance;

            // 容器左侧往右 triggerDistance px
            const clientLeftDown = clientRect.left + triggerDistance;
            // 容器右侧往左 triggerDistance px
            const clientRightUp = clientRect.right - triggerDistance;

            // 滚动方向
            if (event.pageY >= clientBottomUp) {
                this.scrollY = true;
            } else if (event.pageY <= clientTopDown) {
                this.scrollY = false;
            } else {
                this.scrollY = null;
            }

            if (event.pageX >= clientRightUp) {
                this.scrollX = true;
            } else if (event.pageX <= clientLeftDown) {
                this.scrollX = false;
            } else {
                this.scrollX = null;
            }

            if (this.scrollX === null && this.scrollY === null) {
                cancelAnimationFrame(this.autoScrollTimer);
            } else {
                this.boxAutoScroll();
            }

            this.scrollSpeedY = this.getYScrollSpeed(event, {
                clientTopDown,
                clientBottomUp,
                clientLeftDown,
                clientRightUp,
            });

            this.scrollSpeedX = this.getXScrollSpeed(event, {
                clientTopDown,
                clientBottomUp,
                clientLeftDown,
                clientRightUp,
            });

            this.endPoint = {
                x: event.pageX,
                y: event.pageY,
            };

            this.computeLastEndPoint();
        },
        onMouseUp(event) {
            // 清除事件
            window.removeEventListener("mousemove", this.onMouseMove);
            window.removeEventListener("mouseup", this.onMouseUp);
            // 重置状态
            this.mouseDown = false;
            this.startPoint = null;
            this.endPoint = null;
            this.lastEndPoint = null;

            // 可能下一次跟上一次反方向 在方向还没调整对之前，防止抖动一下
            this.scrollSpeedY = 0;
            this.scrollSpeedX = 0;

            // 去除选框样式 隐藏选框
            this.selectionBoxStyling = {
                left: "0px",
                top: "0px",
                width: "0px",
                height: "0px",
                borderWidth: "0px",
            };
        },
    },
};
</script>
<style lang="less" scoped>
.drag-select-wrapper {
    position: relative;
    overflow: hidden;
}
.drag-select-box {
    position: absolute;
    background: rgba(24, 144, 255, 0.4);
    z-index: 10;
    border: 1px dashed #1890ff;
    transform: translate3d(0, 0, 0);
}
</style>
