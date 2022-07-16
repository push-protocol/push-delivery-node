import { Container } from 'typedi'
import LoggerInstance from './logger'

export default () => {
    try {
        Container.set('logger', LoggerInstance)
        LoggerInstance.info('✌️   Logger Injected')
        return null
    } catch (e) {
        LoggerInstance.error('🔥  Error on dependency injector loader: %o', e)
        throw e
    }
}
