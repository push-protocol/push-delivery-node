import config from '../config'
import { axiosUtil } from './axiosUtil'

const urlV1 = `${config.PUSH_NODE_WEBSOCKET_URL}/apis/v1/`
const urlV2 = `${config.PUSH_NODE_WEBSOCKET_URL}/apis/v2/`
export const getThreadHashUrl = async (user: string, chatId: string) => {
    return await axiosUtil({
        url: urlV1,
        requestType: 'get',
        path: `chat/users/${user}/conversations/${chatId}/hash`,
    })
}

export const messageUrl = async (threadHash: string) => {
    return await axiosUtil({
        url: urlV1,
        requestType: 'get',
        path: `chat/conversationhash/${threadHash}?fetchLimit=1`,
    })
}

export const getChatUserInfo = async (chatId: string, user: string) => {
    return await axiosUtil({
        url: urlV1,
        requestType: 'get',
        path: `chat/${chatId}/address/${user}`,
    })
}

export const getGroupInfo = async (chatId: string) => {
    return await axiosUtil({
        url: urlV2,
        requestType: 'get',
        path: `chat/groups/${chatId}`,
    })
}

export const getUserInfo = async (user: string) =>{
    return await axiosUtil({
        url: urlV2,
        requestType: 'get',
        path: `users/?caip10=${user}`,
    })
}