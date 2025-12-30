try {
    const moduleAlias = require('module');
    const originalRequire = moduleAlias.prototype.require;
    moduleAlias.prototype.require = function (name) {
        if (name === 'uws') return originalRequire.apply(this, ['ws']);
        return originalRequire.apply(this, arguments);
    };
} catch (e) {}

const ServerHandle = require("./src/ServerHandle");
const Router = require("./src/sockets/Router");
const Protocol = require("./src/protocols/Protocol");
const { Command } = require("./src/commands/CommandList");
const Gamemode = require("./src/gamemodes/Gamemode");

module.exports = {
    ServerHandle,
    Router,
    Protocol,
    Command,
    Gamemode,

    base: {
        commands: require("./src/commands/DefaultCommands"),
        protocols: [
            require("./src/protocols/LegacyProtocol"),
            require("./src/protocols/ModernProtocol")
        ],
        gamemodes: [
            require("./src/gamemodes/FFA"),
            require("./src/gamemodes/Teams"),
            require("./src/gamemodes/LastManStanding")
        ]
    }
};

if (require.main === module) {
    const handle = new ServerHandle();
    handle.start();
}
