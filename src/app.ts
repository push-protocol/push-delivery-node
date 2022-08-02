import { startServer } from './appInit'

// Call server from here to ensure test cases run fine
startServer()

// stopServer shuts down the server. Used in tests.
async function stopServer() {
    process.exit(0)
}

export { startServer, stopServer }
