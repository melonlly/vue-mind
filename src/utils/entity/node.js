import { NODE_TYPE, NODE_TYPES_LIST } from '@/utils/const'

// 节点信息
class Node {
    constructor(id, type = NODE_TYPE.SYSTEM, text) {
        // 必须参数
        this.id = id;
        this.type = type;
        this.text = text;
        this.detail = {
            nodeIsError: 1
        }
    }
}

export default Node

// 机器人话术节点
export const SystemNode = (id) => {
    const index = NODE_TYPES_LIST.findIndex(obj => {
        return obj.value === NODE_TYPE.SYSTEM
    })
    if (index === -1) {
        console.error('create SystemNode error')
        return new Node(id, NODE_TYPE.SYSTEM, '')
    }
    return new Node(id, NODE_TYPE.SYSTEM, NODE_TYPES_LIST[index].label)
}

// 学员话术节点
export const StudentNode = (id) => {
    const index = NODE_TYPES_LIST.findIndex(obj => {
        return obj.value === NODE_TYPE.STUDENT
    })
    if (index === -1) {
        console.error('create StudentNode error')
        return new Node(id, NODE_TYPE.STUDENT, '')
    }
    return new Node(id, NODE_TYPE.STUDENT, NODE_TYPES_LIST[index].label)
}

// 旁白话术节点
export const TextNode = (id) => {
    const index = NODE_TYPES_LIST.findIndex(obj => {
        return obj.value === NODE_TYPE.TEXT
    })
    if (index === -1) {
        console.error('create TextNode error')
        return new Node(id, NODE_TYPE.TEXT, '')
    }
    return new Node(id, NODE_TYPE.TEXT, NODE_TYPES_LIST[index].label)
}
