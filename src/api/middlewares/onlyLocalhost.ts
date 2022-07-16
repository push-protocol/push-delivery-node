import { Container } from 'typedi'
import config from '../../config'
import logger from '../../loaders/logger'

var dns = require('dns')
var os = require('os')
var ifaces = os.networkInterfaces()

const onlyLocalhost = async (req, res, next) => {
    try {
        // Check if ip is localhost and only continue
        var ip = req.connection.remoteAddress
        var host = req.get('host')

        if (config.environment === 'production') {
            // Return with unauthorized error
            return res.sendStatus(401).json({ info: 'Only development config' })
        }

        checkLocalHost(ip)
            .then((result) => {
                if (!result) {
                    return res
                        .sendStatus(401)
                        .json({ info: 'Only localhost connection allowed' })
                }

                return next()
            })
            .catch((e) => {
                logger.error(
                    '🔥 Error attaching Only Localhost middleware to req: %o',
                    e
                )
                return next(e)
            })
    } catch (e) {
        logger.error(
            '🔥 Error attaching Only Localhost middleware to req: %o',
            e
        )
        return next(e)
    }
}

const checkLocalHost = async (address) => {
    return new Promise((resolve, reject) => {
        dns.lookup(address, function (err, addr) {
            if (err) {
                resolve(false)
                return
            }
            try {
                address = addr
                Object.keys(ifaces).forEach(function (ifname) {
                    ifaces[ifname].forEach(function (iface) {
                        if (iface.address === address) resolve(true)
                    })
                })
                resolve(false)
            } catch (err) {
                reject(err)
            }
        })
    })
}

export default onlyLocalhost
