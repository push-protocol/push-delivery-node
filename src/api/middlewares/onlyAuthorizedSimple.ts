import { Container } from 'typedi'

const onlyAuthorized = async (req, res, next, opToValidate) => {
    const Logger = Container.get('logger')

    try {
        if (req.body.op !== opToValidate) {
            return res.status(401).json({ info: 'Operation mismatched' })
        }

        return next()
    } catch (e) {
        throw e
        return next(e)
    }
}

export default onlyAuthorized
