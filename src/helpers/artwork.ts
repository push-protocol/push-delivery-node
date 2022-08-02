import config from '../config'

module.exports = {
    getPushNodeConnectionArtWork: (socket) => {
        let artwork = `
 ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗███████╗██████╗     ████████╗ ██████╗     ██████╗ ██╗   ██╗███████╗██╗  ██╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ╚══██╔══╝██╔═══██╗    ██╔══██╗██║   ██║██╔════╝██║  ██║    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   █████╗  ██║  ██║       ██║   ██║   ██║    ██████╔╝██║   ██║███████╗███████║    ██╔██╗ ██║██║   ██║██║  ██║█████╗  
██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   ██╔══╝  ██║  ██║       ██║   ██║   ██║    ██╔═══╝ ██║   ██║╚════██║██╔══██║    ██║╚██╗██║██║   ██║██║  ██║██╔══╝  
╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   ███████╗██████╔╝       ██║   ╚██████╔╝    ██║     ╚██████╔╝███████║██║  ██║    ██║ ╚████║╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ╚══════╝╚═════╝        ╚═╝    ╚═════╝     ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
                                                                                                                                                                                
`

        return `
        
        ################################################

        

        ${artwork}



        🛡️  Server listening on url :: ${config.PUSH_NODE_WEBSOCKET_URL}  Socket id :: ${socket.id}🛡️

        ################################################
        `
    },
}
