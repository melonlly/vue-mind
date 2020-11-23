<script>
export default {
    props: {
        nodeContent: {
            type: HTMLDivElement,
            default: null,
        },
    },
    render(h) {
        if (!this.nodeContent) {
            return null;
        } else {
            const list = this.nodeContent.attributes;
            const json = {};
            for (let i = 0, j = list.length; i < j; i++) {
                const attribute = list[i];
                json[attribute.name] = attribute.value;
            }
            const child = this.nodeContent.innerHTML;
            return h("div", {
                class: "mind-node dragable-node",
                domProps: {
                    innerHTML: child,
                },
            });
        }
    },
};
</script>
