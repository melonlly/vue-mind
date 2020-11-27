export const DEFAULT_PAGESIZE = 10;
export const DEFAULT_PAGENUM = 1;

// 机器人话术节点
const SYS_NODE = 1;

// 学员话术节点
const STU_NODE = 2;

// 旁白话术节点
const TEXT_NODE = 3;

// axios请求的base url
export const BASE_URL = '/aitrs-manage'

export const CHOOSE_YES = 1;
export const CHOOSE_NO = 0

export const NODE_TYPE = {
    // 系通话术
    SYSTEM: SYS_NODE,
    // 学员话术
    STUDENT: STU_NODE,
    // 旁白话术
    TEXT: TEXT_NODE
}

export const NODE_TYPES_LIST = [
    {
        label: '机器人话术',
        value: SYS_NODE
    },
    {
        label: '学员话术',
        value: STU_NODE
    },
    {
        label: '旁白话术',
        value: TEXT_NODE
    }
]

export const FLOW_STATUS = {
    // 已上线
    ONLINE: 2,
    // 下线失败
    OFFLINE_FAIL: 7
}

export const IS_OR_NOT = [
    {
        label: '是',
        value: CHOOSE_YES
    },
    {
        label: '否',
        value: CHOOSE_NO
    }
]

export const APPLY_OPTIONS = [
    {
        label: '同时作为练习和考核',
        value: 3
    },
    {
        label: '仅作考核',
        value: 2
    },
    {
        label: '仅作练习',
        value: 1
    }
]

// 
export const TIMES_OPTIONS = [
    {
        label: "无限制",
        value: 1
    },
    {
        label: "有限制",
        value: 2
    }
]


const TYPE_MAIL = 1;
const TYPE_APP = 2;

export const PUSH_WAY = {
    MAIL: TYPE_MAIL,
    APP: TYPE_APP,
}

export const PUSH_OPTIONS = [
    {
        label: '邮件',
        value: TYPE_MAIL
    },
    {
        label: 'APP',
        value: TYPE_APP
    }
]

export const DEFAULT_PARAMS = {
    name: '',
    status: '',
    processType: '',
    typeId: '',
    labelId: '',
    channel: '',
    groupId: '',
    beginTime: '',
    endTime: ''
}

export const DEFAULT_ANALYSIS_PARAMS = {
    // 话术英语
    type: '2',
    // 话术名称
    processName: '',
    // 业务分类
    typeId: '',
    // 标签
    labelId: '',
    beginTime: '',
    endTime: '',
    pageNum: DEFAULT_PAGENUM,
    pageSize: DEFAULT_PAGESIZE,
    sortField: '',
    sortRule: ''
}

export const DEFAULT_DETAIL_PARAMS = {
    groupId: [],
    userName: '',
    isVPR: '',
    isPass: '',
    accountName: '',
    pageNum: DEFAULT_PAGENUM,
    pageSize: DEFAULT_PAGESIZE,
}

export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

export const TIP_NODECONTENT_A = '请输入不超过1000字的中英文字符、数字、空格及部分标点（含，。、！？；：“”-~%/（）《》.[]【】×+*）'

export const TIP_NODECONTENT_B = '若您需要添加关键信息，选中您想要的字段后，点击添加即可'

export const REG_NODECONTENT = new RegExp(/[^a-zA-Z0-9\u4E00-\u9FA5\，\,\。\、\!\！\？\?\；\;\：\:\“\”\"\-\~\%\/\（\）\(\)\《\》\.\[\]\【\】\×\+\*\s]/g)