const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (name) {
    if (name === 'uws') return originalRequire.apply(this, ['ws']);
    return originalRequire.apply(this, arguments);
};

const fs = require("fs");
const readline = require("readline");
const DefaultSettings = require("../src/Settings");
const ServerHandle = require("../src/ServerHandle");
const { genCommand } = require("../src/commands/CommandList");

const DefaultCommands = require("../src/commands/DefaultCommands");
const DefaultProtocols = [
    require("../src/protocols/LegacyProtocol"),
    require("../src/protocols/ModernProtocol"),
];
const DefaultGamemodes = [
    require("../src/gamemodes/FFA"),
    require("../src/gamemodes/Teams"),
    require("../src/gamemodes/LastManStanding")
];

function readSettings() {
    try { 
        let s = JSON.parse(fs.readFileSync("./settings.json", "utf-8"));
        if (process.env.PORT) s.listeningPort = parseInt(process.env.PORT);
        return s;
    } catch (e) {
        let s = Object.assign({}, DefaultSettings);
        if (process.env.PORT) s.listeningPort = parseInt(process.env.PORT);
        return s;
    }
}

function overwriteSettings(settings) {
    try { fs.writeFileSync("./settings.json", JSON.stringify(settings, null, 4), "utf-8"); } catch(e) {}
}

if (!fs.existsSync("./settings.json")) overwriteSettings(DefaultSettings);
let settings = readSettings();

const currentHandle = new ServerHandle(settings);
require("./log-handler")(currentHandle);
const logger = currentHandle.logger;

let commandStreamClosing = false;
const commandStream = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

commandStream.once("SIGINT", () => {
    commandStreamClosing = true;
    commandStream.close();
    currentHandle.stop();
    process.exit(0);
});

DefaultCommands(currentHandle.commands, currentHandle.chatCommands);
currentHandle.protocols.register(...DefaultProtocols);
currentHandle.gamemodes.register(...DefaultGamemodes);

currentHandle.commands.register(
    genCommand({ name: "start", exec: (handle) => handle.start() }),
    genCommand({ name: "stop", exec: (handle) => handle.stop() }),
    genCommand({ name: "exit", exec: (handle) => { handle.stop(); process.exit(0); } })
);

function ask() {
    if (commandStreamClosing) return;
    commandStream.question("", (input) => {
        setTimeout(ask, 100);
        if (!(input = input.trim())) return;
        if (!currentHandle.commands.execute(null, input)) logger.print(`unknown command`);
    });
}

setTimeout(ask, 1000);
currentHandle.start();
