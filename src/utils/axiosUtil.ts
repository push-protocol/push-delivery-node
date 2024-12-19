import axios from 'axios'
import config from '../config'



const constructParamsString = <P>(params: P) => {
    let paramsString = ''
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            paramsString += `/${params[key]}`
        }
    }
    return paramsString
}

const constructQueryString = <Q>(query: Q) => {
    let queryString = '?'
    for (const key in query) {
        if (query.hasOwnProperty(key)) {
            queryString += `${key}=${query[key]}&`
        }
    }
    return queryString
}
export const axiosUtil = async <P, Q, B>(input: {
    url: string,
    requestType: 'get' | 'post'
    path: string
    params?: P
    query?: Q
    body?: B
}) => {
    const { url, requestType, path, params, query, body } = input
    const paramsString = params ? constructParamsString(params) : ''
    const queryString = query ? constructQueryString(query) : ''
    const requestUrl = `${url}${path}${paramsString}${queryString}`
    return await axios[requestType](requestUrl, body)
}
